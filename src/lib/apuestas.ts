// Casa de apuestas de la Tropa (con monedas de mentira). Todo es lógica pura:
//  1. modeloPartido: probabilidad de que gane cada pareja, mezclando ranking, forma, química y cara a cara.
//  2. mercados: de esa probabilidad se saca un modelo juego a juego y se enumeran TODOS los desarrollos posibles
//     del partido. Cada mercado es una suma sobre esa lista, así que las cuotas son coherentes entre sí.
//  3. resolver / carteras: quién acierta y cuántas monedas tiene cada uno.
import { ELO_INICIAL, ganador, type Estadisticas } from "./motor";
import type { Apuesta, Formato, Marcador, Mundo, Partido, Quedada } from "./tipos";

export const SALDO_INICIAL = 1000;
export const APUESTA_MAX = 100;
export const APUESTA_MIN = 5;
export const RESCATE = 100; // lo que da el Banco de la Tropa al que se arruina
const MARGEN = 0.06; // la casa siempre gana (un poco)

// ---------- 1. Quién es favorito ----------

export type Factor = { clave: "ranking" | "forma" | "quimica" | "caraacara"; titulo: string; valor: number; texto: string };
export type Modelo = { pA: number; factores: Factor[] };

const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));

export function modeloPartido(est: Estadisticas, a: number[], b: number[], nombre: (id: number) => string = String): Modelo {
  const elo = (ids: number[]) => ids.reduce((s, id) => s + (est.fichas.get(id)?.elo ?? ELO_INICIAL), 0) / ids.length;
  const ranking = ((elo(a) - elo(b)) / 400) * Math.LN10;

  // Forma: los últimos 5 partidos de cada jugador (del más reciente al más antiguo pesan igual).
  const ultimos = new Map<number, number[]>();
  for (const p of est.partidos) {
    const gana: number[] = ganador(p.sets) === "a" ? p.a : (p.b ?? []);
    for (const id of [...p.a, ...(p.b ?? [])]) {
      const l = ultimos.get(id) ?? [];
      l.push(gana.includes(id) ? 1 : 0);
      ultimos.set(id, l.slice(-5));
    }
  }
  const formaDe = (ids: number[]) =>
    ids.reduce((s, id) => {
      const l = ultimos.get(id) ?? [];
      // Con pocos partidos la forma cuenta menos.
      return s + (l.length ? (l.reduce((x, y) => x + y, 0) / l.length - 0.5) * (l.length / 5) : 0);
    }, 0) / ids.length;
  const forma = (formaDe(a) - formaDe(b)) * 1.2;

  // Química: cómo le va a cada pareja cuando juegan juntos.
  const quimicaDe = (ids: number[]) => {
    const [x, y] = ids;
    const par = est.parejas.find((p) => p.j1 === Math.min(x, y) && p.j2 === Math.max(x, y));
    return par ? (par.ganados / par.jugados - 0.5) * Math.min(par.jugados, 6) / 6 : 0;
  };
  const quimica = (quimicaDe(a) - quimicaDe(b)) * 1.0;

  // Cara a cara: cada jugador de A contra cada jugador de B.
  let cc = 0;
  for (const x of a)
    for (const y of b) {
      const c = est.caras.find((k) => k.x === Math.min(x, y) && k.y === Math.max(x, y));
      if (!c) continue;
      const ganaX = c.x === x ? c.ganaX : c.ganaY;
      cc += ((ganaX - (c.jugados - ganaX)) / c.jugados) * (Math.min(c.jugados, 6) / 6);
    }
  const caraacara = (cc / 4) * 0.8;

  const pA = Math.min(0.92, Math.max(0.08, sigmoide(ranking + forma + quimica + caraacara)));
  const A = a.map(nombre).join(" y ");
  const B = b.map(nombre).join(" y ");
  const quien = (v: number) => (Math.abs(v) < 0.04 ? "Igualados" : `A favor de ${v > 0 ? A : B}`);
  return {
    pA,
    factores: [
      { clave: "ranking", titulo: "📈 Ranking", valor: ranking, texto: quien(ranking) },
      { clave: "forma", titulo: "🔥 Forma (últimos 5)", valor: forma, texto: quien(forma) },
      { clave: "quimica", titulo: "🤝 Química de pareja", valor: quimica, texto: quien(quimica) },
      { clave: "caraacara", titulo: "🥊 Cara a cara", valor: caraacara, texto: quien(caraacara) },
    ],
  };
}

// ---------- 2. Del favorito a los mercados ----------

type ResultadoSet = { a: number; b: number; p: number };

