# Frontend E2E tesztelési terv

Ez a dokumentum a React + TypeScript frontend végponttól végpontig tartó ellenőrzési tervét rögzíti. A cél az, hogy a konzulensi review során ne csak az legyen látható, hogy az alkalmazás elindul, hanem az is, hogy a fő felhasználói folyamatok ellenőrizhető forgatókönyvekre vannak bontva.

## Ellenőrzött környezet

- Frontend: `frontend-react/`, React + TypeScript + Vite
- Backend: `backend/`, Node.js + Express
- Adatbázis: MongoDB Atlas vagy lokális MongoDB
- Média: production környezetben Cloudinary, fejlesztés közben lokális vagy teszt feltöltések

## Manuális E2E smoke flow

1. Regisztráció és bejelentkezés új felhasználóval.
2. Sample feltöltés a Library fejlécgombjával.
3. Sample jogtisztasági nyilatkozat elfogadása feltöltés előtt.
4. Library keresés, javaslatlista, műfaj/drum/type szűrés, lejátszás és letöltés.
5. Demo feltöltés a Demos fejlécgombjával.
6. Aura elemzési állapot ellenőrzése: feltöltés előtt nincs végleges Aura, submit után rövid elemzés, majd színes waveform.
7. Demo lejátszás, upvote/downvote, feedback popup megnyitása.
8. 1-5 pontos feedback mentése szöveges megjegyzéssel.
9. Feedbackre vagy kommentre válasz küldése, hierarchikus megjelenítés ellenőrzése.
10. Collab request küldése más felhasználó demójára, opcionális Instagram kontakt megadásával.
11. Inbox panelen collab request elfogadása vagy elutasítása.
12. Admin belépés után open report, AI review, track, comment és user moderációs tabok ellenőrzése.

## Kiemelt regressziós pontok

- A guest felhasználó sample vagy demo feltöltésnél az auth oldalra kerüljön.
- A sample feltöltés csak jogtisztasági elfogadás után történjen meg.
- A demo BPM nem kerülhet automatikus tippelésre, ha a felhasználó nem adja meg.
- A sample AI risk flag csak admin felületen jelenjen meg, külön AI review listában.
- A suspicious sample admin oldalon meghallgatható legyen mini lejátszóval.
- A Review action popupból lehessen csak törölni, törölni + figyelmeztetni, vagy törölni + bannolni.
- Bannolt felhasználó feltöltései automatikusan törlődjenek.
- A komment válaszok hierarchikusan jelenjenek meg, és a törölt saját komment helyén maradjon jelzés.
- A headerben a creator search ne adjon vissza admin felhasználót.
- A theme váltás ne tolja el a Library/Demos középső navigációját.

## Automatizálási javaslat

A következő fejlesztési lépésben Playwright alapú E2E csomaggal érdemes automatizálni a smoke flow legfontosabb részeit:

- `auth.spec.ts`: register, login, banned login hibaüzenet.
- `library.spec.ts`: sample upload, search suggestions, filters, play/pause, download.
- `demos.spec.ts`: demo upload, Aura reveal, vote, feedback popup.
- `collab.spec.ts`: request küldése, inbox accept/decline.
- `admin.spec.ts`: AI review, report action, user moderation.

Az automatizált E2E tesztekhez külön teszt adatbázis és előre seedelt felhasználók szükségesek, hogy a tesztek ismételhetők legyenek, és ne módosítsák az éles bemutató adatokat.

## Jelenlegi beadási státusz

Az április 26-i mérföldkőhöz a frontend ellenőrzése jelenleg build, lint és manuális E2E smoke flow alapján történik. Az automatizált Playwright tesztcsomag dokumentált következő lépésként szerepel, mert a projektben a legnagyobb értéket adó kockázatok jelenleg a backend route tesztekkel és a kézi UI walkthrough-val fedhetők le.
