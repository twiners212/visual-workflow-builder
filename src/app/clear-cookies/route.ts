import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.set("better-auth.session_token", "", { maxAge: 0, path: "/" });
  cookieStore.set("__secure-better-auth.session_token", "", { maxAge: 0, path: "/" });
  
  return NextResponse.redirect(new URL("/register", request.url));
}
