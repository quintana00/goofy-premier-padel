import { Escena } from "@/components/Escena";
import type { EscenaMedalla as Datos } from "@/lib/escenasMedalla";
import type { Medalla } from "@/lib/motor";
import type { Jugador } from "@/lib/tipos";

export function EscenaMedalla({ md, datos, jugadores }: { md: Medalla; datos: Datos; jugadores: Map<number, Jugador> }) {
  const y = jugadores.get(datos.y);
  if (!y) return null;
  const nombre = jugadores.get(md.jugadorId)?.nombre ?? "";
  return (
    <Escena
      tipo={datos.tipo}
      x={datos.x ? jugadores.get(datos.x) : null}
      y={y}
      frase={datos.frase}
      titulo={`${md.emoji} ${nombre}: ${md.nombre}`}
      texto={md.texto}
    />
  );
}
