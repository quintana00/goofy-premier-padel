import Link from "next/link";
import { Alcance } from "@/components/Alcance";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { EscenaMedalla } from "@/components/EscenaMedalla";
import { escenaDeMedalla } from "@/lib/escenasMedalla";
import { alcance, cargarMundo } from "@/lib/datos";
import { deudas, estadisticas, euros, medallas, mejoresParejas, relaciones } from "@/lib/motor";
import { frase, tituloRelacion } from "@/lib/textos";

export default async function Piques({ searchParams }: PageProps<"/piques">) {
  const { ver } = await searchParams;
  const m = await cargarMundo();
  // Los piques necesitan muchos partidos: por defecto, el histórico.
  const a = alcance(m, typeof ver === "string" ? ver : "historico");
  const est = estadisticas(m, a.desde, a.hasta);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const nom = (id: number) => jugadores.get(id)?.nombre ?? "?";
  const rel = relaciones(est);
  const parejas = mejoresParejas(est);
  const conPartidos = est.ranking.filter((f) => f.jugados > 0);
  const enLlamas = [...conPartidos].sort((x, y) => y.racha - x.racha)[0];
  const hundido = [...conPartidos].sort((x, y) => x.racha - y.racha)[0];
  const moroso = deudas(m).find((d) => d.debe > 0);
  // El acreedor principal del moroso hace de cobrador del frac.
  let acreedor: number | null = null;
  if (moroso) {
    const porPagador = new Map<number, number>();
    for (const g of m.gastos)
      for (const p of g.partes)
        if (p.deudor === moroso.id && !p.pagada) porPagador.set(g.pagador, (porPagador.get(g.pagador) ?? 0) + p.importe);
    acreedor = [...porPagador.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
  }
  const lista = medallas(m, est);
  // Escenas de las medallas del pique (megáfono, Strava, llorón, reconciliación), una por pareja.
  const vistos = new Set<string>();
  const escenasMedallas = lista
    .filter((md) => ["megafono", "strava", "lloron"].includes(md.clave) || md.clave.startsWith("reconciliacion-"))
    .map((md) => ({ md, datos: escenaDeMedalla(m, md) }))
    .filter((e): e is { md: typeof e.md; datos: NonNullable<typeof e.datos> } => {
      if (!e.datos) return false;
      const k = e.md.clave.startsWith("reconciliacion-") ? [e.md.jugadorId, e.md.clave.split("-")[1]].sort().join("-") : `${e.md.clave}-${e.md.jugadorId}`;
      if (vistos.has(k)) return false;
      vistos.add(k);
      return true;
    });
  // Duelos que aún no llegan al mínimo para salir como pique: para que la pestaña no esté vacía al principio.
  const enCamino = est.caras
    .filter((c) => c.jugados > 0 && c.jugados < 3)
    .sort((x, y) => y.jugados - x.jugados)
    .slice(0, 6);
  const nada = rel.length === 0 && escenasMedallas.length === 0 && !parejas.mejor && !(enLlamas?.racha >= 3) && !(hundido?.racha <= -3) && !moroso;

  return (
    <>
      <div className="cabecera">
        <h1>Piques 🔥</h1>
        <span className="fila" style={{ gap: 6 }}>
          <Link href="/muro" className="boton secundario mini">
            🧱 Muro
          </Link>
          <Link href="/vs" className="boton mini">
            🥊 VS
          </Link>
        </span>
      </div>
      <Alcance m={m} ver={a.ver} ruta="/piques" />

      {nada && (
        <div className="vacio">
          <span className="emoji">🍿</span>
          Aún no hay salseo suficiente. Los piques salen solos cuando dos jugadores se han enfrentado al menos 3 veces.{enCamino.length > 0 && " Abajo tienes los que están al caer."}
        </div>
      )}

      <div className="pila" style={{ gap: 18 }}>
        {rel.map((r) => (
          <Escena
            key={`${r.tipo}-${r.x}-${r.y}`}
            tipo={r.tipo === "hijo" ? "biberon" : r.tipo}
            x={jugadores.get(r.x)!}
            y={jugadores.get(r.y)!}
            titulo={tituloRelacion(r, nom(r.x), nom(r.y))}
            texto={frase(r, nom(r.x), nom(r.y))}
          />
        ))}

        {hundido && hundido.racha <= -3 && (
          <Escena
            tipo="ambulancia"
            y={jugadores.get(hundido.id)!}
            titulo={`🚑 ${nom(hundido.id)}: ${-hundido.racha} derrotas seguidas`}
            texto={hundido.racha <= -5 ? "Trasladado de urgencia a la UVI del pádel. Pronóstico reservado." : "Va camino de urgencias. Que alguien le deje ganar uno."}
          />
        )}

        {enLlamas && enLlamas.racha >= 3 && (
          <Escena
            tipo="ego"
            y={jugadores.get(enLlamas.id)!}
            titulo={`🦚 A ${nom(enLlamas.id)} se le ha subido el ego`}
            texto={`${enLlamas.racha} victorias seguidas. El globo ya no cabe en la pista.`}
          />
        )}

        {escenasMedallas.map(({ md, datos }) => (
          <EscenaMedalla key={`${md.clave}-${md.jugadorId}`} md={md} datos={datos} jugadores={jugadores} />
        ))}

        {parejas.mejor && (
          <Escena
            tipo="trofeo"
            x={jugadores.get(parejas.mejor.j1)!}
            y={jugadores.get(parejas.mejor.j2)!}
            titulo={`🤝 Pareja más efectiva: ${nom(parejas.mejor.j1)} y ${nom(parejas.mejor.j2)}`}
            texto={`Ganan el ${Math.round((parejas.mejor.ganados / parejas.mejor.jugados) * 100)}% (${parejas.mejor.ganados} de ${parejas.mejor.jugados}) cuando juegan juntos.`}
          />
        )}

        {moroso && (
          <Escena
            tipo="cobrador"
            x={acreedor ? jugadores.get(acreedor) : null}
            y={jugadores.get(moroso.id)!}
            titulo={`🎩 El cobrador del frac persigue a ${nom(moroso.id)}`}
            texto={`Debe ${euros(moroso.debe)}${acreedor ? `, sobre todo a ${nom(acreedor)}` : ""}. Lleva ${moroso.diasMax} días escondiéndose.`}
          />
        )}
      </div>

      {enCamino.length > 0 && (
        <div className="seccion">
          <h2>🔜 Piques a punto de caer</h2>
          <p className="suave pequeno">Con 3 duelos se decide quién es el padre de quién.</p>
          <div className="pila" style={{ gap: 8 }}>
            {enCamino.map((c) => (
              <div key={`${c.x}-${c.y}`} className="tarjeta fila entre" style={{ padding: 10 }}>
                <span className="fila" style={{ gap: 6 }}>
                  <Avatar j={jugadores.get(c.x)!} tam={30} />
                  <b>{c.ganaX}</b>
                  <span className="suave">-</span>
                  <b>{c.ganaY}</b>
                  <Avatar j={jugadores.get(c.y)!} tam={30} />
                  <span className="pequeno">
                    {nom(c.x)} vs {nom(c.y)}
                  </span>
                </span>
                <span className="chapa naranja">
                  falta{3 - c.jugados > 1 ? "n" : ""} {3 - c.jugados}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {parejas.todas.length > 0 && (
        <div className="seccion">
          <h2>👯 Parejas</h2>
          <div className="pila" style={{ gap: 8 }}>
            {parejas.todas.map((p, i) => {
              const pct = Math.round((p.ganados / p.jugados) * 100);
              return (
                <div key={`${p.j1}-${p.j2}`} className="tarjeta pila" style={{ gap: 6 }}>
                  <div className="fila entre">
                    <span className="fila">
                      <Avatar j={jugadores.get(p.j1)!} tam={28} />
                      <Avatar j={jugadores.get(p.j2)!} tam={28} />
                      <b>
                        {nom(p.j1)} y {nom(p.j2)}
                      </b>
                    </span>
                    <span>
                      {i === parejas.todas.length - 1 && parejas.todas.length > 2 ? "☠️ " : ""}
                      <b>{pct}%</b>
                    </span>
                  </div>
                  <div className="barra">
                    <i style={{ width: `${pct}%` }} />
                  </div>
                  <span className="suave pequeno">
                    {p.ganados} ganados de {p.jugados}
                    {i === parejas.todas.length - 1 && parejas.todas.length > 2 ? " · Pareja tóxica: mejor separarlos" : ""}
                  </span>
                </div>
              );
            })}
          </div>
          <p className="suave pequeno">Solo parejas con 3 partidos o más juntos.</p>
        </div>
      )}

      <div className="seccion">
        <h2>🏅 Medallas</h2>
        {lista.length === 0 ? (
          <p className="suave">Nadie ha ganado nada todavía. Ni las malas.</p>
        ) : (
          <div className="medallas">
            {lista.map((md, i) => (
              <Link key={`${md.clave}-${md.jugadorId}-${i}`} href={`/jugador/${md.jugadorId}`} className="medalla">
                <span className="emoji" style={{ animationDelay: `${(i % 5) * 0.3}s` }}>
                  {md.emoji}
                </span>
                <b>{md.nombre}</b>
                <span className="fila" style={{ gap: 6 }}>
                  <Avatar j={jugadores.get(md.jugadorId)!} tam={22} />
                  <span className="pequeno" style={{ fontWeight: 700 }}>
                    {nom(md.jugadorId)}
                  </span>
                </span>
                <span className="suave pequeno">{md.texto}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
