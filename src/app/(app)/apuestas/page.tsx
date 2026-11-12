import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { APUESTA_MAX, APUESTA_MIN, SALDO_INICIAL, abierta, apuestasVistas, carteras, describir, mercados, modeloPartido, premio } from "@/lib/apuestas";
import { cargarMundo, yo } from "@/lib/datos";
import { estadisticas, partidosAnulados } from "@/lib/motor";
import { Mercados, Rescate } from "./Mercados";

export const metadata = { title: "Apuestas · Goofy Premier Padel" };

const ESTADOS = { pendiente: ["⏳", "En juego", ""], ganada: ["✅", "Ganada", "verde"], perdida: ["❌", "Perdida", "rojo"], nula: ["↩️", "Devuelta", ""] } as const;

export default async function Apuestas() {
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const nom = (id: number) => jugadores.get(id)?.nombre ?? "?";
  const pareja = (ids: number[]) => ids.map(nom).join(" y ");
  const est = estadisticas(m);
  const vistas = apuestasVistas(m, partidosAnulados(m));
  const tabla = carteras(m, vistas);
  const yoCartera = tabla.find((c) => c.id === me.id)!;
  const abiertas = m.quedadas.filter((q) => abierta(q));
  const sinParejas = m.quedadas.filter((q) => q.fecha >= m.hoy && !q.a && !q.partidoId);
  const mias = vistas.filter((a) => a.jugadorId === me.id).sort((x, y) => y.id - x.id);
  const dia = (f: string) => (f === m.hoy ? "Hoy" : new Date(`${f}T12:00:00`).toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }));
  const activos = tabla.filter((c) => c.apostadas > 0 || c.rescates > 0);

  return (
    <>
      <div className="cabecera">
        <h1>Apuestas</h1>
        <Link href="/reglas" className="boton secundario mini">
          Reglas
        </Link>
      </div>

      <div className="monedero-grande">
        <span className="suave pequeno">Tu monedero</span>
        <div className="fila" style={{ gap: 10 }}>
          <i className="moneda" style={{ width: 28, height: 28 }} aria-hidden />
          <span className="grande" style={{ fontSize: 40 }}>{yoCartera.saldo.toLocaleString("es-ES")}</span>
        </div>
        <div className="fila envolver pequeno" style={{ gap: 14 }}>
          <span>
            En juego <b>{yoCartera.enJuego}</b>
          </span>
          <span>
            Balance{" "}
            <b className={yoCartera.beneficio >= 0 ? "ok" : "error"}>
              {yoCartera.beneficio >= 0 ? "+" : ""}
              {yoCartera.beneficio}
            </b>
          </span>
          <span>
            Aciertos <b>{yoCartera.ganadas}</b>/{yoCartera.ganadas + yoCartera.perdidas}
          </span>
        </div>
      </div>

      {yoCartera.saldo < APUESTA_MIN && yoCartera.enJuego === 0 && (
        <div className="seccion" style={{ marginTop: 14 }}>
          <Rescate />
        </div>
      )}

      <div className="seccion">
        <h2 style={{ marginBottom: 12 }}>Partidos abiertos</h2>
        {abiertas.length === 0 && (
          <div className="vacio">
            <span className="emoji">🎰</span>
            No hay partidos con apuestas abiertas.
            <br />
            {sinParejas.length > 0 ? (
              <>
                Hay {sinParejas.length} partida{sinParejas.length > 1 ? "s" : ""} convocada{sinParejas.length > 1 ? "s" : ""}: cuando se llenen y se fijen las parejas, se abren
                los mercados.
              </>
            ) : (
              <>Convocad una partida y fijad las parejas para abrir mercados.</>
            )}
            <br />
            <Link href="/hay-padel" className="boton mini" style={{ marginTop: 12 }}>
              Ir a «¿Hay pádel?»
            </Link>
          </div>
        )}
        <div className="pila" style={{ gap: 16 }}>
          {abiertas.map((q) => {
            const modelo = modeloPartido(est, q.a!, q.b!, nom);
            const A = pareja(q.a!);
            const B = pareja(q.b!);
            const ms = mercados(modelo.pA, q.formato, A, B);
            const hechas = Object.fromEntries(
              m.apuestas.filter((a) => a.quedadaId === q.id && a.jugadorId === me.id).map((a) => [a.mercado, { sel: a.seleccion, importe: a.importe, cuota: a.cuota }]),
            );
            const total = m.apuestas.filter((a) => a.quedadaId === q.id);
            const miLado = q.a!.includes(me.id) ? "a" : q.b!.includes(me.id) ? "b" : null;
            const maxFactor = Math.max(0.3, ...modelo.factores.map((f) => Math.abs(f.valor)));
            return (
              <article key={q.id} className="tarjeta evento pila" style={{ gap: 14 }}>
                <div className="fila entre suave pequeno">
                  <span>
                    {dia(q.fecha)} · {q.hora} · {q.sitio}
                  </span>
                  <span className="chapa">{q.formato === "1set" ? "A 1 set" : "Mejor de 3"}</span>
                </div>
                <div className="duelo">
                  <div className="duelo-lado">
                    <span className="fila" style={{ gap: 0 }}>
                      {q.a!.map((id) => (
                        <Avatar key={id} j={jugadores.get(id)!} tam={42} />
                      ))}
                    </span>
                    <b>{A}</b>
                  </div>
                  <span className="duelo-vs">vs</span>
                  <div className="duelo-lado">
                    <span className="fila" style={{ gap: 0 }}>
                      {q.b!.map((id) => (
                        <Avatar key={id} j={jugadores.get(id)!} tam={42} />
                      ))}
                    </span>
                    <b>{B}</b>
                  </div>
                </div>
                <div>
                  <div className="barra-duelo">
                    <i style={{ width: `${Math.round(modelo.pA * 100)}%` }} />
                  </div>
                  <div className="fila entre pequeno suave" style={{ marginTop: 4 }}>
                    <span>{Math.round(modelo.pA * 100)} %</span>
                    <span>{100 - Math.round(modelo.pA * 100)} %</span>
                  </div>
                </div>

                <details className="porque">
                  <summary>¿De dónde salen las cuotas?</summary>
                  <div className="pila" style={{ gap: 8, marginTop: 10 }}>
                    {modelo.factores.map((f) => (
                      <div key={f.clave} className="factor">
                        <span className="pequeno">{f.titulo}</span>
                        <div className="factor-barra">
                          <i
                            className={f.valor >= 0 ? "a" : "b"}
                            style={{ width: `${(Math.abs(f.valor) / maxFactor) * 50}%`, [f.valor >= 0 ? "right" : "left"]: "50%" }}
                          />
                        </div>
                        <span className="suave pequeno">{f.texto}</span>
                      </div>
                    ))}
                    <span className="suave pequeno">
                      Ranking, forma en los últimos 5 partidos, cómo rinde cada pareja junta y su historial contra estos rivales. Todos los
                      mercados salen del mismo modelo, juego a juego.
                    </span>
                  </div>
                </details>

                <Mercados quedada={q.id} mercados={ms} saldo={yoCartera.saldo} maximo={APUESTA_MAX} minimo={APUESTA_MIN} miLado={miLado} hechas={hechas} />
                {total.length > 0 && (
                  <span className="suave pequeno">
                    {total.length} apuesta{total.length > 1 ? "s" : ""} · {total.reduce((s, a) => s + a.importe, 0)} monedas en juego · cierra a las {q.hora}
                  </span>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {mias.length > 0 && (
        <div className="seccion">
          <h2 style={{ marginBottom: 12 }}>Mis apuestas</h2>
          <div className="pila" style={{ gap: 8 }}>
            {mias.slice(0, 20).map((a) => {
              const [icono, texto, color] = ESTADOS[a.estado];
              const q = a.quedada;
              return (
                <div key={a.id} className="tarjeta apuesta">
                  <span style={{ fontSize: 20 }}>{icono}</span>
                  <span style={{ minWidth: 0 }}>
                    <b>{describir(a, pareja(q.a ?? []), pareja(q.b ?? []))}</b>
                    <br />
                    <span className="suave pequeno">
                      {pareja(q.a ?? [])} vs {pareja(q.b ?? [])} · {dia(q.fecha)} · {a.importe} a {a.cuota.toFixed(2)}
                    </span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    <b className={color === "verde" ? "ok" : color === "rojo" ? "error" : ""} style={{ fontSize: 16 }}>
                      {a.estado === "ganada" ? `+${premio(a) - a.importe}` : a.estado === "perdida" ? `-${a.importe}` : a.estado === "pendiente" ? premio(a) : "0"}
                    </b>
                    <br />
                    <span className="suave pequeno">{a.estado === "pendiente" ? "posible cobro" : texto}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="seccion">
        <h2 style={{ marginBottom: 4 }}>Tiburones y arruinados</h2>
        <p className="suave pequeno" style={{ marginTop: 0 }}>
          Todos empiezan con {SALDO_INICIAL.toLocaleString("es-ES")} monedas. Máximo {APUESTA_MAX} por apuesta.
        </p>
        <div className="pila" style={{ gap: 6 }}>
          {(activos.length ? activos : tabla.slice(0, 5)).map((c, i) => (
            <Link key={c.id} href={`/jugador/${c.id}`} className={`puesto ${i === 0 && c.apostadas > 0 ? "oro" : ""}`}>
              <span className="n">{i === 0 && c.apostadas > 0 ? "🦈" : i + 1}</span>
              <Avatar j={jugadores.get(c.id)!} tam={38} />
              <span>
                <b>{nom(c.id)}</b>
                <br />
                <span className="suave pequeno">
                  {c.ganadas}/{c.ganadas + c.perdidas} aciertos
                  {c.rescates > 0 && ` · 💀 ${c.rescates} rescate${c.rescates > 1 ? "s" : ""}`}
                </span>
              </span>
              <span style={{ textAlign: "right" }}>
                <span className="elo">{(c.saldo + c.enJuego).toLocaleString("es-ES")}</span>
                <br />
                <span className={`pequeno ${c.beneficio >= 0 ? "ok" : "error"}`}>
                  {c.beneficio >= 0 ? "+" : ""}
                  {c.beneficio}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
