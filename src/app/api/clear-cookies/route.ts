import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const allCookies = request.cookies.getAll();
  const redirectTo = request.nextUrl.searchParams.get('to') || '/dashboard';
  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  // Clear all existing cookies on this domain/host
  for (const cookie of allCookies) {
    response.cookies.delete(cookie.name);
    response.cookies.set({
      name: cookie.name,
      value: '',
      maxAge: 0,
      path: '/',
    });
  }

  return response;
}

