import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("gq_access")?.value;

  // Protected contractor routes
  const isContractorProtected =
    pathname.startsWith("/contractor/pipeline") ||
    pathname.startsWith("/contractor/quote") ||
    pathname.startsWith("/contractor/milestones");

  // Protected lender routes
  const isLenderProtected = pathname.startsWith("/lender");

  // Protected operations / admin routes
  const isAdminProtected = pathname.startsWith("/admin");

  if ((isContractorProtected || isLenderProtected || isAdminProtected) && !token) {
    const loginUrl = new URL("/contractor/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/contractor/pipeline/:path*",
    "/contractor/quote/:path*",
    "/contractor/milestones/:path*",
    "/lender/:path*",
    "/admin/:path*",
  ],
};
