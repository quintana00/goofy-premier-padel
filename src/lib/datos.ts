import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { COOKIE_GRUPO, COOKIE_SESION, grupoValido, leerSesion } from "./sesion";
import type { Gasto, Mundo, Partido, Quedada, Torneo } from "./tipos";

export function hoyMadrid() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Madrid" }).format(new Date());
}

const fecha = (d: Date | string) => (typeof d === "string" ? d.slice(0, 10) : d.toISOString().slice(0, 10));
const iso = (d: Date | string | null) => (d == null ? null : typeof d === "string" ? d : d.toISOString());

export const cargarMundo = cache(async (): Promise<Mundo> => {
  const sql = await db();
  const [jugadores, partidos, denuncias, votos, torneos, resultados, gastos, partes, temporadas, eventos, megafonos, quedadasBd, apuntados, apuestas] = await Promise.all([
    sql`select id, nombre, avatar_v from jugadores order by nombre`,
    sql`select *, fecha::text as fecha_t from partidos where estado <> 'rechazado'`,
    sql`select * from denuncias`,
    sql`select * from votos`,
    sql`select *, fecha::text as fecha_t from torneos order by fecha desc, id desc`,
    sql`select * from torneo_resultados order by id`,
    sql`select *, fecha::text as fecha_t from gastos order by fecha desc, id desc`,
    sql`select * from gasto_partes order by id`,
    sql`select *, inicio::text as inicio_t, fin::text as fin_t from temporadas order by inicio, id`,
    sql`select * from eventos order by id`,
    sql`select * from megafonos`,
    sql`select *, fecha::text as fecha_t, fecha >= (now() at time zone 'Europe/Madrid')::date - 1 as reciente from quedadas
        where fecha >= (now() at time zone 'Europe/Madrid')::date - 1 or id in (select quedada_id from apuestas)
        order by fecha, hora, id`,
    sql`select * from quedada_apuntados order by en`,
    sql`select * from apuestas order by id`,
  ]);

  const recientes = new Set<number>(quedadasBd.filter((q) => q.reciente).map((q) => q.id));
  const todasQuedadas = quedadasBd.map(
    (q): Quedada => ({
      id: q.id,
      fecha: q.fecha_t,
      hora: q.hora,
      sitio: q.sitio,
      nota: q.nota,
      creadoPor: q.creado_por,
      apuntados: apuntados
        .filter((x) => x.quedada_id === q.id)
        .map((x) => ({ jugadorId: x.jugador_id, dentro: x.dentro, en: iso(x.en)! })),
      a: q.a1 ? [q.a1, q.a2] : null,
      b: q.b1 ? [q.b1, q.b2] : null,
      formato: q.formato,
      partidoId: q.partido_id,
    }),
  );

  return {
    hoy: hoyMadrid(),
    jugadores: jugadores.map((j) => ({ id: j.id, nombre: j.nombre, avatarV: j.avatar_v })),
    partidos: partidos.map(
      (p): Partido => ({
        id: p.id,
        fecha: p.fecha_t,
        creado: iso(p.creado)!,
        a: [p.a1, p.a2],
        b: p.b1 ? [p.b1, p.b2] : null,
        bExterna: p.b_externa,
        sets: p.sets,
        estado: p.estado,
        creadoPor: p.creado_por,
        confirmadoPor: p.confirmado_por,
        torneoId: p.torneo_id,
        formato: p.formato,
        aDerecha: p.a_derecha,
        bDerecha: p.b_derecha,
        impuestaPor: p.impuesta_por,
        reclamacion: p.reclamado_por
          ? {
              por: p.reclamado_por,
              motivo: p.reclamacion_motivo ?? "",
              sets: p.reclamacion_sets,
              formato: p.reclamacion_formato,
              en: iso(p.reclamado_en)!,
            }
          : null,
      }),
    ),
    denuncias: denuncias.map((d) => ({
      id: d.id,
      partidoId: d.partido_id,
      denunciante: d.denunciante,
      motivo: d.motivo,
      creada: iso(d.creada)!,
      votos: votos
        .filter((v) => v.denuncia_id === d.id)
        .map((v) => ({ jugadorId: v.jugador_id, amano: v.amano, comentario: v.comentario })),
    })),
    torneos: torneos.map(
      (t): Torneo => ({
        id: t.id,
        nombre: t.nombre,
        fecha: t.fecha_t,
        creadoPor: t.creado_por,
        americano: t.americano,
        resultados: resultados
          .filter((r) => r.torneo_id === t.id)
          .map((r) => ({ id: r.id, j1: r.j1, j2: r.j2, puesto: r.puesto })),
      }),
    ),
    gastos: gastos.map(
      (g): Gasto => ({
        id: g.id,
        pagador: g.pagador,
        concepto: g.concepto,
        importe: g.importe,
        fecha: g.fecha_t,
        partes: partes
          .filter((p) => p.gasto_id === g.id)
          .map((p) => ({
            id: p.id,
            deudor: p.deudor,
            importe: p.importe,
            pagada: p.pagada ? fecha(p.pagada) : null,
            avisada: iso(p.avisada),
          })),
      }),
    ),
    temporadas: temporadas.map((t) => ({ id: t.id, nombre: t.nombre, inicio: t.inicio_t, fin: t.fin_t })),
    eventos: eventos.map((e) => ({
      id: e.id,
      tipo: e.tipo,
      jugadorId: e.jugador_id,
      partidoId: e.partido_id,
      creado: iso(e.creado)!,
    })),
    quedadas: todasQuedadas.filter((q) => recientes.has(q.id)),
    quedadasConApuestas: todasQuedadas.filter((q) => apuestas.some((a) => a.quedada_id === q.id)),
    apuestas: apuestas.map((a) => ({
      id: a.id,
      quedadaId: a.quedada_id,
      jugadorId: a.jugador_id,
      mercado: a.mercado,
      seleccion: a.seleccion,
      importe: a.importe,
      cuota: Number(a.cuota),
      creado: iso(a.creado)!,
    })),
    megafonos: megafonos.map((v) => ({ partidoId: v.partido_id, votante: v.votante, acusado: v.acusado })),
  };
});

// Jugador con sesión iniciada. Si la cookie no vale o el jugador ya no existe, a la puerta.
export const yo = cache(async () => {
  const c = await cookies();
  const id = grupoValido(c.get(COOKIE_GRUPO)?.value) ? leerSesion(c.get(COOKIE_SESION)?.value) : null;
  if (!id) redirect("/entrar");
  const mundo = await cargarMundo();
  const jugador = mundo.jugadores.find((j) => j.id === id);
  if (!jugador) redirect("/entrar?fuera=1");
  return jugador;
});

export function temporadaActual(m: Mundo) {
  return [...m.temporadas].reverse().find((t) => t.inicio <= m.hoy) ?? m.temporadas[0];
}

// "?ver=historico" muestra todo; si no, la temporada en curso (o la elegida).
export function alcance(m: Mundo, ver: string | undefined) {
  if (ver === "historico") return { desde: undefined, etiqueta: "Histórico", ver: "historico" };
  const t = m.temporadas.find((x) => String(x.id) === ver) ?? temporadaActual(m);
  const siguiente = m.temporadas.find((x) => x.inicio > t.inicio);
  return { desde: t.inicio, hasta: siguiente?.inicio, etiqueta: t.nombre, ver: String(t.id) };
}
