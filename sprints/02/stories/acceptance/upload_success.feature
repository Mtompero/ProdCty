Feature: Audiofájl sikeres feltöltése
  A felhasználó érvényes mp3/wav fájlt tölt fel, és a rendszer sikeres visszajelzést ad.

  Background:
    Given egy bejelentkezett felhasználó, aki a "Upload" űrlap nézeten van

  Scenario: Érvényes audiofájl sikeres feltöltése
    Given a felhasználó egy érvényes ".mp3" vagy ".wav" fájlt választ ki
    And a fájl mérete legfeljebb 10 MB
    When a felhasználó a "Upload" gombra kattint
    Then a kliens sikeres (200-as) választ kap a backendtől
    And az új track megjelenik a "My Tracks" lista legfelső elemként
    And egy "Upload successful" toast/visszajelzés jelenik meg
