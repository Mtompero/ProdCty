# Végső ütemezés és leadási checklist

Ez a dokumentum a 2026. április 22-én publikált végső szakdolgozati ütemezés alapján készült munkachecklist. Célja, hogy a repóban egy helyen látszódjon, mi kell az egyes mérföldkövekhez.

## 1. mérföldkő - 2026. április 26. 23:59

Elvárás: kód + dokumentáció a megosztott GitHub repóban, működőképes állapotban.

| Tétel | Státusz | Evidence |
| --- | --- | --- |
| Kód feltöltve a GitHub repóba | Kész | `backend/`, `frontend-react/` |
| Root README futtatási és online elérési információkkal | Kész | [README.md](../../README.md) |
| Konfigurációs példa | Kész | [.env.example](../../.env.example) |
| Backend package és lockfile | Kész | [backend/package.json](../../backend/package.json), [backend/package-lock.json](../../backend/package-lock.json) |
| React frontend alkalmazás | Kész | [frontend-react/](../../frontend-react/) |
| GUI/UX dokumentáció | Kész | [docs/ux/](../ux/) |
| GUI/UX screenshot készlet | Kész | `docs/ux/screenshots/` alatt az S01-S18 fájlnevek szerint |
| Dokumentációs index | Kész | [docs/00_index.md](../00_index.md) |
| Tesztriportok | Kész | [reports/junit.xml](../../reports/junit.xml), [reports/cobertura-coverage.xml](../../reports/cobertura-coverage.xml) |
| CI/CD egyértelmű állapota | Kész | [.github/workflows/ci.yml](../../.github/workflows/ci.yml) backend tesztet és React buildet futtat |
| Deploy/runbook | Kész | [docs/06_release/deployment_guide.md](./deployment_guide.md), `deploy/` |

## 2. mérföldkő - 2026. május 3. 23:59

Elvárás: a szakdolgozat első teljes, review-ra küldhető PDF verziója a GitHub repóba commitolva.

Kötelező teendők:

- Szakdolgozat sablon alapján teljes dokumentum összeállítása.
- PDF export és commit a repóba.
- A PDF ne vázlat legyen, hanem legjobb tudás szerinti kész változat.
- MI-használat kb. 2 oldalas fejezet beillesztése.
- A szakdolgozat szövege legyen összhangban a repo aktuális állapotával.

Javasolt fejezetsorrend a ProdCty-hez:

1. Feladatkiírás / téma rövid bemutatása.
2. Tartalmi összefoglaló.
3. Bevezetés.
4. Területi áttekintés és versenytársak.
5. Követelmények és scope.
6. Felhasznált technológiák.
7. Architektúra és adatmodell.
8. Felhasználói felület és UX.
9. Megvalósítás fő részei.
10. Tesztelés és minőségbiztosítás.
11. Mesterséges intelligencia használata a fejlesztés során.
12. Tapasztalatok, korlátok, továbbfejlesztés.
13. Összefoglalás.

## 3. mérföldkő - 2026. május 23.

Elvárás: hivatalos szakdolgozati leadás.

Eddigre javítandók:

- Review visszajelzések átvezetése.
- README és dokumentáció végső ellenőrzése.
- PDF végső export.
- Titkok/secrets ellenőrzése.
- Tesztek és riportok frissítése.
- Repo linkek, screenshotok és hivatkozások ellenőrzése.

## Közvetlen következő lépések

1. `docs/ux/screenshots/` ellenőrzése az aktuális S01-S18 képernyőlistával.
2. `docs/ux`, README és `frontend-react/` commitolása/pusholása.
3. Backend tesztek helyi újrafuttatása `cd backend && npm test` paranccsal.
4. React frontend build újrafuttatása `cd frontend-react && npm run build` paranccsal.
5. Szakdolgozat PDF export ellenőrzése A4 oldalbeállítással.
6. MI-fejezet pontosítása a ténylegesen használt eszközök neveivel és konkrét validációs példákkal.

## UX Screenshot Fájlnevek

Az aktuális felülethez az alábbi screenshotok tartoznak:

- `S01_login.png`
- `S02_register.png`
- `S03_library.png`
- `S04_library_upload_sample.png`
- `S05_license_confirm.png`
- `S06_demos.png`
- `S07_demo_upload_aura.png`
- `S08_demo_feedback_popup.png`
- `S09_collab_request_popup.png`
- `S10_collab_inbox.png`
- `S11_own_profile.png`
- `S12_edit_profile_popup.png`
- `S13_public_profile.png`
- `S14_admin_overview.png`
- `S15_admin_reports_review.png`
- `S16_admin_users_moderation.png`
- `S17_admin_ai_review.png`
- `S18_admin_ai_review_action.png`
