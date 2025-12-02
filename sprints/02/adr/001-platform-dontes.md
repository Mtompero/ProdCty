# ADR-001 – ProdCty platform és architektúra döntés

## Státusz
Elfogadva – Sprint 2

## Kontextus

A ProdCty egy audio-fókuszú, webes alkalmazás, ahol a felhasználók
(mp3/wav) zenéket tölthetnek fel, és egy közösségi felületen keresztül
mutathatják meg őket. A Sprint 2-ben egy minimális, de végigérő
vertikális szeletet kell megvalósítani: első belépési (Samples) nézet,
audiofájl feltöltése, saját trackek listázása, alap hibaállapotok.

A hallgatói környezetben fontos szempont volt:

- könnyen elérhető, ismert technológiák használata,
- egyszerűen hostolható fejlesztői környezet,
- gyors fejlesztési iteráció (hot reload, jó DX).

## Döntés

- **Frontend:** React-alapú single page alkalmazás
  - Vite vagy create-react-app alapú build tooling
  - UI komponensek egyszerű, testreszabott komponensekkel (nincs nehéz UI framework)
- **Backend:** Node.js + Express (REST API)
  - Egyszerű JSON alapú API végpontok:
    - `GET /api/tracks` – saját trackek listázása (mock vagy egyszerű storage)
    - `POST /api/upload` – audiofájl feltöltése (Sprint 2-ben minimális validációval)
- **Adattárolás (Sprint 2):**
  - Fejlesztői környezetben egyszerű fájl-/in-memory storage vagy lightweight adatbázis (pl. SQLite)
  - A valódi, felhőalapú adatbázis (pl. PostgreSQL) a későbbi sprintekben kerül bevezetésre
- **Nyelv:**
  - Frontend + backend: TypeScript-re előkészített struktúra, de Sprint 2-ben a minimalitás miatt JavaScript is elfogadható.
- **Build/CI:**
  - npm/Yarn alapú build folyamat
  - Egyszerű unit/integ tesztek Jest-tel vagy hasonló tesztkeretrendszerrel.

## Indoklás

- React + Node/Express stack a hallgató számára ismerős, jól dokumentált,
  és sok példa érhető el hozzá.
- Egyszerű REST API könnyen illeszthető a későbbi sprintekben bővülő
  funkciókhoz (kommentek, feed, ajánlórendszer).
- Az in-memory vagy fájl alapú tárolás Sprint 2-ben elégséges ahhoz,
  hogy az upload flow működjön, de nem bonyolítja túl az MVP-t.
- A választott stack jól illeszkedik a Terraform-alapú IaC
  megközelítéshez és a tipikus felhő-szolgáltatókhoz (Railway, Render,
  Heroku-szerű környezetek).

## Következmények

- Pozitív:
  - Gyorsan fejleszthető, jól ismert eszköztár.
  - Könnyen bővíthető architektúra későbbi sprintekben (adatbázis,
    autentikáció, feed).
  - A Dev/CI pipeline egyszerűen összeállítható Node/React stackre.
- Negatív:
  - A monolitikus típusú Node/Express backend hosszú távon skálázási
    korlátokat jelenthet, ha a ProdCty valódi nagy terhelést kapna.
  - A Sprint 2-ben használt egyszerű storage megoldás nem „production-grade”,
    ezért később migrációra lesz szükség (pl. PostgreSQL-re).
