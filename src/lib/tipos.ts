export type Jugador = {
  id: number;
  nombre: string;
  avatarV: number; // 0 = sin foto
};

export type Marcador = [number, number]; // [juegos pareja A, juegos pareja B]

export type EstadoPartido = "pendiente" | "confirmado" | "rechazado";

export type Partido = {
  id: number;
  fecha: string; // YYYY-MM-DD
  creado: string; // ISO
  a: [number, number];
  // La pareja B puede ser externa (torneos contra gente de fuera): entonces b es null y bExterna lleva el nombre.
  b: [number, number] | null;
  bExterna: string | null;
  sets: Marcador[];
  estado: EstadoPartido;
  creadoPor: number;
  confirmadoPor: number | null;
  torneoId: number | null;
};

export type Denuncia = {
  id: number;
  partidoId: number;
  denunciante: number;
  motivo: string;
  creada: string;
  votos: { jugadorId: number; amano: boolean; comentario: string }[];
};

export type Veredicto = "deliberando" | "amano" | "limpio";

export type Torneo = {
  id: number;
  nombre: string;
  fecha: string;
  creadoPor: number;
  resultados: { id: number; j1: number; j2: number; puesto: string }[];
};

export type Gasto = {
  id: number;
  pagador: number;
  concepto: string;
  importe: number; // céntimos
  fecha: string;
  partes: { id: number; deudor: number; importe: number; pagada: string | null; avisada: string | null }[];
};

export type Temporada = { id: number; nombre: string; inicio: string };

export type Mundo = {
  jugadores: Jugador[];
  partidos: Partido[];
  denuncias: Denuncia[];
  torneos: Torneo[];
  gastos: Gasto[];
  temporadas: Temporada[];
  hoy: string;
};
