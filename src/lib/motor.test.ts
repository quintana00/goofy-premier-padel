import { describe, expect, it } from "vitest";
import {
  clasificacionAmericano, confirmadores, deudas, duelo, estadisticas, generarAmericano, medallas, peorPesadilla,
  muroDeLaVerguenza, relaciones, repartir, setsValidos, veredicto,
} from "./motor";
import type { Mundo, Partido } from "./tipos";

let n = 0;
const partido = (a: [number, number], b: [number, number] | null, sets: [number, number][], extra: Partial<Partido> = {}): Partido => ({
  id: ++n, fecha: `2026-10-${String(n).padStart(2, "0")}`, creado: "2026-10-01T10:00:00Z", a, b, bExterna: b ? null : "Los de Elche",
  sets, estado: "confirmado", creadoPor: a[0], confirmadoPor: null, torneoId: null,
  formato: sets.length === 1 ? "1set" : "mejor3", aDerecha: null, bDerecha: null, impuestaPor: null, ...extra,
});

const mundo = (partidos: Partido[], extra: Partial<Mundo> = {}): Mundo => ({
  jugadores: [1, 2, 3, 4, 5].map((id) => ({ id, nombre: `J${id}`, avatarV: 0 })),
  partidos, denuncias: [], torneos: [], gastos: [], temporadas: [{ id: 1, nombre: "T1", inicio: "2026-01-01", fin: null }], eventos: [], megafonos: [],
  hoy: "2026-10-28", ...extra,
});

describe("ELO", () => {
  it("el que gana sube, el que pierde baja y la suma se conserva", () => {
    const est = estadisticas(mundo([partido([1, 2], [3, 4], [[6, 2], [6, 3]])]));
    const e = (id: number) => est.fichas.get(id)!.elo;
    expect(e(1)).toBeGreaterThan(1000);
    expect(e(3)).toBeLessThan(1000);
    expect(e(1) + e(2) + e(3) + e(4)).toBeCloseTo(4000);
    expect(est.ranking[0].id === 1 || est.ranking[0].id === 2).toBe(true);
  });

  it("los partidos pendientes no cuentan", () => {
    const est = estadisticas(mundo([partido([1, 2], [3, 4], [[6, 2], [6, 3]], { estado: "pendiente" })]));
    expect(est.fichas.get(1)!.jugados).toBe(0);
  });

  it("cuenta rachas, remontadas, roscos y terceros sets", () => {
    const ps = [
      partido([1, 2], [3, 4], [[0, 6], [6, 4], [6, 3]]),
      partido([1, 3], [2, 4], [[6, 0], [6, 1]]),
    ];
    const f = estadisticas(mundo(ps)).fichas;
    expect(f.get(1)!.racha).toBe(2);
    expect(f.get(4)!.racha).toBe(-2);
    expect(f.get(1)!.remontadas).toBe(1);
    expect(f.get(1)!.roscosDados).toBe(1);
    expect(f.get(1)!.roscosRecibidos).toBe(1);
    expect(f.get(3)!.tercerSetP).toBe(1);
  });
});

describe("piques", () => {
  it("perrito, hijo, beso y peor pesadilla", () => {
    const ps = [
      ...Array.from({ length: 4 }, () => partido([1, 5], [2, 3], [[6, 1], [6, 1]])), // 1 y 5 machacan a 2 y 3
      partido([4, 2], [3, 5], [[6, 4], [6, 4]]),
      partido([4, 3], [2, 5], [[6, 4], [6, 4]]),
    ];
    const est = estadisticas(mundo(ps));
    const rel = relaciones(est);
    expect(rel.find((r) => r.x === 1 && r.y === 2)?.tipo).toBe("perrito");
    expect(rel.find((r) => r.x === 5 && r.y === 3)?.tipo).toBe("hijo"); // 4-1... 5 ganó 4 y perdió 1 contra 3
    expect(peorPesadilla(est, 2)?.rival).toBe(1);
  });
});

