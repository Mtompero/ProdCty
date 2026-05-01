# Design Rendszer / Vizuális Nyelv

## UI Megoldás

A projekt jelenlegi felülete React + TypeScript + Vite alapon működik. A UI saját komponensekből épül, külső komponenskönyvtár nélkül. A vizuális cél egy audiofókuszú, sötét témájú, Splice-szerű, de egyszerűbben kezelhető producer platform kialakítása.

A React átírás után a képernyők közös alkalmazás-szerkezetet használnak: felső navigáció, globális keresés/profil elérés, collab Inbox, közös alsó audio player, modal alapú feltöltés és modal alapú demo feedback. A CSS rétegben még vannak a korábbi statikus prototípusból átvett kompatibilitási osztályok, de ezek már React komponensek alatt futnak.

Az oldalváltások Framer Motion alapú finom fade + slide animációt használnak. A header és a bottom player stabil marad, csak az aktuális route tartalma animálódik.

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

Az Aura színrendszer műfajhoz kötött, élénk palettákat használ. A demo feltöltéskor az Aura preview először semleges elemzési állapotban jelenik meg, majd a feltöltési folyamat indításakor színeződik be.

## Tipográfia

- Fő fontcsalád: `Inter`, rendszerfont fallbackkel
- Címsorok: erősebb font-weight, tiszta, kompakt ritmus
- Meta adatok: kisebb méretű, visszafogott kontrasztú szövegek
- Jellemző méretek:
  - body: `14px-15px`
  - kisebb meta szöveg: `11px-13px`
  - szekciócímek: `15px-18px`
  - hero headline: `24px-40px`
- Font-weight-ek:
  - normál: `400`
  - medium / semibold: `500-600`
  - strong: `700`

## Spacing / Grid

- Alap spacing ritmus: jellemzően `4px`, `8px`, `10px`, `12px`, `14px`, `16px`
- A feltöltési, feedback, report és collab űrlapok modalban nyílnak, így a fő nézetek kevésbé zsúfoltak
- A Library lista táblázatszerű, sávos megjelenést használ
- A Demos nézet sávos elrendezésben mutatja a demókat, My Style / Top Voted szűrési módokkal
- A Profile nézet saját és publikus feltöltéseket kezel, elkülönített sample/demo blokkokkal
- Mobilon az oszlopos elrendezések egyoszlopos szerkezetre törnek

## Komponensek

- felső navigáció aktív route állapottal, középen tartott Library / Demos / Admin váltóval
- headerbe emelt upload gomb, amely az aktuális oldalon sample vagy demo feltöltést indít
- theme választó több vizuális palettával, a központi navigáció eltolása nélkül
- globális alkotókereső a fejlécben
- collab Inbox badge-dzsel, incoming/outgoing kérésekkel, Accept / Decline döntéssel
- sticky / fixed bottom audio player
- upload modal sample és demo feltöltéshez
- széles feedback popup pontszámos visszajelzéshez és reply kezeléshez
- collab request popup skill chipekkel, üzenettel és opcionális Instagram elérhetőséggel
- library sorok szűrőkkel, keresési javaslatokkal és műfaj/instrumentum/típus metaadatokkal
- demo sorok Aura waveformmal, upvote/downvote vezérléssel, Rate, Collab, Report és Play akciókkal
- profil avatar, saját profil szerkesztés és publikus profilnézet
- kompakt genre választó chipek maximum három műfaj kijelöléséhez
- admin AI review lista mini lejátszóval, AI indokkal, Clear AI flag és Review action művelettel
- admin Review action popup sample törléshez, opcionális warninghoz vagy banhoz

## Privacy És Biztonsági UX

- Vendégként upload gombra kattintva az auth oldal nyílik meg
- A publikus creator kereső nem jelenít meg email címet
- A collab requestben megadott Instagram handle pending állapotban nem látható a demo tulajdonosának
- Az Instagram elérés csak elfogadott collab request után jelenik meg linkként
- Bannolt felhasználó nem tud feltölteni, interakciót küldeni vagy collab requestet kezelni

## Ikonrendszer

- Egyszerű, funkcióhoz kötött ikonok és szimbólumok
- Lejátszás / szünet állapot a player és track vezérlőknél
- Placeholder avatar, ha nincs feltöltött profilkép
- Színes Aura waveform a demók hangulati azonosítására

## Sötét Mód

- Támogatott, alapértelmezett megjelenési mód
- A teljes felület sötét témára optimalizált
- A piros elsődleges akciószín a kritikus műveleteket és fő CTA-kat emeli ki

## Reszponzív Breakpointok

- desktop: `1100px` felett
- tablet / kisebb desktop: `1100px` alatt az oszlopok egyoszlopos layoutba rendeződnek
- mobil: `720px` alatt további egyszerűsítés történik, különösen a bottom player, a modális ablakok és a listák esetén

## Forrás / Design Tokenek

- A React komponensek a [frontend-react/src](../../frontend-react/src) mappában találhatók.
- A vizuális rendszer jelenleg főként a [legacy.css](../../frontend-react/src/styles/legacy.css) és [app.css](../../frontend-react/src/styles/app.css) fájlokban definiált CSS változókon és osztályokon alapul.
