import { HttpTypes } from '@medusajs/types';
import { NextRequest, NextResponse } from 'next/server';

import { PROTECTED_ROUTES } from './lib/constants';
import { isTokenExpired } from './lib/helpers/token';

const BACKEND_URL = process.env.MEDUSA_BACKEND_URL;
const PUBLISHABLE_API_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
const DEFAULT_REGION = process.env.NEXT_PUBLIC_DEFAULT_REGION || 'us';

const makeAuthRedirect = (
  req: NextRequest,
  locale: string,
  reason: 'sessionRequired' | 'sessionExpired'
) => {
  const redirectUrl = new URL(`/${locale}/login`, req.url);

  redirectUrl.searchParams.set(reason, 'true');

  const response = NextResponse.redirect(redirectUrl);

  if (reason === 'sessionExpired') {
    response.cookies.delete('_medusa_jwt');
  }

  return response;
};

const regionMapCache = {
  regionMap: new Map<string, HttpTypes.StoreRegion>(),
  regionMapUpdated: Date.now()
};

async function getRegionMap(cacheId: string) {
  const { regionMap, regionMapUpdated } = regionMapCache;

  if (!BACKEND_URL) {
    throw new Error(
      'Middleware.ts: Error fetching regions. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL.'
    );
  }

  if (!regionMap.keys().next().value || regionMapUpdated < Date.now() - 3600 * 1000) {
    // Fetch regions from Medusa. We can't use the JS client here because middleware is running on Edge and the client needs a Node environment.
    const { regions } = await fetch(`${BACKEND_URL}/store/regions`, {
      headers: {
        'x-publishable-api-key': PUBLISHABLE_API_KEY!
      },
      next: {
        revalidate: 3600,
        tags: [`regions-${cacheId}`]
      },
      cache: 'force-cache'
    }).then(async response => {
      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.message);
      }

      return json;
    });

    if (!regions?.length) {
      throw new Error('No regions found. Please set up regions in your Medusa Admin.');
    }

    // Create a map of country codes to regions.
    regions.forEach((region: HttpTypes.StoreRegion) => {
      region.countries?.forEach(c => {
        regionMapCache.regionMap.set(c.iso_2 ?? '', region);
      });
    });

    regionMapCache.regionMapUpdated = Date.now();
  }

  return regionMapCache.regionMap;
}

async function getCountryCode(
  request: NextRequest,
  regionMap: Map<string, HttpTypes.StoreRegion | number>
) {
  try {
    let countryCode;

    const vercelCountryCode = request.headers.get('x-vercel-ip-country')?.toLowerCase();

    const urlCountryCode = request.nextUrl.pathname.split('/')[1]?.toLowerCase();

    if (urlCountryCode && regionMap.has(urlCountryCode)) {
      countryCode = urlCountryCode;
    } else if (vercelCountryCode && regionMap.has(vercelCountryCode)) {
      countryCode = vercelCountryCode;
    } else if (regionMap.has(DEFAULT_REGION)) {
      countryCode = DEFAULT_REGION;
    } else if (regionMap.keys().next().value) {
      countryCode = regionMap.keys().next().value;
    }

    return countryCode;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'Middleware.ts: Error getting the country code. Did you set up regions in your Medusa Admin and define a MEDUSA_BACKEND_URL environment variable? Note that the variable is no longer named NEXT_PUBLIC_MEDUSA_BACKEND_URL.'
      );
    }
  }
}

export async function middleware(request: NextRequest) {
  // Short-circuit static assets
  if (request.nextUrl.pathname.includes('.')) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const cacheIdCookie = request.cookies.get('_medusa_cache_id');
  const cacheId = cacheIdCookie?.value || crypto.randomUUID();

  const urlSegment = pathname.split('/')[1];
  const looksLikeLocale = /^[a-z]{2}$/i.test(urlSegment || '');

  const pathnameWithoutLocale = looksLikeLocale ? pathname.replace(/^\/[^/]+/, '') : pathname;

  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathnameWithoutLocale.startsWith(route));

  if (isProtectedRoute) {
    const jwtCookie = request.cookies.get('_medusa_jwt');
    const token = jwtCookie?.value;

    const locale = looksLikeLocale ? urlSegment : DEFAULT_REGION;

    // Not logged in before
    if (!jwtCookie) {
      return makeAuthRedirect(request, locale, 'sessionRequired');
    }

    // Token exists but expired
    if (token && isTokenExpired(token)) {
      return makeAuthRedirect(request, locale, 'sessionExpired');
    }
  }

  // Fast path: URL already has a locale segment and cache cookie exists
  if (looksLikeLocale && cacheIdCookie) {
    return NextResponse.next();
  }

  let response = NextResponse.next();

  // Ensure cache id cookie exists (set without redirect)
  if (!cacheIdCookie) {
    response.cookies.set('_medusa_cache_id', cacheId, {
      maxAge: 60 * 60 * 24
    });
  }

  const regionMap = await getRegionMap(cacheId);
  const countryCode = regionMap && (await getCountryCode(request, regionMap));
  const urlHasCountryCode = countryCode && pathname.split('/')[1].includes(countryCode);

  // If no country code in URL but we can resolve one, redirect to locale-prefixed path
  if (!urlHasCountryCode && countryCode) {
    const redirectPath = pathname === '/' ? '' : pathname;
    const queryString = request.nextUrl.search ? request.nextUrl.search : '';
    const redirectUrl = `${request.nextUrl.origin}/${countryCode}${redirectPath}${queryString}`;
    return NextResponse.redirect(redirectUrl, 307);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|images|assets|png|svg|jpg|jpeg|gif|webp).*)'
  ]
};
