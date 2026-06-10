# 🏠 House Heroes

Gamified huishoudapp voor Manuela, Davy, Destiny, Jayden en Gwenn. Mobielvriendelijke PWA met centrale Supabase-database: iedereen ziet realtime dezelfde scores via één gedeelde URL.

## Functies

- Gebruiker kiezen zonder wachtwoord (knoppen op de homepage)
- Dashboard: weekscore, maandscore, positie, klusjes deze week, gemiddelde per dag, voortgangsbalk naar het weekdoel (7 klusjes), streak
- Klus registreren met één tik (16 standaardklusjes met punten)
- Anti-cheat: elke klus is "pending" tot een ander gezinslid hem goedkeurt; pas dan tellen de punten
- Scorebord: week / maand / all-time, met trend ▲▼ t.o.v. vorige periode
- Weekdoel-status met kleuren: groen (op schema/voor), oranje (bijna achter), rood (achter)
- Meldingen: achterstand, "nog 1 klusje", voorsprong, rivaal vlak boven je, dagen resterend, openstaande goedkeuringen
- Gamification: 5 levels (Beginner → Legende), 7 achievements, huidige + langste streak
- Statistieken: meest gedane klus, totalen, gemiddelde per week, activiteitsgrafiek (14 dagen)
- Huisheld van de Week en van de Maand (winnaar vorige periode)
- Confetti + geluidseffecten (uitschakelbaar), licht/donker thema
- Beheerpagina: punten aanpassen, klusjes verbergen/toevoegen
- Export naar CSV (opent direct in Excel)
- PWA: installeerbaar op telefoon, offline caching van de app-schil
- Weekscores resetten automatisch (alles wordt per periode berekend uit de historie, dus historische statistieken blijven altijd behouden)

## Deployen op Cloudflare Pages (gratis)

### 1. Supabase

1. Maak een gratis project op [supabase.com](https://supabase.com)
2. Open **SQL Editor** → plak de volledige inhoud van `supabase/schema.sql` → **Run**
3. Noteer onder **Project Settings → API** de **Project URL** en **anon public key**

### 2a. Via GitHub (aanrader: elke push deployt automatisch)

1. Push deze map naar een GitHub-repo
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**
3. Instellingen:
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npm run build`
   - Build output directory: `out`
4. Voeg onder **Environment variables** toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. **Save and Deploy** → je krijgt een gratis `*.pages.dev` URL

### 2b. Of zonder GitHub: direct uploaden

1. Vul lokaal `.env.local` in (kopie van `.env.local.example`)
2. `npm install && npm run build`
3. Cloudflare dashboard → **Workers & Pages → Create → Pages → Upload assets** → sleep de map `out/` erin

Let op: bij directe upload worden de Supabase-gegevens tijdens de lokale build in de bestanden gebakken, dus na elke codewijziging opnieuw builden en uploaden.

## Alternatief: Vercel

### 1. Supabase

1. Maak een gratis project op [supabase.com](https://supabase.com)
2. Open **SQL Editor** → plak de volledige inhoud van `supabase/schema.sql` → **Run**
3. Ga naar **Project Settings → API** en noteer de **Project URL** en de **anon public key**

### 2. Lokaal testen (optioneel)

```bash
cp .env.local.example .env.local   # vul URL en anon key in
npm install
npm run dev                        # http://localhost:3000
```

### 3. Vercel

1. Push deze map naar een GitHub-repo
2. Importeer de repo op [vercel.com](https://vercel.com) (framework wordt automatisch herkend als Next.js)
3. Voeg twee environment variables toe:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy → je krijgt een publieke URL voor het hele gezin

### 4. Op de telefoons

Open de URL → "Zet op beginscherm" (iOS) of "App installeren" (Android). De app gedraagt zich dan als een native app.

## Opmerkingen

- **Push-notificaties:** echte web-push vereist een server met VAPID-keys en gebruikerstoestemming. In deze versie zitten in-app meldingen (verschijnen op het dashboard). Web-push is later toe te voegen zonder de datastructuur te wijzigen.
- **Beveiliging:** er is bewust geen login (zoals gevraagd), dus de database-policies staan open voor de anon key. Prima voor een gezinsapp op een onbekende URL; voeg Supabase Auth toe als je het ooit wilt afschermen.
- **Eigen klus goedkeuren kan niet** via de interface: je ziet alleen klusjes van anderen in je goedkeuringslijst.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Supabase (Postgres + Realtime) · canvas-confetti
