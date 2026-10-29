// Todo el cálculo (ELO, piques, medallas, deudas) es puro: recibe los datos y devuelve números.
// Así se puede probar sin base de datos y recalcular cualquier temporada al vuelo.
import type { Americano, Denuncia, Formato, Marcador, Mundo, Partido, PistaAmericano, Veredicto } from "./tipos";

export const ELO_INICIAL = 1000;

export const PUESTOS = ["Campeones", "Finalistas", "Semifinales", "Cuartos", "Octavos", "Fase de grupos", "Consolación"] as const;
const K = 32;

export function ganador(sets: Marcador[]): "a" | "b" {
  const a = sets.filter(([x, y]) => x > y).length;
  return a > sets.length - a ? "a" : "b";
}

export function diasEntre(desde: string, hasta: string) {
  return Math.round((Date.parse(hasta.slice(0, 10)) - Date.parse(desde.slice(0, 10))) / 86_400_000);
}

export function sumarDias(fecha: string, dias: number) {
  return new Date(Date.parse(fecha) + dias * 86_400_000).toISOString().slice(0, 10);
}

export function enPartido(p: Pick<Partido, "a" | "b">): number[] {
  return [...p.a, ...(p.b ?? [])];
}

// Quién puede confirmar un resultado: los rivales del que lo apunta.
// Si los rivales son de fuera, su compañero. Si no queda nadie, se da por bueno.
export function confirmadores(p: Pick<Partido, "a" | "b" | "creadoPor">): number[] {
  const ladoCreador = p.a.includes(p.creadoPor) ? "a" : p.b?.includes(p.creadoPor) ? "b" : null;
  if (!ladoCreador) return enPartido(p).filter((id) => id !== p.creadoPor);
  const rivales = ladoCreador === "a" ? (p.b ?? []) : p.a;
  if (rivales.length) return [...rivales];
  return (ladoCreador === "a" ? p.a : (p.b ?? [])).filter((id) => id !== p.creadoPor);
}

// El tribunal lo forman los que NO jugaron el partido. Con 3 votos o más decide la mayoría.
export function veredicto(d: Denuncia, p: Partido): { veredicto: Veredicto; amano: number; limpio: number } {
  const jugadores = new Set(enPartido(p));
  const jurado = d.votos.filter((v) => !jugadores.has(v.jugadorId));
  const amano = jurado.filter((v) => v.amano).length;
  const limpio = jurado.length - amano;
  if (jurado.length < 3 || amano === limpio) return { veredicto: "deliberando", amano, limpio };
  return { veredicto: amano > limpio ? "amano" : "limpio", amano, limpio };
}

export function partidosAnulados(m: Mundo): Set<number> {
  const porId = new Map(m.partidos.map((p) => [p.id, p]));
  const anulados = new Set<number>();
  for (const d of m.denuncias) {
    const p = porId.get(d.partidoId);
    if (p && veredicto(d, p).veredicto === "amano") anulados.add(p.id);
  }
  return anulados;
}

export function partidosQueCuentan(m: Mundo, desde?: string, hasta?: string): Partido[] {
  const anulados = partidosAnulados(m);
  return m.partidos
    .filter((p) => p.estado === "confirmado" && !anulados.has(p.id) && (!desde || p.fecha >= desde) && (!hasta || p.fecha < hasta))
    .sort((x, y) => x.fecha.localeCompare(y.fecha) || x.creado.localeCompare(y.creado) || x.id - y.id);
}

export type Ficha = {
  id: number;
  elo: number;
  historial: number[];
  jugados: number;
  ganados: number;
  perdidos: number;
  setsG: number;
  setsP: number;
  juegosG: number;
  juegosP: number;
  racha: number; // +3 = tres victorias seguidas, -5 = cinco derrotas seguidas
  mejorRacha: number;
  peorRacha: number;
  tercerSetG: number;
  tercerSetP: number;
  remontadas: number;
  roscosDados: number;
  roscosRecibidos: number;
  inacabados: number;
  porLado: { derecha: { g: number; p: number }; izquierda: { g: number; p: number } };
  ultimo: string | null;
};

export type Cara = { x: number; y: number; jugados: number; ganaX: number; ganaY: number };
export type Pareja = { j1: number; j2: number; jugados: number; ganados: number };
export type Cambio = { partidoId: number; fecha: string; jugadorId: number; delta: number };

