import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public routes
  const isStaticPublicAsset =
    !pathname.startsWith("/api/") &&
    /\.(?:png|jpg|jpeg|gif|webp|ico|woff2?)$/i.test(pathname);

  const isPublic =
    pathname.startsWith("/nfc/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/test/") ||
    pathname.startsWith("/artifacts/") ||
    pathname === "/signin" ||
    isStaticPublicAsset;

  if (!isPublic && !req.auth) {
    const signInUrl = new URL("/signin", req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.svg).*)"],
};
