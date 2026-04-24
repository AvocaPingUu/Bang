# Bang! Desktop Game

Electron + React desktop app (→ .exe/.dmg) + Node.js/Socket.io server (Railway.app).
Wild West card game, 4-7 players, online multiplayer.

## Stack
- client/ → Electron + React + Framer Motion + TypeScript
- server/ → Node.js + Express + Socket.io + TypeScript
- shared/ → Types + Constants (beide nutzen das)

## Rules — ALWAYS
- Spiellogik NUR auf Server. Client sendet nur Aktionen.
- TypeScript überall. Keine plain JS files.
- Kommentare auf Deutsch.
- Karten als SVG. Nie Rasterbilder für Karten.
- Animationen sind Kern-Feature — nie weglassen.
- Fragen bevor du anfängst wenn unklar.
- Keine sycophantischen Opener ("Natürlich! Gerne...") — direkt antworten.
- Keine langen Erklärungen wenn Code selbsterklärend ist.
- Prefer editing over rewriting whole files.
- Read files before writing code.
- No sycophantic openers or closing fluff.
- Test before declaring done.

## Colors (Wild West)
`#2C1810` `#8B4513` `#D4A853` `#F5E6D3` `#1A0A00`

## Run
```bash
cd server && npm run dev
cd client && npm run dev
cd client && npm run electron
```

## Deploy
```bash
cd server && railway up
cd client && npm run build:win   # oder build:mac
```

## Compaction
When compacting: preserve list of modified files, current game state implemented, and next steps.

## Next Steps
- [x] Monorepo Struktur aufsetzen
- [x] Server: Socket.io Raum-System
- [x] Server: Kern-Spiellogik
- [ ] **Client: Spieltisch UI** ← next
- [ ] Client: SVG Kartendesigns
- [ ] Bot-KI
- [ ] Electron Build
- [ ] Railway Deploy

## Detail-Skills (laden nur bei Bedarf)
- /bang-rules → Vollständige Spielregeln, Karten, Charaktere
- /bang-architecture → Dateistruktur, Socket Events, State Schema

> **Output rules:** Short sentences. No filler. No intro. No summary. Code always complete.