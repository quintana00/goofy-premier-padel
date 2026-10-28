import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { ganador } from "@/lib/motor";
import type { Jugador, Partido } from "@/lib/tipos";

export function Lado({ ids, externa, jugadores }: { ids: number[] | null; externa?: string | null; jugadores: Map<number, Jugador> }) {
  if (!ids) return <span className="fila" style={{ gap: 6 }}>🌍 {externa}</span>;
  return (
    <span className="fila" style={{ gap: 6, minWidth: 0 }}>
      {ids.map((id) => {
        const j = jugadores.get(id);
        return j ? <Avatar key={id} j={j} tam={28} /> : null;
      })}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {ids.map((id) => jugadores.get(id)?.nombre ?? "?").join(" y ")}
      </span>
    </span>
  );
}

export function TarjetaPartido({
  p,
  jugadores,
  etiqueta,
}: {
  p: Partido;
  jugadores: Map<number, Jugador>;
  etiqueta?: React.ReactNode;
}) {
  const gana = ganador(p.sets);
  const fecha = new Date(`${p.fecha}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });
  return (
    <Link href={`/partidos/${p.id}`} className="tarjeta partido">
      <div className="fila entre suave pequeno">
        <span>{fecha}</span>
        {etiqueta}
      </div>
      {(["a", "b"] as const).map((lado) => (
        <div key={lado} className={`lado ${gana === lado ? "gana" : "pierde"}`}>
          <Lado ids={lado === "a" ? p.a : p.b} externa={p.bExterna} jugadores={jugadores} />
          <span className="marcador">
            {p.sets.map(([x, y], i) => {
              const mio = lado === "a" ? x : y;
              const suyo = lado === "a" ? y : x;
              return (
                <span key={i} className={mio > suyo ? "g" : ""}>
                  {mio}
                </span>
              );
            })}
          </span>
        </div>
      ))}
    </Link>
  );
}