// Distribución de marcadores de un set si A gana cada juego con probabilidad g (6-6 se decide con un juego más).
function distribucionSet(g: number): ResultadoSet[] {
  const out = new Map<string, number>();
  const sumar = (a: number, b: number, p: number) => out.set(`${a}-${b}`, (out.get(`${a}-${b}`) ?? 0) + p);
  const ir = (a: number, b: number, p: number) => {
    if (p === 0) return;
    if ((a === 6 && b <= 4) || (b === 6 && a <= 4) || a === 7 || b === 7) return sumar(a, b, p);
    ir(a + 1, b, p * g);
    ir(a, b + 1, p * (1 - g));
  };
  ir(0, 0, 1);
  return [...out.entries()].map(([k, p]) => {
    const [a, b] = k.split("-").map(Number);
    return { a, b, p };
  });
}

export type Desarrollo = { sets: Marcador[]; p: number };

// Todos los partidos posibles con su probabilidad.
function desarrollos(g: number, formato: Formato): Desarrollo[] {
  const set = distribucionSet(g);
  const out: Desarrollo[] = [];
  const seguir = (sets: Marcador[], p: number, ganaA: number, ganaB: number) => {
    const fin = formato === "mejor3" ? ganaA === 2 || ganaB === 2 : sets.length === 1;
    if (fin) return void out.push({ sets, p });
    for (const s of set) seguir([...sets, [s.a, s.b]], p * s.p, ganaA + (s.a > s.b ? 1 : 0), ganaB + (s.b > s.a ? 1 : 0));
  };
  seguir([], 1, 0, 0);
  return out;
}

const ganaA = (d: { sets: Marcador[] }) => ganador(d.sets) === "a";

// Busca la g (probabilidad de ganar cada juego) que hace que A gane el partido con probabilidad pA.
const calibrados = new Map<string, Desarrollo[]>();

function calibrar(pA: number, formato: Formato) {
  const k = `${formato}:${pA.toFixed(3)}`;
  const guardado = calibrados.get(k);
  if (guardado) return guardado;
  const ds = calibrarSinCache(pA, formato);
  if (calibrados.size > 200) calibrados.clear();
  calibrados.set(k, ds);
  return ds;
}

function calibrarSinCache(pA: number, formato: Formato) {
  let lo = 0.2;
  let hi = 0.8;
  let ds: Desarrollo[] = [];
  for (let i = 0; i < 22; i++) {
    const g = (lo + hi) / 2;
    ds = desarrollos(g, formato);
    const p = ds.reduce((s, d) => s + (ganaA(d) ? d.p : 0), 0);
    if (p < pA) lo = g;
    else hi = g;
  }
  return ds;
}

// Qué pasó en un partido, en los términos de los mercados.
function hechos(sets: Marcador[]) {
  const setsA = sets.filter(([x, y]) => x > y).length;
  const setsB = sets.length - setsA;
  const juegos = sets.reduce((s, [x, y]) => s + x + y, 0);
  const roscoA = sets.some(([x, y]) => x === 6 && y === 0);
  const roscoB = sets.some(([x, y]) => y === 6 && x === 0);
  const gana = setsA > setsB ? "a" : "b";
  const primero = sets[0][0] > sets[0][1] ? "a" : "b";
  return { setsA, setsB, juegos, roscoA, roscoB, gana, remontada: sets.length > 1 && primero !== gana, tiebreak: sets.some(([x, y]) => x + y === 13) };
}

type Hechos = ReturnType<typeof hechos>;

export type Opcion = { sel: string; etiqueta: string; prob: number; cuota: number };
export type Mercado = { clave: string; titulo: string; ayuda?: string; opciones: Opcion[] };

// Cómo se decide cada selección. La clave del mercado puede llevar una línea: "juegos:20.5".
function acierta(clave: string, sel: string, h: Hechos): boolean {
  const [tipo, linea] = clave.split(":");
  switch (tipo) {
    case "ganador":
      return h.gana === sel;
    case "sets":
      return `${h.setsA}-${h.setsB}` === sel;
    case "sets_a":
      return String(h.setsA) === sel;
    case "sets_b":
      return String(h.setsB) === sel;
    case "total_sets":
      return (h.setsA + h.setsB > Number(linea)) === (sel === "mas");
    case "juegos":
      return (h.juegos > Number(linea)) === (sel === "mas");
    case "rosco":
      return (h.roscoA || h.roscoB) === (sel === "si");
    case "rosco_a":
      return h.roscoA === (sel === "si");
    case "rosco_b":
      return h.roscoB === (sel === "si");
    case "remontada":
      return h.remontada === (sel === "si");
    case "tiebreak":
      return h.tiebreak === (sel === "si");
    default:
      return false;
  }
}

