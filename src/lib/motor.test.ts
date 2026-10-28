import { describe, expect, it } from "vitest";
import {
  confirmadores, deudas, estadisticas, medallas, peorPesadilla, relaciones, repartir, setsValidos, veredicto,
} from "./motor";
import type { Mundo, Partido } from "./tipos";

let n = 0;
const partido = (a: [number, number], b: [number, number] | null, sets: [number, number][], extra: Partial<Partido> = {}): Partido => ({
  id: ++n, fecha: `2026-10-${String(n).padStart(2, "0")}`, creado: "2026-10-01T10:00:00Z", a, b, bExterna: b ? null : "Los de Elche",
  sets, estado: "confirmado", creadoPor: a[0], confirmadoPor: null, torneoId: null, ...extra,
});

const mundo = (partidos: Partido[], extra: Partial<Mundo> = {}): Mundo => ({
  jugadores: [1, 2, 3, 4, 5].map((id) => ({ id, nombre: `J${id}`, avatarV: 0 })),
  partidos, denuncias: [], torneos: [], gastos: [], temporadas: [{ id: 1, nombre: "T1", inicio: "2026-01-01" }],
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
