import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { alcance, cargarMundo, temporadaActual } from "@/lib/datos";
import { estadisticas } from "@/lib/motor";

export default async function Temporadas() {
  const m = await cargarMundo();
  const actual = temporadaActual(m);
  const fecha = (f: string) => new Date(`${f}T12:00:00`).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
  return (
    <>
      <div className="cabecera">
        <h1>Temporadas</h1>
        <Link href="/" className="boton secundario mini">
          ← Ranking
        </Link>
      </div>
      <div className="pila">
        {[...m.temporadas].reverse().map((t) => {
          const a = alcance(m, String(t.id));
          const campeon = estadisticas(m, a.desde, a.hasta).ranking.find((f) => f.jugados > 0);
          const j = campeon && m.jugadores.find((x) => x.id === campeon.id);
          const enCurso = t.id === actual.id;
          return (
            <Link key={t.id} href={`/temporadas/${t.id}`} className={`tarjeta fila entre ${enCurso ? "alerta" : ""}`}>
              <span>
                <b>{t.nombre}</b> {enCurso && <span className="chapa naranja">En curso</span>}
                <br />
                <span className="suave pequeno">
                  {fecha(t.inicio)}
                  {t.fin ? ` → ${fecha(t.fin)}` : enCurso ? " → …" : ""}
                </span>
              </span>
              {j && (
                <span className="fila pequeno" style={{ gap: 6 }}>
                  {enCurso ? "Va 1.º" : "👑"} <Avatar j={j} tam={30} /> {j.nombre}
                </span>
              )}
            </Link>
          );
        })}
      </div>
      <p className="suave pequeno" style={{ marginTop: 16 }}>
        Las temporadas se abren y se cierran desde <Link href="/yo" style={{ textDecoration: "underline" }}>Yo</Link>.
      </p>
    </>
  );
}
