// Uso: DATABASE_URL=... node scripts/reset-pin.mjs "Nombre" 1234
import { randomBytes, scryptSync } from "node:crypto";
import postgres from "postgres";

const [nombre, pin] = process.argv.slice(2);
if (!nombre || !/^\d{4}$/.test(pin ?? "")) {
  console.error('Uso: node scripts/reset-pin.mjs "Nombre" 1234');
  process.exit(1);
}
const sql = postgres(process.env.DATABASE_URL ?? process.env.POSTGRES_URL, { prepare: false });
const sal = randomBytes(16).toString("hex");
const filas = await sql`update jugadores set pin = ${`${sal}:${scryptSync(pin, sal, 32).toString("hex")}`}
                        where lower(nombre) = lower(${nombre}) returning id`;
console.log(filas.length ? `PIN de ${nombre} cambiado` : `No existe ningún jugador llamado ${nombre}`);
await sql.end();
