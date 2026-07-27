# Poznámka k převzetí handoffu F1 (27. 7. 2026 večer)

Balík `kompletni_návrh.zip` z Michalovy design session (Claude Design)
převzat beze změn: 3 šablony (`F1-Homepage`, `F1-Pohori-Krkonose`
vč. pohledů Středisko + Nové komponenty, `F1-Katalog`), `README.md`
s kompletními instrukcemi pro kodéra, `image-slot.js`, 18 screenshotů.

## Dvě zjištění při intake

1. **`support.js` v balíku CHYBÍ** — prototypy `.dc.html` na něm stojí
   (mini-runtime Claude Design: `<x-dc>`, `<sc-for>`, mustache výrazy),
   takže se lokálně otevřou jen jako kostra s `{{ placeholder }}` texty
   (ověřeno headless 27. 7.). NEVADÍ pro implementaci: README výslovně
   říká, že runtime se do produkce nepřenáší — přenáší se vizuál,
   rozměry, interakce a tokeny. **Vizuální pravda = `screenshots/`
   + kód přímo v HTML** (markup, CSS, datové mocky čitelné).
   Kdyby bylo potřeba klikat lokálně, Michal může doexportovat
   `support.js` z téhož projektu.

2. **Sněžka na screenshotu `02-pohori.png` vypadá jako „1 803 m"** —
   je to jen artefakt čitelnosti halo popisky v PNG; zdrojový kód má
   všude správně **1 603 m** (grep ověřen). Čísla v mockách (41 chat,
   rozpětí 1 025–1 410 m, počty ve vitríně…) jsou vzorky nad zmenšeným
   indexem — v produkci se VŠECHNA počítají z DB při buildu, nikdy se
   nepřepisují ručně.

Implementační plán: BACKLOG položka **F1-IMPL** (fáze F1a–F1f).
