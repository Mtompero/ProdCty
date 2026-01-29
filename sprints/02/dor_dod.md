# ProdCty – Sprint 2 – Definition of Ready (DoR) és Definition of Done (DoD)

## Definition of Ready (DoR)

Egy Sprint 2-es feladat akkor tekinthető “Ready”-nek, ha:

- [ ] A feladat leírása egyértelmű (User Story + AC megadva)
- [ ] A szükséges UI/flow meghatározva (wireframe vagy leírás)
- [ ] Minden külső függőség ismert (API végpontok, mock elég)
- [ ] Mérete becsülhető (MVP vertikális szelet elemei)
- [ ] Elfogadási feltételek (AC-k) tesztelhetők

---

## Definition of Done (DoD)

Egy Sprint 2-es feladat akkor “Done”, ha:

- [ ] A funkció működik végigérő módon (feltöltés → lista)
- [ ] Minden AC teljesült és lefedett tesztekkel (min. 2 automatizált)
- [ ] Nincs kritikus hiba (hibaállapotok kezelve)
- [ ] Készült wireframe a releváns nézetekhez
- [ ] Dokumentumok frissítve:
  - User Storyk
  - Product Spec v0.2
  - Traceability
  - ADR-ek (min. 2)
  - AI Log (min. 3 bejegyzés)
- [ ] CI lefut: build + test + coverage ≥ 60%
- [ ] Terraform `validate` és `plan` sikeres
- [ ] A kód bekerült a sprint branch-be (PR elfogadva)