export function cuotaDe(prob: number) {
  return Math.min(25, Math.max(1.02, Math.round((1 / (prob * (1 + MARGEN))) * 100) / 100));
}

export function mercados(pA: number, formato: Formato, A = "Pareja 1", B = "Pareja 2"): Mercado[] {
  const fmt: Formato = formato === "1set" ? "1set" : "mejor3";
  const ds = calibrar(pA, fmt).map((d) => ({ p: d.p, h: hechos(d.sets) }));
  const prob = (clave: string, sel: string) => ds.reduce((s, d) => s + (acierta(clave, sel, d.h) ? d.p : 0), 0);
  const mercado = (clave: string, titulo: string, opciones: [string, string][], ayuda?: string): Mercado => ({
    clave,
    titulo,
    ayuda,
    opciones: opciones
      .map(([sel, etiqueta]) => ({ sel, etiqueta, prob: prob(clave, sel) }))
      .filter((o) => o.prob > 0.004)
      .map((o) => ({ ...o, cuota: cuotaDe(o.prob) })),
  });
  const siNo: [string, string][] = [["si", "Sí"], ["no", "No"]];

  // Línea de juegos: la x,5 que deja el más/menos más cerca del 50 %.
  const linea = (desde: number, hasta: number, objetivo: number) => {
    let mejor = desde;
    for (let l = desde; l <= hasta; l++)
      if (Math.abs(prob(`juegos:${l}.5`, "mas") - objetivo) < Math.abs(prob(`juegos:${mejor}.5`, "mas") - objetivo)) mejor = l;
    return `${mejor}.5`;
  };
  const [min, max] = fmt === "mejor3" ? [13, 34] : [6, 12];
  const central = linea(min, max, 0.5);
  const alta = linea(min, max, 0.25);
  const masMenos = (l: string): [string, string][] => [["mas", `Más de ${l.replace(".", ",")}`], ["menos", `Menos de ${l.replace(".", ",")}`]];

  const lista: Mercado[] = [mercado("ganador", "¿Quién gana?", [["a", A], ["b", B]])];
  if (fmt === "mejor3") {
    lista.push(
      mercado("sets", "Resultado en sets", [["2-0", `${A} 2-0`], ["2-1", `${A} 2-1`], ["1-2", `${B} 2-1`], ["0-2", `${B} 2-0`]]),
      mercado("total_sets:2.5", "Total de sets", [["mas", "Más de 2,5"], ["menos", "Menos de 2,5"]], "Más de 2,5 = se van al tercer set"),
      mercado("sets_a", `Sets que gana ${A}`, [["0", "0 sets"], ["1", "1 set"], ["2", "2 sets"]]),
      mercado("sets_b", `Sets que gana ${B}`, [["0", "0 sets"], ["1", "1 set"], ["2", "2 sets"]]),
    );
  }
  lista.push(mercado(`juegos:${central}`, "Total de juegos", masMenos(central), "La suma de juegos de todos los sets"));
  if (alta !== central) lista.push(mercado(`juegos:${alta}`, "Total de juegos (partidazo)", masMenos(alta)));
  lista.push(
    mercado("rosco", "¿Habrá algún set a cero (6-0)?", siNo, "«Quien pierda, por debajo de la red»"),
    mercado("rosco_a", `${A} hace un rosco (6-0)`, siNo),
    mercado("rosco_b", `${B} hace un rosco (6-0)`, siNo),
    mercado("tiebreak", "¿Habrá algún 7-6?", siNo),
  );
  if (fmt === "mejor3") lista.push(mercado("remontada", "¿Remontada?", siNo, "Gana quien pierde el primer set"));
  return lista.filter((mk) => mk.opciones.length >= 2);
}

// ---------- 3. Cobrar ----------

export type EstadoApuesta = "pendiente" | "ganada" | "perdida" | "nula";

// El marcador del partido visto desde las parejas de la convocatoria (por si se apuntó con las parejas al revés).
function setsOrientados(q: Quedada, p: Partido): Marcador[] {
  const igual = q.a !== null && p.a.includes(q.a[0]);
  return igual ? p.sets : p.sets.map(([x, y]) => [y, x]);
}

export function estadoApuesta(a: Pick<Apuesta, "mercado" | "seleccion">, q: Quedada, partido: Partido | undefined, anulado = false): EstadoApuesta {
  if (!q.partidoId) return "pendiente";
  // Partido borrado, anulado por amaño o inacabado: se devuelve el dinero.
  if (!partido || partido.estado === "rechazado" || anulado || partido.formato === "inacabado") return "nula";
  if (partido.estado === "reclamado") return "pendiente";
  return acierta(a.mercado, a.seleccion, hechos(setsOrientados(q, partido))) ? "ganada" : "perdida";
}

