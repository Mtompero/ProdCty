# ADR 0004 – Feed stratégia (Sprint 3)

## Státusz
Elfogadva

## Kontextus
A Sprint 2-ben a landing „Samples” tab statikus mintatartalmat mutatott.
Sprint 3-ban szükség van egy minimálisan működő **Feed** nézetre, amely valódi listát ad vissza (még egyszerű logikával), és kezel üres/hiba állapotokat.

## Döntés
Sprint 3-ban a feedet **egyszerű, determinisztikus listázással** valósítjuk meg:
- `GET /feed` endpoint visszaad egy track listát.
- A rendezés alapértelmezetten: **legfrissebb elöl** (createdAt desc).
- Paginációt Sprint 3-ban nem vezetünk be (out of scope), de az interfészt úgy választjuk meg, hogy később bővíthető legyen.

## Indoklás
- 48 órás időkeretben a cél az első end-to-end “közösségi” kör demonstrálása.
- A determinisztikus feed könnyen tesztelhető (unit és smoke).
- A későbbi ForYou algoritmus és pagináció külön ADR-ben/ sprintben kezelhető.

## Következmények
- A feed jelenleg nem személyre szabott.
- A későbbi bővítéshez várhatóan:
  - query paramok (`cursor`, `limit`, `genre`, `sort`) vagy
  - külön endpointok (`/feed/foryou`, `/feed/global`)
  kerülnek bevezetésre.
