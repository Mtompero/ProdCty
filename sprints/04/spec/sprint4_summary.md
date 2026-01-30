# Sprint 4 – Összegzés

A Sprint 4 célja a teljes MVP vertikális szelet megvalósítása és bemutatható állapotba hozása volt, beleértve a backend logikát, az adatbázis kezelést, az autentikációs rendszert és egy egyszerű frontend demót.

## Elkészült elemek

### Backend
- Felhasználói regisztráció és bejelentkezés JWT-alapú hitelesítéssel
- Track kezelés MongoDB adatbázissal
- Kommentelési rendszer megvalósítása
- Feed végpont időrendben rendezett adatokkal
- Middleware alapú jogosultságkezelés

### Tesztelés
- Egységtesztek Jest segítségével
- Coverage riport generálás

### Adatbázis
- MongoDB kollekciók automatikus létrehozása:
  - users
  - tracks
  - comments

### Frontend (demó)
- Regisztrációs és bejelentkezési felület
- Track létrehozás
- Feed megjelenítés felhasználónévvel
- Kommentek kezelése

## Eredmény

A rendszer egy teljesen működő MVP vertikális szeletet valósít meg, amelyben:

- A felhasználók regisztrálhatnak és bejelentkezhetnek
- Bejelentkezett felhasználók trackeket hozhatnak létre
- A trackek megjelennek a feedben
- A felhasználók kommentelhetik a trackeket
- Az adatok perzisztensen tárolódnak MongoDB-ben

## Future scope

- Felhasználói profil oldal bővítése
- Feed lapozás (pagination)
- Felhasználói élmény további javítása
- Audio fájlok feltöltésének támogatása
