Feature: Komment írása

Scenario: Sikeres komment küldés
  Given a felhasználó egy track oldalán van
  When szöveget ír és elküldi
  Then a komment megjelenik a listában

Scenario: Üres komment hiba
  Given a felhasználó nem ír szöveget
  When elküldi a kommentet
  Then hibaüzenet jelenik meg