export type Estadisticas = {
  fichas: Map<number, Ficha>;
  ranking: Ficha[];
  caras: Cara[];
  parejas: Pareja[];
  cambios: Cambio[];
  partidos: Partido[]; // los que tienen ganador
  inacabados: Partido[];
};

function fichaVacia(id: number): Ficha {
  return {
    id, elo: ELO_INICIAL, historial: [ELO_INICIAL], jugados: 0, ganados: 0, perdidos: 0, setsG: 0, setsP: 0,
    juegosG: 0, juegosP: 0, racha: 0, mejorRacha: 0, peorRacha: 0, tercerSetG: 0, tercerSetP: 0,
    remontadas: 0, roscosDados: 0, roscosRecibidos: 0, inacabados: 0,
    porLado: { derecha: { g: 0, p: 0 }, izquierda: { g: 0, p: 0 } }, ultimo: null,
  };
}

const clave = (x: number, y: number) => (x < y ? `${x}-${y}` : `${y}-${x}`);

export function estadisticas(m: Mundo, desde?: string, hasta?: string): Estadisticas {
  const fichas = new Map(m.jugadores.map((j) => [j.id, fichaVacia(j.id)]));
  const caras = new Map<string, Cara>();
  const parejas = new Map<string, Pareja>();
  const cambios: Cambio[] = [];
  const partidos = partidosQueCuentan(m, desde, hasta);

  for (const p of partidos) {
    // Inacabado: solo suma juegos y sets terminados. Ni victoria, ni derrota, ni ELO.
    if (p.formato === "inacabado") {
      for (const [lado, nombre] of [[p.a, "a"], [p.b ?? [], "b"]] as const) {
        for (const id of lado) {
          const f = fichas.get(id);
          if (!f) continue;
          f.inacabados++;
          f.ultimo = p.fecha;
          p.sets.forEach(([x, y], i) => {
            const [mios, suyos] = nombre === "a" ? [x, y] : [y, x];
            f.juegosG += mios;
            f.juegosP += suyos;
            if (i === p.sets.length - 1) return; // el último set es el que quedó a medias
            if (mios > suyos) f.setsG++;
            else if (suyos > mios) f.setsP++;
          });
        }
      }
      continue;
    }

    const gana = ganador(p.sets);
    // ELO por parejas: cada pareja vale la media de sus dos jugadores. Ganar con un compañero flojo
    // (media más baja) da más puntos; perder con uno fuerte (media más alta) quita más.
    const eloLado = (lado: number[] | null) =>
      lado ? lado.reduce((s, id) => s + (fichas.get(id)?.elo ?? ELO_INICIAL), 0) / lado.length : ELO_INICIAL;
    const eloA = eloLado(p.a);
    const eloB = eloLado(p.b);
    const esperadoA = 1 / (1 + 10 ** ((eloB - eloA) / 400));
    const juegosA = p.sets.reduce((s, [x]) => s + x, 0);
    const juegosB = p.sets.reduce((s, [, y]) => s + y, 0);
    // Ganar 6-0 6-0 da algo más que ganar en el tie-break del tercero.
    const margen = 1 + Math.min(Math.abs(juegosA - juegosB), 10) / 20;
    const deltaA = K * margen * ((gana === "a" ? 1 : 0) - esperadoA);

    const lados: [number[], "a" | "b", number, number | null][] = [[p.a, "a", deltaA, p.aDerecha]];
    if (p.b) lados.push([p.b, "b", -deltaA, p.bDerecha]);
    for (const [lado, nombre, delta, derecha] of lados) {
      const gano = gana === nombre;
      for (const id of lado) {
        const f = fichas.get(id);
        if (!f) continue;
        f.elo += delta;
        f.historial.push(f.elo);
        cambios.push({ partidoId: p.id, fecha: p.fecha, jugadorId: id, delta });
        f.jugados++;
        if (gano) f.ganados++;
        else f.perdidos++;
        if (derecha) {
          const l = f.porLado[derecha === id ? "derecha" : "izquierda"];
          if (gano) l.g++;
          else l.p++;
        }
        f.racha = gano ? Math.max(f.racha, 0) + 1 : Math.min(f.racha, 0) - 1;
        f.mejorRacha = Math.max(f.mejorRacha, f.racha);
        f.peorRacha = Math.min(f.peorRacha, f.racha);
        f.ultimo = p.fecha;
        p.sets.forEach(([x, y], i) => {
          const [mios, suyos] = nombre === "a" ? [x, y] : [y, x];
          f.juegosG += mios;
          f.juegosP += suyos;
          if (mios > suyos) f.setsG++;
          else f.setsP++;
          if (mios === 6 && suyos === 0) f.roscosDados++;
          if (suyos === 6 && mios === 0) f.roscosRecibidos++;
          if (i === 2) {
            if (mios > suyos) f.tercerSetG++;
            else f.tercerSetP++;
          }
        });
        const primero = p.sets[0];
        const perdioPrimero = nombre === "a" ? primero[0] < primero[1] : primero[1] < primero[0];
        if (gano && perdioPrimero && p.sets.length > 1) f.remontadas++;
      }
      const [j1, j2] = lado;
      const k = clave(j1, j2);
      const par = parejas.get(k) ?? { j1: Math.min(j1, j2), j2: Math.max(j1, j2), jugados: 0, ganados: 0 };
      par.jugados++;
      if (gano) par.ganados++;
      parejas.set(k, par);
    }

    if (p.b) {
      for (const x of p.a) {
        for (const y of p.b) {
          const k = clave(x, y);
          const c = caras.get(k) ?? { x: Math.min(x, y), y: Math.max(x, y), jugados: 0, ganaX: 0, ganaY: 0 };
          c.jugados++;
          const ganadorId = gana === "a" ? x : y;
          if (ganadorId === c.x) c.ganaX++;
          else c.ganaY++;
          caras.set(k, c);
        }
      }
    }
  }

  const ranking = [...fichas.values()].sort(
    (x, y) => Number(y.jugados > 0) - Number(x.jugados > 0) || y.elo - x.elo || y.ganados - x.ganados,
  );
  return {
    fichas,
    ranking,
    caras: [...caras.values()],
    parejas: [...parejas.values()],
    cambios,
    partidos: partidos.filter((p) => p.formato !== "inacabado"),
    inacabados: partidos.filter((p) => p.formato === "inacabado"),
  };
}

