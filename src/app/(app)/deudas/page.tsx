import { avisarPagada, borrarGasto, marcarPagada } from "@/app/acciones";
import { Avatar } from "@/components/Avatar";
import { Escena } from "@/components/Escena";
import { cargarMundo, yo } from "@/lib/datos";
import { deudas, diasEntre, euros } from "@/lib/motor";
import { FormGasto } from "./FormGasto";

export default async function Deudas() {
  const [m, me] = await Promise.all([cargarMundo(), yo()]);
  const jugadores = new Map(m.jugadores.map((j) => [j.id, j]));
  const nom = (id: number) => jugadores.get(id)?.nombre ?? "?";
  const fichas = deudas(m);
  const morosos = fichas.filter((d) => d.debe > 0);
  const top = morosos[0];
  // Peores pagadores históricos: los que más tardan de media en pagar.
  const tardones = fichas
    .filter((d) => d.mediaDiasPago !== null)
    .sort((x, y) => (y.mediaDiasPago ?? 0) - (x.mediaDiasPago ?? 0));

  const pendientes = m.gastos.flatMap((g) => g.partes.filter((p) => !p.pagada).map((p) => ({ g, p })));
  const meDeben = pendientes.filter(({ g }) => g.pagador === me.id);
  const debo = pendientes.filter(({ p }) => p.deudor === me.id);
  let acreedorTop: number | null = null;
  if (top) {
    const mapa = new Map<number, number>();
    for (const { g, p } of pendientes) if (p.deudor === top.id) mapa.set(g.pagador, (mapa.get(g.pagador) ?? 0) + p.importe);
    acreedorTop = [...mapa.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? null;
  }

  return (
    <>
      <div className="cabecera">
        <h1>Deudas 💸</h1>
      </div>

      {top ? (
        <Escena
          tipo="cobrador"
          x={acreedorTop ? jugadores.get(acreedorTop) : null}
          y={jugadores.get(top.id)!}
          titulo={`🏆 Moroso del mes: ${nom(top.id)}`}
          texto={`Debe ${euros(top.debe)} y la deuda más vieja tiene ${top.diasMax} días. El cobrador del frac ya va detrás.`}
        />
      ) : (
        <div className="vacio">
          <span className="emoji">😇</span>
          Nadie debe nada. Esto no puede durar.
        </div>
      )}

      {debo.length > 0 && (
        <div className="seccion">
          <h2>😬 Tú debes</h2>
          <div className="pila" style={{ gap: 8 }}>
            {debo.map(({ g, p }) => (
              <div key={p.id} className="tarjeta peligro fila entre">
                <span>
                  <b>{euros(p.importe)}</b> a {nom(g.pagador)}
                  <br />
                  <span className="suave pequeno">
                    {g.concepto} · hace {diasEntre(g.fecha, m.hoy)} días
                  </span>
                </span>
                {p.avisada ? (
                  <span className="chapa naranja">Avisado</span>
                ) : (
                  <form action={avisarPagada}>
                    <input type="hidden" name="parte" value={p.id} />
                    <button className="boton mini">Ya hice Bizum</button>
                  </form>
                )}
              </div>
            ))}
          </div>
          <p className="suave pequeno">Solo el que pagó puede tachar la deuda. Avisarle no te libra hasta que lo confirme.</p>
        </div>
      )}

      {meDeben.length > 0 && (
        <div className="seccion">
          <h2>🤑 Te deben</h2>
          <div className="pila" style={{ gap: 8 }}>
            {meDeben.map(({ g, p }) => (
              <div key={p.id} className={`tarjeta fila entre ${p.avisada ? "alerta" : ""}`}>
                <span className="fila">
                  <Avatar j={jugadores.get(p.deudor)!} tam={34} />
                  <span>
                    <b>{nom(p.deudor)}</b> · {euros(p.importe)}
                    <br />
                    <span className="suave pequeno">
                      {g.concepto} · hace {diasEntre(g.fecha, m.hoy)} días
                      {p.avisada && " · dice que ya te pagó"}
                    </span>
                  </span>
                </span>
                <form action={marcarPagada}>
                  <input type="hidden" name="parte" value={p.id} />
                  <button className="boton mini">✓ Cobrado</button>
                </form>
              </div>
            ))}
          </div>
        </div>
      )}

      {morosos.length > 0 && (
        <div className="seccion">
          <h2>📉 Ranking de morosos</h2>
          <div className="ranking">
            {morosos.map((d, i) => (
              <div key={d.id} className={`puesto ${i === 0 ? "farolillo" : ""}`}>
                <span className="n">{i === 0 ? "🎩" : i + 1}</span>
                <Avatar j={jugadores.get(d.id)!} tam={40} />
                <span>
                  <b>{nom(d.id)}</b>
                  <br />
                  <span className="suave pequeno">deuda más vieja: {d.diasMax} días</span>
                </span>
                <span className="elo" style={{ fontSize: 18, color: "var(--rojo)" }}>
                  {euros(d.debe)}
                </span>
              </div>
            ))}
          </div>
          <p className="suave pequeno">Ordenado por morosidad: euros pendientes × días sin pagar.</p>
        </div>
      )}

      {tardones.length > 0 && (
        <div className="seccion">
          <h2>🐢 Los que más tardan en pagar</h2>
          <div className="pila" style={{ gap: 6 }}>
            {tardones.map((d) => (
              <div key={d.id} className="fila entre">
                <span className="fila">
                  <Avatar j={jugadores.get(d.id)!} tam={28} /> {nom(d.id)}
                </span>
                <span className="suave">{Math.round(d.mediaDiasPago ?? 0)} días de media</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="seccion">
        <FormGasto jugadores={m.jugadores} yoId={me.id} hoy={m.hoy} />
      </div>

      {m.gastos.some((g) => g.pagador === me.id) && (
        <div className="seccion">
          <h2>🧾 Lo que has pagado tú</h2>
          <div className="pila" style={{ gap: 8 }}>
            {m.gastos
              .filter((g) => g.pagador === me.id)
              .slice(0, 15)
              .map((g) => (
                <div key={g.id} className="tarjeta fila entre">
                  <span>
                    {g.concepto} · <b>{euros(g.importe)}</b>
                    <br />
                    <span className="suave pequeno">
                      {new Date(`${g.fecha}T12:00:00`).toLocaleDateString("es-ES")} ·{" "}
                      {g.partes.filter((p) => p.pagada).length}/{g.partes.length} han pagado
                    </span>
                  </span>
                  <form action={borrarGasto}>
                    <input type="hidden" name="gasto" value={g.id} />
                    <button className="boton secundario mini" aria-label="Borrar">
                      🗑️
                    </button>
                  </form>
                </div>
              ))}
          </div>
        </div>
      )}
    </>
  );
}
