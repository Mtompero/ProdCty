# Design rendszer / vizuális nyelv

## UI megoldás

A projekt saját, egyedi komponensekből épülő felületet használ HTML, CSS és vanilla JavaScript alapon. Külső UI komponenskönyvtár nincs bevezetve, a vizuális rendszer célja egy audiofókuszú, sötét témájú, splice-szerű webes élmény kialakítása.

## Színpaletta

- `primary`: `#ff2d2d`
- `primary-strong`: `#ff4a4a`
- `secondary`: `#111114`
- `accent`: `#ff9a9a`
- `success`: `#9ff2b7`
- `warning`: `#ffcf70`
- `error`: `#ff8e8e`
- `surface`: `#0a0a0d`
- `surface-soft`: `rgba(17, 17, 20, 0.92)`
- `text`: `#f4f4f6`
- `muted text`: `#a7a7b1`

## Tipográfia

- Fő fontcsalád: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif`
- Címsorok: erősebb font-weight, negatív letter spacing a modern, sűrűbb headline hatásért
- Jellemző méretek:
  - body: `14px–15px`
  - kisebb meta szöveg: `11px–13px`
  - szekciócímek: `15px–18px`
  - hero headline: `24px–40px`
- Font-weight-ek:
  - normál: `400`
  - medium / semibold: `500–600`
  - strong: `700`

## Spacing / grid

- Alap spacing ritmus: jellemzően `4px`, `8px`, `10px`, `12px`, `14px`, `16px`
- Szekciók és panelek: kompakt, de jól olvasható belső padding
- Fő desktop layout: 3 oszlopos szerkezet
  - bal oszlop: kb. `1/5`
  - középső oszlop: kb. `3/5`
  - jobb oszlop: kb. `1/5`
- Max content width: teljes szélességre kifeszített, oldalra húzott rail-ekkel

## Komponensek

- top navigation pill-style aktív állapottal
- sticky / fixed bottom audio player
- surface block panelek finom piros borderrel
- listás library sorok preview oszloppal
- picker elemek feed mód és demo választás céljára
- profil avatar + publikus profilnézet elkülönítve

## Ikonrendszer

- Saját, minimális vizuális elemek
- placeholder avatar SVG
- egyszerű geometrikus formák és színkiemelések
- külső ikonkészlet nincs rendszer-szinten integrálva

## Sötét mód

- Támogatott, alapértelmezett megjelenési mód
- A teljes felület sötét témára optimalizált

## Reszponzív breakpointok

- desktop: `1100px` felett
- tablet / kisebb desktop: `1100px` alatt az oszlopok egy oszlopos layoutba rendeződnek
- mobil: `720px` alatt további egyszerűsítés történik, különösen a bottom player és a listák esetén

## Forrás / design tokenek

- A vizuális rendszer jelenleg közvetlenül a [styles.css](/F:/SZAKDOGA/1-sprint-Mtompero/frontend/styles.css) fájlban definiált CSS változókon és utility osztályokon alapul.
