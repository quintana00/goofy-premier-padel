import "server-only";
import postgres from "postgres";

const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

export const hayBaseDeDatos = Boolean(url);

const local = url ? /@(localhost|127\.0\.0\.1)|host=\/|@\/|%2F/.test(url) : false;

// En Vercel cada función reutiliza la conexión mientras está viva.
const global = globalThis as unknown as { __sql?: postgres.Sql };
export const sql: postgres.Sql =
  global.__sql ??
  (global.__sql = postgres(url ?? "postgres://sin-configurar", {
    max: 5,
    prepare: false, // compatible con el pooler de Supabase/Neon
    ssl: local ? false : "require",
    idle_timeout: 20,
    onnotice: () => {},
  }));

// La base de datos se crea sola la primera vez: no hay que ejecutar ningún SQL a mano.
const ESQUEMA = /* sql */ `
create table if not exists jugadores (
  id serial primary key,
  nombre text not null unique,
  pin text not null,
  avatar text,
  avatar_v int not null default 0,
  creado timestamptz not null default now()
);
alter table jugadores add column if not exists fallos int not null default 0;
alter table jugadores add column if not exists bloqueado_hasta timestamptz;
create table if not exists temporadas (
  id serial primary key,
  nombre text not null,
  inicio date not null
);
create table if not exists torneos (
  id serial primary key,
  nombre text not null,
  fecha date not null,
  creado_por int not null references jugadores(id),
  creado timestamptz not null default now()
);
create table if not exists torneo_resultados (
  id serial primary key,
  torneo_id int not null references torneos(id) on delete cascade,
  j1 int not null references jugadores(id),
  j2 int not null references jugadores(id),
  puesto text not null
);
create table if not exists partidos (
  id serial primary key,
  fecha date not null,
  a1 int not null references jugadores(id),
  a2 int not null references jugadores(id),
  b1 int references jugadores(id),
  b2 int references jugadores(id),
  b_externa text,
  sets jsonb not null,
  estado text not null default 'pendiente',
  creado_por int not null references jugadores(id),
  confirmado_por int references jugadores(id),
  torneo_id int references torneos(id) on delete set null,
  creado timestamptz not null default now()
);
create table if not exists denuncias (
  id serial primary key,
  partido_id int not null unique references partidos(id) on delete cascade,
  denunciante int not null references jugadores(id),
  motivo text not null,
  creada timestamptz not null default now()
);
create table if not exists votos (
  denuncia_id int not null references denuncias(id) on delete cascade,
  jugador_id int not null references jugadores(id),
  amano boolean not null,
  comentario text not null default '',
  primary key (denuncia_id, jugador_id)
);
create table if not exists gastos (
  id serial primary key,
  pagador int not null references jugadores(id),
  concepto text not null,
  importe int not null,
  fecha date not null,
  creado timestamptz not null default now()
);
create table if not exists gasto_partes (
  id serial primary key,
  gasto_id int not null references gastos(id) on delete cascade,
  deudor int not null references jugadores(id),
  importe int not null,
  pagada timestamptz,
  avisada timestamptz
);
alter table partidos add column if not exists formato text not null default 'mejor3';
alter table partidos add column if not exists a_derecha int references jugadores(id);
alter table partidos add column if not exists b_derecha int references jugadores(id);
alter table partidos add column if not exists impuesta_por int references jugadores(id);
-- Antes no se guardaba el formato: los de un solo set eran partidos a 1 set.
update partidos set formato = '1set' where formato = 'mejor3' and jsonb_array_length(sets) = 1;
alter table temporadas add column if not exists fin date;
alter table torneos add column if not exists americano jsonb;
create table if not exists eventos (
  id serial primary key,
  tipo text not null,
  jugador_id int not null references jugadores(id),
  partido_id int references partidos(id) on delete cascade,
  creado timestamptz not null default now()
);
create table if not exists megafonos (
  partido_id int not null references partidos(id) on delete cascade,
  votante int not null references jugadores(id),
  acusado int not null references jugadores(id),
  primary key (partido_id, votante)
);
-- Lo acordado en el grupo: la Temporada 1 oficial cuenta "a partir de esta semana" (lunes 26/10/2026).
update temporadas set inicio = date '2026-10-26' where inicio = date '2000-01-01';
-- Primera temporada: desde el lunes de la semana en que se acordó.
insert into temporadas (nombre, inicio)
  select 'Temporada 1', date '2026-10-26'
  where not exists (select 1 from temporadas);
`;

let listo: Promise<void> | null = null;
export function prepararBase() {
  listo ??= sql
    .unsafe(`select pg_advisory_xact_lock(4242); ${ESQUEMA}`)
    .then(() => undefined)
    .catch((e) => {
      listo = null;
      throw e;
    });
  return listo;
}

export async function db() {
  await prepararBase();
  return sql;
}
