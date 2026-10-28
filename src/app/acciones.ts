"use server";

import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { cargarMundo, hoyMadrid, temporadaActual, yo } from "@/lib/datos";
import { PUESTOS, confirmadores, enPartido, repartir, setsValidos } from "@/lib/motor";
import { COOKIE_GRUPO, COOKIE_SESION, UN_ANO, codigoGrupo, valorGrupo, valorSesion } from "@/lib/sesion";
import type { Marcador } from "@/lib/tipos";

export type Estado = { error?: string; ok?: string } | null;

const cookieSegura = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", maxAge: UN_ANO, path: "/" };

function hashPin(pin: string) {
  const sal = randomBytes(16).toString("hex");
  return `${sal}:${scryptSync(pin, sal, 32).toString("hex")}`;
}

function pinCorrecto(pin: string, guardado: string) {
  const [sal, hash] = guardado.split(":");
  const calculado = scryptSync(pin, sal, 32);
  const esperado = Buffer.from(hash, "hex");
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

const MAX_FALLOS = 5;

const Pin = z.string().regex(/^\d{4}$/, "El PIN son 4 números");
const Nombre = z.string().trim().min(2, "Nombre demasiado corto").max(24, "Nombre demasiado largo");
// Foto ya recortada y pasada por el filtro cómic en el navegador (PNG pequeño).
const Avatar = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/, "Foto no válida")
  .max(400_000, "La foto pesa demasiado");

const fallo = (e: unknown): Estado => ({
  error: e instanceof z.ZodError ? e.issues[0].message : e instanceof Error ? e.message : "Algo ha fallado",
});

function refrescar() {
  revalidatePath("/", "layout");
}

// ---------- Entrada ----------

export async function entrarGrupo(_: Estado, fd: FormData): Promise<Estado> {
  const codigo = String(fd.get("codigo") ?? "").trim();
  if (!codigoGrupo()) return { error: "Falta configurar GROUP_CODE en el servidor" };
  if (codigo.toLowerCase() !== codigoGrupo().toLowerCase()) return { error: "Código incorrecto. ¿Seguro que eres de la Tropa?" };
  (await cookies()).set(COOKIE_GRUPO, valorGrupo(), cookieSegura);
  redirect("/entrar");
}

export async function entrarJugador(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const id = z.coerce.number().int().parse(fd.get("id"));
    const pin = Pin.parse(fd.get("pin"));
    const sql = await db();
    const [j] = await sql`select pin, fallos, bloqueado_hasta > now() as bloqueado from jugadores where id = ${id}`;
    if (!j) return { error: "Ese jugador no existe" };
    // 5 fallos seguidos bloquean 15 minutos: así nadie prueba los 10.000 PIN para hacerse pasar por otro.
    if (j.bloqueado) return { error: "Demasiados intentos. Prueba otra vez en 15 minutos 🔒" };
    if (!pinCorrecto(pin, j.pin)) {
      const fallos = j.fallos + 1;
      await sql`update jugadores set fallos = ${fallos >= MAX_FALLOS ? 0 : fallos},
                bloqueado_hasta = ${fallos >= MAX_FALLOS ? sql`now() + interval '15 minutes'` : null} where id = ${id}`;
      const quedan = MAX_FALLOS - fallos;
      return {
        error: quedan > 0
          ? `PIN incorrecto. Si no eres tú, no hagas trampas 👀 (te quedan ${quedan} intento${quedan > 1 ? "s" : ""})`
          : "Demasiados intentos. Prueba otra vez en 15 minutos 🔒",
      };
    }
    if (j.fallos) await sql`update jugadores set fallos = 0 where id = ${id}`;
    (await cookies()).set(COOKIE_SESION, valorSesion(id), cookieSegura);
  } catch (e) {
    return fallo(e);
  }
  redirect("/");
}

export async function registrar(_: Estado, fd: FormData): Promise<Estado> {
  let id: number;
  try {
    const nombre = Nombre.parse(fd.get("nombre"));
    const pin = Pin.parse(fd.get("pin"));
    const foto = fd.get("avatar") ? Avatar.parse(fd.get("avatar")) : null;
    const sql = await db();
    const [existe] = await sql`select 1 from jugadores where lower(nombre) = lower(${nombre})`;
    if (existe) return { error: "Ya hay alguien con ese nombre" };
    [{ id }] = await sql`
      insert into jugadores (nombre, pin, avatar, avatar_v) values (${nombre}, ${hashPin(pin)}, ${foto}, ${foto ? 1 : 0})
      returning id`;
    (await cookies()).set(COOKIE_SESION, valorSesion(id), cookieSegura);
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  redirect(`/jugador/${id}?bienvenida=1`);
}

export async function salir() {
  (await cookies()).delete(COOKIE_SESION);
  redirect("/entrar");
}

// ---------- Perfil ----------

export async function guardarFoto(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const me = await yo();
    const foto = Avatar.parse(fd.get("avatar"));
    const sql = await db();
    await sql`update jugadores set avatar = ${foto}, avatar_v = avatar_v + 1 where id = ${me.id}`;
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  return { ok: "¡Cabezón actualizado!" };
}

export async function cambiarPin(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const me = await yo();
    const pin = Pin.parse(fd.get("pin"));
    const sql = await db();
    await sql`update jugadores set pin = ${hashPin(pin)} where id = ${me.id}`;
  } catch (e) {
    return fallo(e);
  }
  return { ok: "PIN cambiado" };
}

