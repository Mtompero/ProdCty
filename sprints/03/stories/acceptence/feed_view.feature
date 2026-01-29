Feature: Feed megtekintése

Scenario: Feed sikeres betöltése
  Given a felhasználó megnyitja a feed oldalt
  When az adatok betöltődnek
  Then a trackek listája megjelenik
