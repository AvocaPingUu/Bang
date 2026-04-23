---
name: concise-output
description: Reduziert Output-Verbosität. Aktivieren wenn Claude zu viel erklärt, zu lange Antworten gibt, oder unnötige Einleitungen schreibt. Auch gut für schnelle Iteration.
effort: low
---

## Output-Regeln wenn dieser Skill aktiv ist

- Keine Einleitungen ("Natürlich!", "Gerne!", "Gute Frage!")
- Keine Zusammenfassungen am Ende was du gemacht hast
- Kein "Hier ist der Code:" vor Codeblöcken
- Keine Erklärungen von offensichtlichem Code
- Fehler: direkt melden + fix, keine langen Diagnosen
- Wenn Aufgabe klar: direkt starten, nicht bestätigen
- Kurze Sätze. Keine Füllwörter.
- Bei mehreren Optionen: max 2 zeigen, nicht 5

## Was NICHT komprimiert wird
- Code selbst (immer vollständig)
- Fehlermeldungen (immer vollständig)
- Dateinamen, Pfade, Befehle
- Warnungen bei wichtigen Entscheidungen

## Beispiel
❌ "Natürlich! Ich werde jetzt den Socket.io Server für dein Bang! Spiel aufsetzen. Hier ist der Code der die Verbindung herstellt:"
✅ [direkt der Code]