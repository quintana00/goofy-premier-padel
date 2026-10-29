import { deudas, duelo, estadisticas, ganador, muroDeLaVerguenza, relaciones, sumarDias, type Relacion } from "./motor";
import type { Mundo, Partido } from "./tipos";

export type Resumen = {
  desde: string;
  hasta: string;
  partidos: number;
  lider: number | null;
  subidon: { id: number; delta: number } | null;
  batacazo: { id: number; delta: number } | null;
  paliza: { partido: Partido; diferencia: number } | null;
  moroso: { id: number; debe: number } | null;
  hundido: { id: number; racha: number } | null;
  enLlamas: { id: number; racha: number } | null;
  pique: Relacion | null;
  // El cara a cara de la semana: los dos rivales que más se han enfrentado estos 7 días.
  duelo: { x: number; y: number; ganaX: number; ganaY: number; termometro: number } | null;
  verguenzas: number;
};

// Lo más jugoso de los últimos 7 días, con la temporada en curso como referencia.
export function resumenSemanal(m: Mundo, desdeTemporada?: string): Resumen {
  const desde = sumarDias(m.hoy, -6);
  const est = estadisticas(m, desdeTemporada);
  const semana = est.partidos.filter((p) => p.fecha >= desde);
  const deltas = new Map<number, number>();
  for (const c of est.cambios) if (c.fecha >= desde) deltas.set(c.jugadorId, (deltas.get(c.jugadorId) ?? 0) + c.delta);
  const orden = [...deltas.entries()].sort((x, y) => y[1] - x[1]);
  const conPartidos = est.ranking.filter((f) => f.jugados > 0);

  let paliza: Resumen["paliza"] = null;
  for (const p of semana) {
    const a = p.sets.reduce((s, [x]) => s + x, 0);
    const b = p.sets.reduce((s, [, y]) => s + y, 0);
    const diferencia = ganador(p.sets) === "a" ? a - b : b - a;
    if (!paliza || diferencia > paliza.diferencia) paliza = { partido: p, diferencia };
  }
  const moroso = deudas(m).find((d) => d.debe > 0);
  const hundido = [...conPartidos].sort((x, y) => x.racha - y.racha)[0];
  const enLlamas = [...conPartidos].sort((x, y) => y.racha - x.racha)[0];

  return {
    desde,
    hasta: m.hoy,
    partidos: semana.length,
    lider: conPartidos[0]?.id ?? null,
    subidon: orden[0] && orden[0][1] > 0 ? { id: orden[0][0], delta: orden[0][1] } : null,
    batacazo: orden.length && orden[orden.length - 1][1] < 0 ? { id: orden[orden.length - 1][0], delta: orden[orden.length - 1][1] } : null,
    paliza,
    moroso: moroso ? { id: moroso.id, debe: moroso.debe } : null,
    hundido: hundido && hundido.racha <= -3 ? { id: hundido.id, racha: hundido.racha } : null,
    enLlamas: enLlamas && enLlamas.racha >= 3 ? { id: enLlamas.id, racha: enLlamas.racha } : null,
    pique: relaciones(estadisticas(m))[0] ?? null,
    duelo: dueloDeLaSemana(m, semana),
    verguenzas: muroDeLaVerguenza(m).filter((v) => v.fecha >= desde).length,
  };
}

function dueloDeLaSemana(m: Mundo, semana: Partido[]): Resumen["duelo"] {
  const cuenta = new Map<string, { x: number; y: number; ganaX: number; ganaY: number }>();
  for (const p of semana) {
    if (!p.b) continue;
    const ganadores = ganador(p.sets) === "a" ? p.a : p.b;
    for (const a of p.a)
      for (const b of p.b) {
        const [x, y] = a < b ? [a, b] : [b, a];
        const c = cuenta.get(`${x}-${y}`) ?? { x, y, ganaX: 0, ganaY: 0 };
        if (ganadores.includes(x)) c.ganaX++;
        else c.ganaY++;
        cuenta.set(`${x}-${y}`, c);
      }
  }
  const mejor = [...cuenta.values()]
    .filter((c) => c.ganaX + c.ganaY >= 2)
    .sort((a, b) => b.ganaX + b.ganaY - (a.ganaX + a.ganaY) || Math.abs(a.ganaX - a.ganaY) - Math.abs(b.ganaX - b.ganaY))[0];
  if (!mejor) return null;
  return { ...mejor, termometro: duelo(m, estadisticas(m), mejor.x, mejor.y).termometro };
}
