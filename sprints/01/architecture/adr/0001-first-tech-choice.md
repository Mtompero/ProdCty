# 0001: Technológiai stack kiválasztása

- Dátum: 2026-03-16
- Státusz: Elfogadva

## Kontextus
Az első leadható verzióhoz működő, böngészőből használható MVP szükséges egy audiofókuszú közösségi platformhoz. A megvalósításnak támogatnia kell a hitelesítést, a track metaadatokat, az audiófeltöltést, a lejátszást, a kommenteket, valamint a későbbi szakdolgozati bővítést is.

## Döntés
- Frontend: natív HTML, CSS és JavaScript egy könnyű MVP-hez
- Backend: Node.js Express keretrendszerrel
- Adatbázis: MongoDB

## Vizsgált alternatívák
- Angular + TypeScript: jól strukturált, de a jelenlegi MVP-scope-hoz túl nehéz
- React + Vite: jó fejlesztői élmény, de a jelenlegi prototípusfázisban feleslegesen növeli a komplexitást
- Django szerveroldali sablonokkal: erős backend eszköztár, de gyengébben illeszkedik a mostani JavaScript-alapú kódbázishoz

## Következmények
- Gyors iterációs sebesség és alacsony induló overhead
- Jól elkülöníthető frontend UI, backend API és MongoDB adatmodell
- A stack könnyen dokumentálható és később is bővíthető, ha összetettebb kliensarchitektúrára lesz szükség
