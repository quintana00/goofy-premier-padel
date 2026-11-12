import { describe, expect, it } from "vitest";
import { abierta, apuestasVistas, carteras, cuotaDe, estadoApuesta, mercados, modeloPartido, premio } from "./apuestas";
import { estadisticas } from "./motor";
import type { Apuesta, Marcador, Mundo, Partido, Quedada } from "./tipos";

let n = 0;
const partido = (a: [number, number], b: [number, number], sets: Marcador[], extra: Partial<Partido> = {}): Partido => ({
  id: ++n, fecha: `2026-10-${String((n % 27) + 1).padStart(2, "0")}`, creado: `2026-10-01T10:${String(n % 60).padStart(2, "0")}:00Z`, a, b, bExterna: null,
  sets, estado: "confirmado", creadoPor: a[0], confirmadoPor: null, torneoId: null, formato: "mejor3",
  aDerecha: null, bDerecha: null, impuestaPor: null, reclamacion: null, ...extra,
});
const mundo = (partidos: Partido[], extra: Partial<Mundo> = {}): Mundo => ({
  jugadores: [1, 2, 3, 4, 5, 6].map((id) => ({ id, nombre: `J${id}`, avatarV: 0 })),
  partidos, denuncias: [], torneos: [], gastos: [], temporadas: [], eventos: [], megafonos: [],
  quedadas: [], quedadasConApuestas: [], apuestas: [], hoy: "2026-11-01", ...extra,
});
const quedada = (extra: Partial<Quedada> = {}): Quedada => ({
  id: 1, fecha: "2026-11-02", hora: "20:00", sitio: "One", nota: "", creadoPor: 1, apuntados: [],
  a: [1, 2], b: [3, 4], formato: "mejor3", partidoId: null, ...extra,
});
const prob = (ms: ReturnType<typeof mercados>, clave: string, sel: string) => ms.find((m) => m.clave.startsWith(clave))!.opciones.find((o) => o.sel === sel)?.prob ?? 0;

describe("mercados", () => {
  it("con partido igualado todo es simétrico y las probabilidades suman 1", () => {
    const ms = mercados(0.5, "mejor3");
    expect(prob(ms, "ganador", "a")).toBeCloseTo(0.5, 2);
    for (const m of ms) expect(m.opciones.reduce((s, o) => s + o.prob, 0)).toBeGreaterThan(0.99);
    expect(prob(ms, "sets", "2-0")).toBeCloseTo(prob(ms, "sets", "0-2"), 2);
    // Dos parejas iguales: la mitad de las veces hay tercer set.
    expect(prob(ms, "total_sets", "mas")).toBeCloseTo(0.5, 1);
    expect(prob(ms, "rosco_a", "si")).toBeCloseTo(prob(ms, "rosco_b", "si"), 3);
  });

  it("los mercados son coherentes entre sí", () => {
    const ms = mercados(0.75, "mejor3");
    expect(prob(ms, "ganador", "a")).toBeCloseTo(0.75, 2);
    // Ganar = 2-0 o 2-1; ganar 2 sets = ganar el partido.
    expect(prob(ms, "sets", "2-0") + prob(ms, "sets", "2-1")).toBeCloseTo(0.75, 2);
    expect(prob(ms, "sets_a", "2")).toBeCloseTo(0.75, 2);
    expect(prob(ms, "sets_b", "0")).toBeCloseTo(prob(ms, "sets", "2-0"), 5);
    expect(prob(ms, "total_sets", "mas")).toBeCloseTo(prob(ms, "sets", "2-1") + prob(ms, "sets", "1-2"), 5);
    // El favorito hace más roscos, y un rosco es raro.
    expect(prob(ms, "rosco_a", "si")).toBeGreaterThan(prob(ms, "rosco_b", "si") * 3);
    expect(prob(ms, "rosco", "si")).toBeLessThan(0.3);
    // Con favorito claro hay menos terceros sets.
    expect(prob(ms, "total_sets", "mas")).toBeLessThan(prob(mercados(0.5, "mejor3"), "total_sets", "mas"));
  });

  it("las cuotas llevan el margen de la casa y a un set solo hay mercados que tienen sentido", () => {
    expect(cuotaDe(0.5)).toBe(1.89);
    expect(cuotaDe(0.9)).toBeLessThan(1.1);
    const ms = mercados(0.6, "1set");
    expect(ms.map((m) => m.clave.split(":")[0])).not.toContain("sets");
    expect(ms.map((m) => m.clave.split(":")[0])).toContain("ganador");
  });
});

