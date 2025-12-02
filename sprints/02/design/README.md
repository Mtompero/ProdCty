# ProdCty – Wireframe-ek (Sprint 2)

## 01-main-flow.png

**Cél:**  
Megmutatni, hogyan néz ki a ProdCty főoldala, amikor a felhasználó már
bejelentkezett és látja a „Saját zenéim” blokkot, valamint a
„Mindenes / Neked” tabokat.

**Interakciók:**  
- „Tölts fel egy zenét” gomb a fő CTA.
- Tab váltás: „Mindenes” ↔ „Neked”.

**Állapotok:**  
- Normál (legalább 1 track a listában).
- Rövid „betöltés” állapot (spinner).

**Hivatkozások:**  
- US-03 / AC-03.1, AC-03.2  
- US-05 / AC-05.1  
- Tesztötlet: `tests/acceptance/list_view.feature`

---

## 02-empty-state.png

**Cél:**  
Az első belépő felhasználó esetén egyértelművé tenni, hogy még nincs
feltöltött zene, és mit kell tennie.

**Interakciók:**  
- „Tölts fel egy zenét” CTA gomb.

**Állapotok:**  
- Üres lista helyett illusztráció + rövid magyarázat.

**Hivatkozások:**  
- US-01 / AC-01.1, AC-01.2  
- Teszt: `sprints/02/stories/acceptance/empty_state.feature`

---

## 03-error-state.png

**Cél:**  
Megmutatni, hogyan jelez hibát az UI, ha a feltöltés nem sikerül
(API hiba vagy érvénytelen fájl).

**Interakciók:**  
- „Próbáld újra” gomb.
- Link egy súgó / FAQ oldalra (későbbi sprint).

**Állapotok:**  
- Hibaüzenet piros sávban.
- A lista/űrlap látható marad, hogy könnyű legyen újrapróbálni.

**Hivatkozások:**  
- US-02 / AC-02.2  
- US-04 / AC-04.1, AC-04.2  
- Tesztötlet: `tests/unit/error_handler.spec.*`

---

## 04-upload-form.png (opcionális)

**Cél:**  
Részletesen bemutatni az audiofeltöltés űrlapot.

**Interakciók:**  
- Fájlválasztó gomb.
- Műfaj (dropdown vagy tag input).
- Opcionális cím mező.

**Állapotok:**  
- Valid beküldés (success jelzés).
- Invalid (rossz formátum / túl nagy fájl) – mezőszintű piros hiba.

**Hivatkozások:**  
- US-02 / AC-02.1, AC-02.2  
- Teszt: `sprints/02/stories/acceptance/upload_track.feature`
