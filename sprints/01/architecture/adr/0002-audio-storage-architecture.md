# 0002: Audiótárolási architektúra

- Dátum: 2026-03-16
- Státusz: Elfogadva

## Kontextus
A platform központi eleme a feltöltött audió track. Ezek a fájlok jelentősen nagyobbak, mint a szokásos metaadat-rekordok, ezért az architektúrának skálázhatónak, deployolhatónak és a szakdolgozati dokumentációban is jól indokolhatónak kell lennie.

## Döntés
- Az audiófájlok éles környezetben objektumtárolóban lesznek tárolva
- A MongoDB csak a feltöltött track metaadatait tárolja
- A backend API végzi a validációt, jogosultságkezelést, feltöltésvezérlést és a lejátszási URL-ek kiadását
- Lokális fejlesztés során az audiófájlok átmenetileg a szerver fájlrendszerében is tárolhatók

## Indoklás
- A bináris médiafájlok hosszú távon nem ideálisak hagyományos dokumentumalapú adatbázis-tárolásra
- Az objektumtároló olcsóbban és egyszerűbben skálázható, valamint jobban illeszkedik a médiakiszolgáláshoz
- A fájltárolás és a metaadattárolás szétválasztása tisztább és jobban karbantartható adatmodellt eredményez
- Ez a megközelítés iparági szinten is bevett minta, ezért a szakdolgozatban is könnyen indokolható

## Vizsgált alternatívák
- Az audió közvetlen tárolása MongoDB-ben: elsőre egyszerűbbnek tűnik, de nagyobb médiafájloknál kevésbé hatékony
- Az audió kizárólag az alkalmazásszerver fájlrendszerében való tárolása: lokális MVP-hez működhet, de deploy és skálázás szempontjából gyenge
- Külső médiahoszting használata backend kontroll nélkül: gyorsabb kezdeti megoldás, de kisebb architekturális kontrollt ad

## Következmények
- Az éles rendszerhez adatbázis- és objektumtároló-konfigurációra is szükség lesz
- A backend lesz a vezérlőréteg a felhasználói feltöltések és a tárolt médiaelemek között
- A dokumentációban jól elkülöníthető lesz a fejlesztési és az éles tárolási stratégia
