Feature: First-time landing állapot (Samples nézet)
  A ProdCty első belépési állapotának ellenőrzése, amikor a felhasználónak még nincs saját tartalma.

  Background:
    Given egy bejelentkezett felhasználó, akinek még nincs saját feltöltött tartalma

  Scenario: Samples landing nézet megjelenítése első belépéskor
    When megnyitja a ProdCty alkalmazás főoldalát
    Then megjelenik a "Samples - Feed - Listen" tab sor
    And a "Samples" tab aktív állapotban van
    And a fő tartalomterületen mintatartalmak (sample kártyák) láthatók
    And nem jelenik meg üres lista vagy "nincs tartalom" üzenet

  Scenario: Navigáció Feed és Listen nézetekbe a Samples landingről
    Given a felhasználó a "Samples" landing nézeten van
    When a felhasználó a "Feed" tabra kattint
    Then a "Feed" tab aktív állapotba kerül
    And a "Samples" tab inaktív lesz

    When a felhasználó a "Listen" tabra kattint
    Then a "Listen" tab aktív állapotba kerül
    And a "Feed" tab inaktív lesz
