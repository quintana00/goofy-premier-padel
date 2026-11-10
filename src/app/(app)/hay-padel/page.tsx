import { headers } from "next/headers";
import Link from "next/link";
import { TarjetaQuedada } from "@/components/Quedada";
import { cargarMundo, yo } from "@/lib/datos";
import { sumarDias } from "@/lib/motor";
import { FormQuedada } from "./Form";

export const metadata = { title: "¿Hay pádel? · Goofy Premier Padel" };

export default async function HayPadel() {
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const h = await headers();
  const url = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}/hay-padel`;
  const proximas = m.quedadas.filter((q) => q.fecha >= m.hoy);
  const pasadas = m.quedadas.filter((q) => q.fecha < m.hoy);

  return (
    <>
      <div className="cabecera">
        <h1>¿Hay pádel?</h1>
        <Link href="/partidos" className="boton secundario mini">
          ← Partidos
        </Link>
      </div>
      <p className="suave" style={{ marginTop: -8 }}>
        Para no preguntarlo cinco veces en el grupo. Los cuatro primeros «dentro» juegan; el resto, reservas.
      </p>

      <div className="pila">
        {proximas.length === 0 && (
          <div className="vacio">
            <span className="emoji">🦗</span>
            Ahora mismo no hay pádel. «Que locura extrema es esta». Convoca tú.
          </div>
        )}
        {proximas.map((q) => (
          <TarjetaQuedada key={q.id} q={q} jugadores={jugadores} yoId={me.id} hoy={m.hoy} url={url} />
        ))}
        <FormQuedada hoy={m.hoy} manana={sumarDias(m.hoy, 1)} />
        {pasadas.length > 0 && (
          <div className="seccion">
            <h2 style={{ marginBottom: 12 }}>Ayer</h2>
            <div className="pila">
              {pasadas.map((q) => (
                <TarjetaQuedada key={q.id} q={q} jugadores={jugadores} yoId={me.id} hoy={m.hoy} url={url} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
