// Firmado de cookies sin dependencias de servidor: lo usan tanto el proxy como las páginas.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_GRUPO = "gpp_grupo";
export const COOKIE_SESION = "gpp_sesion";
export const UN_ANO = 60 * 60 * 24 * 365;

export const codigoGrupo = () => process.env.GROUP_CODE?.trim() ?? "";

// Si no se define SESSION_SECRET, se deriva de datos que ya son secretos.
function secreto() {
  return (
    process.env.SESSION_SECRET ??
    createHash("sha256")
      .update(`${process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? ""}|${codigoGrupo()}`)
      .digest("hex")
  );
}

const firmar = (texto: string) => createHmac("sha256", secreto()).update(texto).digest("base64url");

function iguales(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// Cambiar GROUP_CODE echa a todo el mundo, porque la firma depende de él.
export const valorGrupo = () => firmar(`grupo:${codigoGrupo()}`);
export const grupoValido = (valor: string | undefined) => Boolean(valor && codigoGrupo() && iguales(valor, valorGrupo()));

export const valorSesion = (jugadorId: number) => `${jugadorId}.${firmar(`jugador:${jugadorId}:${codigoGrupo()}`)}`;
export function leerSesion(valor: string | undefined): number | null {
  if (!valor) return null;
  const [id] = valor.split(".");
  const n = Number(id);
  if (!Number.isInteger(n) || n <= 0) return null;
  return iguales(valor, valorSesion(n)) ? n : null;
}
