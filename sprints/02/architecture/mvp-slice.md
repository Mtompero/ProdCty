# ProdCty – MVP vertikális szelet (Sprint 2) – Architektúra vázlat

## Áttekintés

A Sprint 2-ben megvalósított vertikális szelet a következő fő komponenseket érinti:

- **UI réteg** – webes felület:
  - Üres állapot nézet („Még nincs feltöltött zenéd”).
  - Feltöltő űrlap (fájlválasztó + műfaj + opcionális cím).
  - „Saját zenéim” lista.

- **Alkalmazás logika / Client**:
  - Form validáció (fájltípus / méret).
  - HTTP hívások az API felé (`POST /tracks`, `GET /tracks`).
  - Hiba- és üres állapotok kezelése.

- **Backend API** (minimális):
  - `GET /tracks` – visszaadja az adott felhasználó trackjeinek listáját.
  - `POST /tracks` – elfogad egy audiofájlt és metaadatokat, majd eltárolja.
  - (A Sprint 2-ben akár mock is lehet, de az interfész stabil.)

- **Persistencia réteg**:
  - Kis számú tesztadat (akár in-memory / file alapú tárolás).
  - Audiofájl tárolás: lokális diszk vagy stub, későbbi S3/Blob helyett.

## Kapcsolódás a későbbi sprintekhez

- A `GET /tracks` és `POST /tracks` API a kommentek, rating és
  ForYou/Mindenes feed alapját adja.
- A felhasználó-azonosítás most minimális (akár fix „demo user”), de a
  végleges rendszerben autentikációhoz kapcsolódik.