// ---------- Piques ----------

export type Relacion = {
  tipo: "perrito" | "hijo" | "beso";
  x: number; // el que manda (en "beso", da igual)
  y: number;
  ganaX: number;
  ganaY: number;
};

export function relaciones(est: Estadisticas): Relacion[] {
  const out: Relacion[] = [];
  for (const c of est.caras) {
    const [x, y, gx, gy] = c.ganaX >= c.ganaY ? [c.x, c.y, c.ganaX, c.ganaY] : [c.y, c.x, c.ganaY, c.ganaX];
    if (c.jugados >= 4 && gy === 0) out.push({ tipo: "perrito", x, y, ganaX: gx, ganaY: gy });
    else if (c.jugados >= 3 && gx / c.jugados >= 0.7) out.push({ tipo: "hijo", x, y, ganaX: gx, ganaY: gy });
    else if (c.jugados >= 3 && gx - gy <= 1) {
      const ex = est.fichas.get(x)?.elo ?? ELO_INICIAL;
      const ey = est.fichas.get(y)?.elo ?? ELO_INICIAL;
      if (Math.abs(ex - ey) <= 40) out.push({ tipo: "beso", x, y, ganaX: gx, ganaY: gy });
    }
  }
  const peso = (r: Relacion) => (r.tipo === "beso" ? r.ganaX + r.ganaY : r.ganaX - r.ganaY);
  return out.sort((r, s) => peso(s) - peso(r));
}

// El rival que más veces te ha ganado (mínimo dos).
export function peorPesadilla(est: Estadisticas, id: number): { rival: number; gana: number; pierde: number } | null {
  let mejor: { rival: number; gana: number; pierde: number } | null = null;
  for (const c of est.caras) {
    if (c.x !== id && c.y !== id) continue;
    const [rival, suyas, mias] = c.x === id ? [c.y, c.ganaY, c.ganaX] : [c.x, c.ganaX, c.ganaY];
    if (suyas < 2 || suyas <= mias) continue;
    if (!mejor || suyas - mias > mejor.gana - mejor.pierde) mejor = { rival, gana: suyas, pierde: mias };
  }
  return mejor;
}

export function mejoresParejas(est: Estadisticas, minimo = 3) {
  const validas = est.parejas.filter((p) => p.jugados >= minimo);
  const pct = (p: Pareja) => p.ganados / p.jugados;
  const orden = [...validas].sort((p, q) => pct(q) - pct(p) || q.jugados - p.jugados);
  return { mejor: orden[0] ?? null, peor: orden.length > 1 ? orden[orden.length - 1] : null, todas: orden };
}

