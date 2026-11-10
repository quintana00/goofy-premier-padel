import Link from "next/link";
import { Alcance } from "@/components/Alcance";
import { RankingAnimado } from "@/components/Animaciones";
import { Avatar } from "@/components/Avatar";
import { Marca } from "@/components/Marca";
import { alcance, cargarMundo, yo } from "@/lib/datos";
import { confirmadores, defensores, deudas, diasEntre, enPlazo, euros, estadisticas, textoSets, titulares, type Ficha } from "@/lib/motor";
import { Teletipo } from "@/components/Teletipo";

function Racha({ f }: { f: Ficha }) {
  if (f.racha >= 3) return <span className="chapa verde">🦚 {f.racha} seguidas</span>;
  if (f.racha <= -5) return <span className="chapa rojo">🚑 {-f.racha} palizas</span>;
  if (f.racha <= -3) return <span className="chapa rojo">🤕 {-f.racha} derrotas</span>;
  return null;
}

export default async function Ranking({ searchParams }: PageProps<"/">) {
  const { ver } = await searchParams;
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const a = alcance(m, typeof ver === "string" ? ver : undefined);
  const est = estadisticas(m, a.desde, a.hasta);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const conPartidos = est.ranking.filter((f) => f.jugados > 0);
  const sinEstrenar = est.ranking.filter((f) => f.jugados === 0);
  // Reclamaciones que tiene que resolver mi pareja, y partidos recién apuntados contra mí (por si están mal).
  const porResolver = m.partidos.filter((p) => p.estado === "reclamado" && defensores(p).includes(me.id));
  const contraMi = m.partidos
    .filter((p) => enPlazo(p) && p.creadoPor !== me.id && confirmadores(p).includes(me.id))
    .sort((x, y) => y.id - x.id)
    .slice(0, 2);
  const nombreDe = (id: number) => m.jugadores.find((j) => j.id === id)?.nombre ?? "?";
  const miDeuda = deudas(m).find((d) => d.id === me.id);
  const temporada = m.temporadas.find((t) => String(t.id) === a.ver);
  const terminada = temporada && (temporada.fin ? temporada.fin < m.hoy : Boolean(a.hasta));
  const fechaCorta = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
  const proxima = m.quedadas.find((q) => q.fecha >= m.hoy);
  const dentroProxima = proxima?.apuntados.filter((x) => x.dentro).length ?? 0;
  const ultimoDelta = new Map<number, number>();
  for (const c of est.cambios) ultimoDelta.set(c.jugadorId, c.delta);

  return (
    <>
      <div className="cabecera">
        <Marca />
        <Link href="/resumen" className="boton secundario mini">
          📰 Resumen
        </Link>
      </div>

      <Teletipo titulares={titulares(m, est, nombreDe)} />

      <div className="pila" style={{ marginBottom: 16 }}>
        <Link href="/hay-padel" className={`tarjeta fila entre haypadel ${proxima ? "" : "vacia"}`}>
          {proxima ? (
            <span>
              <b>
                🎾 {proxima.fecha === m.hoy ? "Hoy" : fechaCorta(proxima.fecha)} {proxima.hora} · {proxima.sitio}
              </b>
              <br />
              <span className="suave pequeno">
                {dentroProxima >= 4
                  ? "Partida de nivel: ya hay cuatro."
                  : `Falta${4 - dentroProxima > 1 ? "n" : ""} ${4 - dentroProxima}.`}{" "}
                {proxima.apuntados.some((x) => x.jugadorId === me.id) ? "Ya has contestado" : "¿Tú qué? Contesta"}
              </span>
            </span>
          ) : (
            <span>
              <b>🎾 ¿Hay pádel?</b>
              <br />
              <span className="suave pequeno">Nadie ha convocado nada. Convoca tú en dos toques</span>
            </span>
          )}
          <span>→</span>
        </Link>
        {porResolver.length > 0 && (
          <Link href={`/partidos/${porResolver[0].id}`} className="tarjeta peligro fila entre">
            <span>
              <b>⚠️ Te han reclamado {porResolver.length} resultado{porResolver.length > 1 ? "s" : ""}</b>
              <br />
              <span className="suave pequeno">No cuenta hasta que aceptes la corrección o lo mandes al tribunal</span>
            </span>
            <span>→</span>
          </Link>
        )}
        {contraMi.map((p) => (
          <Link key={p.id} href={`/partidos/${p.id}`} className="tarjeta alerta fila entre">
            <span>
              <b>
                📝 {nombreDe(p.creadoPor)} apuntó {textoSets(p.sets, p.a.includes(me.id) ? "a" : "b")} contra ti
              </b>
              <br />
              <span className="suave pequeno">Ya cuenta. Si está mal, tienes 48 h para reclamarlo</span>
            </span>
            <span>→</span>
          </Link>
        ))}
        {miDeuda && miDeuda.debe > 0 && (
          <Link href="/deudas" className="tarjeta peligro fila entre">
            <span>
              <b>🎩 Debes {euros(miDeuda.debe)}</b>
              <br />
              <span className="suave pequeno">El cobrador del frac te está buscando</span>
            </span>
            <span>→</span>
          </Link>
        )}
      </div>

      <h1 style={{ marginBottom: 12 }}>Ranking</h1>
      <Alcance m={m} ver={a.ver} ruta="/" />
      {temporada && (
        <div className="fila entre envolver suave pequeno" style={{ marginTop: -6, marginBottom: 12 }}>
          <span>
            📅 Desde el {fechaCorta(temporada.inicio)}
            {temporada.fin && ` hasta el ${fechaCorta(temporada.fin)}`}
            {temporada.fin && !terminada && ` · quedan ${diasEntre(m.hoy, temporada.fin)} días`}
          </span>
          <span className="fila" style={{ gap: 6 }}>
            <Link href="/reglas" className="chapa">📏 Reglas</Link>
            <Link href="/temporadas" className="chapa">🏁 Temporadas</Link>
            <Link href="/vs" className="chapa">🥊 VS</Link>
          </span>
        </div>
      )}
      {terminada && (
        <Link href={`/temporadas/${temporada.id}`} className="tarjeta alerta fila entre" style={{ marginBottom: 12 }}>
          <b>🏁 ¡{temporada.nombre} ha terminado! Ver la ceremonia</b>
          <span>→</span>
        </Link>
      )}

      {conPartidos.length === 0 ? (
        <div className="vacio">
          <span className="emoji">🎾</span>
          Todavía no hay partidos confirmados en {a.etiqueta.toLowerCase()}.
          <br />
          <Link href="/partidos/nuevo" className="boton" style={{ marginTop: 14 }}>
            Apuntar el primero
          </Link>
        </div>
      ) : (
        <RankingAnimado clave={a.ver}>
          {conPartidos.map((f, i) => {
            const j = jugadores.get(f.id)!;
            const clase =
              i === 0 ? "oro" : i === 1 ? "plata" : i === 2 ? "bronce" : i === conPartidos.length - 1 && i > 3 ? "farolillo" : "";
            const delta = ultimoDelta.get(f.id) ?? 0;
            return (
              <Link key={f.id} href={`/jugador/${f.id}`} className={`puesto ${clase}`} data-id={f.id}>
                <span className="n">{i === 0 ? "👑" : clase === "farolillo" ? "🥄" : i + 1}</span>
                <Avatar j={j} tam={46} />
                <span style={{ minWidth: 0 }}>
                  <b style={{ fontSize: 17 }}>{j.nombre}</b>
                  {j.id === me.id && <span className="suave pequeno"> (tú)</span>}
                  <br />
                  <span className="fila envolver" style={{ gap: 6, marginTop: 3 }}>
                    <span className="suave pequeno">
                      {f.ganados}G · {f.perdidos}P · {Math.round((f.ganados / f.jugados) * 100)}%
                    </span>
                    <Racha f={f} />
                  </span>
                </span>
                <span>
                  <span className="elo">{Math.round(f.elo)}</span>
                  <br />
                  <span className={`pequeno ${delta >= 0 ? "ok" : "error"}`} style={{ display: "block", textAlign: "right" }}>
                    {delta >= 0 ? "▲" : "▼"} {Math.abs(Math.round(delta))}
                  </span>
                </span>
              </Link>
            );
          })}
        </RankingAnimado>
      )}

      {sinEstrenar.length > 0 && (
        <div className="seccion">
          <h2>🪑 En el banquillo</h2>
          <p className="suave pequeno">Sin partidos en {a.etiqueta.toLowerCase()}. Empiezan con 1000 puntos.</p>
          <div className="fila envolver">
            {sinEstrenar.map((f) => (
              <Link key={f.id} href={`/jugador/${f.id}`} className="chapa" style={{ padding: "4px 10px 4px 4px" }}>
                <Avatar j={jugadores.get(f.id)!} tam={24} /> {jugadores.get(f.id)!.nombre}
              </Link>
            ))}
          </div>
        </div>
      )}

      <p className="suave pequeno" style={{ marginTop: 24 }}>
        ℹ️ Ranking ELO: todos empiezan con 1000 cada temporada. Ganar a los buenos da muchos puntos; perder contra los malos
        quita muchos. Todo lo que cuenta (y lo que no) está en <Link href="/reglas" style={{ textDecoration: "underline" }}>las reglas</Link>.
      </p>

      <Link href="/partidos/nuevo" className="boton flotante" aria-label="Apuntar resultado">
        ＋
      </Link>
    </>
  );
}