describe("confirmaciones y tribunal", () => {
  it("confirma el rival; si es externo, el compañero", () => {
    expect(confirmadores(partido([1, 2], [3, 4], [[6, 1], [6, 1]]))).toEqual([3, 4]);
    expect(confirmadores(partido([1, 2], null, [[6, 1], [6, 1]]))).toEqual([2]);
  });
  it("el jurado no incluye a los que jugaron", () => {
    const p = partido([1, 2], [3, 4], [[6, 1], [6, 1]]);
    const d = { id: 1, partidoId: p.id, denunciante: 3, motivo: "", creada: "",
      votos: [3, 4, 5, 6].map((j) => ({ jugadorId: j, amano: j !== 6, comentario: "" })) };
    expect(veredicto(d, p)).toEqual({ veredicto: "deliberando", amano: 1, limpio: 1 });
    d.votos.push({ jugadorId: 8, amano: true, comentario: "" });
    expect(veredicto(d, p)).toEqual({ veredicto: "amano", amano: 2, limpio: 1 });
    const est = estadisticas(mundo([p], { denuncias: [d] }));
    expect(est.fichas.get(1)!.jugados).toBe(0);
  });
});

describe("deudas", () => {
  it("reparte céntimos y ordena por morosidad", () => {
    expect(repartir(1000, [1, 2, 3])).toEqual([{ deudor: 1, importe: 334 }, { deudor: 2, importe: 333 }, { deudor: 3, importe: 333 }]);
    const m = mundo([], { gastos: [{ id: 1, pagador: 1, concepto: "Pista", importe: 2400, fecha: "2026-10-01", partes: [
      { id: 1, deudor: 2, importe: 600, pagada: null, avisada: null },
      { id: 2, deudor: 3, importe: 600, pagada: "2026-10-02", avisada: null },
    ] }] });
    const d = deudas(m);
    expect(d[0].id).toBe(2);
    expect(d[0].diasMax).toBe(27);
    expect(d.find((x) => x.id === 1)!.leDeben).toBe(600);
    expect(medallas(m, estadisticas(m)).find((x) => x.clave === "moroso")?.jugadorId).toBe(2);
  });
});

describe("sets", () => {
  it("valida marcadores", () => {
    expect(setsValidos([[6, 4], [6, 3]])).toBeNull();
    expect(setsValidos([[6, 4], [3, 6], [10, 8]])).toBeNull();
    expect(setsValidos([[6, 4], [3, 6]])).not.toBeNull();
    expect(setsValidos([[6, 4], [6, 3], [6, 1]])).not.toBeNull();
    expect(setsValidos([[6, 6]])).not.toBeNull();
  });
});

describe("formatos y lados", () => {
  it("un inacabado suma juegos pero no victoria, derrota ni ELO", () => {
    const est = estadisticas(mundo([partido([1, 2], [3, 4], [[6, 4], [4, 6], [3, 1]], { formato: "inacabado" })]));
    const f = est.fichas.get(1)!;
    expect(f.jugados).toBe(0);
    expect(f.elo).toBe(1000);
    expect(f.inacabados).toBe(1);
    expect(f.juegosG).toBe(13);
    expect(f.setsG).toBe(1);
    expect(f.setsP).toBe(1);
    expect(est.partidos).toHaveLength(0);
  });

  it("separa las estadísticas por lado", () => {
    const est = estadisticas(mundo([
      partido([1, 2], [3, 4], [[6, 1], [6, 1]], { aDerecha: 1, bDerecha: 3 }),
      partido([1, 2], [3, 4], [[1, 6], [1, 6]], { aDerecha: 2, bDerecha: 3 }),
    ]));
    expect(est.fichas.get(1)!.porLado).toEqual({ derecha: { g: 1, p: 0 }, izquierda: { g: 0, p: 1 } });
    expect(est.fichas.get(4)!.porLado).toEqual({ derecha: { g: 0, p: 0 }, izquierda: { g: 1, p: 1 } });
  });

  it("valida cada formato", () => {
    expect(setsValidos([[6, 4]], "1set")).toBeNull();
    expect(setsValidos([[6, 4], [6, 2]], "1set")).not.toBeNull();
    expect(setsValidos([[6, 4]], "mejor3")).not.toBeNull();
    expect(setsValidos([[6, 4], [4, 6], [3, 1]], "inacabado")).toBeNull();
    expect(setsValidos([[3, 3]], "inacabado")).toBeNull();
    expect(setsValidos([[0, 0]], "inacabado")).not.toBeNull();
  });
});

