# ProdCty dokumentációs index

Ez az index a szakdolgozati leadandó munkapéldányának belépési pontja. A cél az, hogy a kód, a terméktervezés, a UX, a tesztelés és az AI-használat bizonyítékai egy helyről elérhetők legyenek.

## Termék és scope

- Product plan: [project_plan.md](../project_plan.md)
- Projekt összefoglaló: [13_TOMPA_Marton_ProdCty.md](../13_TOMPA_Marton_ProdCty.md)
- Sprint 1 PRD: [sprints/01/prd.yaml](../sprints/01/prd.yaml)
- Sprint 2 product spec: [sprints/02/spec/product_spec_v0.2.md](../sprints/02/spec/product_spec_v0.2.md)
- Sprint 3 product spec: [sprints/03/spec/product_spec_v0.3.md](../sprints/03/spec/product_spec_v0.3.md)
- Sprint 4 összegzés: [sprints/04/spec/sprint4_summary.md](../sprints/04/spec/sprint4_summary.md)

## GUI/UX dokumentáció

- UX README: [docs/ux/README.md](ux/README.md)
- Pageflow Mermaid: [docs/ux/pageflow.mmd](ux/pageflow.mmd)
- Pageflow kép: [docs/ux/pageflow.png](ux/pageflow.png)
- Képernyő táblázat: [docs/ux/screens.csv](ux/screens.csv)
- User journey-k: [docs/ux/journeys.md](ux/journeys.md)
- Design system: [docs/ux/design_system.md](ux/design_system.md)
- Önértékelés: [docs/ux/self_assessment.md](ux/self_assessment.md)
- Screenshotok: [docs/ux/screenshots/](ux/screenshots/)

## Architektúra és döntések

- Sprint 1 ADR-ek: [sprints/01/architecture/adr/](../sprints/01/architecture/adr/)
- Sprint 2 ADR-ek: [sprints/02/adr/](../sprints/02/adr/)
- Sprint 3 ADR-ek: [sprints/03/adr/](../sprints/03/adr/)
- Sprint 4 ADR: [sprints/04/adr/0006-final-architecture-state.md](../sprints/04/adr/0006-final-architecture-state.md)
- Sprint 2 MVP szelet: [sprints/02/architecture/mvp-slice.md](../sprints/02/architecture/mvp-slice.md)
- Sprint 3 MVP szelet: [sprints/03/architecture/mvp-slice.md](../sprints/03/architecture/mvp-slice.md)

## Tesztelés és riportok

- Backend teszt: [backend/tests/trackService.test.js](../backend/tests/trackService.test.js)
- Backend route tesztek: [backend/tests/app.routes.test.js](../backend/tests/app.routes.test.js)
- Aura generálás tesztek: [backend/tests/analysis.test.js](../backend/tests/analysis.test.js)
- Jest config: [backend/jest.config.cjs](../backend/jest.config.cjs)
- React frontend package: [frontend-react/package.json](../frontend-react/package.json)
- CI workflow: [.github/workflows/ci.yml](../.github/workflows/ci.yml)
- JUnit riport: [reports/junit.xml](../reports/junit.xml)
- Coverage riport: [reports/cobertura-coverage.xml](../reports/cobertura-coverage.xml)

Futtatás:

```bash
cd backend
npm install
npm test
```

Frontend build:

```bash
cd frontend-react
npm install
npm run build
```

## AI-használat

- Sprint 1 AI terv: [sprints/01/ai/usage_plan.yaml](../sprints/01/ai/usage_plan.yaml)
- Sprint 1 AI napló: [sprints/01/ai/ai_log.jsonl](../sprints/01/ai/ai_log.jsonl)
- Sprint 2 AI napló: [sprints/02/ai/ai_log.jsonl](../sprints/02/ai/ai_log.jsonl)
- Sprint 3 AI napló: [sprints/03/ai/ai_log.jsonl](../sprints/03/ai/ai_log.jsonl)
- Sprint 4 AI napló: [sprints/04/ai/ai_log.jsonl](../sprints/04/ai/ai_log.jsonl)
- Szakdolgozatba illeszthető MI-fejezet munkaverzió: [docs/07_ai/mesterseges_intelligencia_hasznalata.md](07_ai/mesterseges_intelligencia_hasznalata.md)

## Április 26-i mérföldkő állapota

- Kód a repóban: backend és React + TypeScript frontend MVP szelet megtalálható.
- README: quickstart és teszt parancsok dokumentálva.
- Konfiguráció: `.env.example` létrehozva.
- UX dokumentáció: `docs/ux/` alatt elérhető.
- Végső ütemezés checklist: [docs/06_release/final_submission_checklist.md](06_release/final_submission_checklist.md)
- Online deploy útmutató: [docs/06_release/deployment_guide.md](06_release/deployment_guide.md)
- Szakdolgozat munkapéldány: [docs/thesis/Tompa_Marton_ProdCty_szakdolgozat.docx](thesis/Tompa_Marton_ProdCty_szakdolgozat.docx)
- A végleges PDF első teljes verziója még külön előállítandó a május 3-i mérföldkőig.
