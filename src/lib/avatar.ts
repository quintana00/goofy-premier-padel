import type { Jugador } from "./tipos";

const COLORES = ["#d9ff3d", "#ff5fa2", "#3ee08f", "#5fb7ff", "#ffae3d", "#b48cff", "#ff6b6b", "#4de8e0", "#ffd84d", "#9cff6b"];

export const colorDe = (id: number) => COLORES[id % COLORES.length];

export const iniciales = (nombre: string) =>
  nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

export const urlAvatar = (j: Pick<Jugador, "id" | "avatarV">) => `/api/avatar/${j.id}?v=${j.avatarV}`;
