# Top 3 user journey

## 1. Sample feltöltés és lejátszás

**Persona:** Egy producer gyorsan fel szeretne tölteni egy új royalty-free sample-t, hogy mások is meghallgathassák és letölthessék.

**Belépési pont:** `S01` Auth képernyő.

1. `S01` — A user bejelentkezik vagy regisztrál.  
   Rendszerválasz: sikeres auth után a Library oldal nyílik meg.  
   Hibaág: hibás jelszó vagy hiányzó mezők esetén hibaüzenet jelenik meg.
2. `S02` — A user kitölti az upload formot, kiválaszt egy audio fájlt és rákattint az `Upload sample` gombra.  
   Rendszerválasz: a backend létrehozza a tracket, majd a lista frissül.  
   Hibaág: ha nincs fájl vagy nincs cím, a form validáció megakadályozza a mentést.
3. `S02` — A user a frissen feltöltött sorban a `Play` gombra kattint.  
   Rendszerválasz: a bottom player elindul, a preview sáv animálódik az aktív sorban.  
   Hibaág: ha a backend nem elérhető, a lejátszás nem indul el.
4. `S02` — A user a `Download` gombbal ellenőrzi, hogy a sample letölthető.  
   Rendszerválasz: a sample letöltése elindul.  
   Hibaág: hibás endpoint vagy hálózati hiba esetén a böngésző jelzi a letöltési hibát.

**Sikerkritérium:** A sample megjelenik a library listában, lejátszható és letölthető.

**Mért időtartam:** kb. 30–50 másodperc, 4–6 fő interakció.

## 2. Demo feltöltés és időbélyeges feedback adás

**Persona:** Egy producer work-in-progress demót szeretne megosztani, hogy konkrét, időponthoz kötött visszajelzéseket kapjon.

**Belépési pont:** `S02` vagy `S03`, top navigációval a Demos oldalra.

1. `S04` — A user megnyitja a demo boardot.  
   Rendszerválasz: betöltődik az upload panel, a demo picker és az értékelési/felülvizsgálati oldalsáv.  
   Hibaág: backend hiba esetén üres vagy hibás állapot jelenik meg.
2. `S04` — A user feltölt egy új demót az upload formmal.  
   Rendszerválasz: a demo bekerül a listába és kiválasztható review-ra.  
   Hibaág: hiányzó fájl vagy kötelező mező esetén validációs hiba jelenik meg.
3. `S04` — A user kiválasztja a demót a külön `Choose demo` blokkban.  
   Rendszerválasz: a kiválasztott demo adatai megjelennek és a bottom playerből lejátszható.  
   Hibaág: ha a track nem érhető el, a kiválasztás nem frissül.
4. `S04` — A user lejátszás közben a `Capture player time` gombbal rögzíti az aktuális időt.  
   Rendszerválasz: a timestamp badge frissül `mm:ss` formátumban.  
   Hibaág: ha nincs aktív lejátszás, az időpont nem releváns.
5. `S04` — A user kiválaszt egy kategóriát, beírja a feedbacket és elküldi.  
   Rendszerválasz: az új időbélyeges visszajelzés megjelenik a listában.  
   Hibaág: üres feedback vagy auth hiba esetén a rendszer blokkolja a mentést.

**Sikerkritérium:** A demohoz mentett értékelés és időbélyeges feedback látható a jobb oldali panelen.

**Mért időtartam:** kb. 45–75 másodperc, 6–8 fő interakció.

## 3. Másik felhasználó profiljának megtekintése

**Persona:** Egy felhasználó szeretné megnézni, milyen demókat és sample-öket töltött fel egy másik producer.

**Belépési pont:** `S02`, `S03` vagy `S04` egy kattintható username linken keresztül.

1. `S02` / `S03` / `S04` — A user rákattint egy feltöltő nevére.  
   Rendszerválasz: megnyílik a publikus profilnézet.  
   Hibaág: ha nincs userId, a link nem navigál publikus profilra.
2. `S06` — A user áttekinti a publikus profil fejlécét és a külön `Samples` / `Demos` blokkokat.  
   Rendszerválasz: a rendszer betölti a felhasználó publikus adatait és feltöltéseit.  
   Hibaág: ha a user nem létezik, hibás vagy üres állapot jelenik meg.
3. `S06` — A user egy track `Play` gombjára kattint.  
   Rendszerválasz: a bottom player elindítja a kiválasztott anyagot.  
   Hibaág: hálózati vagy stream hiba esetén nincs lejátszás.
4. `S06` — A user a jobb felső profile iconnal visszalép a saját profiljára.  
   Rendszerválasz: megnyílik `S05`.  
   Hibaág: ha nincs aktív session, auth képernyőre kerülhet.

**Sikerkritérium:** A user meg tudja nézni a másik profil feltöltéseit és le tud játszani legalább egyet.

**Mért időtartam:** kb. 15–30 másodperc, 2–4 fő interakció.
