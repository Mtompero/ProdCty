# TOMPA Márton — ProdCty

**Neptun:** ZI3X3C | **Repó:** github.com/Mtompero/ProdCty---Szakdolgozat---2026-

---

## Mi ez a projekt?

Audio/zenei közösségi platform és kreatív eszköz, ahol zenészek és producerek royalty-free hangmintákat fedezhetnek fel, demókat oszthatnak meg professzionális visszajelzésre, és MI-alapú audio-feldolgozási eszközökkel dolgozhatnak. A Splice + SoundCloud + BandLab elemeit kombinálja, közösség-fókuszú platform.

## Tervezett funkciók

- Demo board (feltöltés + időbélyeges, kategorizált visszajelzés)
- Audio lejátszó hullámforma-vizualizációval (Wavesurfer.js)
- Tag-alapú keresés (műfaj, BPM, hangnem, energia-szint, hangszín)
- Felhasználói profilok (portfólió, statisztikák, követők, megjelenítés)
- MI-alapú hangminta-kategorizálás (automatikus BPM/hangnem/energia detekció)
- MI mastering asszisztens (spektrum-analízis, EQ/kompresszor javaslat)
- Stem separation (vokal/dob/basszus/egyéb szétválasztása)
- Sample könyvtár (royalty-free minták, letöltés, licenc-kezelés)
- Audio "For You" feed (érdeklődés és korábbi lejátszások alapú ajánlás)
- Kollaborációs workspace (megosztott projekt, verziókezelés, real-time chat)

## Technológiai verem

| Réteg | Választás | Értékelés |
|---|---|---|
| Frontend | React 19 + TypeScript | **Kiváló.** Modern hooks, concurrent rendering. |
| Backend | Express.js vagy FastAPI (Python) | **Szükséges** audio-feldolgozáshoz és ML-hez. |
| Tárolás | AWS S3 vagy Firebase Storage | **Szükséges** nagy audio-fájlokhoz (streaming szintű). |
| Audio lejátszás | Web Audio API + Wavesurfer.js | **Ideális** hullámforma-vizualizációhoz és interaktív playback-hoz. |
| Autó-analízis | Essentia.js (nyílt forráskódú) | **Excellent** BPM, hangnem, energía-szinthez. |
| Stem separation | Stem Separation API (AudioShake, ezStudio, vagy Splitter.ai) | **Best-in-class.** 4-stem szeparáció, pre-trained models, API-s elérés. |
| Real-time collab | WebSocket vagy WebRTC (Yjs CRDT) | **Szükséges** a kolaborációs workspace-hez. |
| Keresés | Algolia vagy Meilisearch | **Szükséges** a tag-alapú gyors kereséshez. |

## Versenytársak

A **Splice** (4M+ felhasználó) a sample-piac királya: millió+ hangminta, plugin-bérlés, AI-keresés (Splice Scout), de nincs feedback-platform. A **SoundCloud** (300M+) zenemegosztás + streaming + közösség, de nincs kreatív eszköz. A **BandLab** (100M+) ingyenes online DAW + kollaboráció + közösség, de korlátolt az audio-analízis. A **Landr** MI-mastering és automatikus disztribúció, de nincs demo-board. Az **LALAL.AI** stem separation (fizetős), de nincs közösség. A ProdCty egyedi értéke: demo-fókuszú visszajelzés platform + MI-mastering + stem separation + kollaborációs workspace, ami a SoundCloud közösségét a BandLab + Landr eszközeivel kombinálja.

## Javasolt lehetséges képességek

Nem kötelező, de ezekből lehet válogatni:

- MI-alapú hangminta-kategorizálás (Essentia.js) — automatikus BPM, hangnem, energia-szint detekció
- Időbélyeges, kategorizált visszajelzés rendszer — visszajelzés a hullámforma bármely pontján
- MI mastering asszisztens (spektrum-analízis, EQ/kompresszor javaslat)
- Stem separation API integráció — vokal/dob/basszus/egyéb szétválasztása
- Kollaborációs workspace — verziózás, real-time chat, közös projektszerkesztés
- Push értesítések — új feedback, követők tevékenységéről értesítések
- Felhasználó-statisztikák dashboard — hallgatottság, tetszéspontok, visszhang-analízis
- Admin moderációs panel — spam-szűrés, közösségi normák védelme
- Exportálás és download — audiofájlok, projektarchívum, licenc-igazolások
- Google/Spotify integrációval felhasználó-szinkronizálás
- Zajos hangminta szűrés (teljesen rossz minőség automatikus elutasítása)

## Összegzés

A ProdCty a demo-fókuszú visszajelzés, az MI-audio analízis és a stem separation kombinációjával egy hiánypiacot tölt be. Az időbélyeges feedback-rendszer és a mastering-asszisztens egyedülálló értékek a zenei közösségi tereken.
