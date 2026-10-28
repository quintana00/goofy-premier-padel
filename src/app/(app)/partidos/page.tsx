import Link from "next/link";
import { TarjetaPartido } from "@/components/TarjetaPartido";
import { cargarMundo, yo } from "@/lib/datos";
import { confirmadores, partidosAnulados, veredicto } from "@/lib/motor";

export default async function Partidos() {
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const anulados = partidosAnulados(m);
  const denuncias = new Map(m.denuncias.map((d) => [d.partidoId, d]));
  const orden = [...m.partidos].sort((x, y) => y.fecha.localeCompare(x.fecha) || y.id - x.id);
  const pendientes = orden.filter((p) => p.estado === "pendiente");
  const jugados = orden.filter((p) => p.estado === "confirmado");

  return (
    <>
      <div className="cabecera">
        <h1>Partidos</h1>
        <Link href="/torneos" className="boton secundario mini">
          🏟️ Torneos
        </Link>
      </div>

      {pendientes.length > 0 && (
        <div className="seccion" style={{ marginTop: 0 }}>
          <h2>⏳ Esperando confirmación</h2>
          <div className="pila">
            {pendientes.map((p) => (
              <TarjetaPartido
                key={p.id}
                p={p}
                jugadores={jugadores}
                etiqueta={
                  confirmadores(p).includes(me.id) ? (
                    <span className="chapa naranja">¡Te toca confirmar!</span>
                  ) : (
                    <span className="chapa">Pendiente</span>
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      <div className="seccion">
        <h2>🎾 Últimos resultados</h2>
        {jugados.length === 0 ? (
          <div className="vacio">
            <span className="emoji">🦗</span>
            Aquí no ha jugado nadie todavía.
          </div>
        ) : (
          <div className="pila">
            {jugados.map((p) => {
              const d = denuncias.get(p.id);
              const v = d ? veredicto(d, p).veredicto : null;
              return (
                <TarjetaPartido
                  key={p.id}
                  p={p}
                  jugadores={jugadores}
                  etiqueta={
                    anulados.has(p.id) ? (
                      <span className="chapa rojo">🚫 Anulado por amaño</span>
                    ) : v === "deliberando" ? (
                      <span className="chapa rosa">⚖️ En el tribunal</span>
                    ) : v === "limpio" ? (
                      <span className="chapa verde">✅ Limpio (denuncia desestimada)</span>
                    ) : p.torneoId ? (
                      <span className="chapa">🏟️ Torneo</span>
                    ) : null
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      <Link href="/partidos/nuevo" className="boton flotante" aria-label="Apuntar resultado">
        ＋
      </Link>
    </>
  );
}
