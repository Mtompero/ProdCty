a# ADR 0005 – Kommentek tárolása és modellje (Sprint 3)

## Státusz
Elfogadva

## Kontextus
Sprint 3-ban minimális komment funkció kell:
- kommentek listázása track alatt,
- új komment létrehozása,
- basic validáció + error handling.

A tárolásnak gyorsan implementálhatónak és könnyen tesztelhetőnek kell lennie.

## Döntés
Sprint 3-ban a kommenteket **in-memory struktúrában** tároljuk:

- `commentsByTrackId: { [trackId: string]: Comment[] }`
- `Comment` mezők:
  - `id` (incrementális vagy uuid-szerű),
  - `trackId`,
  - `authorId` (demo user vagy fix user),
  - `text`,
  - `createdAt`.

Az API:
- `GET /tracks/:id/comments`
- `POST /tracks/:id/comments`

## Indoklás
- A cél az első működő “feltöltés → feed → komment” kör demonstrálása.
- In-memory tárolás gyors, nem igényel DB migrációt.
- Unit tesztekben könnyen kontrollálható (determinált állapotok).

## Következmények
- Kommentek nem perzisztensek újraindítás után.
- Sprint 4+ során DB-re váltható (pl. PostgreSQL), minimális változással a service rétegben.
