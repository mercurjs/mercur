import type { Metadata } from 'next';

import './globals.css';

import { Toaster } from '@medusajs/ui';

import { retrieveCart } from '@/lib/data/cart';

import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    template: `%s | ${
      process.env.NEXT_PUBLIC_SITE_NAME || 'Mercur B2C Demo - Marketplace Storefront'
    }`,
    default: process.env.NEXT_PUBLIC_SITE_NAME || 'Mercur B2C Demo - Marketplace Storefront'
  },
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Mercur B2C Demo - Marketplace Storefront',
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cartPromise = retrieveCart();

  // LocaleProvider sets the visitor's language once the [locale] segment renders.
  const htmlLang = 'en';

  return (
    <html
      lang={htmlLang}
      className=""
    >
      <head>
        <link
          rel="preconnect"
          href="https://i.imgur.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://i.imgur.com"
        />
        {/* Image origins for faster LCP */}
        <link
          rel="preconnect"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://medusa-public-images.s3.eu-west-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://mercur-connect.s3.eu-central-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://s3.eu-central-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://s3.eu-central-1.amazonaws.com"
        />
        <link
          rel="preconnect"
          href="https://api.mercurjs.com"
          crossOrigin="anonymous"
        />
        <link
          rel="dns-prefetch"
          href="https://api.mercurjs.com"
        />
      </head>
      <body className="relative bg-primary text-secondary antialiased">
        <Providers cartPromise={cartPromise}>{children}</Providers>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
