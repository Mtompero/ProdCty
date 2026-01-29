# ProdCty – MVP vertikális szelet (Sprint 3) – Architektúra vázlat

## Áttekintés

A Sprint 3 célja a Sprint 2 MVP-szelet kiterjesztése az első valódi közösségi interakciók felé:
- **Feed** (nem csak statikus „Samples”, hanem listázott tartalom logika),
- **Komment / visszajelzés** (minimális szöveges komment),
- **Profil minimum** (alap felhasználói nézet).

A megoldás továbbra is egy egyszerű, tesztelhető vertikális szelet, amely a későbbi skálázás alapját adja.

## Fő komponensek

### UI réteg
- **Feed nézet** (Samples / Feed / Listen tabok mellett a Feed már tényleges listát mutat).
- **Track részletek** (egy track megnyitása, kommentek listázása).
- **Komment írás** (textarea + „Küldés”, success/error visszajelzés).
- **Profil nézet** (minimum: név/handle + feltöltött trackek listája vagy számláló).

### Alkalmazás logika / Client
- Feed betöltése és alap állapotok kezelése:
  - loading,
  - empty (ha nincs mit mutatni),
  - error + retry.
- Komment létrehozás validáció:
  - nem üres szöveg,
  - max hossz (pl. 280–500 karakter).
- API hívások kezelése és egységes hibaüzenetek.

### Backend API (minimális interfész)
- `GET /feed` – visszaadja a feedben megjelenő trackek listáját (mock/in-memory is lehet).
- `GET /tracks/:id/comments` – visszaadja a track kommentjeit.
- `POST /tracks/:id/comments` – létrehoz egy kommentet a trackhez.
- `GET /users/:id` – minimális profiladatok.

(A Sprint 3-ban a cél az interfészek stabilizálása, a belső implementáció lehet egyszerű.)

### Persistencia
- In-memory / file alapú tárolás:
  - `tracks[]`,
  - `commentsByTrackId{ trackId: comments[] }`,
  - `users[]`.
- A fájltárolás és auth továbbra is egyszerűsített (demo user), később váltható DB + auth irányba.

## Kapcsolódás a későbbi sprintekhez

- A `GET /feed` később kiegészíthető:
  - ForYou algoritmus,
  - pagináció,
  - szűrés (műfaj, trending).
- A komment endpointok később bővíthetők:
  - moderáció,
  - emojik / reaction,
  - threadelt válaszok.
- A profil endpoint később bővíthető:
  - követés,
  - bio/links,
  - statisztikák.

## Megjegyzés a scope-ról

A Sprint 3 nem célja teljes közösségi rendszer leszállítása.
A fókusz: **minimális feed + minimális komment**, hogy a “feltöltés → megjelenés → visszajelzés” első end-to-end kör működjön.
