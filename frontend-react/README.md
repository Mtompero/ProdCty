# ProdCty frontend

Ez a mappa tartalmazza a ProdCty aktuális frontendjét. A korábbi statikus HTML/CSS/JavaScript prototípus helyett a felület React + TypeScript + Vite alapon működik.

## Technológia

- React
- TypeScript
- Vite
- Hash alapú kliensoldali routing
- Saját CSS réteg, külső UI komponenskönyvtár nélkül

## Fő nézetek

- Auth: bejelentkezés, regisztráció, érdeklődési körök kiválasztása
- Library: sample böngészés, keresés, szűrés, feltöltés, lejátszás és letöltés
- Demos: demo feltöltés, My Style / Top Voted szűrés, Aura előnézet, upvote/downvote és feedback popup
- Profile: saját profil szerkesztése, avatar feltöltése, saját és publikus feltöltések megtekintése

## Futtatás

```powershell
cd frontend-react
npm install
npm run dev
```

Alapértelmezett fejlesztői cím:

```text
http://127.0.0.1:5173
```

## Build ellenőrzés

```powershell
cd frontend-react
npm run build
```

## Backend kapcsolat

A frontend a lokális Express backend API-t használja. A backend alapértelmezett címe:

```text
http://localhost:3000
```

Backend indítása:

```powershell
cd backend
npm start
```
