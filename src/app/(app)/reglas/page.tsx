import Link from "next/link";

export const metadata = { title: "Reglas · Goofy Premier Padel" };

const REGLAS: { t: string; d: React.ReactNode }[] = [
  {
    t: "📜 Cuenta al momento; 48 horas para reclamar",
    d: "Un resultado cuenta en cuanto se apunta: nadie tiene que aceptarlo. Durante 48 horas la pareja rival puede reclamarlo diciendo cuál fue el resultado bueno (o que no se jugó). Mientras está reclamado no cuenta: la pareja que lo apuntó acepta la corrección o mantiene el suyo, y entonces decide el tribunal. Pasadas las 48 horas queda en acta: ya no se borra ni se cambia, e intentar borrar uno perdido da la medalla de Llorón.",
  },
  {
    t: "🎾 Formatos",
    d: (
      <>
        <b>A 1 set</b> y <b>al mejor de 3</b> cuentan igual: victoria para quien gana. Un partido <b>inacabado</b> (por
        ejemplo 1-1 y 3-1 en el tercero) se guarda con su marcador y suma juegos y sets terminados, pero{" "}
        <b>no da victoria, ni derrota, ni puntos</b>. Así no se cuenta solo «cuando interesa»: se decide al apuntarlo y
        lo confirma el rival.
      </>
    ),
  },
  {
    t: "📈 Ranking ELO por parejas",
    d: "Todos empiezan cada temporada con 1000 puntos. Cada pareja vale la media de sus dos jugadores: ganar con un compañero flojo da más puntos y perder con uno fuerte quita más. Ganar a los buenos da mucho; perder contra los de abajo, también duele mucho. Las palizas cuentan algo más que los partidos ajustados.",
  },
  {
    t: "↔️ Derecha o revés",
    d: "Al apuntar un partido se marca quién iba a la derecha. En el perfil de cada uno salen sus números por lado, para que se acabe lo de «es que iba a la derecha».",
  },
  {
    t: "📅 Temporadas",
    d: "El ranking va por temporadas. La Temporada 1 cuenta a partir de la semana del 26 de octubre de 2026, que es lo que se acordó. Lo anterior no entra en la temporada, pero se ve en el Histórico. Al cerrar una temporada hay ceremonia: podio, confeti y cuchara de madera para el último.",
  },
  {
    t: "⚖️ Tribunal de amaños",
    d: "Cualquiera puede denunciar un partido confirmado. Votan los que no jugaron; con 3 votos decide la mayoría. Si gana «amaño», el partido se anula.",
  },
  {
    t: "📣 Megáfono",
    d: "Después de un partido, los que jugaron pueden votar si alguien le gritó a su pareja. Con 2 votos al mismo jugador, medalla de Megáfono.",
  },
  {
    t: "🎰 Apuestas (con monedas de mentira)",
    d: (
      <>
        Todos empiezan con <b>1.000 monedas</b>. Se apuesta en las partidas convocadas en «¿Hay pádel?» cuando ya tienen las
        parejas fijadas, o en un partido que cualquiera (juegue o no) ponga desde Apuestas cuando van a empezar. Se puede
        apostar hasta la hora del partido. Máximo <b>100 monedas por apuesta</b> y una apuesta por mercado. La cuota
        se queda fijada en el momento de apostar. Las cuotas salen de un modelo que mezcla ranking, forma (últimos 5
        partidos), química de la pareja y cara a cara, con un pequeño margen para la casa. Los que juegan solo pueden
        apostar a su propia victoria. Se cobra sola al apuntar el resultado desde la convocatoria; si el partido se
        borra, se anula o queda inacabado, se devuelve lo apostado. Si te arruinas, el Banco de la Tropa te rescata con
        100 monedas… y queda apuntado. No es dinero real: solo dignidad.
      </>
    ),
  },
  {
    t: "🕸️ Por debajo de la red",
    d: "Quien se come un rosco (6-0), pasa por debajo de la red. La app lo deja documentado con su escena. Con dos roscos encajados, medalla.",
  },
  {
    t: "🎾 ¿Hay pádel?",
    d: "Cualquiera convoca una partida con día, hora y sitio. Los cuatro primeros que digan «dentro» juegan; el resto quedan de reservas por orden. Si alguien se cae, sube el primer reserva.",
  },
  {
    t: "🏟️ Torneos",
    d: "Torneos normales (cada pareja pone cómo quedó) y torneo cruzado o americano: las parejas rotan, todos juegan con todos y sale un ranking individual por juegos ganados. El americano no cuenta para el ELO.",
  },
];

export default function Reglas() {
  return (
    <>
      <div className="cabecera">
        <h1>Reglas del ranking</h1>
        <Link href="/" className="boton secundario mini">
          ← Ranking
        </Link>
      </div>
      <p className="suave" style={{ marginTop: -8 }}>
        Para que nadie diga que se cuenta «cuando interesa».
      </p>
      <div className="pila">
        {REGLAS.map((r) => (
          <div key={r.t} className="tarjeta pila" style={{ gap: 6 }}>
            <b>{r.t}</b>
            <span className="suave" style={{ lineHeight: 1.45 }}>
              {r.d}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
