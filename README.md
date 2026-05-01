# ProdCty

A ProdCty egy audiofókuszú közösségi platform producereknek és zenészeknek. A felhasználók sample-eket és demókat tölthetnek fel, lejátszhatják egymás anyagait, szavazhatnak rájuk, valamint demókhoz értékelést és szöveges visszajelzést adhatnak.

## Fő funkciók

- Regisztráció és bejelentkezés JWT-alapú munkamenettel
- Sample library feltöltéssel, szűréssel, lejátszással és letöltéssel
- Demo board feltöltéssel, aura-megjelenítéssel, lejátszással és feedback popupbal
- Collab request funkció demo interakcióknál, fejlécben elérhető inboxszal és Accept / Decline döntéssel
- Upvote és downvote a sample-ökön és demókon
- AI-assisted sample risk screening: sample feltöltés után a rendszer OpenAI API-val vagy fallback szabályrendszerrel jelzi a licenc/spam szempontból gyanús metaadatokat az admin felületnek
- Saját és publikus profilnézet avatarral, bio-val, érdeklődési körökkel és feltöltésekkel
- Role-alapú admin kezelőfelület moderációs statisztikákkal, sample/demo/komment report elbírálással, külön AI review listával, mini admin lejátszóval, felhasználói figyelmeztetéssel / tiltással, felhasználó-törléssel, track és komment törléssel
- GUI/UX dokumentáció, release checklist és MI-használat dokumentáció a `docs/` mappában

## Tech stack

- Frontend: React + TypeScript + Vite
- UI animáció: Framer Motion alapú finom route transition
- Backend: Node.js, Express
- Adatbázis: MongoDB + Mongoose
- Auth: JWT + `bcryptjs`
- Tesztelés: Jest
- CI: GitHub Actions

## Repo struktúra

- `frontend-react/` - React + TypeScript + Vite frontend
- `backend/` - Express API, modellek, route-ok, middleware-ek és tesztek
- `docs/` - dokumentációs munkapéldányok, UX anyagok, AI fejezet
- `sprints/` - korábbi sprintanyagok és specifikációk
- `reports/` - teszt- és coverage riportok

## Előkövetelmények

- Node.js 20 vagy újabb
- npm
- MongoDB lokálisan, vagy elérhető MongoDB connection string

## Konfiguráció

Másold le a példakonfigurációt:

```powershell
copy .env.example backend\.env
```

Linux/macOS alatt:

```bash
cp .env.example backend/.env
```

Fontosabb változók:

- `PORT` - backend port, alapértelmezetten `3000`
- `MONGO_URI` - MongoDB kapcsolat, például `mongodb://localhost:27017/prodcty`
- `JWT_SECRET` - JWT aláíró titok
- `UPLOAD_DIR` - lokális audio feltöltési könyvtár
- `ADMIN_EMAIL` - demo admin felhasználó email címe, alapértelmezetten `admin@admin.com`
- `ADMIN_PASSWORD` - demo admin jelszó, alapértelmezetten `Admin12345`
- `CORS_ORIGIN` - vesszővel elválasztott engedélyezett frontend domainek production környezetben
- `MEDIA_STORAGE_PROVIDER` - `local` vagy `cloudinary`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` - Cloudinary média storage kulcsok
- `AI_SAMPLE_SCREENING_ENABLED`, `OPENAI_API_KEY`, `OPENAI_SAMPLE_RISK_MODEL` - opcionális AI-alapú sample risk screening; API-kulcs nélkül szabályalapú fallback működik
- `VITE_API_URL` - a React frontend production API URL-je Vercelen, például `https://prodcty-api.onrender.com`

## Quickstart

### Gyors indítás Windows alatt

Ha Windows alatt szeretnéd a legegyszerűbben elindítani a projektet:

1. Ellenőrizd, hogy fut-e a MongoDB.
2. Kattints duplán a projekt gyökerében lévő `start-prodcty.bat` fájlra.
3. Nyisd meg a frontendet:

```text
http://127.0.0.1:4173
```

A script külön ablakban indítja a backendet és a React frontendet, közben visszajelzést ad arról, hogy vár a frontend szerverre. Amikor a frontend elérhető, automatikusan megnyitja a böngészőben. Ha valamelyik oldalon hiányzik a `node_modules`, automatikusan lefuttatja az `npm install` parancsot. Ha még nincs `backend/.env`, a `.env.example` alapján létrehozza.

### Manuális indítás

Backend indítása:

```bash
cd backend
npm install
npm start
```

Sikeres induláskor ezt kell látni:

```text
[db] connected: mongodb://localhost:27017/prodcty
ProdCty running at http://localhost:3000
```

Healthcheck:

```bash
curl http://localhost:3000/health
```

Elvárt válasz:

