// La personalidad de cada uno, sacada del grupo de WhatsApp. Las escenas la usan para vestir a cada cabezón
// (el IQOS de Borja, las gafas de natación de Fran…) y el perfil para presentar a cada jugador.
// Para añadir a alguien o un chiste nuevo, basta con tocar esta lista.

export type Accesorio = "iqos" | "natacion" | "boli";

export type Personaje = {
  claves: string[]; // nombres con los que se puede haber registrado (sin tildes, en minúsculas)
  apodos: string[];
  accesorio?: Accesorio;
  bio: string;
  frase?: string;
  mayusculas?: boolean; // escribe EN MAYÚSCULAS
};

const PERSONAJES: Personaje[] = [
  {
    claves: ["borja", "borja escuin", "escuin"],
    apodos: ["El Dictador", "El Escocés"],
    accesorio: "iqos",
    bio: "Mejor bajada, mejor bandeja y «mejor muñeca, de largo». Terraza, IQOS y un ego que le sobrepasa.",
    frase: "Tengo el ego muy alto bro, le sobrepasa",
  },
  {
    claves: ["fran", "fran blasco", "blasco", "flan"],
    apodos: ["Flan"],
    accesorio: "natacion",
    bio: "Nada con neopreno en El Perelló y lo sube a Strava. Más completo y mejor físico (lo reconoce hasta Borja). La pareja, dice, siempre se la imponen.",
    frase: "Es un juego, entre amigos. Tranquilo.",
  },
  {
    claves: ["jose", "jose santos", "josito", "joselito"],
    apodos: ["Josito"],
    bio: "Fundador del grupo y mediador oficial de la paz… aunque reparte pelotazos sin pedir perdón.",
    frase: "No me gusta que os habléis feo entre compañeros",
    mayusculas: true,
  },
  {
    claves: ["brotons", "jorge", "jorge brotons", "broti"],
    apodos: ["Broti", "El Notario"],
    accesorio: "boli",
    bio: "Apunta los partidos que otros no quieren apuntar. Según Borja: «Brotons en la derecha >>>> Fran en la derecha».",
    frase: "Así es, hasta que se demuestre lo contrario",
  },
  {
    claves: ["quintana", "quinto", "alejandro"],
    apodos: ["Quinto", "El Comisionado"],
    bio: "Creó la app y ahora tiene que aguantar las reclamaciones.",
    frase: "Va por temporadas. Si te toca pelar en esta, pelas",
  },
  {
    claves: ["bacete"],
    apodos: ["Bacete"],
    bio: "Guardián del «ranking real» (el de la semana pasada).",
    frase: "Es el real",
  },
  {
    claves: ["isma", "ismael", "isma salamandra", "salamandra"],
    apodos: ["Salamandra 🍯"],
    bio: "Especialista en vacilar al escocés. Consejo táctico favorito: «al medio, amigo».",
    frase: "Al medio amigo",
  },
  {
    claves: ["zuri", "alex zuriaga", "zuriaga", "zuro", "alex"],
    apodos: ["Zuro"],
    bio: "Pide torneo cruzado individual para zanjarlo todo.",
    frase: "Últimamente el pádel nos divide más que nos une",
  },
];

const normalizar = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z ]/g, "")
    .replace(/\s+/g, " ")
    .trim();

export function personaje(nombre: string): Personaje | null {
  const n = normalizar(nombre);
  return (
    PERSONAJES.find((p) => p.claves.includes(n)) ??
    PERSONAJES.find((p) => p.claves.some((c) => n.split(" ").includes(c))) ??
    null
  );
}

export function apodo(nombre: string) {
  return personaje(nombre)?.apodos[0] ?? null;
}