// ---------- Deudas ----------

export type FichaDeudor = {
  id: number;
  debe: number; // céntimos pendientes
  morosidad: number; // € pendientes × días que llevan pendientes
  diasMax: number;
  leDeben: number;
  pagadoPorEl: number; // total adelantado por él (pista, pelotas…)
  mediaDiasPago: number | null; // cuánto tarda de media en pagar
};

export function deudas(m: Mundo): FichaDeudor[] {
  const fichas = new Map<number, FichaDeudor & { _dias: number[] }>(
    m.jugadores.map((j) => [
      j.id,
      { id: j.id, debe: 0, morosidad: 0, diasMax: 0, leDeben: 0, pagadoPorEl: 0, mediaDiasPago: null, _dias: [] },
    ]),
  );
  for (const g of m.gastos) {
    const pagador = fichas.get(g.pagador);
    if (pagador) pagador.pagadoPorEl += g.importe;
    for (const parte of g.partes) {
      const f = fichas.get(parte.deudor);
      if (!f) continue;
      const dias = Math.max(0, diasEntre(g.fecha, parte.pagada ?? m.hoy));
      f._dias.push(dias);
      if (!parte.pagada) {
        f.debe += parte.importe;
        f.morosidad += (parte.importe / 100) * Math.max(dias, 1);
        f.diasMax = Math.max(f.diasMax, dias);
        if (pagador) pagador.leDeben += parte.importe;
      }
    }
  }
  return [...fichas.values()]
    .map(({ _dias, ...f }) => ({
      ...f,
      mediaDiasPago: _dias.length ? _dias.reduce((s, d) => s + d, 0) / _dias.length : null,
    }))
    .sort((x, y) => y.morosidad - x.morosidad || y.debe - x.debe);
}

// Reparte un gasto a partes iguales; los céntimos sobrantes se los comen los primeros.
export function repartir(importe: number, personas: number[]): { deudor: number; importe: number }[] {
  const base = Math.floor(importe / personas.length);
  const resto = importe - base * personas.length;
  return personas.map((deudor, i) => ({ deudor, importe: base + (i < resto ? 1 : 0) }));
}

// ---------- Medallas ----------

export type Medalla = { clave: string; emoji: string; nombre: string; texto: string; jugadorId: number };

