import { Reaccion } from "@/components/Animaciones";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { clasificacionAmericano } from "@/lib/motor";
import type { Jugador, Torneo } from "@/lib/tipos";
import { FormPista } from "../Formularios";

export function AmericanoVista({ t, jugadores }: { t: Torneo; jugadores: Map<number, Jugador> }) {
  const datos = t.americano!;
  const tabla = clasificacionAmericano(datos);
  const nom = (id: number) => jugadores.get(id)?.nombre ?? "?";
  const total = datos.rondas.reduce((s, r) => s + r.pistas.length, 0);
  const jugados = datos.rondas.reduce((s, r) => s + r.pistas.filter((p) => p.ja != null && p.jb != null).length, 0);
  const acabado = jugados === total;
  const [primero, segundo] = tabla;

  return (
    <>
      <div className="fila entre suave pequeno" style={{ marginTop: -8 }}>
        <span>🔀 Americano · cada partido a {datos.juegos} {datos.juegos > 7 ? "puntos" : "juegos"}</span>
        <span>
          {jugados}/{total} partidos
        </span>
      </div>

      {acabado && primero && (
        <div className="seccion">
          <Reaccion resultado="gana" clave={`americano-${t.id}`} avatar={null} />
          {segundo ? (
            <Escena
              tipo="trofeo"
              x={jugadores.get(primero.id)!}
              y={jugadores.get(segundo.id)!}
              titulo={`🏆 Gana ${nom(primero.id)} (y ${nom(segundo.id)} segundo)`}
              texto={`${primero.juegosG} juegos ganados. Ranking individual: aquí no vale echarle la culpa a la pareja.`}
            />
          ) : null}
        </div>
      )}

      <div className="seccion">
        <h2 style={{ marginBottom: 10 }}>Clasificación individual</h2>
        <div className="pila" style={{ gap: 6 }}>
          {tabla.map((f, i) => (
            <div key={f.id} className={`puesto ${i === 0 && f.juegosG ? "oro" : ""}`}>
              <span className="n">{i === 0 && f.juegosG ? "👑" : i + 1}</span>
              <Avatar j={jugadores.get(f.id)!} tam={36} />
              <span>
                <b>{nom(f.id)}</b>
                <br />
                <span className="suave pequeno">
                  {f.ganados}/{f.jugados} ganados · dif {f.juegosG - f.juegosP >= 0 ? "+" : ""}
                  {f.juegosG - f.juegosP}
                </span>
              </span>
              <span className="elo">{f.juegosG}</span>
            </div>
          ))}
        </div>
        <p className="suave pequeno">Ordenado por juegos ganados; si empatan, por diferencia.</p>
      </div>

      <div className="seccion pila">
        <h2>Rondas</h2>
        {datos.rondas.map((r, ri) => (
          <div key={ri} className="tarjeta pila">
            <b>Ronda {ri + 1}</b>
            {r.pistas.map((p, pi) => (
              <div key={pi} className="pila" style={{ gap: 6, paddingTop: 6, borderTop: pi ? "1px solid var(--borde)" : undefined }}>
                <span className="suave pequeno">Pista {pi + 1}</span>
                <span className="pequeno">
                  <b style={{ color: "var(--bola)" }}>{p.a.map(nom).join(" y ")}</b> vs{" "}
                  <b style={{ color: "var(--rosa)" }}>{p.b.map(nom).join(" y ")}</b>
                </span>
                <FormPista torneo={t.id} ronda={ri} pista={pi} ja={p.ja} jb={p.jb} />
              </div>
            ))}
            {r.descansan.length > 0 && <span className="suave pequeno">☕ Descansan: {r.descansan.map(nom).join(", ")}</span>}
          </div>
        ))}
      </div>
    </>
  );
}
