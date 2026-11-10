import Link from "next/link";
import { borrarQuedada, responderQuedada } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import type { Jugador, Quedada } from "@/lib/tipos";

const dia = (f: string, hoy: string) => {
  if (f === hoy) return "Hoy";
  const d = new Date(`${f}T12:00:00`);
  const txt = d.toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "short" });
  return txt[0].toUpperCase() + txt.slice(1);
};

// Una convocatoria: 4 sillas, reservas y los que se caen.
export function TarjetaQuedada({ q, jugadores, yoId, hoy, url }: { q: Quedada; jugadores: Map<number, Jugador>; yoId: number; hoy: string; url: string }) {
  const dentro = q.apuntados.filter((a) => a.dentro);
  const fuera = q.apuntados.filter((a) => !a.dentro);
  const titulares = dentro.slice(0, 4);
  const reservas = dentro.slice(4);
  const mio = q.apuntados.find((a) => a.jugadorId === yoId);
  const llena = titulares.length === 4;
  const nom = (id: number) => jugadores.get(id)?.nombre ?? "?";
  const faltan = 4 - titulares.length;
  const texto = llena
    ? `🎾 PARTIDA DE NIVEL: ${dia(q.fecha, hoy)} ${q.hora} en ${q.sitio}. Juegan ${titulares.map((a) => nom(a.jugadorId)).join(", ")}.${reservas.length ? ` Reservas: ${reservas.map((a) => nom(a.jugadorId)).join(", ")}.` : ""}\n${url}`
    : `🎾 ¿HAY PÁDEL? ${dia(q.fecha, hoy)} ${q.hora} en ${q.sitio}. ${titulares.length ? `Dentro: ${titulares.map((a) => nom(a.jugadorId)).join(", ")}. ` : ""}Falta${faltan > 1 ? "n" : ""} ${faltan}. Apúntate 👉 ${url}`;
  const [a1, a2, b1, b2] = titulares.map((a) => a.jugadorId);

  return (
    <div className={`tarjeta pila quedada ${llena ? "llena" : ""}`}>
      <div className="fila entre">
        <span>
          <b style={{ fontSize: 18 }}>
            {dia(q.fecha, hoy)} · {q.hora}
          </b>
          <br />
          <span className="suave pequeno">
            📍 {q.sitio} · convoca {nom(q.creadoPor)}
          </span>
        </span>
        {llena ? <span className="sello-nivel">PARTIDA DE NIVEL</span> : <span className="chapa naranja">Falta{faltan > 1 ? "n" : ""} {faltan}</span>}
      </div>
      {q.nota && <i className="pequeno">«{q.nota}»</i>}

      <div className="sillas">
        {[0, 1, 2, 3].map((i) => {
          const j = titulares[i] && jugadores.get(titulares[i].jugadorId);
          return (
            <div key={i} className={`silla ${j ? "ocupada" : ""}`} style={{ animationDelay: `${i * 0.08}s` }}>
              {j ? <Avatar j={j} tam={48} /> : <span className="hueco">?</span>}
              <span className="pequeno" style={{ fontWeight: 750 }}>
                {j ? j.nombre : "Libre"}
              </span>
            </div>
          );
        })}
      </div>

      {reservas.length > 0 && (
        <span className="pequeno">
          🪑 Reservas: {reservas.map((a) => nom(a.jugadorId)).join(", ")}
          {reservas.length >= 2 && <i className="suave"> — «¿PERO NO VES QUE SOMOS {dentro.length}?»</i>}
        </span>
      )}
      {fuera.length > 0 && <span className="suave pequeno">🙅 Se caen: {fuera.map((a) => nom(a.jugadorId)).join(", ")}</span>}

      <form action={responderQuedada} className="fila">
        <input type="hidden" name="id" value={q.id} />
        <button name="r" value="dentro" className={`boton ${mio?.dentro ? "" : "secundario"}`} style={{ flex: 1 }} aria-pressed={mio?.dentro === true}>
          {mio?.dentro ? "✓ Dentro" : "🙋 Yo dentro"}
        </button>
        <button name="r" value="fuera" className={`boton ${mio && !mio.dentro ? "rojo" : "secundario"}`} style={{ flex: 1 }} aria-pressed={mio?.dentro === false}>
          {mio && !mio.dentro ? "✗ Me caigo" : "Me caigo"}
        </button>
      </form>

      <div className="fila envolver">
        <a href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target="_blank" rel="noreferrer" className="boton mini" style={{ background: "#25d366", color: "#062b14", flex: 1 }}>
          📲 Pasar al grupo
        </a>
        {llena && q.fecha <= hoy && (
          <Link href={`/partidos/nuevo?a1=${a1}&a2=${a2}&b1=${b1}&b2=${b2}`} className="boton secundario mini" style={{ flex: 1 }}>
            🎾 Apuntar resultado
          </Link>
        )}
        {q.creadoPor === yoId && (
          <form action={borrarQuedada}>
            <input type="hidden" name="id" value={q.id} />
            <button className="boton secundario mini" aria-label="Borrar convocatoria">
              🗑️
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