export function medallas(m: Mundo, est: Estadisticas): Medalla[] {
  const out: Medalla[] = [];
  const conPartidos = est.ranking.filter((f) => f.jugados > 0);
  const add = (clave: string, emoji: string, nombre: string, texto: string, jugadorId: number) =>
    out.push({ clave, emoji, nombre, texto, jugadorId });

  if (conPartidos[0]) add("numero1", "👑", "El Rey de la Pista", "Número 1 del ranking", conPartidos[0].id);
  const minimos = conPartidos.filter((f) => f.jugados >= 3);
  if (minimos.length > 2) {
    const ultimo = minimos[minimos.length - 1];
    add("cuchara", "🥄", "Cuchara de Madera", "Último del ranking. Alguien tiene que serlo", ultimo.id);
  }

  for (const f of conPartidos) {
    if (f.racha <= -5) add("ambulancia", "🚑", "Ambulancia", `${-f.racha} derrotas seguidas. Que alguien llame al 112`, f.id);
    else if (f.racha <= -3) add("tocado", "🤕", "Tocado y hundido", `${-f.racha} derrotas seguidas`, f.id);
    if (f.racha >= 3)
      add("ego", "🦚", "Ego por las nubes", `${f.racha} victorias seguidas${f.racha >= 5 ? ". El ego ya no cabe en la pista" : ""}`, f.id);
    if (f.tercerSetP >= 3 && f.tercerSetG / (f.tercerSetG + f.tercerSetP) <= 0.34)
      add("pechofrio", "🧊", "Pecho Frío", `Ha perdido ${f.tercerSetP} terceros sets de ${f.tercerSetG + f.tercerSetP}`, f.id);
    if (f.ultimo && diasEntre(f.ultimo, m.hoy) > 30)
      add("fantasma", "👻", "Fantasma", `No pisa una pista desde hace ${diasEntre(f.ultimo, m.hoy)} días`, f.id);
  }

  const maximo = (campo: keyof Ficha, minimo: number) => {
    const top = [...conPartidos].sort((x, y) => (y[campo] as number) - (x[campo] as number))[0];
    return top && (top[campo] as number) >= minimo ? top : null;
  };
  const panadero = maximo("roscosDados", 1);
  if (panadero) add("panadero", "🍩", "El Panadero", `Ha repartido ${panadero.roscosDados} roscos (6-0)`, panadero.id);
  const comeroscos = maximo("roscosRecibidos", 1);
  if (comeroscos)
    add("comeroscos", "🥯", "Come Roscos", `Se ha comido ${comeroscos.roscosRecibidos} roscos (0-6)`, comeroscos.id);
  const remontador = maximo("remontadas", 2);
  if (remontador)
    add("remontador", "🦾", "El Remontador", `${remontador.remontadas} partidos ganados perdiendo el primer set`, remontador.id);

  // Deudas
  const deu = deudas(m);
  const moroso = deu.find((d) => d.debe > 0);
  if (moroso) add("moroso", "💸", "Moroso del Mes", `Debe ${euros(moroso.debe)} desde hace ${moroso.diasMax} días`, moroso.id);
  const banco = [...deu].sort((x, y) => y.pagadoPorEl - x.pagadoPorEl)[0];
  if (banco && banco.pagadoPorEl > 0)
    add("banco", "🏦", "El Banco de la Tropa", `Ha adelantado ${euros(banco.pagadoPorEl)} en total`, banco.id);

  // Tribunal
  const porId = new Map(m.partidos.map((p) => [p.id, p]));
  const lloros = new Map<number, number>();
  const trampas = new Map<number, number>();
  for (const d of m.denuncias) {
    const p = porId.get(d.partidoId);
    if (!p) continue;
    const v = veredicto(d, p).veredicto;
    if (v === "limpio") lloros.set(d.denunciante, (lloros.get(d.denunciante) ?? 0) + 1);
    if (v === "amano") {
      const ganadores = ganador(p.sets) === "a" ? p.a : (p.b ?? []);
      for (const id of ganadores) trampas.set(id, (trampas.get(id) ?? 0) + 1);
    }
  }
  // Llorón: denuncias desestimadas + intentos de borrar un partido perdido.
  const intentos = new Map<number, number>();
  for (const e of m.eventos) if (e.tipo === "intento_borrado") intentos.set(e.jugadorId, (intentos.get(e.jugadorId) ?? 0) + 1);
  for (const id of new Set([...lloros.keys(), ...intentos.keys()])) {
    const partes = [];
    const n = lloros.get(id) ?? 0;
    const k = intentos.get(id) ?? 0;
    if (k) partes.push(`intentó borrar ${k} partido${k > 1 ? "s" : ""} perdido${k > 1 ? "s" : ""}`);
    if (n) partes.push(`${n} denuncia${n > 1 ? "s" : ""} de amaño desestimada${n > 1 ? "s" : ""}`);
    add("lloron", "🥹", "Llorón Oficial", partes.join(" y ").replace(/^./, (c) => c.toUpperCase()), id);
  }

  // Megáfono: al menos dos de los otros tres jugadores del partido dicen que gritó a su pareja.
  const gritos = new Map<number, number>();
  const porPartido = new Map<string, number>();
  for (const v of m.megafonos) porPartido.set(`${v.partidoId}-${v.acusado}`, (porPartido.get(`${v.partidoId}-${v.acusado}`) ?? 0) + 1);
  for (const [k, n] of porPartido) {
    if (n < 2) continue;
    const acusado = Number(k.split("-")[1]);
    gritos.set(acusado, (gritos.get(acusado) ?? 0) + 1);
  }
  for (const [id, n] of gritos) add("megafono", "📣", "Megáfono", `Pillado gritando a su pareja en ${n} partido${n > 1 ? "s" : ""}`, id);

  // Modo Strava: el que más ha jugado en los últimos 7 días (mínimo 3).
  const semana = sumarDias(m.hoy, -6);
  const enSemana = new Map<number, number>();
  for (const p of partidosQueCuentan(m, semana)) for (const id of enPartido(p)) enSemana.set(id, (enSemana.get(id) ?? 0) + 1);
  const [stravero, nStrava] = [...enSemana.entries()].sort((a, b) => b[1] - a[1])[0] ?? [0, 0];
  if (nStrava >= 3) add("strava", "🏊", "Modo Strava", `${nStrava} partidos esta semana. Esto ya hay que subirlo a Strava`, stravero);

  // Pareja impuesta: quien más veces dice que la pareja se la impusieron.
  const impuestas = new Map<number, number>();
  for (const p of m.partidos) if (p.impuestaPor && p.estado !== "rechazado") impuestas.set(p.impuestaPor, (impuestas.get(p.impuestaPor) ?? 0) + 1);
  for (const [id, n] of impuestas) if (n >= 2) add("impuesta", "🙄", "Siempre me la imponéis", `Ha dicho ${n} veces que la pareja se la impusieron`, id);

  // Reconciliación Guadalquivir: las 2 rivalidades más gordas (3+ duelos) cuyos protagonistas también ganan juntos.
  const reconciliables = est.caras
    .filter((c) => c.jugados >= 3 && est.parejas.some((p) => p.j1 === c.x && p.j2 === c.y && p.ganados > 0))
    .sort((a, b) => b.jugados - a.jugados || Math.abs(a.ganaX - a.ganaY) - Math.abs(b.ganaX - b.ganaY))
    .slice(0, 2);
  for (const c of reconciliables) {
    for (const id of [c.x, c.y]) {
      const otro = id === c.x ? c.y : c.x;
      add(`reconciliacion-${otro}`, "🤝", "Reconciliación Guadalquivir", `Rivales en ${c.jugados} partidos, pero juntos ganan`, id);
    }
  }
  for (const [id, n] of trampas) add("tramposo", "🕵️", "Tramposo Condenado", `${n} partido${n > 1 ? "s" : ""} anulado${n > 1 ? "s" : ""} por amaño`, id);

  // Torneos
  for (const t of m.torneos) {
    for (const r of t.resultados) {
      if (r.puesto === "Campeones") {
        add(`torneo-${t.id}`, "🏆", "Campeón de Torneo", t.nombre, r.j1);
        add(`torneo-${t.id}`, "🏆", "Campeón de Torneo", t.nombre, r.j2);
      }
    }
  }
  return out;
}

