"use client";

import { useRef, useState } from "react";

const VISOR = 260; // px del círculo de recorte
const SALIDA = 288; // px de la imagen final

type Pos = { x: number; y: number; s: number };

// Recorta la cara y le aplica un filtro de cómic: colores planos, más saturación y contorno negro.
function cabezonizar(img: HTMLImageElement, pos: Pos): string {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = SALIDA;
  const ctx = lienzo.getContext("2d", { willReadFrequently: true })!;
  const lado = VISOR / pos.s;
  ctx.drawImage(img, -pos.x / pos.s, -pos.y / pos.s, lado, lado, 0, 0, SALIDA, SALIDA);

  const datos = ctx.getImageData(0, 0, SALIDA, SALIDA);
  const p = datos.data;
  const n = SALIDA * SALIDA;

  // Luminancia suavizada para sacar los bordes sin ruido.
  const lum = new Float32Array(n);
  for (let i = 0; i < n; i++) lum[i] = 0.299 * p[i * 4] + 0.587 * p[i * 4 + 1] + 0.114 * p[i * 4 + 2];
  const suave = new Float32Array(n);
  for (let y = 1; y < SALIDA - 1; y++) {
    for (let x = 1; x < SALIDA - 1; x++) {
      let s = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s += lum[(y + dy) * SALIDA + x + dx];
      suave[y * SALIDA + x] = s / 9;
    }
  }

  const niveles = 6;
  const centro = SALIDA / 2;
  for (let y = 0; y < SALIDA; y++) {
    for (let x = 0; x < SALIDA; x++) {
      const i = y * SALIDA + x;
      const o = i * 4;
      // Fuera del círculo, transparente.
      const d = Math.hypot(x - centro + 0.5, y - centro + 0.5);
      if (d > centro) {
        p[o + 3] = 0;
        continue;
      }
      let borde = 0;
      if (x > 1 && y > 1 && x < SALIDA - 2 && y < SALIDA - 2) {
        const v = (dx: number, dy: number) => suave[(y + dy) * SALIDA + x + dx];
        const gx = -v(-1, -1) - 2 * v(-1, 0) - v(-1, 1) + v(1, -1) + 2 * v(1, 0) + v(1, 1);
        const gy = -v(-1, -1) - 2 * v(0, -1) - v(1, -1) + v(-1, 1) + 2 * v(0, 1) + v(1, 1);
        borde = Math.min(1, Math.max(0, (Math.hypot(gx, gy) - 50) / 70));
      }
      const gris = lum[i];
      for (let c = 0; c < 3; c++) {
        let v = gris + (p[o + c] - gris) * 1.55; // saturación
        v = (v - 128) * 1.18 + 140; // contraste y algo de brillo
        v = Math.round((Math.min(255, Math.max(0, v)) / 255) * (niveles - 1)) / (niveles - 1) * 255; // colores planos
        p[o + c] = v * (1 - borde * 0.88);
      }
    }
  }
  ctx.putImageData(datos, 0, 0);
  return lienzo.toDataURL("image/png");
}

