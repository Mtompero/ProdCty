# ProdCty – Product Spec v0.2 (Sprint 2)

## Cél

A Sprint 2 célja egy olyan MVP vertikális szelet megvalósítása, amelyben egy zenész
(„Alex, feltörekvő producer” vagy „Péter, gitárjátékos”) egyszerűen
feltölthet egy audiofájlt a ProdCty platformra, majd azonnal vissza is
láthatja azt a saját listájában. Ez a szelet demonstrálja a Sprint 1 PRD-ben
meghatározott fő értékajánlatot: **audio-fókuszú, közösségi tér**, ahol a
felhasználó videó nélkül is meg tudja mutatni a zenéjét, és a rendszer nem
nyomja el az audio-t a vizuális tartalmak mellett.

## Kapcsolódás az 1. sprint PRD-jéhez

Ez a sprint az 1. sprintben definiált scope **„Zene- és audiófájlok feltöltése és
rendszerezése”** és **„Közösségi funkciók: visszajelzés és kommentek”**
részének első, minimális, még kommentek nélküli szelete.  
Nem foglalkozunk MI-alapú ajánlórendszerrel, automatikus „aura” generálással
vagy licencmentes audioanyagok gyűjtésével – ezek a PRD „out of scope”
elemei maradnak.

## Scope (In / Out)

### In (Sprint 2)

- Saját audiofájl feltöltése (mp3/wav) egyszerű űrlappal.
- Saját feltöltött zenék listázása (cím, hossz vagy placeholder, feltöltés dátuma).
- Első belépési (landing) állapot megjelenítése:
  a felhasználó mintatartalmakkal teli **„Samples” kezdőnézetre érkezik**, 
  nem üres listára.
- Alap hibaállapot:
  - API hiba esetén (500 / network).
  - Érvénytelen fájl esetén (méret vagy formátum).
- Minimális backend / API végpont(ok) a fentihez (mock vagy valós).
- Egy alap „For you / Feed” tab vizuális jelzése (még statikus).

### Out (későbbi sprintek)

- Komment rendszer, részletes visszajelzés (szöveges review, rating).
- MI-alapú címkézés és ajánlórendszer.
- Automatikus vizuális „aura” generálás az mp3-hoz.
- Licencmentes audioanyagok letöltési felülete.
- Részletes profiloldal, követés, feed algoritmus.

## User Story térkép (Sprint 2 szelet)

- **US-01 – First-time landing („Samples”) nézet**
  (új felhasználó mintatartalommal teli kezdőnézetet lát)
- **US-02 – Audiofájl feltöltése**
  (producer/zenész első próbálkozása)
- **US-03 – Saját feltöltések listázása**
  (ellenőrizni, hogy sikerült-e a feltöltés)
- **US-04 – Hibaállapot kezelése**
  (érthető hibaüzenet és retry lehetőség)
- **US-05 – Tab-váltás „Samples / Feed / Listen”** (csak UI, statikus)

## NFR-ek (Sprint 2-re)

- **NFR-1 – Teljesítmény**  
  A kezdőlista (saját trackek) első bájtválasza (TTFB) ≤ 1.5 s dev preview
  környezetben 10 egymás utáni mérés átlaga alapján.

- **NFR-2 – Megbízhatóság / Smoke**  
  A főoldal (`/`) és az audio lista végpont smoke-tesztjeinek sikeraránya
  ≥ 95% a CI futások során.

- **NFR-3 – Tesztlefedettség**  
  A sprint végére a kritikus logikára (upload flow + listázás + error handling)
  vonatkozó line coverage ≥ 60%.

- **NFR-4 – Használhatóság**  
  A felhasználók legalább 80%-a (belső tesztelés) képes elsőre feltölteni
  egy zenét és megtalálni azt a listában 1 percen belül.

## Fő Acceptance Criteria (AC-k)

- **AC-F1 – First-time landing („Samples”) állapot**  
  Given a felhasználó először lép be, és még nincs saját feltöltött tartalma  
  When megnyitja a ProdCty főoldalát bejelentkezve  
  Then megjelenik a “Samples – Feed – Listen” tab sor  
  And a “Samples” tab van aktívan jelölve  
  And mintatartalmak jelennek meg (sample képek / ajánlók)  
  And nem jelenik meg üres lista vagy “Nincs tartalom” üzenet

- **AC-F2 – Sikeres feltöltés**  
  Given a felhasználó kiválaszt egy érvényes `.mp3` vagy `.wav` fájlt  
  When a „Feltöltés” gombbal elküldi az űrlapot  
  Then a rendszer 200-as választ ad  
  And a fájl megjelenik a „Saját zenéim” listában  
  And „Sikeres feltöltés” toast/sáv jelenik meg.

- **AC-F3 – Érvénytelen fájl**  
  Given a felhasználó egy nem audiofájlt vagy túl nagy (pl. >10 MB) fájlt választ  
  When megpróbálja feltölteni  
  Then hibaüzenetet lát, amely megmagyarázza a hibát  
  And nem kerül új elem a listába.

- **AC-F4 – API hiba kezelése**  
  Given a feltöltés közben API hiba vagy hálózati hiba történik  
  When a backend 5xx hibával válaszol vagy nem elérhető  
  Then a felhasználó piros hiba-sávot lát  
  And „Próbáld újra” gombot, amellyel újraindíthatja a feltöltést.
