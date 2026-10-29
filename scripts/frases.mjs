// Busca las frases más celebradas de una exportación del chat de WhatsApp (_chat.txt).
// Una frase puntúa por cada respuesta con risas («jajaja», 🤣, «qué buena»…) de otra persona en los 3 minutos siguientes.
// Uso: node scripts/frases.mjs ruta/_chat.txt [desde DD/MM/AA] > candidatas.tsv
// Las candidatas se revisan a mano antes de pasarlas a src/lib/personajes.ts.
import { readFileSync } from "node:fs";

const [ruta, desde] = process.argv.slice(2);
if (!ruta) {
  console.error("Uso: node scripts/frases.mjs _chat.txt [desde DD/MM/AA]");
  process.exit(1);
}

const fecha = (d) => {
  const [dia, mes, ano] = d.split("/").map(Number);
  return new Date(2000 + ano, mes - 1, dia);
};
const texto = readFileSync(ruta, "utf8").replace(/‎| /g, " ");
const linea = /^\[(\d+\/\d+\/\d+), (\d+):(\d+):(\d+)\] ([^:]+): (.*)$/gm;
const mensajes = [];
for (const m of texto.matchAll(linea)) {
  const t = fecha(m[1]);
  t.setHours(+m[2], +m[3], +m[4]);
  mensajes.push({ t, dia: m[1], quien: m[5].trim(), x: m[6].trim() });
}
const inicio = desde ? fecha(desde) : new Date(0);
const risa = /(ja){2,}|(ha){2,}|jsjs|🤣|😂|💀|q(ue)? buena|buen[ií]sim|leyenda|me meo|crack/i;
const ruido = /omitid|http|@|\d{6,}|eliminad|editó|llamada|videollamada/i;

const salida = [];
mensajes.forEach((m, i) => {
  if (m.t < inicio || m.x.length < 12 || m.x.length > 110 || ruido.test(m.x)) return;
  if (risa.test(m.x) && m.x.replace(risa, "").trim().length < 8) return; // solo risas
  const rien = new Set();
  let n = 0;
  for (const r of mensajes.slice(i + 1, i + 14)) {
    if (r.t - m.t > 180_000) break;
    if (r.quien !== m.quien && risa.test(r.x)) {
      rien.add(r.quien);
      n++;
    }
  }
  const puntos = rien.size * 2 + n;
  if (puntos >= 5) salida.push([puntos, m.dia, m.quien, m.x]);
});
salida.sort((a, b) => b[0] - a[0]);
console.log("puntos\tdía\tquién\tfrase");
for (const f of salida.slice(0, 300)) console.log(f.join("\t"));
