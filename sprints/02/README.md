# Sprint 2 – PRODcty

## Sprint célja
A Sprint 2 célja az MVP első vertikális szeletének leszállítása:  
**audiofájl feltöltés + saját zenék listázása**, valamint a kezdő „Samples” landing nézet megjelenítése.

## Leszállított elemek

### 1. Specifikáció
- `spec/product_spec_v0.2.md`

### 2. User Story-k
- `stories/user_stories.md`
- Acceptance tesztek (Gherkin):
  - `stories/acceptance/samples_landing.feature`
  - `stories/acceptance/upload_success.feature`
  - `stories/acceptance/upload_error.feature`

### 3. Wireframe-ek
- A „Samples” kezdőképernyő
- Upload form – success / error állapotok  
  (PNG-ek a `wireframes/` mappában)

### 4. Architektúra
- `architecture/mvp-slice.md`  
  (Sprint 2 vertikális szelet UI → API → persistencia áttekintés)

### 5. ADR-ek
- `adr/0002-iac-deploy-strategia.md`  
- `adr/0003-deployment-target.md`

### 6. AI log
- `ai/ai_log.jsonl`

### 7. DoR / DoD
- `dor_dod.md`

### 8. Traceability
- User Story → AC → Wireframe → Spec megfeleltetés  
  (`traceability.md`)

## Összefoglaló
A Sprint 2 leszállította a működő MVP-szeletet:  
- a felhasználó feltölthet zenét,  
- hibakezelés működik,  
- saját listában meg is jelenik,  
- első belépési képernyő a „Samples” mintatartalmakkal.  

A következő sprintben a feed logika, kommentek és profilfunkciók kerülhetnek fókuszba.
