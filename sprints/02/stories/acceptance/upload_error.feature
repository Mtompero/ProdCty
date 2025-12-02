Feature: Hibaállapotok kezelése audiofájl feltöltésekor
  Érvénytelen fájlformátum, backend hiba és hálózati hiba kezelése.

  Background:
    Given egy bejelentkezett felhasználó, aki a "Upload" űrlap nézeten van

  Scenario: Érvénytelen fájlformátum hibaüzenetet eredményez
    Given a felhasználó egy nem audiofájlt választ (pl. ".pdf")
    When a felhasználó a "Upload" gombra kattint
    Then piros hibaüzenet jelenik meg: "Csak mp3 vagy wav fájl tölthető fel"
    And nem jön létre új listaelem a "My Tracks" nézetben

  Scenario: Backend 500-as hiba piros hiba-sávot eredményez
    Given a felhasználó egy érvényes ".mp3" vagy ".wav" fájlt választ ki
    And a fájl mérete legfeljebb 10 MB
    And a backend a feltöltés során 500-as hibát ad vissza
    When a felhasználó a "Upload" gombra kattint
    Then piros hiba-sáv jelenik meg: "Hiba történt a feltöltés közben"
    And egy "Retry" gomb látható

  Scenario: Hálózati hiba esetén retry lehetőség
    Given a kliens nem éri el az API-t (network error)
    And a felhasználó egy érvényes ".mp3" vagy ".wav" fájlt választ ki
    When a felhasználó a "Upload" gombra kattint
    Then üzenet jelenik meg: "Nem sikerült elérni a szervert"
    And egy "Retry" gomb látható
    When a felhasználó a "Retry" gombra kattint
    Then a rendszer újra megpróbálja elküldeni a feltöltési kérést
