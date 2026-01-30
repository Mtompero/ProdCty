# Sprint 4 – Megvalósítás és vertikális szelet lezárása

## Cél

A Sprint 4 célja az MVP alapfunkcióinak teljes összekapcsolása volt, beleértve a backend logikát, az adatbázist, az autentikációs rendszert és egy egyszerű frontend demót.

Fő célkitűzések:
- MongoDB-alapú adatmodellek megvalósítása
- Feed logika kialakítása
- Kommentelési rendszer implementálása
- JWT-alapú hitelesítés integrálása
- Egyszerű frontend felület készítése a bemutatáshoz

---

## Megvalósított funkciók

### Backend

- Felhasználói regisztráció és bejelentkezés JWT tokennel
- Track modell és kapcsolódó API végpontok
- Comment modell és kapcsolódó API végpontok
- Feed végpont időrendben rendezett adatokkal
- Védett végpontok middleware segítségével

### Adatbázis

- MongoDB kollekciók:
  - users
  - tracks
  - comments
- Kollekciók automatikus létrehozása Mongoose használatával

### Frontend (demó)

- Regisztrációs és bejelentkezési felület
- Track létrehozás
- Feed megjelenítés felhasználónévvel
- Kommentek hozzáadása és megjelenítése

---

## Eredmény

A Sprint 4 végére egy teljesen működő MVP vertikális szelet készült el:

- A felhasználók tudnak regisztrálni és bejelentkezni
- Bejelentkezett felhasználók trackeket hozhatnak létre
- A trackek megjelennek a feedben
- A felhasználók kommentelhetik a trackeket
- Az adatok perzisztensen tárolódnak MongoDB-ben

---

## Megjegyzések

A sprint során a fejlesztési fókusz a teljes vertikális szelet működőképességére helyeződött, ezért a kezdeti tervhez képest bizonyos funkciók sorrendje és megvalósítása módosult.  
Ez az agilis fejlesztési szemléletnek megfelelő alkalmazkodást tükrözi.

---

## További lehetséges fejlesztések

- Felhasználói profil oldal bővítése
- Feed lapozás (pagination)
- Felhasználói élmény további javítása
- Audio fájlok feltöltésének támogatása (jövőbeni bővítés)
