import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

const parseTags = (value: string | null): string[] =>
  value
    ? value
        .split(',')
        .map(tag => tag.trim())
        .filter(Boolean)
    : [];

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const secret = process.env.REVALIDATE_SECRET;

  if (secret) {
    const provided =
      request.headers.get('x-revalidate-secret') ?? url.searchParams.get('secret');

    if (provided !== secret) {
      return NextResponse.json(
        { revalidated: false, message: 'Invalid secret' },
        { status: 401 }
      );
    }
  }

  const tags = new Set(parseTags(url.searchParams.get('tags')));

  try {
    const body = await request.json();
    if (Array.isArray(body?.tags)) {
      body.tags.filter((tag: unknown): tag is string => typeof tag === 'string').forEach((tag: string) => tags.add(tag));
    }
  } catch {
    // no JSON body — tags may still come from the query string
  }

  const resolved = [...tags].filter(Boolean);

  if (resolved.length === 0) {
    return NextResponse.json(
      { revalidated: false, message: 'No tags provided' },
      { status: 400 }
    );
  }

  resolved.forEach(tag => revalidateTag(tag));

  return NextResponse.json({ revalidated: true, tags: resolved });
}
