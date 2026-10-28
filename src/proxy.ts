import { NextResponse, type NextRequest } from "next/server";
import { COOKIE_GRUPO, COOKIE_SESION, grupoValido, leerSesion } from "@/lib/sesion";

// Toda la app es privada: sin el código del grupo y sin jugador elegido, a la puerta.
export function proxy(request: NextRequest) {
  const grupo = grupoValido(request.cookies.get(COOKIE_GRUPO)?.value);
  const dentro = grupo && leerSesion(request.cookies.get(COOKIE_SESION)?.value);
  // Las caras se ven ya en la pantalla de "¿quién eres?", con solo el código del grupo.
  if (dentro || (grupo && request.nextUrl.pathname.startsWith("/api/avatar/"))) return NextResponse.next();
  if (request.nextUrl.pathname.startsWith("/api/")) return new NextResponse("Fuera", { status: 401 });
  return NextResponse.redirect(new URL("/entrar", request.url));
}

export const config = {
  matcher: ["/((?!entrar|_next/|manifest.webmanifest|icon|apple-icon|favicon).*)"],
};
