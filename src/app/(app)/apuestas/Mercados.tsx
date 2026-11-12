"use client";

import { useActionState, useState } from "react";
import { apostar, pedirRescate } from "@/app/acciones";
import type { Mercado } from "@/lib/apuestas";

const FICHAS = [10, 25, 50, 100];

type Elegida = { mercado: Mercado; sel: string; etiqueta: string; cuota: number };

// Los mercados de un partido y el boleto para apostar. Se apuesta una vez por mercado.
export function Mercados({
  quedada,
  mercados,
  saldo,
  maximo,
  minimo,
  miLado,
  hechas,
}: {
  quedada: number;
  mercados: Mercado[];
  saldo: number;
  maximo: number;
  minimo: number;
  miLado: "a" | "b" | null; // si juego este partido
  hechas: Record<string, { sel: string; importe: number; cuota: number }>;
}) {
  const [elegida, setElegida] = useState<Elegida | null>(null);
  const [importe, setImporte] = useState(25);
  const [todos, setTodos] = useState(false);
  const [estado, accion, enviando] = useActionState(apostar, null);
  const tope = Math.min(maximo, saldo);
  const visibles = todos ? mercados : mercados.slice(0, 4);
  const permitido = (mk: Mercado, sel: string) => miLado === null || (mk.clave === "ganador" && sel === miLado);

  return (
    <div className="pila" style={{ gap: 14 }}>
      {miLado && <p className="suave pequeno" style={{ margin: 0 }}>🎾 Juegas este partido: solo puedes apostar a que ganas tú. Nada de dejarse perder.</p>}
      {visibles.map((mk) => {
        const hecha = hechas[mk.clave];
        return (
          <div key={mk.clave} className="mercado">
            <div className="fila entre">
              <b>{mk.titulo}</b>
              {hecha && <span className="chapa verde">Apostado</span>}
            </div>
            {mk.ayuda && <span className="suave pequeno">{mk.ayuda}</span>}
            <div className={`cuotas-fila n${Math.min(mk.opciones.length, 4)}`}>
              {mk.opciones.map((o) => {
                const mia = hecha?.sel === o.sel;
                const activa = elegida?.mercado.clave === mk.clave && elegida.sel === o.sel;
                return (
                  <button
                    key={o.sel}
                    type="button"
                    className={`cuota ${activa ? "activa" : ""} ${mia ? "mia" : ""}`}
                    disabled={Boolean(hecha) || !permitido(mk, o.sel)}
                    aria-pressed={activa}
                    onClick={() => setElegida(activa ? null : { mercado: mk, sel: o.sel, etiqueta: o.etiqueta, cuota: o.cuota })}
                  >
                    <span>{o.etiqueta}</span>
                    <b>{(mia ? hecha.cuota : o.cuota).toFixed(2)}</b>
                    {mia && <small>{hecha.importe} 🪙</small>}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {mercados.length > 4 && (
        <button type="button" className="boton secundario mini" onClick={() => setTodos(!todos)}>
          {todos ? "Ver menos mercados" : `Ver los ${mercados.length} mercados`}
        </button>
      )}
      {estado?.ok && !elegida && <p className="ok">{estado.ok}</p>}

      {elegida && (
        <form action={accion} className="boleto" onSubmit={() => setTimeout(() => setElegida(null), 50)}>
          <input type="hidden" name="quedada" value={quedada} />
          <input type="hidden" name="mercado" value={elegida.mercado.clave} />
          <input type="hidden" name="seleccion" value={elegida.sel} />
          <input type="hidden" name="importe" value={importe} />
          <div className="fila entre">
            <span>
              <span className="suave pequeno">{elegida.mercado.titulo}</span>
              <br />
              <b>{elegida.etiqueta}</b>
            </span>
            <span className="cuota-grande">{elegida.cuota.toFixed(2)}</span>
          </div>
          <div className="fichas">
            {FICHAS.map((f) => (
              <button key={f} type="button" disabled={f > tope} aria-pressed={importe === f} onClick={() => setImporte(f)}>
                {f}
              </button>
            ))}
          </div>
          <input
            type="range"
            min={minimo}
            max={Math.max(minimo, tope)}
            step={5}
            value={Math.min(importe, Math.max(minimo, tope))}
            onChange={(e) => setImporte(Number(e.target.value))}
            aria-label="Monedas"
            style={{ minHeight: 0, padding: 0 }}
          />
          <div className="fila entre pequeno">
            <span className="suave">
              Apuestas <b style={{ color: "var(--texto)" }}>{importe}</b> · tienes {saldo.toLocaleString("es-ES")}
            </span>
            <span>
              Cobras <b style={{ color: "var(--verde)" }}>{Math.round(importe * elegida.cuota)}</b>
            </span>
          </div>
          {estado?.error && <p className="error">{estado.error}</p>}
          <div className="fila">
            <button type="button" className="boton secundario" onClick={() => setElegida(null)}>
              Cancelar
            </button>
            <button className="boton" style={{ flex: 1 }} disabled={enviando || importe > tope || tope < minimo}>
              {tope < minimo ? "Sin monedas" : `Apostar ${importe}`}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export function Rescate() {
  const [estado, accion, enviando] = useActionState(pedirRescate, null);
  return (
    <form action={accion} className="tarjeta peligro pila">
      <b>💀 Estás arruinado</b>
      <span className="suave pequeno">El Banco de la Tropa te puede rescatar con 100 monedas. Queda apuntado en tu expediente (y en el muro).</span>
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      <button className="boton rojo" disabled={enviando}>
        Pedir rescate
      </button>
    </form>
  );
}