export function FotoCabezon({ nombre = "avatar", alCambiar }: { nombre?: string; alCambiar?: (url: string | null) => void }) {
  const [fuente, setFuente] = useState<string | null>(null);
  const [pos, setPos] = useState<Pos>({ x: 0, y: 0, s: 1 });
  const [minimo, setMinimo] = useState(1);
  const [resultado, setResultado] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const punteros = useRef(new Map<number, { x: number; y: number }>());
  const distancia = useRef<number | null>(null);

  function elegir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setResultado(null);
    alCambiar?.(null);
    setFuente(URL.createObjectURL(archivo));
  }

  function cargada() {
    const img = imgRef.current!;
    const s = VISOR / Math.min(img.naturalWidth, img.naturalHeight);
    setMinimo(s);
    // Centrado, un poco hacia arriba: la cara suele estar en la mitad superior.
    setPos({ s, x: (VISOR - img.naturalWidth * s) / 2, y: Math.min(0, (VISOR - img.naturalHeight * s) / 3) });
  }

  function limitar(p: Pos): Pos {
    const img = imgRef.current;
    if (!img) return p;
    const w = img.naturalWidth * p.s;
    const h = img.naturalHeight * p.s;
    return { s: p.s, x: Math.min(0, Math.max(VISOR - w, p.x)), y: Math.min(0, Math.max(VISOR - h, p.y)) };
  }

  function zoom(s: number, cx = VISOR / 2, cy = VISOR / 2) {
    setPos((p) => {
      const nuevo = Math.max(minimo, Math.min(minimo * 6, s));
      const k = nuevo / p.s;
      return limitar({ s: nuevo, x: cx - (cx - p.x) * k, y: cy - (cy - p.y) * k });
    });
  }

  function abajo(e: React.PointerEvent) {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function mover(e: React.PointerEvent) {
    const antes = punteros.current.get(e.pointerId);
    if (!antes) return;
    punteros.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const todos = [...punteros.current.values()];
    if (todos.length === 2) {
      const d = Math.hypot(todos[0].x - todos[1].x, todos[0].y - todos[1].y);
      if (distancia.current) zoom(pos.s * (d / distancia.current));
      distancia.current = d;
      return;
    }
    setPos((p) => limitar({ ...p, x: p.x + e.clientX - antes.x, y: p.y + e.clientY - antes.y }));
  }

  function arriba(e: React.PointerEvent) {
    punteros.current.delete(e.pointerId);
    if (punteros.current.size < 2) distancia.current = null;
  }

  function hacer() {
    const url = cabezonizar(imgRef.current!, pos);
    setResultado(url);
    alCambiar?.(url);
  }

  return (
    <div className="pila">
      <input type="hidden" name={nombre} value={resultado ?? ""} />
      {resultado ? (
        <div className="pila" style={{ justifyItems: "center" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={resultado} alt="Tu cabezón" width={180} height={180} className="medalla-pop" style={{ filter: "drop-shadow(0 6px 0 #000)" }} />
          <p className="ok" style={{ margin: 0 }}>¡Cabezón listo! Así saldrás en las escenas.</p>
          <button type="button" className="boton secundario mini" onClick={() => setResultado(null)}>
            Reencuadrar
          </button>
        </div>
      ) : fuente ? (
        <div className="pila">
          <div className="recorte" onPointerDown={abajo} onPointerMove={mover} onPointerUp={arriba} onPointerCancel={arriba}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={fuente}
              alt=""
              onLoad={cargada}
              style={{ transform: `translate(${pos.x}px, ${pos.y}px) scale(${pos.s})` }}
            />
          </div>
          <p className="suave pequeno" style={{ textAlign: "center", margin: 0 }}>
            Arrastra para centrar la cara y ajusta el zoom. Que la cara llene el círculo.
          </p>
          <input
            type="range"
            min={minimo}
            max={minimo * 6}
            step={minimo / 50}
            value={pos.s}
            onChange={(e) => zoom(Number(e.target.value))}
            aria-label="Zoom"
            style={{ minHeight: 0, padding: 0 }}
          />
          <button type="button" className="boton rosa" onClick={hacer}>
            🤪 ¡Cabezonizar!
          </button>
        </div>
      ) : null}
      <label className="boton secundario" style={{ display: "flex" }}>
        📸 {fuente ? "Elegir otra foto" : "Subir foto"}
        <input type="file" accept="image/*" onChange={elegir} style={{ display: "none" }} />
      </label>
      {!fuente && (
        <ul className="consejos">
          <li>Basta con una foto de <b>la cara</b>, de frente.</li>
          <li>Buena luz, sin gafas de sol y sin nadie más en la foto.</li>
          <li>Cuanto más exagerada la cara (boca abierta, cara de pena…), más risa en las escenas.</li>
        </ul>
      )}
    </div>
  );
}
