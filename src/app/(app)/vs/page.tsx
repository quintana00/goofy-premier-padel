import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { Cabeza, Escena } from "@/components/Escena";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { cargarMundo, yo } from "@/lib/datos";
import { duelo, estadisticas, etiquetaTermometro, relaciones } from "@/lib/motor";
import { apodo, frasePara, personaje } from "@/lib/personajes";
import { frase, tituloRelacion } from "@/lib/textos";
import type { Jugador } from "@/lib/tipos";

function Luchador({ j, lado, dia }: { j: Jugador; lado: "izq" | "der"; dia: string }) {
  const mote = apodo(j.nombre, dia);
  return (
    <div className={`vs-lado ${lado}`}>
      <svg viewBox="-12 -12 150 140" width={130} height={122} role="img" aria-label={j.nombre}>
        <Cabeza j={j} cx={62} cy={62} r={56} id={`vs-${lado}-${j.id}`} />
      </svg>
      <b style={{ fontSize: 20 }}>{j.nombre}</b>
      {mote && <span className="chapa">{mote}</span>}
    </div>
  );
}

// Pantalla de rivalidad: dos jugadores frente a frente.
export default async function VS({ searchParams }: PageProps<"/vs">) {
  const q = await searchParams;
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const est = estadisticas(m);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  // Por defecto: tú contra tu rival más habitual.
  const habitual = est.caras
    .filter((c) => c.x === me.id || c.y === me.id)
    .sort((a, b) => b.jugados - a.jugados)[0];
  const xId = Number(q.x) || me.id;
  const yId = Number(q.y) || (habitual ? (habitual.x === me.id ? habitual.y : habitual.x) : m.jugadores.find((j) => j.id !== xId)?.id);
  const x = jugadores.get(xId);
  const y = yId ? jugadores.get(yId) : undefined;

  const selector = (
    <form className="fila" style={{ gap: 8 }}>
      {(["x", "y"] as const).map((campo) => (
        <select key={campo} name={campo} defaultValue={campo === "x" ? xId : yId}>
          {m.jugadores.map((j) => (
            <option key={j.id} value={j.id}>
              {j.nombre}
            </option>
          ))}
        </select>
      ))}
      <button className="boton mini">🥊</button>
    </form>
  );

  if (!x || !y || x.id === y.id)
    return (
      <>
        <div className="cabecera">
          <h1>Cara a cara</h1>
        </div>
        {selector}
        <p className="suave">Elige a dos jugadores distintos.</p>
      </>
    );

  const d = duelo(m, est, x.id, y.id);
  const rel = relaciones(est).find((r) => (r.x === x.id && r.y === y.id) || (r.x === y.id && r.y === x.id));
  const ultimo = d.partidos[d.partidos.length - 1];
  const reconciliados = d.partidos.length >= 2 && d.juntos.ganados > 0;
  const nadaY = personaje(y.nombre)?.accesorios?.includes("natacion");
  const fx = frasePara(x.nombre, "pique", m.hoy);
  const fy = frasePara(y.nombre, "pique", m.hoy);

  return (
    <>
      <div className="cabecera">
        <h1>Cara a cara</h1>
        <Link href="/piques" className="boton secundario mini">
          🔥 Piques
        </Link>
      </div>
      {selector}

      <div key={`${x.id}-${y.id}`} className="vs-escenario choque" style={{ marginTop: 14 }}>
        <Luchador j={x} lado="izq" dia={m.hoy} />
        <span className="vs-letras">VS</span>
        <Luchador j={y} lado="der" dia={m.hoy} />
      </div>

      <div className="seccion tarjeta pila">
        <div className="fila entre" style={{ alignItems: "end" }}>
          <span className="grande" style={{ color: d.ganaX > d.ganaY ? "var(--verde)" : undefined }}>{d.ganaX}</span>
          <span className="suave" style={{ textAlign: "center" }}>
            victorias
            <br />
            como rivales
          </span>
          <span className="grande" style={{ color: d.ganaY > d.ganaX ? "var(--verde)" : undefined }}>{d.ganaY}</span>
        </div>
        <div className="pila" style={{ gap: 6 }}>
          <div className="fila entre">
            <b>Termómetro de pique</b>
            <span className="chapa naranja">{etiquetaTermometro(d.termometro)}</span>
          </div>
          <div className="termometro">
            <i style={{ width: `${Math.max(d.termometro, 4)}%` }} />
          </div>
          <span className="suave pequeno">Sube con cada duelo, si van igualados y si son recientes.</span>
        </div>
        <div className="fila entre envolver pequeno">
          <span>
            🔥 Racha:{" "}
            {d.racha ? (
              <b>
                {jugadores.get(d.racha.quien)?.nombre} lleva {d.racha.n} seguida{d.racha.n > 1 ? "s" : ""}
              </b>
            ) : (
              "nadie todavía"
            )}
          </span>
          <span>
            🤝 Juntos de pareja: <b>{d.juntos.ganados}</b> de {d.juntos.jugados}
          </span>
        </div>
      </div>

      {(fx || fy) && (
        <div className="seccion fila entre" style={{ alignItems: "stretch" }}>
          {[
            [x, fx],
            [y, fy],
          ].map(([j, f]) => (
            <div key={(j as Jugador).id} className="tarjeta pequeno" style={{ flex: 1 }}>
              <Avatar j={j as Jugador} tam={26} /> <i>«{(f as string | null) ?? "…"}»</i>
            </div>
          ))}
        </div>
      )}

      {rel && (
        <div className="seccion">
          <Escena
            tipo={rel.tipo === "hijo" ? "biberon" : rel.tipo}
            x={jugadores.get(rel.x)!}
            y={jugadores.get(rel.y)!}
            titulo={tituloRelacion(rel, jugadores.get(rel.x)!.nombre, jugadores.get(rel.y)!.nombre)}
            texto={frase(rel, jugadores.get(rel.x)!.nombre, jugadores.get(rel.y)!.nombre)}
          />
        </div>
      )}

      {reconciliados && (
        <div className="seccion">
          <Escena
            tipo="guadalquivir"
            y={nadaY ? y : x}
            x={nadaY ? x : y}
            titulo="🤝 Reconciliación Guadalquivir"
            texto="Uno nadando, otro en la terraza con el IQOS. Y luego, unión: juntos de pareja también ganan."
          />
        </div>
      )}

      {ultimo && (
        <div className="seccion">
          <h2 style={{ marginBottom: 12 }}>Último duelo</h2>
          <TarjetaPartido p={ultimo} jugadores={jugadores} />
        </div>
      )}
      {d.partidos.length === 0 && <p className="suave seccion">Todavía no se han enfrentado. ¿A qué esperáis?</p>}
    </>
  );
}
