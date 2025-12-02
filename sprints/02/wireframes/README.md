# ProdCty – Sprint 2 Wireframe csomag

A következő wireframe-ek a Sprint 2 vertikális szelethez tartozó UI-nézeteket mutatják be:
az első belépési „Samples” képernyőt, valamint az audiofeltöltés sikeres és hibás állapotait.

A képek a specifikációban és a user story-kban hivatkozott AC-ket illusztrálják.

---

## 1. Samples landing screen (`samples.png`)

**Cél:**  
Az első belépési képernyő megjelenítése mintatartalmakkal (nem üres állapot).  

**Kapcsolódó User Story-k:**  
- US-01 – First-time landing view  

**Kapcsolódó AC-k:**  
- AC-01.1 – Samples tab aktív  
- AC-01.2 – Navigáció más tabokra  

**Funkciók:**  
- Samples / Feed / Listen tabok  
- Sample tartalmak megjelenítése  
- Profil ikon  

---

## 2. Upload – successful state (`upload_success.png`)

**Cél:**  
A feltöltés sikeres befejezésének UI visszajelzése.  

**Kapcsolódó User Story-k:**  
- US-02 – Audiofájl feltöltése  

**Kapcsolódó AC-k:**  
- AC-02.1 – Sikeres feltöltés visszajelzése  

**Funkciók:**  
- Fájlválasztó űrlap (genre + title opciók)  
- „Upload successful” zöld státuszsáv  
- Továbbnavigálás a listára (implicit)  

---

## 3. Upload – error + retry (`upload_error.png`)

**Cél:**  
Hibás feltöltési kísérlet vizuális visszajelzése + újrapróbálási lehetőség.  

**Kapcsolódó User Story-k:**  
- US-04 – Hibaállapot kezelése  

**Kapcsolódó AC-k:**  
- AC-04.1 – Backend hiba  
- AC-04.2 – Hálózati hiba  

**Funkciók:**  
- Piros hibaüzenet („Error – Try again”)  
- „Retry” gomb  
- Fájl- és metaadatmezők változatlanul megmaradnak  

---

## Megjegyzés

A wireframe-ek low-fidelity nézetek, céljuk a flow bemutatása:  
- első belépési képernyő,  
- feltöltési űrlap működése,  
- hibakezelés és visszajelzés.  

A végleges UI ettől eltérhet, de az MVP funkcionális logikáját reprezentálja.
