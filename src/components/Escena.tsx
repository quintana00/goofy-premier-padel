// Escenas de dibujos animados: cuerpos dibujados + la cara (cabezón) de cada jugador.
// Todo es SVG con animaciones CSS, sin JavaScript en el navegador.
import type { ReactNode } from "react";
import type { Jugador } from "@/lib/tipos";
import { colorDe, iniciales, urlAvatar } from "@/lib/avatar";
import { personaje, type Accesorio } from "@/lib/personajes";

export type TipoEscena =
  | "biberon"
  | "perrito"
  | "beso"
  | "cobrador"
  | "ambulancia"
  | "fuego"
  | "trofeo"
  | "lloron"
  | "guadalquivir"
  | "nadar"
  | "ego"
  | "megafono"
  | "cuchara";

const N = "#111"; // trazo

export function Cabeza({
  j,
  cx,
  cy,
  r,
  id,
  sinAccesorio,
}: {
  j: Jugador | null;
  cx: number;
  cy: number;
  r: number;
  id: string;
  sinAccesorio?: boolean;
}) {
  if (!j) {
    // Cara genérica (el cobrador del frac cuando no sabemos a quién se le debe).
    return (
      <g>
        <circle cx={cx} cy={cy} r={r} fill="#f6c9a0" stroke={N} strokeWidth={4} />
        <circle cx={cx - r * 0.35} cy={cy - r * 0.15} r={r * 0.09} fill={N} />
        <circle cx={cx + r * 0.35} cy={cy - r * 0.15} r={r * 0.09} fill={N} />
        <path
          d={`M${cx - r * 0.5} ${cy + r * 0.25} q${r * 0.25} -${r * 0.25} ${r * 0.5} 0 q${r * 0.25} -${r * 0.25} ${r * 0.5} 0`}
          fill={N}
          stroke={N}
          strokeWidth={3}
        />
      </g>
    );
  }
  const clip = `cab-${id}`;
  return (
    <g>
      <clipPath id={clip}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r} fill={colorDe(j.id)} />
      {j.avatarV ? (
        <image
          href={urlAvatar(j)}
          x={cx - r}
          y={cy - r}
          width={r * 2}
          height={r * 2}
          clipPath={`url(#${clip})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <text x={cx} y={cy + r * 0.18} textAnchor="middle" fontSize={r * 0.62} fontWeight={900} fill={N}>
          {iniciales(j.nombre)}
        </text>
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={N} strokeWidth={4} />
      {!sinAccesorio && <Complemento tipo={personaje(j.nombre)?.accesorio} cx={cx} cy={cy} r={r} id={clip} />}
    </g>
  );
}

// El sello de cada uno, encima de su cabezón.
function Complemento({ tipo, cx, cy, r, id }: { tipo?: Accesorio; cx: number; cy: number; r: number; id: string }) {
  if (tipo === "iqos") {
    // IQOS en la comisura y su nubecita de vapor.
    const x = cx + r * 0.32;
    const y = cy + r * 0.5;
    return (
      <g>
        <g transform={`rotate(-18 ${x} ${y})`}>
          <rect x={x} y={y - r * 0.08} width={r * 0.95} height={r * 0.17} rx={r * 0.08} fill="#f4f4f4" stroke={N} strokeWidth={2.5} />
          <rect x={x} y={y - r * 0.08} width={r * 0.3} height={r * 0.17} rx={r * 0.06} fill="#c7a26b" stroke={N} strokeWidth={2} />
        </g>
        {[0, 1, 2].map((i) => (
          <circle
            key={i}
            className="e-vapor"
            style={{ animationDelay: `${i * 0.6}s` }}
            cx={x + r * 0.95}
            cy={y - r * 0.4}
            r={r * (0.13 + i * 0.03)}
            fill="#fff"
            stroke="#999"
            strokeWidth={1.5}
            opacity={0.9}
          />
        ))}
      </g>
    );
  }
  if (tipo === "natacion") {
    // Gorro naranja Strava y gafas de natación.
    return (
      <g>
        <clipPath id={`gorro-${id}`}>
          <circle cx={cx} cy={cy} r={r - 2} />
        </clipPath>
        <rect x={cx - r} y={cy - r} width={r * 2} height={r * 0.62} fill="#fc4c02" clipPath={`url(#gorro-${id})`} />
        <path d={`M${cx - r * 0.98} ${cy - r * 0.32} Q${cx} ${cy - r * 0.48} ${cx + r * 0.98} ${cy - r * 0.32}`} fill="none" stroke={N} strokeWidth={r * 0.1} />
        {[-1, 1].map((k) => (
          <g key={k}>
            <ellipse cx={cx + k * r * 0.33} cy={cy - r * 0.38} rx={r * 0.22} ry={r * 0.15} fill="#3dd6ff" stroke={N} strokeWidth={3} />
            <ellipse cx={cx + k * r * 0.33 - r * 0.07} cy={cy - r * 0.42} rx={r * 0.06} ry={r * 0.035} fill="#fff" />
          </g>
        ))}
      </g>
    );
  }
  if (tipo === "boli") {
    // Boli de notario detrás de la oreja.
    return (
      <g transform={`rotate(35 ${cx + r * 0.9} ${cy - r * 0.35})`}>
        <rect x={cx + r * 0.6} y={cy - r * 0.42} width={r * 0.75} height={r * 0.14} rx={r * 0.04} fill="#ffd23d" stroke={N} strokeWidth={2.5} />
        <path d={`M${cx + r * 1.35} ${cy - r * 0.42} l${r * 0.18} ${r * 0.07} l${-r * 0.18} ${r * 0.07} Z`} fill="#333" stroke={N} strokeWidth={2} />
      </g>
    );
  }
  return null;
}

// Brazo o pierna con contorno negro.
function Extremidad({ d, color, ancho = 11 }: { d: string; color: string; ancho?: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={N} strokeWidth={ancho + 5} />
      <path d={d} stroke={color} strokeWidth={ancho} />
    </g>
  );
}

function Torso({ x, y, w = 62, h = 70, color }: { x: number; y: number; w?: number; h?: number; color: string }) {
  return <rect x={x} y={y} width={w} height={h} rx={22} fill={color} stroke={N} strokeWidth={3.5} />;
}

const PIEL = "#f6c9a0";

function Suelo({ color, movil = false }: { color: string; movil?: boolean }) {
  return (
    <g>
      <rect x={0} y={200} width={360} height={20} fill={color} />
      <line x1={0} y1={200} x2={360} y2={200} stroke={N} strokeWidth={3} />
      {movil && (
        <g className="e-carretera">
          {Array.from({ length: 12 }, (_, i) => (
            <rect key={i} x={i * 40} y={208} width={20} height={4} rx={2} fill="#fff" opacity={0.8} />
          ))}
        </g>
      )}
    </g>
  );
}

function Bocadillo({ x, y, texto, ancho }: { x: number; y: number; texto: string; ancho: number }) {
  return (
    <g className="e-bocadillo">
      <rect x={x} y={y} width={ancho} height={30} rx={14} fill="#fff" stroke={N} strokeWidth={3} />
      <path d={`M${x + 20} ${y + 29} l-6 12 l16 -12`} fill="#fff" stroke={N} strokeWidth={3} strokeLinejoin="round" />
      <rect x={x + 10} y={y + 26} width={22} height={5} fill="#fff" />
      <text x={x + ancho / 2} y={y + 20} textAnchor="middle" fontSize={14} fontWeight={900} fill={N}>
        {texto}
      </text>
    </g>
  );
}

function Corazon({ x, y, s = 1, clase }: { x: number; y: number; s?: number; clase?: string }) {
  return (
    // La animación CSS pisaría el atributo transform: por eso va en un grupo aparte.
    <g className={clase}>
      <path
        transform={`translate(${x} ${y}) scale(${s})`}
        d="M0 6 C0 -2 -12 -2 -12 6 C-12 12 0 18 0 22 C0 18 12 12 12 6 C12 -2 0 -2 0 6 Z"
        fill="#ff3d7f"
        stroke={N}
        strokeWidth={2.5}
      />
    </g>
  );
}

function Biberon({ x, y }: { x: Jugador; y: Jugador }) {
  const k = `${x.id}-${y.id}`;
  return (
    <>
      <rect width={360} height={220} fill="#ffe3ef" />
      <Suelo color="#f7b9d3" />
      {/* Padre */}
      <Extremidad d="M92 166 L88 200" color="#2b3a8c" />
      <Extremidad d="M118 166 L122 200" color="#2b3a8c" />
      <Extremidad d="M80 122 Q64 146 74 166" color={PIEL} />
      <Torso x={72} y={104} color={colorDe(x.id)} />
      <Extremidad d="M132 124 Q168 132 196 120" color={PIEL} />
      <Cabeza j={x} cx={105} cy={70} r={38} id={`p${k}`} />
      {/* Biberón */}
      <g className="e-biberon">
        <g transform="translate(192 104) rotate(-10)">
          <rect x={0} y={0} width={46} height={24} rx={7} fill="#fff" stroke={N} strokeWidth={3} />
          <rect x={3} y={11} width={32} height={10} rx={3} fill="#fff6c9" />
          <line x1={12} y1={3} x2={12} y2={9} stroke={N} strokeWidth={2} />
          <line x1={22} y1={3} x2={22} y2={9} stroke={N} strokeWidth={2} />
          <rect x={40} y={-3} width={9} height={30} rx={3} fill="#6cc3ff" stroke={N} strokeWidth={3} />
          <path d="M49 6 Q64 12 49 18 Z" fill="#f4c07a" stroke={N} strokeWidth={3} strokeLinejoin="round" />
        </g>
      </g>
      {/* Bebé */}
      <g className="e-bebe">
        <ellipse cx={280} cy={176} rx={36} ry={28} fill={PIEL} stroke={N} strokeWidth={3.5} />
        <path d="M246 180 Q280 222 314 180 Q280 196 246 180 Z" fill="#fff" stroke={N} strokeWidth={3} />
        <ellipse cx={250} cy={168} rx={9} ry={13} fill={PIEL} stroke={N} strokeWidth={3} transform="rotate(30 250 168)" />
        <ellipse cx={310} cy={168} rx={9} ry={13} fill={PIEL} stroke={N} strokeWidth={3} transform="rotate(-30 310 168)" />
        <Cabeza j={y} cx={280} cy={118} r={36} id={`h${k}`} />
        <path d="M272 82 q6 -16 14 -4" fill="none" stroke={N} strokeWidth={3} strokeLinecap="round" />
      </g>
      <text className="e-glu" x={236} y={74} fontSize={16} fontWeight={900} fill={N}>
        glu glu
      </text>
      <Corazon x={190} y={40} s={0.8} clase="e-flota" />
    </>
  );
}

function Perrito({ x, y }: { x: Jugador; y: Jugador }) {
  const k = `${x.id}-${y.id}`;
  const marron = "#c98b4f";
  return (
    <>
      <rect width={360} height={220} fill="#dff7d0" />
      <circle cx={320} cy={36} r={18} fill="#ffe14d" stroke={N} strokeWidth={3} />
      <Suelo color="#a5d98a" movil />
      {/* Dueño caminando */}
      <g className="e-pierna1">
        <Extremidad d="M84 166 L80 200" color="#2b3a8c" />
      </g>
      <g className="e-pierna2">
        <Extremidad d="M106 166 L110 200" color="#2b3a8c" />
      </g>
      <g className="e-andar">
        <Extremidad d="M68 122 Q56 146 66 164" color={PIEL} />
        <Torso x={62} y={104} color={colorDe(x.id)} />
        <Extremidad d="M118 124 Q140 140 160 146" color={PIEL} />
        <Cabeza j={x} cx={94} cy={70} r={36} id={`d${k}`} />
      </g>
      {/* Correa */}
      <path d="M160 146 Q230 186 288 160" fill="none" stroke="#e8322f" strokeWidth={4} strokeLinecap="round" />
      {/* Perro */}
      <g className="e-perro">
        <path className="e-cola" d="M216 160 Q196 140 204 124" fill="none" stroke={N} strokeWidth={13} strokeLinecap="round" />
        <path className="e-cola" d="M216 160 Q196 140 204 124" fill="none" stroke={marron} strokeWidth={8} strokeLinecap="round" />
        <g className="e-pata1">
          <Extremidad d="M232 180 L230 204" color={marron} ancho={9} />
          <Extremidad d="M282 180 L280 204" color={marron} ancho={9} />
        </g>
        <g className="e-pata2">
          <Extremidad d="M250 180 L252 204" color={marron} ancho={9} />
          <Extremidad d="M298 180 L300 204" color={marron} ancho={9} />
        </g>
        <ellipse cx={262} cy={168} rx={50} ry={22} fill={marron} stroke={N} strokeWidth={3.5} />
        <ellipse className="e-oreja1" cx={292} cy={124} rx={11} ry={22} fill="#8a5a2b" stroke={N} strokeWidth={3} />
        <ellipse className="e-oreja2" cx={338} cy={124} rx={11} ry={22} fill="#8a5a2b" stroke={N} strokeWidth={3} />
        <Cabeza j={y} cx={314} cy={136} r={30} id={`g${k}`} />
        <rect x={296} y={160} width={36} height={8} rx={4} fill="#e8322f" stroke={N} strokeWidth={2.5} />
        <ellipse className="e-lengua" cx={326} cy={174} rx={6} ry={9} fill="#ff7aa8" stroke={N} strokeWidth={2.5} />
      </g>
      <Bocadillo x={220} y={50} texto="¡Guau! 🦴" ancho={96} />
    </>
  );
}

function Beso({ x, y }: { x: Jugador; y: Jugador }) {
  const k = `${x.id}-${y.id}`;
  return (
    <>
      <rect width={360} height={220} fill="#ffe9f3" />
      {[30, 90, 300, 330].map((cx, i) => (
        <Corazon key={cx} x={cx} y={30 + (i % 2) * 40} s={0.6} clase="e-latido" />
      ))}
      <Suelo color="#ffc2dc" />
      <g className="e-beso-izq">
        <Extremidad d="M108 168 L104 200" color="#2b3a8c" />
        <Extremidad d="M132 168 L136 200" color="#2b3a8c" />
        <Torso x={88} y={108} color={colorDe(x.id)} />
        <Extremidad d="M144 126 Q166 120 176 106" color={PIEL} />
        <Cabeza j={x} cx={128} cy={78} r={40} id={`i${k}`} />
      </g>
      <g className="e-beso-der">
        <Extremidad d="M228 168 L224 200" color="#2b3a8c" />
        <Extremidad d="M252 168 L256 200" color="#2b3a8c" />
        <Torso x={210} y={108} color={colorDe(y.id)} />
        <Extremidad d="M216 126 Q194 120 184 106" color={PIEL} />
        <Cabeza j={y} cx={232} cy={78} r={40} id={`r${k}`} />
      </g>
      <g className="e-muac">
        <Corazon x={180} y={18} s={1.3} />
        <text x={180} y={70} textAnchor="middle" fontSize={20} fontWeight={900} fill="#ff3d7f" stroke={N} strokeWidth={1}>
          MUAC
        </text>
      </g>
    </>
  );
}

function Cobrador({ x, y }: { x: Jugador | null; y: Jugador }) {
  const k = `${x?.id ?? 0}-${y.id}`;
  return (
    <>
      <rect width={360} height={220} fill="#e6ecff" />
      <Suelo color="#9aa6c8" movil />
      {/* Moroso huyendo */}
      <g className="e-correr">
        <g className="e-pierna1">
          <Extremidad d="M262 164 L250 198" color="#2b3a8c" />
        </g>
        <g className="e-pierna2">
          <Extremidad d="M282 164 L298 196" color="#2b3a8c" />
        </g>
        <g transform="rotate(10 272 136)">
          <Extremidad d="M248 122 Q232 104 238 88" color={PIEL} />
          <Torso x={242} y={102} h={66} color={colorDe(y.id)} />
          <Extremidad d="M298 122 Q318 136 330 124" color={PIEL} />
        </g>
        <Cabeza j={y} cx={282} cy={72} r={34} id={`m${k}`} />
        <path className="e-gota" d="M246 50 q-6 10 0 14 q6 -4 0 -14 Z" fill="#6cc3ff" stroke={N} strokeWidth={2} />
        <path className="e-gota e-gota2" d="M318 46 q-6 10 0 14 q6 -4 0 -14 Z" fill="#6cc3ff" stroke={N} strokeWidth={2} />
      </g>
      {/* Cobrador del frac */}
      <g className="e-correr e-retraso">
        <path className="e-faldon" d="M74 150 L40 186 L66 180 L80 166 Z" fill={N} stroke={N} strokeWidth={3} strokeLinejoin="round" />
        <g className="e-pierna2">
          <Extremidad d="M92 164 L80 198" color="#222" />
        </g>
        <g className="e-pierna1">
          <Extremidad d="M112 164 L126 196" color="#222" />
        </g>
        <Torso x={72} y={102} h={66} color="#1d1d1d" />
        <path d="M92 102 L103 132 L114 102 Z" fill="#fff" stroke={N} strokeWidth={2.5} />
        <path d="M95 106 L103 112 L111 106 L111 116 L103 112 L95 116 Z" fill="#e8322f" stroke={N} strokeWidth={1.5} />
        <Extremidad d="M130 120 Q150 130 158 150" color="#1d1d1d" />
        <g transform="translate(140 148)">
          <rect x={0} y={0} width={46} height={30} rx={4} fill="#8a5a2b" stroke={N} strokeWidth={3} />
          <path d="M15 0 v-6 h16 v6" fill="none" stroke={N} strokeWidth={3} />
          <text x={23} y={20} textAnchor="middle" fontSize={9} fontWeight={900} fill="#ffe14d">
            COBROS
          </text>
        </g>
        <Cabeza j={x} cx={102} cy={72} r={34} id={`c${k}`} />
        {/* Chistera */}
        <rect x={74} y={32} width={56} height={8} rx={3} fill={N} />
        <rect x={84} y={0} width={36} height={36} rx={3} fill={N} />
        <rect x={84} y={24} width={36} height={6} fill="#e8322f" />
      </g>
      <Bocadillo x={146} y={4} texto="¡Mañana te hago Bizum!" ancho={210} />
    </>
  );
}

function Ambulancia({ y }: { y: Jugador }) {
  const k = `${y.id}`;
  return (
    <>
      <rect width={360} height={220} fill="#eef1f6" />
      <Suelo color="#7d8597" movil />
      <g className="e-traqueteo">
        <rect x={40} y={72} width={220} height={110} rx={14} fill="#fff" stroke={N} strokeWidth={4} />
        <path d="M260 102 L300 102 L330 140 L330 182 L260 182 Z" fill="#fff" stroke={N} strokeWidth={4} strokeLinejoin="round" />
        <path d="M270 110 L296 110 L318 138 L270 138 Z" fill="#9fd6ff" stroke={N} strokeWidth={3} />
        <rect x={40} y={150} width={290} height={10} fill="#e8322f" />
        <rect x={190} y={92} width={16} height={46} fill="#e8322f" />
        <rect x={175} y={107} width={46} height={16} fill="#e8322f" />
        <text x={150} y={176} textAnchor="middle" fontSize={11} fontWeight={900} fill="#fff">
          UVI PÁDEL
        </text>
        <rect className="e-sirena" x={120} y={58} width={34} height={14} rx={4} fill="#ff3030" stroke={N} strokeWidth={3} />
        <circle cx={104} cy={118} r={36} fill="#9fd6ff" stroke={N} strokeWidth={4} />
        <Cabeza j={y} cx={104} cy={118} r={30} id={`a${k}`} />
        {/* Venda */}
        <path d="M76 100 Q104 86 132 100" fill="none" stroke="#fff" strokeWidth={9} strokeLinecap="round" />
        <path d="M76 100 Q104 86 132 100" fill="none" stroke={N} strokeWidth={1.5} strokeDasharray="3 4" />
        <circle cx={112} cy={94} r={3.5} fill="#e8322f" />
        <g className="e-rueda" style={{ transformOrigin: "100px 184px" }}>
          <circle cx={100} cy={184} r={20} fill="#333" stroke={N} strokeWidth={3} />
          <path d="M100 168 V200 M84 184 H116" stroke="#aaa" strokeWidth={3} />
        </g>
        <g className="e-rueda" style={{ transformOrigin: "280px 184px" }}>
          <circle cx={280} cy={184} r={20} fill="#333" stroke={N} strokeWidth={3} />
          <path d="M280 168 V200 M264 184 H296" stroke="#aaa" strokeWidth={3} />
        </g>
      </g>
      <text className="e-nino" x={300} y={40} textAnchor="middle" fontSize={18} fontWeight={900} fill="#e8322f">
        NINO NINO
      </text>
    </>
  );
}

function Fuego({ y }: { y: Jugador }) {
  return (
    <>
      <rect width={360} height={220} fill="#2a0d00" />
      <g className="e-llama">
        <path d="M180 214 C90 214 96 120 130 84 C130 120 150 120 150 120 C140 70 170 30 200 14 C190 60 230 80 236 120 C246 106 248 92 244 80 C280 120 276 214 180 214 Z" fill="#ff6a00" stroke={N} strokeWidth={4} />
      </g>
      <g className="e-llama e-llama2">
        <path d="M180 212 C126 212 126 150 152 122 C156 146 170 150 170 150 C164 120 182 96 198 84 C196 116 226 132 222 160 C236 150 236 140 236 132 C254 160 240 212 180 212 Z" fill="#ffd23d" />
      </g>
      <Cabeza j={y} cx={180} cy={140} r={46} id={`f${y.id}`} />
      {/* Gafas de sol */}
      <g>
        <rect x={146} y={124} width={30} height={18} rx={7} fill={N} />
        <rect x={184} y={124} width={30} height={18} rx={7} fill={N} />
        <rect x={174} y={128} width={12} height={4} fill={N} />
        <rect x={151} y={127} width={9} height={4} rx={2} fill="#fff" opacity={0.6} />
      </g>
    </>
  );
}

function Trofeo({ x, y }: { x: Jugador; y: Jugador }) {
  const k = `${x.id}-${y.id}`;
  return (
    <>
      <rect width={360} height={220} fill="#fff4cc" />
      {Array.from({ length: 14 }, (_, i) => (
        <rect
          key={i}
          className="e-confeti"
          style={{ animationDelay: `${(i * 0.37) % 2}s` }}
          x={12 + i * 25}
          y={-10}
          width={7}
          height={12}
          fill={["#ff3d7f", "#3ee08f", "#3d8bff", "#ffae3d"][i % 4]}
        />
      ))}
      <Suelo color="#f2d273" />
      <g className="e-saltito">
        <Extremidad d="M108 172 L104 200" color="#2b3a8c" />
        <Extremidad d="M128 172 L132 200" color="#2b3a8c" />
        <Torso x={88} y={112} h={64} color={colorDe(x.id)} />
        <Extremidad d="M144 126 Q160 96 168 70" color={PIEL} />
        <Cabeza j={x} cx={118} cy={82} r={34} id={`t${k}`} />
      </g>
      <g className="e-saltito e-retraso">
        <Extremidad d="M232 172 L228 200" color="#2b3a8c" />
        <Extremidad d="M252 172 L256 200" color="#2b3a8c" />
        <Torso x={212} y={112} h={64} color={colorDe(y.id)} />
        <Extremidad d="M216 126 Q200 96 192 70" color={PIEL} />
        <Cabeza j={y} cx={242} cy={82} r={34} id={`u${k}`} />
      </g>
      <g className="e-copa">
        <path d="M158 20 H202 V40 C202 62 158 62 158 40 Z" fill="#ffd23d" stroke={N} strokeWidth={3.5} />
        <path d="M158 26 C142 26 142 46 160 48 M202 26 C218 26 218 46 200 48" fill="none" stroke={N} strokeWidth={3.5} />
        <rect x={174} y={58} width={12} height={10} fill="#ffd23d" stroke={N} strokeWidth={3} />
        <rect x={164} y={66} width={32} height={9} rx={2} fill="#8a5a2b" stroke={N} strokeWidth={3} />
      </g>
    </>
  );
}

function Lloron({ y, frase }: { y: Jugador; frase?: string }) {
  return (
    <>
      <rect width={360} height={220} fill="#dbe9ff" />
      <Suelo color="#a9c4ef" />
      <rect x={60} y={150} width={240} height={50} fill="#6cc3ff" opacity={0.5} className="e-charco" />
      <Extremidad d="M170 166 L166 200" color="#2b3a8c" />
      <Extremidad d="M190 166 L194 200" color="#2b3a8c" />
      <Torso x={149} y={104} color={colorDe(y.id)} />
      <Extremidad d="M154 122 Q130 140 140 160" color={PIEL} />
      <Extremidad d="M206 122 Q232 116 238 100" color={PIEL} />
      {/* Pañuelo */}
      <path d="M232 76 L258 84 L250 108 L228 100 Z" fill="#fff" stroke={N} strokeWidth={3} className="e-panuelo" />
      <Cabeza j={y} cx={180} cy={72} r={40} id={`l${y.id}`} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path className="e-lagrima" style={{ animationDelay: `${i * 0.4}s` }} d="M162 74 q-5 9 0 12 q5 -3 0 -12 Z" fill="#3d8bff" stroke={N} strokeWidth={1.5} />
          <path className="e-lagrima" style={{ animationDelay: `${i * 0.4 + 0.2}s` }} d="M198 74 q-5 9 0 12 q5 -3 0 -12 Z" fill="#3d8bff" stroke={N} strokeWidth={1.5} />
        </g>
      ))}
      <Bocadillo x={14} y={14} texto={frase ?? "¡Ha sido amaño! 😭"} ancho={150} />
    </>
  );
}

