import type { Medalla } from "./motor";
import { personaje } from "./personajes";
import type { Mundo } from "./tipos";
import type { TipoEscena } from "@/components/Escena";

export type EscenaMedalla = { tipo: TipoEscena; x?: number; y: number; frase?: string };

// Qué escena animada acompaña a cada medalla (si tiene).
export function escenaDeMedalla(m: Mundo, md: Medalla): EscenaMedalla | null {
  const y = md.jugadorId;
  if (md.clave === "ego") return { tipo: "ego", y };
  if (md.clave === "strava") return { tipo: "nadar", y };
  if (md.clave === "cuchara") return { tipo: "cuchara", y };
  if (md.clave === "ambulancia" || md.clave === "tocado") return { tipo: "ambulancia", y };
  if (md.clave === "lloron") {
    const borro = m.eventos.some((e) => e.tipo === "intento_borrado" && e.jugadorId === y);
    return { tipo: "lloron", y, frase: borro ? "¡Ese no cuenta! 😭" : undefined };
  }
  if (md.clave.startsWith("reconciliacion-")) {
    const otro = Number(md.clave.split("-")[1]);
    // Nada el que tenga pinta de nadador; el otro, a la terraza.
    const nadaOtro = personaje(m.jugadores.find((j) => j.id === otro)?.nombre ?? "")?.accesorios?.includes("natacion");
    return nadaOtro ? { tipo: "guadalquivir", y: otro, x: y } : { tipo: "guadalquivir", y, x: otro };
  }
  if (md.clave === "megafono") {
    // El compañero del último partido en el que le pillaron gritando.
    const votos = new Map<number, number>();
    for (const v of m.megafonos) if (v.acusado === y) votos.set(v.partidoId, (votos.get(v.partidoId) ?? 0) + 1);
    const ids = [...votos.entries()].filter(([, n]) => n >= 2).map(([id]) => id);
    const p = m.partidos.filter((x) => ids.includes(x.id)).sort((a, b) => b.id - a.id)[0];
    const lado = p && (p.a.includes(y) ? p.a : p.b);
    const companero = lado?.find((id) => id !== y);
    return companero ? { tipo: "megafono", x: y, y: companero } : null;
  }
  return null;
}