describe("duelo y medallas del pique", () => {
  it("cuenta el cara a cara, la racha y el termómetro", () => {
    const ps = [
      partido([1, 3], [2, 4], [[6, 4], [4, 6], [7, 5]]),
      partido([2, 3], [1, 4], [[6, 4], [6, 4]]),
      partido([2, 5], [1, 6], [[7, 6], [7, 5]]),
    ];
    const m = mundo(ps);
    const d = duelo(m, estadisticas(m), 1, 2);
    expect([d.ganaX, d.ganaY]).toEqual([1, 2]);
    expect(d.racha).toEqual({ quien: 2, n: 2 });
    expect(d.termometro).toBeGreaterThan(30);
  });

  it("da megáfono, llorón, ego, strava, pareja impuesta y reconciliación", () => {
    const ps = [
      partido([1, 3], [2, 4], [[6, 1], [6, 1]], { fecha: "2026-10-25", impuestaPor: 2 }),
      partido([1, 3], [2, 4], [[6, 1], [6, 1]], { fecha: "2026-10-26", impuestaPor: 2 }),
      partido([1, 3], [2, 4], [[6, 3], [6, 3]], { fecha: "2026-10-26" }),
      partido([1, 2], [3, 4], [[6, 1], [6, 1]], { fecha: "2026-10-27" }),
      partido([1, 2], [3, 4], [[6, 1], [2, 1]], { fecha: "2026-10-28", formato: "inacabado" }),
    ];
    const m = mundo(ps, {
      megafonos: [
        { partidoId: ps[0].id, votante: 3, acusado: 2 },
        { partidoId: ps[0].id, votante: 1, acusado: 2 },
      ],
      eventos: [{ id: 1, tipo: "intento_borrado", jugadorId: 4, partidoId: ps[0].id, creado: "" }],
    });
    const md = medallas(m, estadisticas(m));
    const quien = (clave: string) => md.filter((x) => x.clave.startsWith(clave)).map((x) => x.jugadorId).sort();
    expect(quien("megafono")).toEqual([2]);
    expect(quien("lloron")).toEqual([4]);
    expect(quien("ego")).toEqual([1]);
    expect(quien("strava")).toHaveLength(1);
    expect(muroDeLaVerguenza(m).map((v) => v.emoji).filter((e) => e !== "🍩").sort()).toEqual(["📣", "🙄", "🙄", "🥹"]);
    expect(quien("impuesta")).toEqual([2]);
    expect(quien("reconciliacion")).toEqual([1, 2]);
  });
});

describe("torneo cruzado", () => {
  it("con 8 jugadores todos juegan lo mismo y casi no se repiten parejas", () => {
    const t = generarAmericano([1, 2, 3, 4, 5, 6, 7, 8], 16, 42);
    expect(t.rondas).toHaveLength(7);
    const veces = new Map<string, number>();
    for (const r of t.rondas) {
      expect(r.pistas).toHaveLength(2);
      for (const p of r.pistas) for (const par of [p.a, p.b]) {
        const k = [...par].sort().join("-");
        veces.set(k, (veces.get(k) ?? 0) + 1);
      }
    }
    expect(Math.max(...veces.values())).toBeLessThanOrEqual(2);
  });

  it("con 6 jugadores reparte los descansos y clasifica por juegos", () => {
    const t = generarAmericano([1, 2, 3, 4, 5, 6], 16, 7);
    const descansos = new Map<number, number>();
    for (const r of t.rondas) for (const j of r.descansan) descansos.set(j, (descansos.get(j) ?? 0) + 1);
    expect([...descansos.values()].every((n) => n === 2)).toBe(true);
    t.rondas[0].pistas[0].ja = 10;
    t.rondas[0].pistas[0].jb = 6;
    const c = clasificacionAmericano(t);
    expect(c[0].juegosG).toBe(10);
    expect(t.rondas[0].pistas[0].a).toContain(c[0].id);
  });
});
