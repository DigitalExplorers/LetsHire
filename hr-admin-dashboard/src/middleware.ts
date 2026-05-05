import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

// Define role-to-allowed paths map
const roleAccessMap: Record<string, string[]> = {
  superadmin: ["/super-admin", "/settings"],
  admin: [
    "/admin",
    "/positions",
    "/candidates",
    "/candidate",
    "/interview",
    "/settings",
  ],
  hr: ["/hr", "/positions", "/candidates", "/candidate", "/interview"],
  interviewer: ["/interviewer"],
};

// Define globally unprotected or open-access paths
const openPaths = ["/dashboard"];

export async function middleware(req: NextRequest) {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("JWT_SECRET environment variable is not set");
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }
  const secret = new TextEncoder().encode(jwtSecret);

  console.log("middleware");
  console.log("COOKIES: ", req.cookies.getAll());
  const token = req.cookies.get("token")?.value;
  const pathname = req.nextUrl.pathname;

  // If path is open to all roles, allow access
  if (openPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  if (!token) {
    console.warn("No token found in cookies!");
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = (payload.role as string)?.toLowerCase();

    const allowedPaths = roleAccessMap[role];

    // If no mapping found for role or not allowed to access the path
    if (
      !allowedPaths ||
      !allowedPaths.some((path) => pathname.startsWith(path))
    ) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
  } catch (err) {
    console.error("JWT verification failed", err);
    return NextResponse.redirect(new URL("/auth/signin", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/candidate/:path*",
    "/interview/:path*",
    "/positions/:path*",
    "/candidates/:path*",
    "/super-admin/:path*",
    "/admin/:path*",
    "/hr/:path*",
    "/interviewer/:path*",
    "/settings/:path*",
  ],
};
