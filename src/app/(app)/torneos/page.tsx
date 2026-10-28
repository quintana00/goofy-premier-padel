import Link from "next/link";
import { cargarMundo } from "@/lib/datos";
import { FormTorneo } from "./Formularios";

const MEDALLA: Record<string, string> = { Campeones: "🥇", Finalistas: "🥈", Semifinales: "🥉" };

export default async function Torneos() {
  const m = await cargarMundo();
  const nombre = (id: number) => m.jugadores.find((j) => j.id === id)?.nombre ?? "?";
  return (
    <>
      <div className="cabecera">
        <h1>Torneos</h1>
        <Link href="/partidos" className="boton secundario mini">
          ← Partidos
        </Link>
      </div>
      <div className="pila">
        {m.torneos.length === 0 && (
          <div className="vacio">
            <span className="emoji">🏟️</span>
            Ningún torneo todavía. Cuando juguéis uno, creadlo aquí y que cada pareja ponga cómo quedó y sus partidos
            (aunque sean contra gente de fuera).
          </div>
        )}
        {m.torneos.map((t) => (
          <Link key={t.id} href={`/torneos/${t.id}`} className="tarjeta pila" style={{ gap: 6 }}>
            <div className="fila entre">
              <b>{t.nombre}</b>
              <span className="suave pequeno">{new Date(`${t.fecha}T12:00:00`).toLocaleDateString("es-ES")}</span>
            </div>
            {t.resultados.map((r) => (
              <span key={r.id} className="pequeno">
                {MEDALLA[r.puesto] ?? "▫️"} {nombre(r.j1)} y {nombre(r.j2)} — <span className="suave">{r.puesto}</span>
              </span>
            ))}
          </Link>
        ))}
        <div className="seccion">
          <FormTorneo hoy={m.hoy} />
        </div>
      </div>
    </>
  );
}
