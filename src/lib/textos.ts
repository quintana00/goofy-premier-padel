import type { Relacion } from "./motor";

// Frases para cada pique. Se elige una según los jugadores, para que no salga siempre la misma.
const FRASES: Record<Relacion["tipo"], ((x: string, y: string, r: Relacion) => string)[]> = {
  perrito: [
    (x, y, r) => `${r.ganaX}-0 en sus duelos. ${y} no le ha ganado ni jugando con el viento a favor.`,
    (x, y) => `${y} sale a la pista con correa y ${x} le da una galletita al acabar.`,
    (x, y) => `Cada vez que ${x} silba, ${y} trae la bola.`,
  ],
  hijo: [
    (x, y, r) => `Le gana ${r.ganaX} de ${r.ganaX + r.ganaY}. Biberón, eructito y a la cuna.`,
    (x, y) => `${y} todavía le pide la paga a ${x} los domingos.`,
    (x, y, r) => `${r.ganaX}-${r.ganaY} en sus duelos. Papá ${x} siempre gana.`,
  ],
  beso: [
    (x, y, r) => `${r.ganaX}-${r.ganaY} en sus duelos y casi el mismo ELO. Que se besen ya.`,
    (x, y) => `Tanta rivalidad entre ${x} y ${y} ya es tensión sexual no resuelta.`,
    (x, y) => `Mismo nivel, mismo ego, mismo amor. ${x} 💕 ${y}.`,
  ],
};

export function frase(r: Relacion, x: string, y: string) {
  const lista = FRASES[r.tipo];
  return lista[(r.x * 7 + r.y * 3) % lista.length](x, y, r);
}

export function tituloRelacion(r: Relacion, x: string, y: string) {
  if (r.tipo === "perrito") return `🐕 ${x} tiene de perrito a ${y}`;
  if (r.tipo === "hijo") return `🍼 ${x} tiene de hijo a ${y}`;
  return `💋 ${x} y ${y}: almas gemelas`;
}
