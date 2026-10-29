import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { Grafica } from "@/components/Grafica";
import { alcance, cargarMundo, yo } from "@/lib/datos";
import { deudas, estadisticas, euros, medallas, peorPesadilla, relaciones } from "@/lib/motor";
import { personaje } from "@/lib/personajes";
import { frase, tituloRelacion } from "@/lib/textos";

export default async function Jugador({ params, searchParams }: PageProps<"/jugador/[id]">) {
  const [{ id }, { bienvenida }] = await Promise.all([params, searchParams]);
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const j = m.jugadores.find((x) => x.id === Number(id));
  if (!j) notFound();
  const jugadores = new Map(m.jugadores.map((x) => [x.id, x]));
  const nom = (x: number) => jugadores.get(x)?.nombre ?? "?";

  const temporada = alcance(m, undefined);
  const estT = estadisticas(m, temporada.desde, temporada.hasta);
  const est = estadisticas(m);
  const f = est.fichas.get(j.id)!;
  const fT = estT.fichas.get(j.id)!;
  const puestoT = estT.ranking.filter((x) => x.jugados > 0).findIndex((x) => x.id === j.id) + 1;
  const pesadilla = peorPesadilla(est, j.id);
  const misRel = relaciones(est).filter((r) => r.x === j.id || r.y === j.id);
  const misMedallas = medallas(m, est).filter((x) => x.jugadorId === j.id);
  const deuda = deudas(m).find((d) => d.id === j.id);
  const pct = f.jugados ? Math.round((f.ganados / f.jugados) * 100) : 0;
  const tercer = f.tercerSetG + f.tercerSetP;
  const perfil = personaje(j.nombre);
  const lados = (["derecha", "izquierda"] as const)
    .map((l) => ({ l, ...f.porLado[l], n: f.porLado[l].g + f.porLado[l].p }))
    .filter((x) => x.n > 0);

  const otros = m.jugadores
    .filter((x) => x.id !== j.id)
    .map((x) => {
      const cara = est.caras.find((c) => (c.x === j.id && c.y === x.id) || (c.y === j.id && c.x === x.id));
      const pareja = est.parejas.find((p) => (p.j1 === j.id && p.j2 === x.id) || (p.j2 === j.id && p.j1 === x.id));
      const gana = cara ? (cara.x === j.id ? cara.ganaX : cara.ganaY) : 0;
      const pierde = cara ? cara.jugados - gana : 0;
      return { x, gana, pierde, juntos: pareja?.jugados ?? 0, juntosG: pareja?.ganados ?? 0 };
    })
    .filter((o) => o.gana + o.pierde + o.juntos > 0)
    .sort((a, b) => b.gana + b.pierde + b.juntos - (a.gana + a.pierde + a.juntos));

  return (
    <>
      {bienvenida && (
        <div className="tarjeta alerta" style={{ marginBottom: 16 }}>
          🎉 <b>¡Fichado!</b> Ya estás en la Tropa. Apunta tu primer partido y que empiece el pique.
          {!j.avatarV && (
            <>
              {" "}
              Y sube una foto en <Link href="/yo" style={{ textDecoration: "underline" }}>Yo</Link>, que sin cabezón no hay escenas.
            </>
          )}
        </div>
      )}

      <div className="pila" style={{ justifyItems: "center", textAlign: "center", gap: 8 }}>
        <Avatar j={j} tam={128} />
        <h1>{j.nombre}</h1>
        {perfil && (
          <div className="pila" style={{ gap: 4, justifyItems: "center" }}>
            <span className="chapa rosa">aka {perfil.apodos.join(" · ")}</span>
            <span className="suave pequeno" style={{ maxWidth: 380 }}>
              {perfil.bio}
            </span>
            {perfil.frase && <i className="pequeno">«{perfil.mayusculas ? perfil.frase.toUpperCase() : perfil.frase}»</i>}
          </div>
        )}
        <div className="fila envolver" style={{ justifyContent: "center" }}>
          {puestoT > 0 && <span className="chapa">#{puestoT} en {temporada.etiqueta}</span>}
          <span className="chapa">ELO {Math.round(fT.elo)}</span>
          {f.racha >= 3 && <span className="chapa verde">🔥 {f.racha} seguidas</span>}
          {f.racha <= -3 && <span className="chapa rojo">🚑 {-f.racha} derrotas seguidas</span>}
        </div>
        {j.id === me.id ? (
          <Link href="/yo" className="boton secundario mini">
            📸 Cambiar foto
          </Link>
        ) : (
          <Link href={`/vs?x=${me.id}&y=${j.id}`} className="boton mini">
            🥊 {me.nombre} vs {j.nombre}
          </Link>
        )}
      </div>

      <div className="seccion cifras">
        <div className="cifra">
          <b>{f.jugados}</b>
          <span>partidos</span>
        </div>
        <div className="cifra">
          <b>{pct}%</b>
          <span>victorias</span>
        </div>
        <div className="cifra">
          <b>{Math.round(f.elo)}</b>
          <span>ELO histórico</span>
        </div>
        <div className="cifra">
          <b>
            {f.setsG}-{f.setsP}
          </b>
          <span>sets</span>
        </div>
        <div className="cifra">
          <b>{f.mejorRacha}</b>
          <span>mejor racha</span>
        </div>
        <div className="cifra">
          <b>{-f.peorRacha}</b>
          <span>peor racha</span>
        </div>
        <div className="cifra">
          <b>{f.remontadas}</b>
          <span>remontadas</span>
        </div>
        <div className="cifra">
          <b>{f.roscosDados}</b>
          <span>roscos dados</span>
        </div>
        <div className="cifra">
          <b>{tercer ? `${Math.round((f.tercerSetG / tercer) * 100)}%` : "—"}</b>
          <span>3er set ganado</span>
        </div>
      </div>

      {lados.length > 0 && (
        <div className="seccion">
          <h2 style={{ marginBottom: 10 }}>↔️ Por lado</h2>
          <div className="cifras" style={{ gridTemplateColumns: "1fr 1fr" }}>
            {lados.map((x) => (
              <div key={x.l} className="cifra">
                <b>{Math.round((x.g / x.n) * 100)}%</b>
                <span>
                  {j.nombre} ({x.l === "derecha" ? "derecha" : "revés"}) · {x.g}G {x.p}P
                </span>
              </div>
            ))}
          </div>
          <p className="suave pequeno">Solo partidos en los que se apuntó quién iba a la derecha.</p>
        </div>
      )}

      {f.historial.length > 2 && (
        <div className="seccion tarjeta">
          <b>📈 Evolución del ELO (histórico)</b>
          <Grafica valores={f.historial} />
        </div>
      )}

      {pesadilla && (
        <div className="seccion tarjeta peligro fila">
          <Avatar j={jugadores.get(pesadilla.rival)!} tam={52} />
          <span>
            <b>😱 Su peor pesadilla: {nom(pesadilla.rival)}</b>
            <br />
            <span className="suave pequeno">
              Le ha ganado {pesadilla.gana} {pesadilla.gana === 1 ? "vez" : "veces"} (y solo ha perdido {pesadilla.pierde}).
            </span>
          </span>
        </div>
      )}

      {misRel.length > 0 && (
        <div className="seccion pila" style={{ gap: 18 }}>
          {misRel.map((r) => (
            <Escena
              key={`${r.tipo}-${r.x}-${r.y}`}
              tipo={r.tipo === "hijo" ? "biberon" : r.tipo}
              x={jugadores.get(r.x)!}
              y={jugadores.get(r.y)!}
              titulo={tituloRelacion(r, nom(r.x), nom(r.y))}
              texto={frase(r, nom(r.x), nom(r.y))}
            />
          ))}
        </div>
      )}

      {misMedallas.length > 0 && (
        <div className="seccion">
          <h2>🏅 Vitrina</h2>
          <div className="medallas">
            {misMedallas.map((md, i) => (
              <div key={`${md.clave}-${i}`} className="medalla">
                <span className="emoji">{md.emoji}</span>
                <b>{md.nombre}</b>
                <span className="suave pequeno">{md.texto}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {otros.length > 0 && (
        <div className="seccion">
          <h2>🥊 Cara a cara</h2>
          <div className="pila" style={{ gap: 6 }}>
            {otros.map((o) => (
              <Link key={o.x.id} href={`/vs?x=${j.id}&y=${o.x.id}`} className="tarjeta fila entre" style={{ padding: 10 }}>
                <span className="fila">
                  <Avatar j={o.x} tam={30} /> <b>{o.x.nombre}</b>
                </span>
                <span className="fila pequeno" style={{ gap: 6 }}>
                  {o.gana + o.pierde > 0 && (
                    <span className={`chapa ${o.gana > o.pierde ? "verde" : o.gana < o.pierde ? "rojo" : ""}`}>
                      vs {o.gana}-{o.pierde}
                    </span>
                  )}
                  {o.juntos > 0 && (
                    <span className="chapa">
                      juntos {o.juntosG}/{o.juntos}
                    </span>
                  )}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {deuda && (deuda.debe > 0 || deuda.leDeben > 0) && (
        <div className="seccion tarjeta fila entre">
          <span>💸 Debe {euros(deuda.debe)}</span>
          <span className="suave">Le deben {euros(deuda.leDeben)}</span>
        </div>
      )}
    </>
  );
}
