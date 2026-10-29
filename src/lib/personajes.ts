// La personalidad de cada uno, sacada del grupo de WhatsApp. Las escenas la usan para vestir a cada cabezón
// (el IQOS de Borja, las gafas de natación de Fran…) y para poner frases célebres del grupo.
// Para añadir a alguien, un apodo o una frase nueva, basta con tocar esta lista.

export type Accesorio = "iqos" | "gorrita" | "natacion" | "boli" | "bigote";

// Temas para elegir la frase que pega con cada escena.
export type Tema = "ego" | "llorar" | "pareja" | "ranking" | "derrota" | "victoria" | "strava" | "paz" | "pique";

export type Frase = { texto: string; temas?: Tema[] };

export type Personaje = {
  claves: string[]; // nombres con los que se puede haber registrado (sin tildes, en minúsculas)
  apodos: string[];
  accesorios?: Accesorio[];
  bio: string;
  frases: Frase[];
  mayusculas?: boolean; // escribe EN MAYÚSCULAS
};

const PERSONAJES: Personaje[] = [
  {
    claves: ["borja", "borja escuin", "escuin"],
    apodos: ["El Dictador", "El Escocés", "El Comandante", "El de la gorrita"],
    accesorios: ["gorrita", "iqos"],
    bio: "Mejor bajada, mejor bandeja y «mejor muñeca, de largo». Gorrita, terraza, IQOS y un ego que le sobrepasa.",
    frases: [
      { texto: "Tengo el ego muy alto bro, le sobrepasa", temas: ["ego", "victoria"] },
      { texto: "Tengo mejor bajada que él y mejor bandeja", temas: ["ego", "pique"] },
      { texto: "Mejor muñeca yo. De largo", temas: ["ego", "victoria"] },
      { texto: "Brotons en la derecha >>>> Fran en la derecha", temas: ["pique", "ranking"] },
      { texto: "¿Cómo te toca tanto el ego? 🥹", temas: ["llorar", "pique"] },
      { texto: "Mételo en la app", temas: ["ranking", "llorar"] },
      { texto: "Es entre amigos eh, no la va a ver nadie", temas: ["llorar", "paz"] },
      { texto: "Mentalidad de perdedor", temas: ["derrota", "pique"] },
      { texto: "La mejor cabeza la tiene Fran", temas: ["paz"] },
      { texto: "Mi strava de hoy", temas: ["strava"] },
    ],
  },
  {
    claves: ["fran", "fran blasco", "blasco", "flan"],
    apodos: ["Flan", "El Iron Man", "El chico conciertos"],
    accesorios: ["natacion"],
    bio: "Se prepara un Iron Man: nada con neopreno en El Perelló y lo sube a Strava. Más completo y mejor físico (lo reconoce hasta Borja). La pareja, dice, siempre se la imponen.",
    frases: [
      { texto: "Es un juego Borja. Tranquilo. Entre amigos", temas: ["paz", "pique"] },
      { texto: "Que tienes el ego muy alto", temas: ["ego", "pique"] },
      { texto: "Siempre me la imponéis jajaja", temas: ["pareja", "derrota"] },
      { texto: "Si ponemos todos los resultados desde que empezamos, la app explota", temas: ["ranking", "llorar"] },
      { texto: "¿Cuando te interesa no, tt?", temas: ["llorar", "ranking"] },
      { texto: "Mejor que fumarme un IQOS", temas: ["strava", "pique"] },
      { texto: "Vamos a ganar, céntrate, no me toques los juegos", temas: ["pareja"] },
      { texto: "Otra derrota más al casillero", temas: ["derrota"] },
      { texto: "Aquí se miran los partidos", temas: ["ranking"] },
    ],
  },
  {
    claves: ["jose", "jose santos", "josito", "joselito"],
    apodos: ["Josito"],
    bio: "Fundador del grupo y mediador oficial de la paz… aunque reparte pelotazos sin pedir perdón. Escribe en mayúsculas.",
    mayusculas: true,
    frases: [
      { texto: "A Fran hay que ponerle en dos", temas: ["pique", "ranking"] },
      { texto: "No me gusta que os habléis feo entre compañeros", temas: ["paz"] },
      { texto: "Te pido perdón", temas: ["paz"] },
      { texto: "Strava Guadalquivir: uno nadando y otro con el IQOS en la terraza", temas: ["strava", "paz"] },
      { texto: "Hace algo que no he visto nunca en el pádel: la volea globo", temas: ["victoria"] },
      { texto: "100€ en juego. Para actualizar el ranking", temas: ["ranking"] },
      { texto: "Se me quitan las ganas de jugar", temas: ["derrota", "llorar"] },
    ],
  },
  {
    claves: ["brotons", "jorge", "jorge brotons", "broti"],
    apodos: ["Broti", "Bigotes", "Señor Pepino", "Señor Cucumber", "El Notario"],
    accesorios: ["bigote", "boli"],
    bio: "Apunta los partidos que otros no quieren apuntar. Según Borja: «Brotons en la derecha >>>> Fran en la derecha».",
    frases: [
      { texto: "Tenemos llorón", temas: ["llorar"] },
      { texto: "Así es, hasta que se demuestre lo contrario", temas: ["ranking", "victoria"] },
      { texto: "No haber aceptado la pareja", temas: ["pareja"] },
      { texto: "Está el globo enfriándose, va", temas: ["victoria"] },
      { texto: "Es que la gente tiene mucho ego", temas: ["ego"] },
      { texto: "Me juego 50 pavos si hace falta", temas: ["pique"] },
      { texto: "Bueno, esto se está yendo de madre", temas: ["pique", "paz"] },
      { texto: "Borja también está loco. Pero luego se le pasa", temas: ["ego", "paz"] },
    ],
  },
  {
    claves: ["quintana", "quinto", "alejandro"],
    apodos: ["Quinto", "El Comisionado"],
    bio: "Creó la app y ahora tiene que aguantar las reclamaciones.",
    frases: [
      { texto: "Va por temporadas: si te toca pelar en esta, pelas", temas: ["ranking", "derrota"] },
      { texto: "Me encanta, porque vais a ir a fuego", temas: ["pique"] },
      { texto: "A fútbol soy mejor que el Dicta", temas: ["ego"] },
      { texto: "Nah, no le deis bola nano", temas: ["paz"] },
    ],
  },
  {
    claves: ["bacete"],
    apodos: [],
    bio: "Guardián del «ranking real» (el de la semana pasada).",
    frases: [
      { texto: "Ranking real. Es el real", temas: ["ranking"] },
      { texto: "Si yo me pongo con Fran, somos imbatibles", temas: ["pareja", "ego"] },
      { texto: "¡Siempre en tu equipo, Bigotes!", temas: ["pareja"] },
      { texto: "Vamos a ganar 2-0", temas: ["victoria"] },
      { texto: "Nada es casualidad", temas: ["pique"] },
      { texto: "Ostia qué picao. Muy a malas", temas: ["pique", "llorar"] },
    ],
  },
  {
    claves: ["isma", "ismael", "isma salamandra", "salamandra", "ismaelo", "prisma", "prismaelo"],
    apodos: ["Ismaelo", "Prismaelo", "Prisma", "Desautorizador de copas", "Mano derecha de Corzo", "Contable de Calladitos SL"],
    bio: "Especialista en vacilar al Escocés. Consejo táctico favorito: «al medio, amigo».",
    frases: [
      { texto: "Al medio amigo", temas: ["pareja", "victoria"] },
      { texto: "Josito ha jodido el partido, como a mí el otro día…", temas: ["pareja", "derrota"] },
      { texto: "Es un loquito el bebé escocés", temas: ["ego", "pique"] },
      { texto: "¿Se quedaron sin pala? 😂", temas: ["derrota"] },
      { texto: "Una media de 3 faltas de saque por partido yendo 2 años a clases de pádel", temas: ["derrota", "pique"] },
    ],
  },
  {
    claves: ["zuri", "alex zuriaga", "zuriaga", "zuro", "alex"],
    apodos: ["Zuro", "Narizudo", "Culón", "Road Manager", "Ex ludópata"],
    bio: "Pide torneo cruzado individual para zanjarlo todo.",
    frases: [
      { texto: "Últimamente el pádel nos divide más que nos une", temas: ["pique", "paz"] },
      { texto: "Torneo cruzado individual y rankeamos", temas: ["ranking"] },
      { texto: "Lo que hay que aguantar en este grupo", temas: ["llorar", "pique"] },
      { texto: "El partido de su vida", temas: ["victoria"] },
      { texto: "Hemos ganado 1/2 vez algunos y da gracias", temas: ["derrota"] },
      { texto: "Es la tendencia habitual en este grupo", temas: ["pique"] },
    ],
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

// Número estable a partir de un texto: la misma escena dice lo mismo todo el día, y cambia al siguiente.
function semilla(texto: string) {
  let h = 0;
  for (const c of texto) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

// Un apodo distinto cada día.
export function apodo(nombre: string, dia = "") {
  const p = personaje(nombre);
  if (!p?.apodos.length) return null;
  return p.apodos[semilla(nombre + dia) % p.apodos.length];
}

// Una frase célebre del jugador, a ser posible del tema de la escena.
export function frasePara(nombre: string, tema?: Tema, dia = ""): string | null {
  const p = personaje(nombre);
  if (!p?.frases.length) return null;
  const delTema = tema ? p.frases.filter((f) => f.temas?.includes(tema)) : [];
  const lista = delTema.length ? delTema : p.frases;
  const f = lista[semilla(`${nombre}${tema ?? ""}${dia}`) % lista.length].texto;
  return p.mayusculas ? f.toUpperCase() : f;
}
