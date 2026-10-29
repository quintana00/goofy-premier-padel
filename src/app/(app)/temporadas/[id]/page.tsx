import Link from "next/link";
import { notFound } from "next/navigation";
import { Reaccion } from "@/components/Animaciones";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { alcance, cargarMundo, temporadaActual, yo } from "@/lib/datos";
import { estadisticas } from "@/lib/motor";

const PUESTOS = [
  { n: 2, alto: 120, color: "#cfd8ef", medalla: "🥈", retraso: 0.6 },
  { n: 1, alto: 170, color: "#ffd34d", medalla: "🥇", retraso: 1.2 },
  { n: 3, alto: 90, color: "#d58b4d", medalla: "🥉", retraso: 0 },
];

// Ceremonia de fin de temporada: podio que sube, confeti para el campeón y cuchara de madera para el último.
export default async function Ceremonia({ params }: PageProps<"/temporadas/[id]">) {
  const { id } = await params;
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const t = m.temporadas.find((x) => String(x.id) === id);
  if (!t) notFound();
  const a = alcance(m, id);
  const ranking = estadisticas(m, a.desde, a.hasta).ranking.filter((f) => f.jugados > 0);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const enCurso = t.id === temporadaActual(m).id && !(t.fin && t.fin < m.hoy);
  const ultimo = ranking.length > 3 ? ranking[ranking.length - 1] : null;

  return (
    <>
      <div className="cabecera">
        <h1>{t.nombre}</h1>
        <Link href="/temporadas" className="boton secundario mini">
          ← Temporadas
        </Link>
      </div>
      {enCurso && (
        <p className="tarjeta alerta" style={{ marginTop: 0 }}>
          ⏳ La temporada sigue en marcha: así quedaría el podio si acabase hoy.
        </p>
      )}
      {!enCurso && ranking[0] && <Reaccion resultado="gana" clave={`ceremonia-${t.id}`} avatar={null} />}

      {ranking.length === 0 ? (
        <div className="vacio">
          <span className="emoji">🦗</span>
          Nadie jugó esta temporada.
        </div>
      ) : (
        <div className="podio" style={{ marginTop: 16 }}>
          {PUESTOS.map((p) => {
            const f = ranking[p.n - 1];
            const j = f && jugadores.get(f.id);
            return (
              <div key={p.n} className="escalon">
                {j && (
                  <>
                    <span className="cara" style={{ animationDelay: `${p.retraso + 0.5}s` }}>
                      {p.n === 1 && <div style={{ textAlign: "center", fontSize: 28 }}>👑</div>}
                      <Avatar j={j} tam={p.n === 1 ? 84 : 64} />
                    </span>
                    <b style={{ textAlign: "center" }}>{j.nombre}</b>
                    <span className="suave pequeno">{Math.round(f.elo)} pts</span>
                  </>
                )}
                <div className="bloque" style={{ height: p.alto, background: p.color, animationDelay: `${p.retraso}s` }}>
                  {p.medalla}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {ultimo && (
        <div className="seccion">
          <Escena
            tipo="cuchara"
            y={jugadores.get(ultimo.id)!}
            titulo={`🥄 Cuchara de madera: ${jugadores.get(ultimo.id)?.nombre}`}
            texto={`Último de ${t.nombre} con ${Math.round(ultimo.elo)} puntos. Si te toca pelar, pelas.`}
          />
        </div>
      )}

      {ranking.length > 3 && (
        <div className="seccion">
          <h2>Clasificación final</h2>
          <div className="pila" style={{ gap: 6 }}>
            {ranking.map((f, i) => (
              <div key={f.id} className="fila entre">
                <span className="fila">
                  <b style={{ width: 22 }}>{i + 1}</b>
                  <Avatar j={jugadores.get(f.id)!} tam={28} /> {jugadores.get(f.id)?.nombre}
                  {f.id === me.id && <span className="suave pequeno">(tú)</span>}
                </span>
                <span className="suave">
                  {f.ganados}G {f.perdidos}P · <b style={{ color: "var(--texto)" }}>{Math.round(f.elo)}</b>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
