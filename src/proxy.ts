import { NextResponse, type NextRequest } from "next/server";

// Verificação otimista: sem cookie de sessão, nem chega a renderizar o painel.
// A validação real da sessão (no banco) acontece em cada página do painel (exigirAdmin).
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin/login")) return NextResponse.next();
  if (!req.cookies.has("dv_admin")) return NextResponse.redirect(new URL("/admin/login/", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
