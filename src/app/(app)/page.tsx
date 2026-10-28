import Link from "next/link";
import { Alcance } from "@/components/Alcance";
import { Avatar } from "@/components/Avatar";
import { Marca } from "@/components/Marca";
import { alcance, cargarMundo, yo } from "@/lib/datos";
import { confirmadores, deudas, euros, estadisticas, type Ficha } from "@/lib/motor";

function Racha({ f }: { f: Ficha }) {
  if (f.racha >= 3) return <span className="chapa verde">🔥 {f.racha} seguidas</span>;
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
  const porConfirmar = m.partidos.filter((p) => p.estado === "pendiente" && confirmadores(p).includes(me.id));
  const miDeuda = deudas(m).find((d) => d.id === me.id);
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

      <div className="pila" style={{ marginBottom: 16 }}>
        {porConfirmar.length > 0 && (
          <Link href={`/partidos/${porConfirmar[0].id}`} className="tarjeta alerta fila entre">
            <span>
              <b>⏳ Tienes {porConfirmar.length} resultado{porConfirmar.length > 1 ? "s" : ""} por confirmar</b>
              <br />
              <span className="suave pequeno">Sin tu OK no cuenta para el ranking</span>
            </span>
            <span>→</span>
          </Link>
        )}
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
        <div className="ranking">
          {conPartidos.map((f, i) => {
            const j = jugadores.get(f.id)!;
            const clase =
              i === 0 ? "oro" : i === 1 ? "plata" : i === 2 ? "bronce" : i === conPartidos.length - 1 && i > 3 ? "farolillo" : "";
            const delta = ultimoDelta.get(f.id) ?? 0;
            return (
              <Link key={f.id} href={`/jugador/${f.id}`} className={`puesto ${clase}`}>
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
        </div>
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
        ℹ️ Ranking ELO: todos empiezan con 1000. Ganar a los buenos da muchos puntos; perder contra los malos quita muchos.
        Las palizas cuentan un poco más que los partidos ajustados.
      </p>

      <Link href="/partidos/nuevo" className="boton flotante" aria-label="Apuntar resultado">
        ＋
      </Link>
    </>
  );
}