export function euros(centimos: number) {
  return (centimos / 100).toLocaleString("es-ES", { style: "currency", currency: "EUR" });
}

export function textoSets(sets: Marcador[], lado: "a" | "b" = "a") {
  return sets.map(([x, y]) => (lado === "a" ? `${x}-${y}` : `${y}-${x}`)).join(" ");
}

// Valida el marcador según el formato. Admite el super tie-break (10-8) como tercer set.
export function setsValidos(sets: Marcador[], formato: Formato = "mejor3"): string | null {
  if (sets.length < 1 || sets.length > 3) return "Pon entre 1 y 3 sets";
  for (const [x, y] of sets) {
    if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0 || x > 30 || y > 30) return "Hay un set raro";
    if (x === y && formato !== "inacabado") return "Un set no puede acabar en empate";
  }
  if (formato === "inacabado") {
    return sets.some(([x, y]) => x + y > 0) ? null : "Pon cómo iba el marcador cuando se paró";
  }
  if (formato === "1set") return sets.length === 1 ? null : "Un partido a 1 set lleva un solo set";
  if (sets.length === 1) return "Al mejor de 3 hacen falta al menos 2 sets. ¿Era a 1 set?";
  const a = sets.filter(([x, y]) => x > y).length;
  if (a * 2 === sets.length) return "Los sets están empatados: falta el tercero (o márcalo como inacabado)";
  if (sets.length === 3) {
    const [s1, s2] = sets;
    if (s1[0] > s1[1] === s2[0] > s2[1]) return "Si alguien ganó los dos primeros sets, no hay tercero";
  }
  return null;
}

// ---------- Cara a cara ----------

export type Duelo = {
  partidos: Partido[]; // como rivales, del más antiguo al más reciente
  ganaX: number;
  ganaY: number;
  racha: { quien: number; n: number } | null;
  juntos: { jugados: number; ganados: number };
  termometro: number; // 0-100
};

