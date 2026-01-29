# ProdCty – Product Spec v0.3 (Sprint 3)

## Cél

A Sprint 3 célja a ProdCty MVP továbbfejlesztése egy működő közösségi maggal:
a felhasználók képesek legyenek megtekinteni egy központi feedet, kommentelni
zenéket, valamint egy alap profilnézeten keresztül áttekinteni saját tartalmaikat.

## Kapcsolódás az előző sprintekhez

A Sprint 3 a Sprint 2-ben megvalósított audiofeltöltés és listázás funkcióra épít.
A mostani sprint a közösségi interakciók első lépcsőjét valósítja meg.

## Scope (In / Out)

### In

- Központi feed a feltöltött zenékből
- Kommentek írása és megjelenítése trackekhez
- Alap profilnézet (feltöltött zenék listája)
- Alap hibaállapotok kezelése

### Out

- Követési rendszer
- Ajánlórendszer
- Moderáció
- Értesítések

## User Story térkép (Sprint 3)

- Feed megtekintése
- Komment írása
- Komment lista megjelenítése
- Profil megtekintése
- Hibaállapot kezelése

## NFR-ek

- A feed betöltési ideje ≤ 2 s
- Automatizált tesztek lefedik a kritikus flow-kat
- Coverage ≥ 60%
- Alap UI használhatóság tesztelt

## Fő AC-k

- A feed sikeresen megjeleníti a trackeket
- A kommentek mentődnek és megjelennek
- A profiloldal listázza a felhasználó tartalmait
- Hiba esetén érthető üzenet jelenik meg