```json
{"ok":true}
```

Frontend kipróbálása (React + TypeScript + Vite):

```bash
cd frontend-react
npm install
npm run dev -- --host 127.0.0.1 --port 4173
```

Alapértelmezett helyi URL:

```text
http://127.0.0.1:4173
```

Ajánlott kipróbálási sorrend:

1. Nyisd meg az auth nézetet és regisztrálj egy felhasználót.
2. Jelentkezz be.
3. Próbáld ki a Library, Demos, Profile és publikus profile nézeteket.
4. Admin funkciókhoz jelentkezz be a demo adminnal:

```text
email: admin@admin.com
password: Admin12345
```

Admin belépés után a felső navigációban megjelenik az `Admin` menüpont, amely a `/admin` útvonalra visz.

## Tesztek

Backend tesztek:

```bash
cd backend
npm install
npm test
```

Syntax check:

```bash
cd backend
npm run check:syntax
```

React frontend build:

```bash
cd frontend-react
npm install
npm run build
```

React frontend lint:

```bash
cd frontend-react
npm run lint
```

Frontend E2E ellenőrzési terv:

```text
docs/08_testing/frontend_e2e_plan.md
```

Coverage futtatás:

```bash
cd backend
npm run test:coverage
```

## Dokumentáció

A dokumentáció belépési pontja: `docs/00_index.md`

Fontosabb anyagok:

- `docs/ux/` - GUI/UX dokumentáció, screenshotok, pageflow, journey-k
- `docs/thesis/Tompa_Marton_ProdCty_szakdolgozat.docx` - szakdolgozat munkapéldány
- `docs/06_release/final_submission_checklist.md` - beadási ellenőrzőlista
- `docs/06_release/deployment_guide.md` - Render + Vercel + MongoDB Atlas + Cloudinary online deploy útmutató
- `docs/07_ai/mesterseges_intelligencia_hasznalata.md` - MI-használat fejezet munkaverziója
- `docs/08_testing/frontend_e2e_plan.md` - frontend E2E smoke flow és automatizálási terv

## Ajánlott bemutatási sorrend

1. Auth oldal: regisztráció és login
2. Library: sample feltöltés, keresés, szűrés, lejátszás, letöltés
3. Demos: demo feltöltés, aura, saját stílus szerinti és top voted nézet
4. Demo collab: más felhasználó demójánál collab request küldése, majd a fejléc Inbox panelen elfogadás vagy elutasítás
5. Feedback popup: 1-5 pontszámos feedback, válaszok, saját komment törlése és demo/komment reportolás
6. Admin AI review: gyanúsnak jelölt sample-ek áttekintése, mini lejátszós ellenőrzése, AI flag manuális törlése vagy review action indítása
7. Library report: sample licenc / copyright, spam vagy kéretlen tartalom jelzése
8. Profil: saját és publikus feltöltések áttekintése
9. Admin: aktív és lezárt reportok elbírálása, felhasználók figyelmeztetése / tiltása / törlése, feltöltések és kommentek moderációs áttekintése

## Ismert korlátok

- A médiafájlok fejlesztői környezetben lokálisan, production környezetben Cloudinary storage/CDN rétegen tárolhatók
- Éles rendszerhez a Cloudinary környezeti változók és a publikus backend/frontend domainek beállítása szükséges
- A recommendation logika egyszerű pontozásra épül, nem teljes értékű ajánlórendszer
- A frontend React + TypeScript alapú, de a vizuális CSS rétegben még vannak a korábbi statikus prototípusból átvett, fokozatosan tisztítható osztályok
- A demo admin account fejlesztői/bemutatási célra szolgál, éles környezetben erős, egyedi admin jelszó szükséges

## Biztonsági és működési megjegyzések

- A publikus profil és a creator kereső nem ad vissza email címet
- A collab requestben megadott Instagram elérés csak elfogadott kérés után látható
- A play statisztika csak tényleges lejátszásindításkor növekszik
- Az auth végpontok alap rate limitinget és erősebb jelszóminimumot használnak
- Két admin figyelmeztetés után a felhasználó automatikusan tiltott státuszba kerül; figyelmeztetéskor belépés után banner jelzi az okot, tiltáskor a login képernyő kap egyértelmű hibaüzenetet

## Troubleshooting

- `DB connect error`: ellenőrizd, hogy fut-e a MongoDB, vagy jó-e a `MONGO_URI`
- `JWT secret missing`: töltsd ki a `JWT_SECRET` változót a `backend/.env` fájlban
- `npm is not recognized`: telepítsd a Node.js LTS verziót, majd nyiss új terminált
- Feltöltési hiba: ellenőrizd, hogy az audiofájl támogatott formátumú és a mérete belefér a validációs limitbe