// Lo caliente que está un pique: muchos duelos, igualados y recientes.
export function duelo(m: Mundo, est: Estadisticas, x: number, y: number): Duelo {
  const rivales = (p: Partido) => p.b && ((p.a.includes(x) && p.b.includes(y)) || (p.a.includes(y) && p.b.includes(x)));
  const partidos = est.partidos.filter(rivales);
  let ganaX = 0;
  let ganaY = 0;
  let racha = null as Duelo["racha"];
  let difJuegos = 0;
  for (const p of partidos) {
    const ganadores = ganador(p.sets) === "a" ? p.a : p.b!;
    const quien = ganadores.includes(x) ? x : y;
    if (quien === x) ganaX++;
    else ganaY++;
    racha = racha?.quien === quien ? { quien, n: racha.n + 1 } : { quien, n: 1 };
    difJuegos += Math.abs(p.sets.reduce((s, [a, b]) => s + a - b, 0));
  }
  const juntos = est.parejas.find((p) => p.j1 === Math.min(x, y) && p.j2 === Math.max(x, y));
  const n = partidos.length;
  const recientes = partidos.filter((p) => diasEntre(p.fecha, m.hoy) <= 30).length;
  const igualdad = n ? 1 - Math.min(Math.abs(ganaX - ganaY) / n + difJuegos / n / 16, 1) : 0;
  const termometro = Math.round(Math.min(100, Math.min(n, 6) * 8 + igualdad * 32 + Math.min(recientes, 4) * 5));
  return { partidos, ganaX, ganaY, racha, juntos: { jugados: juntos?.jugados ?? 0, ganados: juntos?.ganados ?? 0 }, termometro };
}

export function etiquetaTermometro(t: number) {
  if (t >= 75) return "🌋 Volcán en erupción";
  if (t >= 50) return "🔥 Caliente";
  if (t >= 25) return "🌡️ Templado";
  return "🧊 Frío";
}

// ---------- Torneo cruzado (americano) ----------

// Generador pseudoaleatorio con semilla, para que el cuadro sea reproducible.
function aleatorio(semilla: number) {
  let s = semilla >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return (s >>> 0) / 4294967296;
  };
}

// Rondas con parejas que rotan: se busca que nadie repita compañero y que los descansos se repartan.
export function generarAmericano(jugadores: number[], juegos: number, semilla = 1, rondas?: number): Americano {
  const rnd = aleatorio(semilla);
  const n = jugadores.length;
  const pistas = Math.floor(n / 4);
  const total = rondas ?? (n % 4 === 0 ? n - 1 : n);
  const companeros = new Map<string, number>();
  const rivales = new Map<string, number>();
  const descansos = new Map(jugadores.map((j) => [j, 0]));
  const cuenta = (mapa: Map<string, number>, a: number, b: number) => mapa.get(clave(a, b)) ?? 0;
  const out: Americano["rondas"] = [];

  for (let r = 0; r < total; r++) {
    const sobran = n - pistas * 4;
    const orden = [...jugadores].sort((a, b) => descansos.get(a)! - descansos.get(b)! || rnd() - 0.5);
    const descansan = orden.slice(0, sobran);
    const juegan = jugadores.filter((j) => !descansan.includes(j));
    let mejor: { coste: number; pistas: PistaAmericano[] } | null = null;
    for (let intento = 0; intento < 400; intento++) {
      const mezcla = [...juegan].sort(() => rnd() - 0.5);
      let coste = 0;
      const ps: PistaAmericano[] = [];
      for (let k = 0; k < pistas; k++) {
        const [p, q, t, u] = mezcla.slice(k * 4, k * 4 + 4);
        const opciones: [[number, number], [number, number]][] = [[[p, q], [t, u]], [[p, t], [q, u]], [[p, u], [q, t]]];
        let elegida = opciones[0];
        let costeElegida = Infinity;
        for (const [a, b] of opciones) {
          const c = (cuenta(companeros, ...a) + cuenta(companeros, ...b)) * 10 +
            a.reduce((s, x) => s + b.reduce((s2, y) => s2 + cuenta(rivales, x, y), 0), 0);
          if (c < costeElegida) [elegida, costeElegida] = [[a, b], c];
        }
        coste += costeElegida;
        ps.push({ a: elegida[0], b: elegida[1], ja: null, jb: null });
      }
      if (!mejor || coste < mejor.coste) mejor = { coste, pistas: ps };
      if (coste === 0) break;
    }
    for (const p of mejor!.pistas) {
      companeros.set(clave(...p.a), cuenta(companeros, ...p.a) + 1);
      companeros.set(clave(...p.b), cuenta(companeros, ...p.b) + 1);
      for (const x of p.a) for (const y of p.b) rivales.set(clave(x, y), cuenta(rivales, x, y) + 1);
    }
    for (const j of descansan) descansos.set(j, descansos.get(j)! + 1);
    out.push({ pistas: mejor!.pistas, descansan });
  }
  return { jugadores: [...jugadores], juegos, rondas: out };
}

