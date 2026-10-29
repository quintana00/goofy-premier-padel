export type Jugador = {
  id: number;
  nombre: string;
  avatarV: number; // 0 = sin foto
};

export type Marcador = [number, number]; // [juegos pareja A, juegos pareja B]

export type EstadoPartido = "pendiente" | "confirmado" | "rechazado";

// "inacabado": se guarda el marcador (cuenta para juegos y sets) pero no da victoria ni derrota.
export type Formato = "1set" | "mejor3" | "inacabado";

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
  formato: Formato;
  // Quién jugó a la derecha (drive) en cada pareja; el otro iba a la izquierda (revés). null = no consta.
  aDerecha: number | null;
  bDerecha: number | null;
  impuestaPor: number | null; // quien dice que la pareja se la impusieron 🙄
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
  americano: Americano | null;
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

export type Temporada = { id: number; nombre: string; inicio: string; fin: string | null };

export type Evento = { id: number; tipo: "intento_borrado"; jugadorId: number; partidoId: number | null; creado: string };

export type Megafono = { partidoId: number; votante: number; acusado: number };

// Torneo cruzado (americano): las parejas rotan y sale un ranking individual por juegos ganados.
export type PistaAmericano = { a: [number, number]; b: [number, number]; ja: number | null; jb: number | null };
export type Americano = {
  jugadores: number[];
  juegos: number; // juegos (o puntos) por partido
  rondas: { pistas: PistaAmericano[]; descansan: number[] }[];
};

export type Mundo = {
  jugadores: Jugador[];
  partidos: Partido[];
  denuncias: Denuncia[];
  torneos: Torneo[];
  gastos: Gasto[];
  temporadas: Temporada[];
  eventos: Evento[];
  megafonos: Megafono[];
  hoy: string;
};