describe("modelo", () => {
  it("la forma, la química y el cara a cara mueven la cuota", () => {
    const base = modeloPartido(estadisticas(mundo([])), [1, 2], [3, 4]);
    expect(base.pA).toBeCloseTo(0.5);
    // 1 y 2 juntos ganan siempre a 3 y 4.
    const ps = Array.from({ length: 5 }, () => partido([1, 2], [3, 4], [[6, 3], [6, 4]]));
    const mod = modeloPartido(estadisticas(mundo(ps)), [1, 2], [3, 4]);
    expect(mod.pA).toBeGreaterThan(0.75);
    expect(mod.factores.every((f) => f.valor > 0)).toBe(true);
    // Con otra pareja (sin química ni cara a cara) el 1 sigue siendo favorito, pero menos.
    const otra = modeloPartido(estadisticas(mundo(ps)), [1, 5], [3, 6]);
    expect(otra.pA).toBeGreaterThan(0.5);
    expect(otra.pA).toBeLessThan(mod.pA);
  });
});

describe("cobrar", () => {
  const ap = (mercado: string, seleccion: string, extra: Partial<Apuesta> = {}): Apuesta => ({
    id: ++n, quedadaId: 1, jugadorId: 5, mercado, seleccion, importe: 100, cuota: 2.5, creado: "", ...extra,
  });

  it("resuelve cada mercado con el marcador real, aunque las parejas se apunten al revés", () => {
    const p = partido([3, 4], [1, 2], [[4, 6], [6, 0], [3, 6]]); // visto desde la convocatoria: 6-4 0-6 6-3
    const q = quedada({ partidoId: p.id });
    const e = (m: string, s: string) => estadoApuesta({ mercado: m, seleccion: s }, q, p);
    expect(e("ganador", "a")).toBe("ganada");
    expect(e("sets", "2-1")).toBe("ganada");
    expect(e("sets_b", "1")).toBe("ganada");
    expect(e("total_sets:2.5", "mas")).toBe("ganada");
    expect(e("juegos:24.5", "mas")).toBe("ganada"); // 25 juegos
    expect(e("juegos:25.5", "mas")).toBe("perdida");
    expect(e("rosco_b", "si")).toBe("ganada");
    expect(e("rosco_a", "si")).toBe("perdida");
    expect(e("remontada", "si")).toBe("perdida");
  });

  it("devuelve el dinero si el partido se borra o queda inacabado, y espera si está reclamado", () => {
    const q = quedada({ partidoId: 99 });
    expect(estadoApuesta(ap("ganador", "a"), q, undefined)).toBe("nula");
    expect(estadoApuesta(ap("ganador", "a"), q, partido([1, 2], [3, 4], [[6, 1], [2, 1]], { formato: "inacabado" }))).toBe("nula");
    expect(estadoApuesta(ap("ganador", "a"), q, partido([1, 2], [3, 4], [[6, 1], [6, 1]], { estado: "reclamado" }))).toBe("pendiente");
    expect(estadoApuesta(ap("ganador", "a"), quedada(), undefined)).toBe("pendiente");
  });

  it("lleva las cuentas del monedero", () => {
    const p = partido([1, 2], [3, 4], [[6, 1], [6, 1]]);
    const q1 = quedada({ id: 1, partidoId: p.id });
    const q2 = quedada({ id: 2 });
    const m = mundo([p], {
      quedadasConApuestas: [q1, q2],
      apuestas: [
        ap("ganador", "a", { quedadaId: 1, jugadorId: 5, importe: 100, cuota: 1.5 }), // gana 50
        ap("rosco", "si", { quedadaId: 1, jugadorId: 5, importe: 40, cuota: 6 }), // pierde 40
        ap("ganador", "b", { quedadaId: 2, jugadorId: 5, importe: 30, cuota: 2 }), // pendiente
        ap("ganador", "b", { quedadaId: 1, jugadorId: 6, importe: 100, cuota: 3 }), // pierde 100
      ],
      eventos: [{ id: 1, tipo: "rescate", jugadorId: 6, partidoId: null, creado: "" }],
    });
    const c = carteras(m, apuestasVistas(m, new Set()));
    const de = (id: number) => c.find((x) => x.id === id)!;
    expect(de(5)).toMatchObject({ saldo: 1000 + 50 - 40 - 30, enJuego: 30, ganadas: 1, perdidas: 1, beneficio: 10, mejor: 150 });
    expect(de(6)).toMatchObject({ saldo: 1000 - 100 + 100, rescates: 1 });
    expect(premio({ importe: 100, cuota: 1.89 })).toBe(189);
  });

  it("cierra las apuestas a la hora del partido", () => {
    expect(abierta(quedada(), "2026-11-02 19:59")).toBe(true);
    expect(abierta(quedada(), "2026-11-02 20:00")).toBe(false);
    expect(abierta(quedada({ a: null }), "2026-11-01 10:00")).toBe(false);
    expect(abierta(quedada({ partidoId: 3 }), "2026-11-01 10:00")).toBe(false);
  });
});
