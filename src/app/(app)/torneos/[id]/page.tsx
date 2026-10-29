import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { cargarMundo, yo } from "@/lib/datos";
import { PUESTOS } from "@/lib/motor";
import { FormPuesto } from "../Formularios";
import { AmericanoVista } from "./Americano";

export default async function Torneo({ params }: PageProps<"/torneos/[id]">) {
  const { id } = await params;
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const t = m.torneos.find((x) => x.id === Number(id));
  if (!t) notFound();
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const resultados = [...t.resultados].sort(
    (x, y) => PUESTOS.indexOf(x.puesto as (typeof PUESTOS)[number]) - PUESTOS.indexOf(y.puesto as (typeof PUESTOS)[number]),
  );
  const campeones = resultados.find((r) => r.puesto === "Campeones");
  const partidos = m.partidos.filter((p) => p.torneoId === t.id).sort((x, y) => y.id - x.id);

  if (t.americano)
    return (
      <>
        <div className="cabecera">
          <h1>{t.nombre}</h1>
          <Link href="/torneos" className="boton secundario mini">
            ← Torneos
          </Link>
        </div>
        <AmericanoVista t={t} jugadores={jugadores} />
      </>
    );

  return (
    <>
      <div className="cabecera">
        <h1>{t.nombre}</h1>
        <Link href="/torneos" className="boton secundario mini">
          ← Torneos
        </Link>
      </div>
      <p className="suave" style={{ marginTop: -8 }}>
        {new Date(`${t.fecha}T12:00:00`).toLocaleDateString("es-ES", { dateStyle: "full" })}
      </p>

      {campeones && (
        <Escena
          tipo="trofeo"
          x={jugadores.get(campeones.j1)!}
          y={jugadores.get(campeones.j2)!}
          titulo={`🏆 ${jugadores.get(campeones.j1)?.nombre} y ${jugadores.get(campeones.j2)?.nombre}, campeones`}
          texto="Se lo van a recordar al grupo hasta el fin de los tiempos."
        />
      )}

      <div className="seccion">
        <h2>Clasificación de la Tropa</h2>
        <div className="pila" style={{ gap: 8 }}>
          {resultados.length === 0 && <p className="suave">Nadie ha dicho todavía cómo quedó. Sospechoso.</p>}
          {resultados.map((r) => (
            <div key={r.id} className="tarjeta fila entre">
              <span className="fila">
                <Avatar j={jugadores.get(r.j1)!} tam={32} />
                <Avatar j={jugadores.get(r.j2)!} tam={32} />
                <b>
                  {jugadores.get(r.j1)?.nombre} y {jugadores.get(r.j2)?.nombre}
                </b>
              </span>
              <span className="chapa">{r.puesto}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="seccion">
        <FormPuesto torneo={t.id} jugadores={m.jugadores} yoId={me.id} />
      </div>

      <div className="seccion">
        <div className="fila entre" style={{ marginBottom: 12 }}>
          <h2>Partidos</h2>
          <Link href={`/partidos/nuevo?torneo=${t.id}`} className="boton mini">
            ＋ Partido
          </Link>
        </div>
        <p className="suave pequeno">
          Apunta cada partido del torneo, también contra parejas de fuera: cuentan para el ranking y las estadísticas.
        </p>
        <div className="pila">
          {partidos.map((p) => (
            <TarjetaPartido key={p.id} p={p} jugadores={jugadores} />
          ))}
        </div>
      </div>
    </>
  );
}
