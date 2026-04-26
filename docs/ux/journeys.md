# Top 3 User Journey

## 1. Sample Feltöltés És Lejátszás

**Persona:** Egy producer gyorsan fel szeretne tölteni egy új royalty-free sample-t, hogy mások is meghallgathassák és letölthessék.

**Belépési pont:** `S01` Auth képernyő.

1. `S01` - A user bejelentkezik vagy regisztrál.
   Rendszerválasz: sikeres auth után a Library oldal nyílik meg.
   Hibaág: hibás jelszó vagy hiányzó mezők esetén hibaüzenet jelenik meg.
2. `S02` - A user megnyitja az upload popupot, kiválaszt egy audio fájlt, kitölti a címet és legfeljebb három műfajt jelöl.
   Rendszerválasz: a backend létrehozza a sample tracket, majd a lista frissül.
   Hibaág: ha nincs fájl vagy nincs cím, a form validáció megakadályozza a mentést.
3. `S02` - A user műfaj, instrumentum, típus vagy keresési javaslat alapján szűri a listát.
   Rendszerválasz: a library táblázat csak a találatokat mutatja.
   Hibaág: üres találat esetén empty state jelenik meg.
4. `S02` - A user a frissen feltöltött sorban a play ikonra kattint.
   Rendszerválasz: a bottom player elindul, és a kiválasztott sample metaadatai megjelennek.
   Hibaág: ha a backend nem elérhető, a lejátszás nem indul el.
5. `S02` - A user a `Download` gombbal ellenőrzi, hogy a sample letölthető.
   Rendszerválasz: a sample letöltése elindul.

**Sikerkritérium:** A sample megjelenik a library listában, szűrhető, lejátszható és letölthető.

**Mért időtartam:** kb. 30-50 másodperc, 4-6 fő interakció.

## 2. Demo Feltöltés, Feedback És Collab

**Persona:** Egy producer work-in-progress demót szeretne megosztani, majd pontszámos, szöveges visszajelzést és potenciális együttműködési megkeresést kapni rá.

**Belépési pont:** `S02` vagy top navigációval a Demos oldal.

1. `S03` - A user megnyitja a Demos oldalt.
   Rendszerválasz: betöltődik a demo lista, a My Style / Top Voted szűrő, az Aura preview és az upvote/downvote vezérlés.
   Hibaág: backend hiba esetén üres vagy hibás állapot jelenik meg.
2. `S03` - A user feltölt egy új demót az upload popupban.
   Rendszerválasz: az Aura preview csak a feltöltési folyamat indításakor kezd elemzési állapotba, majd kb. 1,25 másodperc után színeződik be.
   Hibaág: hiányzó fájl vagy kötelező mező esetén validációs hiba jelenik meg.
3. `S03` - A user lejátszik egy demót a play ikonnal.
   Rendszerválasz: a bottom player frissül, a demó metaadatai és Aura háttérszínei láthatók.
   Hibaág: ha a track nem érhető el, a lejátszás nem indul el.
4. `S03` - A user a `Rate` gombbal megnyitja a feedback popupot.
   Rendszerválasz: a `S04` popup széles nézetben megjeleníti a demó összesített pontszámát, szöveges visszajelzéseit és válaszait.
5. `S04` - A user pontszámot és opcionális szöveges feedbacket ad, vagy meglévő hozzászólásra válaszol.
   Rendszerválasz: a feedback egy közös timeline-ban jelenik meg, a válaszok hierarchikusan beljebb rendezve.
   Hibaág: érvénytelen rating vagy üres válasz esetén a rendszer blokkolja a mentést.
6. `S03` - A user másik felhasználó demóján a `Collab` gombra kattint.
   Rendszerválasz: megnyílik egy rövid collab request popup.
7. `S03` - A user kiválasztja, miben tud segíteni, például vocals, mixing, guitar vagy production, majd üzenetet ír.
   Rendszerválasz: a backend létrehozza a pending collab requestet.
8. `S07` - Ha a user Instagram elérhetőséget ad meg, az csak elfogadás után válik láthatóvá a demo tulajdonosának.
   Hibaág: saját demóra nem küldhető collab request, duplikált pending kérés esetén a rendszer figyelmeztet.

**Sikerkritérium:** A demóhoz mentett pontszámos feedback és válasz látható a feedback popupban, a visszajelző profilja megnyitható, és az együttműködési kérés megjelenik az Inbox panelen.

**Mért időtartam:** kb. 60-90 másodperc, 6-9 fő interakció.

## 3. Másik Felhasználó Profiljának Megtekintése

**Persona:** Egy felhasználó szeretné megnézni, milyen demókat és sample-öket töltött fel egy másik producer.

**Belépési pont:** `S02`, `S03`, `S04` vagy a fejlécben lévő alkotókereső.

1. `S02` / `S03` / `S04` - A user rákattint egy feltöltő vagy kommentelő nevére, vagy rákeres a fejlécben.
   Rendszerválasz: megnyílik a publikus profilnézet.
   Hibaág: ha nincs userId, a link nem navigál publikus profilra.
2. `S06` - A user áttekinti a publikus profil fejlécét és a külön `Samples` / `Demos` blokkokat.
   Rendszerválasz: a rendszer betölti a felhasználó publikus adatait és feltöltéseit.
   Hibaág: ha a user nem létezik, hibás vagy üres állapot jelenik meg.
3. `S06` - A user egy track play gombjára kattint vagy letölt egy sample-t.
   Rendszerválasz: a bottom player elindítja a kiválasztott anyagot, sample esetén a letöltés is elérhető.
   Hibaág: hálózati vagy stream hiba esetén nincs lejátszás.
4. `S06` - A user a saját profile ikonnal visszalép a saját profiljára.
   Rendszerválasz: megnyílik `S05`.

**Sikerkritérium:** A user meg tudja nézni a másik profil feltöltéseit, le tud játszani legalább egyet, és a saját profiljára is vissza tud térni.

**Mért időtartam:** kb. 15-30 másodperc, 2-4 fő interakció.

## Kiegészítő Flow: Collab Request És Inbox

**Persona:** Egy producer meghallgat egy másik felhasználó demóját, és szakmai együttműködést szeretne kezdeményezni.

1. `S03` - A user másik felhasználó demóján a `Collab` gombra kattint.
   Rendszerválasz: megnyílik egy rövid collab request popup.
2. `S03` - A user kiválasztja, miben tud segíteni, majd üzenetet ír.
   Rendszerválasz: a backend létrehozza a pending collab requestet.
3. `S07` - A demo tulajdonosa a fejlécben lévő Inbox panelen látja a bejövő kérést.
   Rendszerválasz: az Inbox badge jelzi az új pending kérések számát.
4. `S07` - A demo tulajdonosa `Accept` vagy `Decline` döntést hoz.
   Rendszerválasz: a kérés státusza frissül, és mindkét fél számára látható marad az Inbox listában.
5. `S07` - Ha Instagram elérhetőséget kértek, az elfogadás után linkként jelenik meg.
   Rendszerválasz: pending állapotban a konkrét Instagram handle nem látható.

**Sikerkritérium:** A collab request elküldhető, nem küldhető saját demóra, az Inboxban megjelenik, a demo tulajdonosa el tudja bírálni, és az Instagram elérhetőség csak elfogadás után válik láthatóvá.
