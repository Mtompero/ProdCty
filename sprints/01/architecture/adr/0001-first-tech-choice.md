# 0001: Technológiai stack választás

- Dátum: 2025-10-15
- Státusz: Elfogadva

## Kontextus
Gyors MVP fejlesztéshez és iterációhoz moduláris frontend és rugalmas backend kell, ami kezeli az audiófeltöltéseket és visszajelzéseket.

## Döntés
- Frontend: Angular + TypeScript  
- Backend: Node.js (Express)  
- Adatbázis: MongoDB  

## Alternatívák
- React + TS + MongoDB – gyors prototípus, de Angular jobban támogatja a moduláris UI-t  
- Vue 3 + Vite + Firebase – egyszerű setup, de kevés gyakorlat a csapatnak  
- Django + Angular – erős admin, de bonyolultabb deployment

## Következmények
- Stack jól skálázható, támogatja audiófeltöltést és közösségi funkciókat  
- Gyors iteráció és rövid onboarding a csapatnak  
- Adatmodell rugalmasan bővíthető MI-funkciókhoz