export async function nuevaTemporada(_: Estado, fd: FormData): Promise<Estado> {
  try {
    await yo();
    const nombre = z.string().trim().min(2).max(40).parse(fd.get("nombre"));
    const m = await cargarMundo();
    if (temporadaActual(m).inicio === m.hoy) return { error: "Ya ha empezado una temporada hoy" };
    const sql = await db();
    await sql`insert into temporadas (nombre, inicio) values (${nombre}, ${m.hoy})`;
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  return { ok: "¡Nueva temporada! Todos a 1000 puntos" };
}

// ---------- Partidos ----------

const IdOpcional = z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int().positive().nullable());

export async function nuevoPartido(_: Estado, fd: FormData): Promise<Estado> {
  let id: number;
  try {
    const me = await yo();
    const datos = z
      .object({
        fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida"),
        a1: z.coerce.number().int(),
        a2: z.coerce.number().int(),
        b1: IdOpcional,
        b2: IdOpcional,
        bExterna: z.string().trim().max(40).optional().default(""),
        sets: z.string(),
        torneoId: IdOpcional,
      })
      .parse(Object.fromEntries(fd));
    if (datos.fecha > hoyMadrid()) return { error: "Ese partido aún no se ha jugado, vidente" };
    const sets = z
      .array(z.tuple([z.number().int(), z.number().int()]))
      .parse(JSON.parse(datos.sets)) as Marcador[];
    const errSets = setsValidos(sets);
    if (errSets) return { error: errSets };
    const externa = !datos.b1 && !datos.b2;
    if (externa && !datos.bExterna) return { error: "Elige a los rivales o pon el nombre de la pareja de fuera" };
    if (!externa && (!datos.b1 || !datos.b2)) return { error: "Faltan rivales" };
    const ids = [datos.a1, datos.a2, ...(externa ? [] : [datos.b1!, datos.b2!])];
    if (new Set(ids).size !== ids.length) return { error: "Hay un jugador repetido. Nadie juega en los dos lados" };
    const m = await cargarMundo();
    if (!ids.every((x) => m.jugadores.some((j) => j.id === x))) return { error: "Jugador desconocido" };

    const p = {
      a: [datos.a1, datos.a2] as [number, number],
      b: externa ? null : ([datos.b1!, datos.b2!] as [number, number]),
      creadoPor: me.id,
    };
    // Si nadie puede confirmarlo (p. ej. lo apunta uno solo contra gente de fuera), vale directamente.
    const autoconfirmado = confirmadores(p).length === 0;
    const sql = await db();
    [{ id }] = await sql`
      insert into partidos (fecha, a1, a2, b1, b2, b_externa, sets, estado, creado_por, torneo_id)
      values (${datos.fecha}, ${datos.a1}, ${datos.a2}, ${p.b?.[0] ?? null}, ${p.b?.[1] ?? null},
              ${externa ? datos.bExterna : null}, ${sql.json(sets)}, ${autoconfirmado ? "confirmado" : "pendiente"},
              ${me.id}, ${datos.torneoId})
      returning id`;
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  redirect(`/partidos/${id}?nuevo=1`);
}

async function partidoPara(id: number) {
  const m = await cargarMundo();
  const p = m.partidos.find((x) => x.id === id);
  if (!p) throw new Error("Ese partido no existe");
  return p;
}

export async function confirmarPartido(fd: FormData) {
  const me = await yo();
  const p = await partidoPara(Number(fd.get("id")));
  if (p.estado !== "pendiente" || !confirmadores(p).includes(me.id)) return;
  const sql = await db();
  await sql`update partidos set estado = 'confirmado', confirmado_por = ${me.id} where id = ${p.id} and estado = 'pendiente'`;
  refrescar();
}

export async function rechazarPartido(fd: FormData) {
  const me = await yo();
  const p = await partidoPara(Number(fd.get("id")));
  if (p.estado !== "pendiente" || (!confirmadores(p).includes(me.id) && p.creadoPor !== me.id)) return;
  const sql = await db();
  await sql`update partidos set estado = 'rechazado', confirmado_por = ${me.id} where id = ${p.id}`;
  refrescar();
  redirect("/partidos");
}

export async function denunciar(_: Estado, fd: FormData): Promise<Estado> {
  try {
    const me = await yo();
    const p = await partidoPara(Number(fd.get("id")));
    const motivo = z.string().trim().min(3, "Explica un poco la trampa").max(400).parse(fd.get("motivo"));
    if (p.estado !== "confirmado") return { error: "Solo se pueden denunciar partidos confirmados" };
    const sql = await db();
    await sql`insert into denuncias (partido_id, denunciante, motivo) values (${p.id}, ${me.id}, ${motivo})
              on conflict (partido_id) do nothing`;
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  return { ok: "Denuncia presentada. Que decida el tribunal ⚖️" };
}

export async function votar(fd: FormData) {
  const me = await yo();
  const denunciaId = Number(fd.get("denuncia"));
  const amano = fd.get("amano") === "si";
  const comentario = String(fd.get("comentario") ?? "").slice(0, 200);
  const m = await cargarMundo();
  const d = m.denuncias.find((x) => x.id === denunciaId);
  const p = d && m.partidos.find((x) => x.id === d.partidoId);
  if (!d || !p || enPartido(p).includes(me.id)) return;
  const sql = await db();
  await sql`insert into votos (denuncia_id, jugador_id, amano, comentario) values (${d.id}, ${me.id}, ${amano}, ${comentario})
            on conflict (denuncia_id, jugador_id) do update set amano = excluded.amano, comentario = excluded.comentario`;
  refrescar();
}

// ---------- Torneos ----------

export async function nuevoTorneo(_: Estado, fd: FormData): Promise<Estado> {
  let id: number;
  try {
    const me = await yo();
    const nombre = z.string().trim().min(3, "Ponle nombre al torneo").max(60).parse(fd.get("nombre"));
    const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha no válida").parse(fd.get("fecha"));
    const sql = await db();
    [{ id }] = await sql`insert into torneos (nombre, fecha, creado_por) values (${nombre}, ${fecha}, ${me.id}) returning id`;
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  redirect(`/torneos/${id}`);
}

export async function resultadoTorneo(_: Estado, fd: FormData): Promise<Estado> {
  try {
    await yo();
    const torneo = z.coerce.number().int().parse(fd.get("torneo"));
    const j1 = z.coerce.number().int().parse(fd.get("j1"));
    const j2 = z.coerce.number().int().parse(fd.get("j2"));
    const puesto = z.enum(PUESTOS).parse(fd.get("puesto"));
    if (j1 === j2) return { error: "Una pareja son dos personas" };
    const sql = await db();
    await sql`delete from torneo_resultados where torneo_id = ${torneo} and (j1 in (${j1}, ${j2}) or j2 in (${j1}, ${j2}))`;
    await sql`insert into torneo_resultados (torneo_id, j1, j2, puesto) values (${torneo}, ${j1}, ${j2}, ${puesto})`;
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  return { ok: "Resultado guardado" };
}

// ---------- Deudas ----------

export async function nuevoGasto(_: Estado, fd: FormData): Promise<Estado> {
  try {
    await yo();
    const pagador = z.coerce.number().int().parse(fd.get("pagador"));
    const concepto = z.string().trim().min(2, "¿Qué se pagó?").max(40).parse(fd.get("concepto"));
    const importe = Math.round(
      z.coerce.number({ message: "Importe no válido" }).positive("Importe no válido").max(2000).parse(String(fd.get("importe")).replace(",", ".")) * 100,
    );
    const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(fd.get("fecha"));
    const participantes = [...new Set(fd.getAll("participantes").map(Number))].filter(Number.isInteger);
    if (participantes.length < 2) return { error: "Elige al menos a dos personas (incluido el que pagó si jugó)" };
    const partes = repartir(importe, participantes).filter((p) => p.deudor !== pagador);
    if (!partes.length) return { error: "Si solo pagó y jugó él, aquí nadie debe nada" };
    const sql = await db();
    await sql.begin(async (tx) => {
      const [{ id }] = await tx`insert into gastos (pagador, concepto, importe, fecha) values (${pagador}, ${concepto}, ${importe}, ${fecha}) returning id`;
      for (const p of partes) await tx`insert into gasto_partes (gasto_id, deudor, importe) values (${id}, ${p.deudor}, ${p.importe})`;
    });
  } catch (e) {
    return fallo(e);
  }
  refrescar();
  return { ok: "Apuntado. El cobrador del frac ya está avisado 🎩" };
}

// Solo quien adelantó el dinero puede tachar la deuda.
export async function marcarPagada(fd: FormData) {
  const me = await yo();
  const sql = await db();
  await sql`update gasto_partes gp set pagada = now() from gastos g
            where gp.id = ${Number(fd.get("parte"))} and gp.gasto_id = g.id and g.pagador = ${me.id} and gp.pagada is null`;
  refrescar();
}

// El deudor solo puede avisar de que ya ha hecho el Bizum.
export async function avisarPagada(fd: FormData) {
  const me = await yo();
  const sql = await db();
  await sql`update gasto_partes set avisada = now() where id = ${Number(fd.get("parte"))} and deudor = ${me.id} and pagada is null`;
  refrescar();
}

export async function borrarGasto(fd: FormData) {
  const me = await yo();
  const sql = await db();
  await sql`delete from gastos where id = ${Number(fd.get("gasto"))} and pagador = ${me.id}`;
  refrescar();
}
