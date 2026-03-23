# Project Plan - ProdCty

## Egy mondatos értékajánlat

A ProdCty egy Splice-szerű, audiofókuszú közösségi platform producereknek és zenészeknek, ahol a royalty-free hanganyagok külön könyvtárban böngészhetők, míg a felhasználói demók egy elkülönített közösségi térben jelennek meg visszajelzés és értékelés céljából, letöltés és újrafelhasználás nélkül.

## Képességek

| Képesség | Kategória | Komplexitás | Miért nem triviális? |
|---|---|---|---|
| Splice-szerű audio library UI royalty-free hanganyagokhoz | Value | M | Olyan felület kell, amely egyszerre böngészhető, gyorsan átlátható és audiofókuszú, miközben külön kezeli a sample és demo tartalmakat |
| Royalty-free sample könyvtár böngészése, lejátszása és letöltése | Value | M | Külön médiafolyam, metaadat-kezelés, lejátszás és letöltési logika szükséges |
| Elkülönített demo board feltöltéssel, ahol a demók nem tölthetők le és nem használhatók fel | Value | L | Jogosultsági és UX szinten is szét kell választani a letölthető sample tartalmat a csak visszajelzésre szolgáló demóktól |
| Demo értékelés és szöveges feedback rendszer | Value | M | Trackhez kötött értékelés, aggregált pontszám, visszajelzések és későbbi módosíthatóság kezelése szükséges |
| Audio-only "For You" feed, TikTok-szerű felfedezési élménnyel vizuális fókusz nélkül | Value | L | Sorrendezés, gyors váltás, folyamatos lejátszás és relevanciaalapú ajánlás kell egy vizuálisan minimalista felületen |
| Felhasználókeresés és profilnézet, ahol a feltöltő demói külön láthatók | Value | M | Keresési logika, profiloldal, saját tartalmak listázása és demo/sample típus szerinti szétválasztás szükséges |
| Regisztráció, bejelentkezés és jogosultságkezelés | Productization | M | Biztonságos auth-flow, route-védelem, tokenkezelés és műveletszintű hozzáférés-szabályozás kell |
| Tartalomtípusonként eltérő szabályrendszer | Productization | M | Más szabály vonatkozik a royalty-free hangokra és a demókra, ezért backend és frontend oldalon is következetesen kell érvényesíteni a korlátozásokat |
| Hibakezelés és felhasználóbarát státuszüzenetek a teljes appban | Productization | M | Hálózati hibák, sikertelen feltöltés, auth-problémák és jogosultsági hibák egységes kezelése szükséges |
| Éles környezetre alkalmas média- és metaadattárolási architektúra | Productization | L | Adatbázis és objektumtároló szétválasztása, deploy-kompatibilis fájlkezelés és skálázható média-kiszolgálás szükséges |

## A legnehezebb rész

A legnehezebb rész várhatóan az lesz, hogy a platformon belül világosan és technikailag is biztonságosan elkülönüljön a két fő tartalomtípus: a royalty-free sample könyvtár és a csak feedbackre szolgáló demo tér. Ez azért nem fog elsőre tökéletesen működni, mert nem elég UI-szinten külön oldalakra rakni őket, hanem a keresésben, a profilnézetben, a hozzáférési szabályokban, a letöltési logikában és a jövőbeli ajánlórendszerben is következetesen külön kell kezelni őket.

## Tech stack - indoklással

| Réteg | Technológia | Miért ezt és nem mást? |
|---|---|---|
| UI | HTML, CSS, JavaScript | Gyors prototípuskészítés, teljes kontroll a splice-szerű felület és az audio-only élmény felett |
| Backend / logika | Node.js + Express | Jól illeszkedik az audiofeltöltéshez, REST API-khoz, keresési végpontokhoz és jogosultságkezeléshez |
| Adattárolás | MongoDB | Rugalmas dokumentumalapú modell, jól kezelhető benne a felhasználó, track, rating, komment és profil metaadat |
| Auth | JWT alapú tokenes hitelesítés | Egyszerűen használható frontend API-hívásokkal, route-védelemmel és felhasználói műveletkorlátozásokkal |

## Ami kimarad (non-goals)

- Böngészőben futó professzionális zeneszerkesztő vagy DAW-funkciók
- Videós vagy vizuális tartalomra épülő social feed

## Ami még nem tiszta

- A "For You" feed az első verzióban szabályalapú vagy részben ajánlási logikára épülő legyen-e
- A felhasználókeresés csak névre és profilra terjedjen-e ki, vagy címke/műfaj alapú felfedezés is tartozzon hozzá
