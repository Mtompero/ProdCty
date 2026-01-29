# ProdCty – User Storyk (Sprint 2)

> A storyk az 1. sprint PRD-jében definiált personákra épülnek
> („Alex, feltörekvő producer” és „Péter, gitárjátékos”).

---

## US-01 – First-time landing állapot („Samples” nézet)

**Leírás (Story)**  
Mint új felhasználó (Alex vagy Péter),  
szeretnék egy áttekinthető kezdőképernyőt látni,  
amely mintatartalmakat mutat és segít elindulni a platformon,  
még akkor is, ha még nincs saját feltöltött zeném vagy személyes feedem.

**AC-01.1 – Samples kezdőnézet megjelenítése**
- Given a felhasználónak még nincs saját tartalma
- When megnyitja a ProdCty alkalmazást bejelentkezve
- Then megjelenik a „Samples – Feed – Listen” tab sor
- And a „Samples” tab van aktív állapotban
- And a fő tartalomterületen mintatartalmak (sample képek / ajánlók) láthatók
- And nem jelenik meg üres lista vagy „nincs tartalom” üzenet

**AC-01.2 – Navigáció más nézetekbe**
- Given a felhasználó az első belépési (Samples) nézeten van
- When rákattint a „Feed” vagy „Listen” tabra
- Then átjut a megfelelő nézetre
- And a tab vizuálisan aktívra vált

---

## US-02 – Audiofájl feltöltése

**Leírás**  
Mint producer vagy zenész,  
szeretnék egyetlen lépésben feltölteni egy audiofájlt (mp3/wav),  
hogy a ProdCty közösség számára elérhető legyen.

**AC-02.1 – Sikeres feltöltés**
- Given a felhasználó egy érvényes `.mp3` vagy `.wav` fájlt választ ki
- And a fájl mérete legfeljebb 10 MB
- When rákattint a „Feltöltés” gombra
- Then a kliens sikeres (200-as) választ kap a backendtől
- And az új track megjelenik a „Saját zenéim” lista legfelső elemként
- And egy „Sikeres feltöltés” visszajelzést lát (toast/sáv)

**AC-02.2 – Érvénytelen formátum**
- Given a felhasználó egy nem audiofájlt választ (pl. `.pdf`)
- When megpróbálja feltölteni
- Then piros hibaüzenetet lát („Csak mp3 vagy wav fájl tölthető fel”)
- And nem jön létre új listaelem

---

## US-03 – Saját feltöltések listázása

**Leírás**  
Mint zenész,  
szeretném áttekinteni, hogy milyen zenéket töltöttem már fel a ProdCty-re,  
hogy tudjam, mit hallgathatnak meg rólam mások.

**AC-03.1 – Lista tartalma**
- Given a felhasználónak legalább egy feltöltött zenéje van
- When megnyitja a „Saját zenéim” nézetet
- Then a listában minden elemnél látszik:
  - a track címe vagy fájlneve,
  - a feltöltés dátuma,
  - a műfaj (ha meg lett adva) vagy „ismeretlen” placeholder

**AC-03.2 – Rendezési sorrend**
- Given legalább két feltöltött zeneszám
- When megnyitja a listát
- Then alapértelmezetten a legutóbb feltöltött szám látszik legfelül

---

## US-04 – Hibaállapot kezelése

**Leírás**  
Mint felhasználó,  
hiba esetén is szeretném érthetően látni, mi történt,  
hogy tudjam, érdemes-e újrapróbálni.

**AC-04.1 – Backend hiba**
- Given a backend a feltöltés során 500-as hibát ad vissza
- When a kliens megkapja a hibát
- Then megjelenik egy piros hiba-sáv („Hiba történt a feltöltés közben”)
- And látható egy „Próbáld újra” gomb

**AC-04.2 – Hálózati hiba**
- Given a kliens nem éri el az API-t (network error)
- When a felhasználó megpróbál egy audiofájlt feltölteni
- Then egy „Nem sikerült elérni a szervert” üzenetet lát
- And a „Próbáld újra” gomb újraindítja a kérést

---

## US-05 – Samples / Feed / Listen tab (csak UI)

**Leírás**  
Mint felhasználó,  
szeretném látni, hogy a ProdCty több különböző feedet is kezel (“Samples”, “Feed”, “Listen”),  
hogy értsem a platform fő navigációs szerkezetét.

**AC-05.1 – Tab váltás vizuálisan**
- Given a felhasználó a fő nézeten van
- When rákattint a „Feed” tabra
- Then a „Feed” tab aktív állapotba kerül
- And a „Samples” és „Listen” tab inaktív lesz (UI, statikus tartalommal)
