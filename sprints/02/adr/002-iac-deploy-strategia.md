# ADR-002 – IaC és deploy stratégia ProdCty-hez

## Státusz
Elfogadva – Sprint 2

## Kontextus

A ProdCty-nél a tárgy követelménye, hogy a hallgató:

- használjon valamilyen Infrastructure as Code (IaC) megoldást,
- mutassa be, hogyan kerülne a rendszer „preview” / „production-szerű”
  környezetbe,
- és legyen legalább egy `terraform plan` artefakt.

A projekt jelenlegi állapota (Sprint 2):

- A rendszer alapvetően egy monolitikus webalkalmazás (frontend + backend),
- Nincs még dedikált, felhőbeli adatbázis,
- A hangsúly a feltöltési folyamat és a UI bemutatásán van.

## Döntés

- **IaC eszköz:** Terraform
  - A repo `infra/terraform` mappájában kerülnek elhelyezésre a Terraform konfigurációk.
  - Sprint 2-ben minimálisan:
    - egy „dummy” local_file resource (a Terraform pipeline életben tartására),
    - valamint előkészített struktúra jövőbeli erőforrásokhoz (app + adatbázis).
- **Deploy stratégia (Sprint 2):**
  - Fejlesztői környezetben: lokális futtatás (npm/yarn), `localhost` alapú elérés.
  - CI-ben: build + test futtatása, majd Terraform `plan` generálása mint artefakt.
- **Célkörnyezet (későbbi sprintekben):**
  - Egy egyszerű PaaS jellegű szolgáltatás (pl. Railway/Render/Heroku-szerű),
  - ahol a Node.js backend és a statikus frontend egy konténerből vagy külön szolgáltatásból szolgálható ki.
- **Pipeline:**
  - Git alapú verziókezelés (GitHub/GitLab),
  - CI futtatja:
    - npm/yarn build + test,
    - coverage report generálás,
    - Terraform `fmt` + `validate` + `plan`.

## Indoklás

- A Terraform jól illeszkedik a tárgy követelményeihez, és
  iparági standard IaC eszköz.
- Sprint 2-ben nincs szükség teljes, felhőbe deployolt infrastruktúrára,
  de a Terraform-struktúra előkészítése később lehetővé teszi a
  fokozatos bővítést (app service, adatbázis, storage).
- A „dummy” resource (pl. local_file) használata lehetővé teszi, hogy a
  Terraform pipeline már most is működjön (validate, plan), anélkül,
  hogy valódi felhős erőforrásokat kellene létrehozni.

## Következmények

- Pozitív:
  - A projekt már Sprint 2-ben rendelkezik működő IaC réteggel,
    amelyre a további sprintek építhetnek.
  - A CI pipeline egyszerűen demonstrálható: van `terraform validate`
    és `terraform plan` lépés, ami megfelel a tárgyi elvárásoknak.
  - Később könnyű lesz bővíteni az infra réteget (pl. PostgreSQL,
    S3-szerű storage).
- Negatív:
  - A Terraform konfiguráció Sprint 2-ben még főként „csontváz” jellegű,
    azaz kevés valódi erőforrást ír le.
  - A tényleges deploy platform (PaaS / cloud provider) pontos
    kiválasztása és konfigurálása későbbi extra munkát igényel.
