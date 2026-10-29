# 🎾 Goofy Premier Padel

El ranking oficial (y despiadado) de **La Tropa Goofy**: ranking ELO, piques con escenas animadas,
medallas de broma, tribunal de amaños y la lista negra de morosos.

Es una web que se instala como app en el móvil (iPhone: Safari → Compartir → «Añadir a pantalla de inicio").

## Qué hace

- **Ranking ELO** por temporadas y histórico. Todos empiezan con 1000; ganar a los buenos da más puntos y las palizas cuentan algo más.
- **Resultados con sets** y **confirmación del rival**: un partido no cuenta hasta que alguien de la otra pareja lo confirma.
- **Torneos**: cada pareja apunta cómo quedó y sus partidos, también contra parejas de fuera.
- **Piques** con escenas animadas usando la cara de cada uno:
  - 🍼 *X tiene de hijo a Y* (le gana el 70 % o más, mínimo 3 duelos)
  - 🐕 *X tiene de perrito a Y* (4 o más duelos y nunca ha perdido)
  - 💋 *Almas gemelas* (duelos igualados y casi el mismo ELO)
  - 🚑 rachas de derrotas, 🔥 rachas de victorias, 🏆 pareja más efectiva
- **Tribunal de amaños**: cualquiera denuncia un partido; votan los que no jugaron. Con 3 votos decide la mayoría.
  Si es amaño, el partido se anula. Si es limpio, el denunciante se lleva la medalla de Llorón.
- **Medallas**: Rey de la Pista, Cuchara de Madera, Ambulancia, Pecho Frío, Panadero (6-0), Come Roscos, Remontador, Fantasma, Moroso del Mes, El Banco…
- **Deudas**: se apunta quién pagó la pista o las pelotas y se reparte. Solo el que pagó puede tachar la deuda.
  Ranking de morosos y el cobrador del frac persiguiendo al primero.
- **Resumen semanal** en imagen, listo para compartir en WhatsApp.
- **Fotos**: basta una foto de la cara. Se recorta en el móvil y se le aplica un filtro cómic; luego se pega sobre los muñecos.

## Novedades del pique Fran vs Borja

- **Partidos en acta**: confirmado = sellado. No se borra; intentarlo con uno perdido queda en el historial y da la medalla de Llorón.
- **Formatos**: 1 set, mejor de 3 o inacabado (suma juegos y sets, pero ni victoria ni derrota). Todo explicado en `/reglas`.
- **Derecha / revés**: cada partido guarda quién iba a la derecha y el perfil saca los números por lado.
- **Temporadas** con fecha de fin, archivo en `/temporadas` y ceremonia con podio, confeti y cuchara de madera.
- **Cara a cara** (`/vs`): entrada con choque, termómetro de pique, racha y cómo les va juntos.
- **Medallas nuevas**: Megáfono (votado por los del partido), Ego por las nubes, Modo Strava, Siempre me la imponéis y
  Reconciliación Guadalquivir. Salen con animación la primera vez.
- **Torneo cruzado (americano)**: cruces automáticos y ranking individual.

## Personajes y escenas

La personalidad de cada uno (apodos, frase, accesorio en las escenas: IQOS, gafas de natación, boli de notario…) está en
`src/lib/personajes.ts`, sacada del grupo de WhatsApp. Las escenas son SVG con animaciones CSS en
`src/components/Escena.tsx`: cada cabezón lleva su accesorio automáticamente en todas las escenas.

## Publicarla (gratis, unos 10 minutos)

1. Entra en [vercel.com](https://vercel.com) con tu cuenta de GitHub → **Add New… → Project** → importa este repositorio.
2. Antes de darle a Deploy, en **Environment Variables** añade:
   - `GROUP_CODE` → el código que pasarás por WhatsApp (por ejemplo `goofy2026`).
3. Deploy. Luego, en el proyecto: **Storage → Create Database → Neon (Postgres)** → conéctala al proyecto.
   Eso crea `DATABASE_URL` sola. Vuelve a **Deployments** y haz **Redeploy**.
   - ¿Prefieres Supabase? Pon en `DATABASE_URL` la cadena de conexión del *Transaction pooler*.
4. Las tablas se crean solas la primera vez que alguien entra. No hay que ejecutar nada a mano.
5. Manda al grupo el enlace (`https://tu-proyecto.vercel.app`) y el código.

Variables opcionales: `SESSION_SECRET` (si no se pone, se deriva de la base de datos y el código).
Cambiar `GROUP_CODE` echa a todo el mundo y tendrán que volver a entrar con el código nuevo.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # pon DATABASE_URL y GROUP_CODE
npm run dev
npm test                     # pruebas del motor (ELO, piques, medallas, deudas)
```

Toda la lógica de cálculo está en `src/lib/motor.ts` (pura, sin base de datos). Las escenas son SVG animado con CSS en
`src/components/Escena.tsx`, y el filtro cómic de las fotos en `src/components/FotoCabezon.tsx`.

¿Alguien olvidó su PIN? Con la `DATABASE_URL` de Vercel:

```bash
DATABASE_URL="postgres://…" node scripts/reset-pin.mjs "Fran" 1234
```
