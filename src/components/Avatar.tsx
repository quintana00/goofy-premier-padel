import { colorDe, iniciales, urlAvatar } from "@/lib/avatar";
import type { Jugador } from "@/lib/tipos";

export function Avatar({ j, tam = 40 }: { j: Jugador; tam?: number }) {
  return (
    <span className="avatar" style={{ width: tam, height: tam, background: colorDe(j.id), fontSize: tam * 0.38 }}>
      {j.avatarV ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={urlAvatar(j)} alt={j.nombre} loading="lazy" />
      ) : (
        iniciales(j.nombre)
      )}
    </span>
  );
}

export function Nombre({ j, tam = 28 }: { j: Jugador; tam?: number }) {
  return (
    <a href={`/jugador/${j.id}`} className="fila" style={{ gap: 6, display: "inline-flex" }}>
      <Avatar j={j} tam={tam} />
      <span style={{ fontWeight: 750 }}>{j.nombre}</span>
    </a>
  );
}
