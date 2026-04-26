# Mesterséges intelligencia használata a fejlesztés során

Ez a fejezet munkaverzió, amely a szakdolgozat végleges PDF-jéhez készült. A célja annak bemutatása, hogy a ProdCty fejlesztése során a mesterséges intelligencia nem önálló szerzőként, hanem fejlesztői segédeszközként jelent meg: ötleteket adott, alternatívákat sorolt fel, kódrészleteket és dokumentációs vázlatokat javasolt, de a végső döntések, a scope meghatározása és a validálás fejlesztői felelősség maradt.

## Használt eszközök és szerepük

A projekt során többféle MI-asszisztált munkamódot használtam. A legfontosabb szerep a ChatGPT/Codex jellegű párbeszédes és kódbázist olvasó asszisztensnek jutott, amelyet elsősorban tervezési, dokumentációs, review és repo-rendezési feladatokra használtam. Az ilyen eszközök előnye az volt, hogy nagyobb összefüggésben tudták kezelni a projektet: egyszerre lehetett rajtuk keresztül áttekinteni a README-t, a sprint dokumentumokat, az ADR-eket, a backend route-okat és a frontend oldalakat.

Az MI-t nem egyetlen fázisban használtam, hanem a fejlesztés különböző pontjain más-más célra. A korai szakaszban a termékötlet pontosításában, a scope csökkentésében és a versenytársi kontextus megfogalmazásában segített. Később az architekturális döntésekhez adott alternatívákat, például a backend, adatbázis, autentikáció és media storage lehetséges megközelítéseihez. A megvalósítási szakaszban kódreview, hibakeresés, tesztötletek és dokumentációs struktúra készítésében volt hasznos. A végső szakaszban a README, a GUI/UX dokumentáció, az AI-használat dokumentálása és a beadandó ellenőrzőlisták összeállítása során támogatta a munkát.

## Konkrétabb felhasználási területek

Kódgenerálásra és kódkiegészítésre az MI-t főleg kisebb, jól körülhatárolt részeknél használtam. Ilyen példa volt egyes backend validációs logikák, route-szintű hibakezelési minták, illetve frontend állapotkezelési és üzenetmegjelenítési részletek átgondolása. A komplexebb részeknél nem az volt a cél, hogy az MI egyben "megírja a rendszert", hanem hogy kisebb részfeladatokra bontva javaslatokat adjon, amelyeket utána átnéztem és a projekt stílusához igazítottam.

A frontend modernizálásánál az MI különösen a React + TypeScript + Vite átállás megtervezésében és végrehajtásában segített. A korábbi statikus prototípus funkcióit komponensekre kellett bontani, a backend API-kat típusos kliensoldali hívásokkal kellett összekötni, és a nézetek közötti logikai átfedéseket csökkenteni kellett. Ilyen döntés volt például, hogy a külön közösségi feedback oldal helyett a demo visszajelzés a Demos oldalon, széles feedback popupban jelenjen meg. Az MI itt nem önállóan döntött a terméklogikáról, hanem alternatívákat adott, amelyeket a használhatóság, a scope és a konzulensi visszajelzés alapján szűrtem.

Kiemelt szerepe volt a kódreview-nak. Az MI-t gyakran úgy használtam, mint egy második olvasót: nézze meg, hol lehet hiányos az input validáció, hol nem egyértelmű a hibaüzenet, van-e autentikációs vagy jogosultsági kockázat, illetve melyik rész nincs összhangban a dokumentált scope-pal. Ez különösen fontos volt azért, mert a ProdCty több különböző tartalomtípust kezel: sample, demo, komment, rating és profiladat. Ezeknél könnyű lett volna összekeverni, hogy melyik tartalom letölthető, melyik csak visszajelzésre szól, és melyik művelet igényel bejelentkezett felhasználót.

Dokumentáció írására szintén használtam MI-t. Ide tartozott a sprint dokumentumok szerkezeti ellenőrzése, a README futtatási lépések tisztázása, a GUI/UX dokumentáció tagolása, valamint a szakdolgozat fejezeteinek előkészítése. Fontos, hogy az MI által javasolt szövegek nem kerültek automatikusan elfogadásra: a projekt konkrét állapotához, a repóban létező fájlokhoz és a ténylegesen megvalósított funkciókhoz kellett őket igazítani. Ez azért lényeges, mert az MI könnyen tud túl általános vagy a valós kódállapottal nem teljesen egyező dokumentációt javasolni.

Tesztek és minőségbiztosítás területén az MI főleg tesztesetek ötletelésében és hiányzó edge case-ek keresésében segített. Ahelyett, hogy csak a sikeres feltöltés vagy sikeres bejelentkezés happy path-ját néztem volna, az MI segítségével külön figyelmet kaptak a hibás inputok, a hiányzó tokenek, az érvénytelen audiofájlok, az üres kommentek és a nem létező erőforrásokra adott API válaszok. A tesztek tényleges értékét viszont mindig futtatással és a teszt logikájának átnézésével lehetett megítélni, nem önmagában azzal, hogy az MI generált valamilyen tesztkódot.