export type FilaAmericano = { id: number; juegosG: number; juegosP: number; ganados: number; jugados: number };

export function clasificacionAmericano(t: Americano): FilaAmericano[] {
  const filas = new Map(t.jugadores.map((id) => [id, { id, juegosG: 0, juegosP: 0, ganados: 0, jugados: 0 }]));
  for (const r of t.rondas) {
    for (const p of r.pistas) {
      if (p.ja == null || p.jb == null) continue;
      for (const [lado, mios, suyos] of [[p.a, p.ja, p.jb], [p.b, p.jb, p.ja]] as const) {
        for (const id of lado) {
          const f = filas.get(id)!;
          f.juegosG += mios;
          f.juegosP += suyos;
          f.jugados++;
          if (mios > suyos) f.ganados++;
        }
      }
    }
  }
  return [...filas.values()].sort(
    (x, y) => y.juegosG - x.juegosG || y.juegosG - y.juegosP - (x.juegosG - x.juegosP) || y.ganados - x.ganados,
  );
}

// ---------- Muro de la vergüenza ----------

export type Verguenza = {
  fecha: string;
  emoji: string;
  jugadorId: number;
  texto: string;
  partidoId?: number;
};

// Todo lo que nadie quiere que se recuerde, del más reciente al más antiguo.
export function muroDeLaVerguenza(m: Mundo): Verguenza[] {
  const out: Verguenza[] = [];
  const porId = new Map(m.partidos.map((p) => [p.id, p]));
  for (const e of m.eventos) {
    if (e.tipo !== "intento_borrado") continue;
    out.push({ fecha: e.creado.slice(0, 10), emoji: "🥹", jugadorId: e.jugadorId, texto: "intentó borrar un partido que había perdido", partidoId: e.partidoId ?? undefined });
  }
  for (const d of m.denuncias) {
    const p = porId.get(d.partidoId);
    if (!p) continue;
    const v = veredicto(d, p).veredicto;
    if (v === "limpio")
      out.push({ fecha: d.creada.slice(0, 10), emoji: "😭", jugadorId: d.denunciante, texto: "denunció un amaño… y el tribunal dijo que fue limpio", partidoId: p.id });
    if (v === "amano")
      for (const id of ganador(p.sets) === "a" ? p.a : (p.b ?? []))
        out.push({ fecha: d.creada.slice(0, 10), emoji: "🕵️", jugadorId: id, texto: "ganó un partido que el tribunal anuló por amaño", partidoId: p.id });
  }
  const votos = new Map<string, number>();
  for (const v of m.megafonos) votos.set(`${v.partidoId}-${v.acusado}`, (votos.get(`${v.partidoId}-${v.acusado}`) ?? 0) + 1);
  for (const [k, n] of votos) {
    if (n < 2) continue;
    const [pid, acusado] = k.split("-").map(Number);
    const p = porId.get(pid);
    if (p) out.push({ fecha: p.fecha, emoji: "📣", jugadorId: acusado, texto: `le gritó a su pareja (${n} testigos)`, partidoId: pid });
  }
  for (const p of m.partidos) {
    if (p.impuestaPor && p.estado === "confirmado")
      out.push({ fecha: p.fecha, emoji: "🙄", jugadorId: p.impuestaPor, texto: "dijo que la pareja se la impusieron", partidoId: p.id });
    if (p.estado === "confirmado" && p.formato !== "inacabado") {
      const perdedores = ganador(p.sets) === "a" ? (p.b ?? []) : p.a;
      const [x, y] = p.sets.reduce(([a, b], [s1, s2]) => [a + s1, b + s2], [0, 0]);
      const roscos = p.sets.filter(([a, b]) => Math.min(a, b) === 0 && Math.max(a, b) === 6).length;
      if (roscos >= 2 || Math.abs(x - y) >= 10)
        for (const id of perdedores)
          out.push({ fecha: p.fecha, emoji: "🍩", jugadorId: id, texto: `se comió una paliza (${textoSets(p.sets, p.a.includes(id) ? "a" : "b")})`, partidoId: p.id });
    }
  }
  for (const d of deudas(m))
    if (d.debe > 0 && d.diasMax >= 14)
      out.push({ fecha: m.hoy, emoji: "🎩", jugadorId: d.id, texto: `lleva ${d.diasMax} días sin pagar ${euros(d.debe)}` });
  return out.sort((a, b) => b.fecha.localeCompare(a.fecha));
}