// Reconciliación Guadalquivir: uno nadando (y lo sube a Strava), otro en la terraza. Sin terraza = solo natación.
function Guadalquivir({ nadador, terraza }: { nadador: Jugador; terraza: Jugador | null }) {
  const k = `${nadador.id}-${terraza?.id ?? 0}`;
  const ancho = terraza ? 232 : 360;
  return (
    <>
      <rect width={360} height={220} fill="#bfe8ff" />
      <circle cx={terraza ? 200 : 320} cy={34} r={18} fill="#ffe14d" stroke={N} strokeWidth={3} />
      {/* Torre del Oro */}
      <g>
        <rect x={20} y={58} width={34} height={66} fill="#e8c27a" stroke={N} strokeWidth={3} />
        <rect x={26} y={34} width={22} height={26} fill="#e8c27a" stroke={N} strokeWidth={3} />
        <path d="M24 34 L37 16 L50 34 Z" fill="#c9a55a" stroke={N} strokeWidth={3} strokeLinejoin="round" />
        <rect x={33} y={78} width={8} height={14} rx={4} fill={N} />
      </g>
      {/* Río */}
      <rect x={0} y={118} width={ancho} height={102} fill="#2f8fd8" />
      <g className="e-olas">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${i * 40 - 40} 124 q10 -8 20 0 t20 0`} fill="none" stroke="#bfe6ff" strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>
      {/* Nadador */}
      <g className="e-nado">
        <g className="e-brazo1" style={{ transformOrigin: "128px 150px", transformBox: "view-box" }}>
          <Extremidad d="M128 150 L160 128" color={PIEL} ancho={10} />
        </g>
        <Cabeza j={nadador} cx={104} cy={146} r={28} id={`n${k}`} />
        <g className="e-brazo2" style={{ transformOrigin: "84px 156px", transformBox: "view-box" }}>
          <Extremidad d="M84 156 L52 134" color={PIEL} ancho={10} />
        </g>
      </g>
      <rect x={0} y={166} width={ancho} height={54} fill="#2f8fd8" />
      <g className="e-olas e-retraso">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d={`M${i * 40 - 20} 168 q10 -8 20 0 t20 0`} fill="none" stroke="#bfe6ff" strokeWidth={3} strokeLinecap="round" />
        ))}
      </g>
      {[0, 1, 2].map((i) => (
        <circle key={i} className="e-salpica" style={{ animationDelay: `${i * 0.3}s` }} cx={150 + i * 8} cy={150} r={4} fill="#fff" />
      ))}
      {/* Notificación de Strava */}
      <g className="e-bocadillo">
        <rect x={70} y={10} width={150} height={44} rx={10} fill="#fff" stroke={N} strokeWidth={3} />
        <rect x={70} y={10} width={34} height={44} rx={10} fill="#fc4c02" stroke={N} strokeWidth={3} />
        <text x={87} y={39} textAnchor="middle" fontSize={18}>
          🏊
        </text>
        <text x={112} y={28} fontSize={10} fontWeight={900} fill="#fc4c02">
          STRAVA
        </text>
        <text x={112} y={45} fontSize={11} fontWeight={800} fill={N}>
          1,2 km · 12 kudos 👍
        </text>
      </g>
      {terraza && (
        <>
          {/* Terraza */}
          <rect x={232} y={118} width={128} height={102} fill="#f0d9b5" />
          <line x1={232} y1={118} x2={232} y2={220} stroke={N} strokeWidth={3} />
          <path d="M250 70 Q300 30 352 70 Z" fill="#e8322f" stroke={N} strokeWidth={3} strokeLinejoin="round" />
          <path d="M276 70 Q300 46 326 70" fill="#fff" stroke={N} strokeWidth={2} />
          <line x1={300} y1={70} x2={300} y2={196} stroke={N} strokeWidth={4} />
          <Extremidad d="M280 176 L276 206" color="#2b3a8c" />
          <Extremidad d="M302 176 L306 206" color="#2b3a8c" />
          <Torso x={262} y={124} w={56} h={58} color={colorDe(terraza.id)} />
          <Cabeza j={terraza} cx={290} cy={100} r={28} id={`t${k}`} />
          <ellipse cx={330} cy={176} rx={26} ry={7} fill="#fff" stroke={N} strokeWidth={3} />
          <line x1={330} y1={182} x2={330} y2={206} stroke={N} strokeWidth={4} />
          <rect x={322} y={150} width={14} height={24} rx={3} fill="#ffcf3d" stroke={N} strokeWidth={2.5} />
          <rect x={322} y={150} width={14} height={6} rx={2} fill="#fff" />
          <text x={296} y={140} textAnchor="middle" fontSize={9} fontWeight={900} fill={N}>
            TERRAZA
          </text>
        </>
      )}
      {terraza && <Corazon x={214} y={90} s={0.7} clase="e-flota" />}
    </>
  );
}

// Ego por las nubes: un globo con el ego que le levanta del suelo y cola de pavo real.
function Ego({ y }: { y: Jugador }) {
  return (
    <>
      <rect width={360} height={220} fill="#fff3e0" />
      <Suelo color="#ffd9a8" />
      <g className="e-abanico" style={{ transformOrigin: "160px 150px", transformBox: "view-box" }}>
        {[-75, -50, -25, 0, 25, 50, 75].map((a) => (
          <g key={a} transform={`rotate(${a} 160 150)`}>
            <ellipse cx={160} cy={78} rx={17} ry={58} fill="#1aa38f" stroke={N} strokeWidth={2.5} />
            <circle cx={160} cy={42} r={9} fill="#2b5bd7" stroke={N} strokeWidth={2} />
            <circle cx={160} cy={42} r={4} fill="#ffd23d" />
          </g>
        ))}
      </g>
      <g className="e-elevar">
        <path className="e-globo-cuerda" d="M196 128 Q230 100 250 76" fill="none" stroke={N} strokeWidth={2} />
        <g className="e-globo" style={{ transformOrigin: "258px 50px", transformBox: "view-box" }}>
          <ellipse cx={258} cy={46} rx={44} ry={40} fill="#ff5fa2" stroke={N} strokeWidth={3.5} />
          <path d="M252 86 l6 8 l6 -8 Z" fill="#ff5fa2" stroke={N} strokeWidth={2.5} />
          <ellipse cx={244} cy={32} rx={10} ry={6} fill="#fff" opacity={0.6} />
          <text x={258} y={55} textAnchor="middle" fontSize={26} fontWeight={900} fill="#fff" stroke={N} strokeWidth={1.5}>
            EGO
          </text>
        </g>
        <Extremidad d="M150 168 L146 196" color="#2b3a8c" />
        <Extremidad d="M170 168 L174 196" color="#2b3a8c" />
        <Torso x={130} y={110} h={62} color={colorDe(y.id)} />
        <Extremidad d="M182 126 Q192 120 196 128" color={PIEL} />
        <Extremidad d="M136 126 Q120 140 128 156" color={PIEL} />
        <Cabeza j={y} cx={160} cy={80} r={36} id={`ego${y.id}`} />
      </g>
    </>
  );
}

// Megáfono: uno grita a su compañero, que sale despeinado.
function Megafono({ x, y }: { x: Jugador; y: Jugador }) {
  const k = `${x.id}-${y.id}`;
  return (
    <>
      <rect width={360} height={220} fill="#e9f7ef" />
      <Suelo color="#9fd9b6" />
      <rect x={176} y={120} width={6} height={80} fill="#fff" stroke={N} strokeWidth={2} />
      <g>
        <Extremidad d="M88 166 L84 200" color="#2b3a8c" />
        <Extremidad d="M110 166 L114 200" color="#2b3a8c" />
        <Torso x={68} y={106} h={64} color={colorDe(x.id)} />
        <Cabeza j={x} cx={98} cy={74} r={34} id={`gr${k}`} />
        <Extremidad d="M124 120 Q140 110 140 96" color={PIEL} />
        <path d="M128 86 L168 66 L168 112 L128 94 Z" fill="#ff4d4d" stroke={N} strokeWidth={3} strokeLinejoin="round" />
        <rect x={164} y={64} width={8} height={50} rx={3} fill="#fff" stroke={N} strokeWidth={2.5} />
      </g>
      {[0, 1, 2].map((i) => (
        <path
          key={i}
          className="e-onda"
          style={{ animationDelay: `${i * 0.3}s` }}
          d="M186 60 Q204 90 186 120"
          fill="none"
          stroke={N}
          strokeWidth={4}
          strokeLinecap="round"
        />
      ))}
      <g className="e-temblor">
        <g transform="rotate(-10 270 190)">
          <Extremidad d="M258 166 L254 200" color="#2b3a8c" />
          <Extremidad d="M280 166 L284 200" color="#2b3a8c" />
          <Torso x={238} y={106} h={64} color={colorDe(y.id)} />
          <Extremidad d="M244 122 Q226 104 232 88" color={PIEL} />
          <Extremidad d="M296 122 Q314 104 308 88" color={PIEL} />
        </g>
        {[0, 1, 2].map((i) => (
          <line key={i} className="e-viento" style={{ animationDelay: `${i * 0.2}s` }} x1={300} y1={50 + i * 18} x2={340} y2={46 + i * 18} stroke="#7aa" strokeWidth={3} strokeLinecap="round" />
        ))}
        <Cabeza j={y} cx={262} cy={74} r={34} id={`gd${k}`} />
      </g>
      <Bocadillo x={10} y={6} texto="¡¡AL MEDIO!!" ancho={120} />
    </>
  );
}

// Cuchara de madera para el último de la temporada.
function Cuchara({ y }: { y: Jugador }) {
  return (
    <>
      <rect width={360} height={220} fill="#f3e5d0" />
      <Suelo color="#d9bf95" />
      <Extremidad d="M170 166 L166 200" color="#2b3a8c" />
      <Extremidad d="M190 166 L194 200" color="#2b3a8c" />
      <Torso x={149} y={104} color={colorDe(y.id)} />
      <g className="e-cuchara" style={{ transformOrigin: "212px 128px", transformBox: "view-box" }}>
        <rect x={208} y={30} width={12} height={110} rx={5} fill="#b07a3b" stroke={N} strokeWidth={3} />
        <ellipse cx={214} cy={30} rx={24} ry={32} fill="#c98b4f" stroke={N} strokeWidth={3.5} />
        <ellipse cx={214} cy={30} rx={14} ry={20} fill="#b07a3b" />
      </g>
      <Extremidad d="M206 122 Q216 128 214 132" color={PIEL} />
      <Extremidad d="M154 122 Q136 142 146 160" color={PIEL} />
      <Cabeza j={y} cx={180} cy={72} r={40} id={`cu${y.id}`} />
      <text x={70} y={60} textAnchor="middle" fontSize={34}>
        🥄
      </text>
    </>
  );
}

export function Escena({
  tipo,
  x,
  y,
  titulo,
  texto,
  extra,
  frase,
}: {
  tipo: TipoEscena;
  frase?: string;
  x?: Jugador | null;
  y: Jugador;
  titulo: ReactNode;
  texto?: ReactNode;
  extra?: ReactNode;
}) {
  let dibujo: ReactNode;
  switch (tipo) {
    case "biberon":
      dibujo = <Biberon x={x!} y={y} />;
      break;
    case "perrito":
      dibujo = <Perrito x={x!} y={y} />;
      break;
    case "beso":
      dibujo = <Beso x={x!} y={y} />;
      break;
    case "cobrador":
      dibujo = <Cobrador x={x ?? null} y={y} />;
      break;
    case "ambulancia":
      dibujo = <Ambulancia y={y} />;
      break;
    case "fuego":
      dibujo = <Fuego y={y} />;
      break;
    case "trofeo":
      dibujo = <Trofeo x={x!} y={y} />;
      break;
    case "lloron":
      dibujo = <Lloron y={y} frase={frase} />;
      break;
    case "guadalquivir":
      dibujo = <Guadalquivir nadador={y} terraza={x ?? null} />;
      break;
    case "nadar":
      dibujo = <Guadalquivir nadador={y} terraza={null} />;
      break;
    case "ego":
      dibujo = <Ego y={y} />;
      break;
    case "megafono":
      dibujo = <Megafono x={x!} y={y} />;
      break;
    case "cuchara":
      dibujo = <Cuchara y={y} />;
      break;
  }
  return (
    <figure className="escena" style={{ margin: 0 }}>
      <svg viewBox="0 0 360 220" role="img" aria-label={typeof titulo === "string" ? titulo : undefined}>
        {dibujo}
      </svg>
      <figcaption className="pie">
        <strong>{titulo}</strong>
        {texto && <p>{texto}</p>}
        {extra}
      </figcaption>
    </figure>
  );
}
