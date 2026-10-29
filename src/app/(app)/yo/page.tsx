import Link from "next/link";
import { salir } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import { cargarMundo, temporadaActual, yo } from "@/lib/datos";
import { FormFoto, FormPin, FormTemporada } from "./Formularios";

export default async function Yo() {
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  return (
    <>
      <div className="cabecera">
        <h1>Yo</h1>
        <form action={salir}>
          <button className="boton secundario mini">Salir</button>
        </form>
      </div>
      <Link href={`/jugador/${me.id}`} className="tarjeta fila" style={{ marginBottom: 16 }}>
        <Avatar j={me} tam={64} />
        <span>
          <b style={{ fontSize: 20 }}>{me.nombre}</b>
          <br />
          <span className="suave pequeno">Ver mis estadísticas →</span>
        </span>
      </Link>
      <div className="pila">
        <FormFoto />
        <div className="tarjeta pila">
          <h2>📲 Tenerla como app</h2>
          <ul className="consejos">
            <li>
              <b>iPhone:</b> ábrela en Safari → botón Compartir → «Añadir a pantalla de inicio».
            </li>
            <li>
              <b>Android:</b> en Chrome → menú ⋮ → «Instalar aplicación» o «Añadir a pantalla de inicio».
            </li>
          </ul>
        </div>
        <Link href="/resumen" className="tarjeta fila entre">
          <span>📰 Resumen semanal para el grupo</span>
          <span>→</span>
        </Link>
        <Link href="/torneos" className="tarjeta fila entre">
          <span>🏟️ Torneos</span>
          <span>→</span>
        </Link>
        <FormPin />
        <FormTemporada actual={temporadaActual(m).nombre} fin={temporadaActual(m).fin} hoy={m.hoy} />
      </div>
    </>
  );
}
