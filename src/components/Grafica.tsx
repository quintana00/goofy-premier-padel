// Evolución del ELO: una línea sencilla, sin librerías.
export function Grafica({ valores }: { valores: number[] }) {
  if (valores.length < 2) return null;
  const w = 320;
  const h = 90;
  const min = Math.min(...valores) - 5;
  const max = Math.max(...valores) + 5;
  const x = (i: number) => (i / (valores.length - 1)) * w;
  const y = (v: number) => h - ((v - min) / (max - min)) * h;
  const puntos = valores.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const base = y(1000);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: 90, display: "block" }} preserveAspectRatio="none">
      {base >= 0 && base <= h && <line x1={0} x2={w} y1={base} y2={base} stroke="#2a3a78" strokeDasharray="4 4" />}
      <polyline points={puntos} fill="none" stroke="var(--bola)" strokeWidth={3} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
