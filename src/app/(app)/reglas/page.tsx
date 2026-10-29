import Link from "next/link";

export const metadata = { title: "Reglas · Goofy Premier Padel" };

const REGLAS: { t: string; d: React.ReactNode }[] = [
  {
    t: "📜 Todo partido confirmado queda en acta",
    d: "Lo apunta un jugador y lo confirma alguien de la pareja rival. Desde ese momento no se borra ni se edita. Si alguien intenta borrar uno que ha perdido, queda en el historial (y se lleva la medalla de Llorón). Si de verdad algo está mal, se lleva al tribunal.",
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
