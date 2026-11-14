"use client";

import { useActionState, useState } from "react";
import { nuevaQuedada } from "@/app/acciones";

// Los sitios de siempre, según el grupo.
const SITIOS = ["One Pádel", "K7", "Bamvolea", "Family Sport", "Sportcity", "Domotik Torrent"];
const HORAS = ["19:00", "20:00", "20:30", "21:00"];

export function FormQuedada({ hoy, manana }: { hoy: string; manana: string }) {
  const [estado, accion, enviando] = useActionState(nuevaQuedada, null);
  const [fecha, setFecha] = useState(hoy);
  const [hora, setHora] = useState("20:00");
  const [sitio, setSitio] = useState(SITIOS[0]);
  return (
    <form action={accion} className="tarjeta pila">
      <h2>📣 Convocar partida</h2>
      <div className="pestanas" style={{ margin: 0 }}>
        {[
          [hoy, "Hoy"],
          [manana, "Mañana"],
        ].map(([f, t]) => (
          <a key={f} href="#" role="button" aria-current={fecha === f ? "page" : undefined} onClick={(e) => (e.preventDefault(), setFecha(f))}>
            {t}
          </a>
        ))}
        <input type="date" name="fecha" value={fecha} min={hoy} onChange={(e) => setFecha(e.target.value)} required style={{ minHeight: 38, padding: "4px 10px", width: "auto", flex: 1 }} aria-label="Otro día" />
      </div>
      <div className="pestanas" style={{ margin: 0 }}>
        {HORAS.map((h) => (
          <a key={h} href="#" role="button" aria-current={hora === h ? "page" : undefined} onClick={(e) => (e.preventDefault(), setHora(h))}>
            {h}
          </a>
        ))}
        <input type="time" name="hora" value={hora} onChange={(e) => setHora(e.target.value)} required style={{ minHeight: 38, padding: "4px 10px", width: "auto" }} aria-label="Otra hora" />
      </div>
      <div className="pestanas" style={{ margin: 0 }}>
        {SITIOS.map((x) => (
          <a key={x} href="#" role="button" aria-current={sitio === x ? "page" : undefined} onClick={(e) => (e.preventDefault(), setSitio(x))}>
            {x}
          </a>
        ))}
      </div>
      <input name="sitio" value={sitio} onChange={(e) => setSitio(e.target.value)} maxLength={40} placeholder="¿Dónde?" required aria-label="Sitio" />
      <input name="nota" maxLength={120} placeholder="Nota (opcional): «invito yo, me nace»" />
      {estado?.error && <p className="error">{estado.error}</p>}
      {estado?.ok && <p className="ok">{estado.ok}</p>}
      <button className="boton" disabled={enviando}>
        Convocar (y me apunto)
      </button>
    </form>
  );
}