A React átállás után a validálás része lett a TypeScript build futtatása is. Ez azért fontos, mert a frontend már nem csak böngészőben megnyitott statikus fájlokból áll, hanem buildelhető alkalmazásból, ahol a komponensek, típusok és API-kapcsolatok hibái a fordítás során is előjöhetnek.

## Validálás és ellenőrzés

A fejlesztés során az MI kimenetét hipotézisként kezeltem. Ez azt jelenti, hogy egy javaslat akkor vált a projekt részévé, ha illeszkedett a megadott scope-hoz, érthető volt, és valamilyen módon ellenőrizhető maradt. Kód esetében ez futtatást, tesztet vagy legalább kézi átnézést jelentett. Dokumentáció esetében azt ellenőriztem, hogy a leírt állítások visszaköthetők-e konkrét fájlokhoz, route-okhoz, screenshotokhoz vagy sprint artefaktumokhoz.

Volt olyan helyzet, amikor az MI túl nagy scope-ot vagy túl ambiciózus technológiai irányt javasolt. A ProdCty eredeti ötletében szerepelt több nagy komplexitású elem, például teljes TikTok-szerű audio feed, fejlett ajánlórendszer, professzionális média infrastruktúra és MI-alapú audio feldolgozás. Ezek önmagukban érdekes irányok, de egy szakdolgozati MVP-ben nem kezelhetők egyszerre termékminőségben. Emiatt a scope-ot tudatosan szűkíteni kellett: az első teljesebb szelet a feltöltésre, listázásra, feedre, kommentre, ratingre, profilra és alap autentikációra koncentrált.

Egy másik tanulságos példa a dokumentáció validálása volt. Az MI képes jól hangzó, de pontatlan állításokat generálni, például olyan deploy vagy media storage állapotot sugallni, amely a repóban még csak terv vagy munkapéldány. Ezért a végleges dokumentációban külön kellett választani a "megvalósított", a "részben kész" és a "jövőbeli fejlesztés" státuszokat. Ez különösen fontos a szakdolgozati értékelésnél, mert a termékminőség nem csak az ötletekről, hanem a bizonyítékokról is szól.

## Hol nem használtam MI-t

Nem az MI döntötte el a projekt témáját, célcsoportját és fő értékajánlatát. A zenei és produceri közösségi platform ötlete, a sample és demo tartalmak szétválasztása, valamint a visszajelzés-fókuszú demo board gondolata saját termékdöntés volt. Az MI ezek megfogalmazásában és strukturált leírásában segített, de nem helyettesítette a probléma megértését.

Szándékosan nem használtam MI-t arra sem, hogy automatikusan elfogadjak architekturális döntéseket. Például a MongoDB, Express és JWT választásánál figyelembe kellett venni a projekt méretét, a fejlesztési időt, a már meglévő kódot és azt, hogy az MVP-ben milyen adatok kezelése a legfontosabb. Az MI által adott alternatívák hasznosak voltak, de az ADR-ekben szereplő végső döntéseknek a projekt reális korlátaihoz kellett igazodniuk.

A szakdolgozat értékelése és következtetései szintén nem lehetnek pusztán MI által írt szövegek. Ezekben azt kell bemutatni, hogy fejlesztőként mit tanultam a scope kezeléséről, a validálásról, a dokumentáció és a kód összhangjáról, illetve arról, hogy egy ötletből hogyan lesz bemutatható, futtatható MVP.

## Tanulságok

Az MI legnagyobb előnye a gyorsítás és a strukturált gondolkodás támogatása volt. Segített abban, hogy a nagy, nehezen áttekinthető feladatokat kisebb részekre bontsam, ellenőrzőlistákat készítsek, hiányzó dokumentációs pontokat találjak, és gyorsabban végiggondoljam a tipikus hibákat. Különösen hasznos volt akkor, amikor a repo állapotát kellett összevetni a leadási követelményekkel.

Ugyanakkor lassítani is tudott, amikor túl nagy vagy túl általános megoldásokat javasolt. Egy szakdolgozati projektben nem az a cél, hogy minden modern technológia bekerüljön, hanem hogy a vállalt scope bizonyíthatóan működjön. A következő projektben még tudatosabban alkalmaznám a "spec-first" megközelítést: előbb pontos acceptance criteria és tesztlista, utána implementáció. Emellett hamarabb vezetném a prompt logot és a verification logot, mert utólag sokkal nehezebb rekonstruálni, hogy melyik MI-javaslat milyen döntéshez vagy kódrészhez vezetett.

Összességében az MI hasznos fejlesztői társ volt, de csak akkor, amikor kontrollált, ellenőrzött és dokumentált folyamat részeként használtam. A projekt minőségét nem az javította, hogy az MI válaszokat adott, hanem az, hogy ezekre a válaszokra kérdésként, hipotézisként és review-alapanyagként tekintettem.