export const premio = (a: Pick<Apuesta, "importe" | "cuota">) => Math.round(a.importe * a.cuota);

export type Cartera = {
  id: number;
  saldo: number;
  enJuego: number;
  apostadas: number;
  ganadas: number;
  perdidas: number;
  beneficio: number; // lo ganado menos lo perdido en apuestas resueltas
  rescates: number;
  mejor: number; // el mayor premio cobrado
};

export type ApuestaVista = Apuesta & { estado: EstadoApuesta; quedada: Quedada };

export function apuestasVistas(m: Mundo, anulados: Set<number>): ApuestaVista[] {
  const partidos = new Map(m.partidos.map((p) => [p.id, p]));
  const quedadas = new Map(m.quedadasConApuestas.map((q) => [q.id, q]));
  return m.apuestas.flatMap((a) => {
    const q = quedadas.get(a.quedadaId);
    if (!q) return [];
    const p = q.partidoId ? partidos.get(q.partidoId) : undefined;
    return [{ ...a, quedada: q, estado: estadoApuesta(a, q, p, q.partidoId ? anulados.has(q.partidoId) : false) }];
  });
}

export function carteras(m: Mundo, vistas: ApuestaVista[]): Cartera[] {
  const c = new Map<number, Cartera>(
    m.jugadores.map((j) => [j.id, { id: j.id, saldo: SALDO_INICIAL, enJuego: 0, apostadas: 0, ganadas: 0, perdidas: 0, beneficio: 0, rescates: 0, mejor: 0 }]),
  );
  for (const e of m.eventos) {
    const x = c.get(e.jugadorId);
    if (x && e.tipo === "rescate") {
      x.rescates++;
      x.saldo += RESCATE;
    }
  }
  for (const a of vistas) {
    const x = c.get(a.jugadorId);
    if (!x || a.estado === "nula") continue;
    x.apostadas++;
    if (a.estado === "pendiente") {
      x.saldo -= a.importe;
      x.enJuego += a.importe;
    } else if (a.estado === "ganada") {
      const neto = premio(a) - a.importe;
      x.saldo += neto;
      x.beneficio += neto;
      x.ganadas++;
      x.mejor = Math.max(x.mejor, premio(a));
    } else {
      x.saldo -= a.importe;
      x.beneficio -= a.importe;
      x.perdidas++;
    }
  }
  return [...c.values()].sort((x, y) => y.saldo + y.enJuego - (x.saldo + x.enJuego));
}

// Hora de Madrid como "YYYY-MM-DD HH:MM", para comparar con la fecha y hora de la convocatoria.
export function ahoraMadrid(d = new Date()) {
  const f = new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Madrid", dateStyle: "short", timeStyle: "short" }).format(d);
  return f.replace("T", " ");
}

// Se puede apostar mientras haya parejas, no haya resultado y no haya llegado la hora.
export function abierta(q: Quedada, ahora = ahoraMadrid()) {
  return q.a !== null && q.b !== null && !q.partidoId && `${q.fecha} ${q.hora}` > ahora;
}

// Etiqueta legible de una apuesta ya hecha.
export function describir(a: Pick<Apuesta, "mercado" | "seleccion">, A: string, B: string) {
  const [tipo, linea] = a.mercado.split(":");
  const l = linea?.replace(".", ",");
  const siNo = a.seleccion === "si" ? "sí" : "no";
  const masMenos = a.seleccion === "mas" ? "más" : "menos";
  switch (tipo) {
    case "ganador":
      return `Gana ${a.seleccion === "a" ? A : B}`;
    case "sets": {
      const [x, y] = a.seleccion.split("-").map(Number);
      return x > y ? `${A} gana ${x}-${y} en sets` : `${B} gana ${y}-${x} en sets`;
    }
    case "sets_a":
      return `${A} gana ${a.seleccion} set${a.seleccion === "1" ? "" : "s"}`;
    case "sets_b":
      return `${B} gana ${a.seleccion} set${a.seleccion === "1" ? "" : "s"}`;
    case "total_sets":
      return `${masMenos[0].toUpperCase()}${masMenos.slice(1)} de ${l} sets`;
    case "juegos":
      return `${masMenos[0].toUpperCase()}${masMenos.slice(1)} de ${l} juegos`;
    case "rosco":
      return `Algún set a cero: ${siNo}`;
    case "rosco_a":
      return `Rosco de ${A}: ${siNo}`;
    case "rosco_b":
      return `Rosco de ${B}: ${siNo}`;
    case "remontada":
      return `Remontada: ${siNo}`;
    case "tiebreak":
      return `Algún 7-6: ${siNo}`;
    default:
      return `${a.mercado}: ${a.seleccion}`;
  }
}
