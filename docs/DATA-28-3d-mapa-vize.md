# DATA-28 · Vize 3D mapy — kde žije a jak ji vyšperkovat

*Zadání Michala (27. 7. 2026): mapa na úrovni pohoří celá — klidně do hero
sekce; na detailu chaty výřez s umístěním aktuální chaty, možností otáčení
a rozklikem celé mapy. „Vyšperkovat pro maximální wow — animované lanovky
apod. Jak do 3D modelu dostat život? Jak to udělat nejkrásnější?"*

Prototyp: `docs/experimenty/3d-teren-krkonose.html` (ostrý výškopis Mapy.com
240×144, 17 153 úseků značených tras OSM, 58 vrcholů; generuje
`scripts/data28-3d-teren.ts` v Actions).

---

## 1. Kde mapa žije

**A. Hero stránky pohoří** (`/cesko/krkonose`): full-bleed scéna za titulkem.
Při načtení pomalá autorotace v „golden hour" světle; scroll mapu odsune za
obsah (parallax). Ovládání se odemyká až kliknutím **„Prozkoumat ve 3D"** —
jinak by mapa kradla scroll. LCP řeší předrenderovaný poster (první snímek
jako obrázek, scéna se hydratuje po něm). `prefers-reduced-motion` → statický
poster bez autorotace. Mobil: poster + tap-to-open fullscreen.

**B. Detail chaty: výřez ~6×6 km** centrovaný na chatu. Kamera na orbitě kolem
pinu, tahem se otáčí, pin aktuální chaty zvýrazněný (větší vlaječka + pulz).
Tlačítko „Otevřít celou mapu" → velká mapa s **fly-to**: kamera doletí na
chatu plynulým obloukem. Deep-link `?chata=<slug>` — odkaz na mapu
s konkrétní boudou jde poslat. Výřez = subset téže mřížky (žádná další data).

**C. Og-obrázky profilů z 3D.** Headless render (playwright pipeline už
existuje) vygeneruje pro každý profil og-image: výřez terénu s vlaječkou
chaty. Každé sdílení profilu na sítích ukazuje 3D Krkonoše s vyznačenou
boudou. Levné, unikátní, běží v Actions po každé změně korpusu.

**D. Samostatná stránka „Mapa"** pro přímé sdílení a fullscreen (stejná
komponenta, jen route).

## 2. Wow — seřazeno podle poměru efekt/práce

### P0 — bez čeho to nemá smysl pouštět ven

1. **Skutečné světlo.** Dráha slunce podle hodiny dne (výchozí = čas
   návštěvníka; posuvník). Stínová mapa terénu — ráno dlouhé stíny hřebenů
   do dolů, večer zlatá. Jedna DirectionalLight + shadowmap, MeshStandard.
2. **Noc a světla bud.** Po setmění tmavá scéna, hvězdy, a **boudy se
   rozsvítí** (teplé emissive body + jemný glow sprite; jen `v-provozu`).
   Emočně nejsilnější prvek — „světla bud" jsou krkonošská ikonografie.
   Váže se na dark mode webu.
3. **Roční doby.** Sněžná čára v shaderu (výška + sklon), řízená měsícem
   nebo přepínačem: zima bílá s modrými stíny, léto zelené, podzim okr.
4. **Stíny mraků.** Pomalu plující šumová textura násobící osvětlení svahů.
   Pár řádek shaderu, zásadní dojem hloubky.
5. **Fly-to + vlaječky + karty.** Klik na chatu → karta s hero fotkou
   (Commons už máme) a odkazem na profil; výběr z vyhledávání → kamera letí.
   Vlaječky v designu značky (pásová značka, Space Grotesk).
6. **Diorama estetika** (rozhodnutí stylu, viz §3): krémový „sokl" s kótami
   souřadnic po obvodu, lesy z OSM jako tmavší pole, skály na prudkých
   svazích, kosodřevina nad hranicí lesa. Stylizace, ne pseudorealismus.

### P1 — život

7. **Animované lanovky.** OSM `aerialway` (kabinky Sněžka, Černohorský
   express, sedačky Medvědín/Svatý Petr, vleky) — jeden rozšířený Overpass
   běh DATA-28. Podpěry v intervalech, prověšené lano (catenary), po něm
   **jedoucí kabinky** oběma směry. Rychlost realistická, hustota malá.
8. **Řeky.** OSM `waterway` (Labe, Úpa, Bílé Labe…) s animovaným tokem
   (scroll normal mapy / dash offset) — třpyt v údolích.
9. **Inverze.** Poloprůhledná mlha v údolích pod ~900 m (vrstva s šumem),
   hřeben nad ní. Přepínač / vazba na počasí-náladu scény.
10. **Kouř z komínů.** V zimě a večer tenký particle proužek nad
    provozovanými boudami. Střídmě.
11. **Časová osa 1530–2026.** Posuvník roku: boudy se objevují dle
    `rokVzniku`, zaniklé svítí jako „duchové" a mizí (data Atlasu zaniklých
    + `data/zanikle/`). **Feature-příkop: vizualizace našich ověřených dat,
    kterou konkurence nemůže okopírovat, protože data nemá.**

### P2 — třešně

12. **Přelet přechodu/výletu.** Výběr přechodu chata–chata → kamera letí
    podél skutečné trasy (geometrie z DATA-06), dole se odvíjí výškový
    profil. Formát pro 10 výletů fáze 1 — každý výlet jako mini-film
    (a exportovatelné video pro sítě).
13. **Turisté na trasách.** Pár drobných teček putujících po hřebenovce za
    dne. Hodně střídmě, vypínatelné.
14. **Ptáci** nad údolími (občasné hejno, sprite). **Zvuk** (vítr, ptáci)
    default OFF.
15. **Zonace KRNAP** jako přepínatelná vrstva (užitečné + unikátní).

## 3. Estetika: přiznané muzejní diorama

Doporučení: NE pseudorealismus (ortofoto se pere s licencemi i se značkou),
ALE stylizovaný „papírový model v muzeu": hypsometrie v barvách projektu,
vystřižené hrany bboxu jako sokl, kolem krémový rám s kótami souřadnic
(jako okraj staré mapy), jemný papírový grain. Ladí s nostalgií knižního
průvodce a razítek; dark mode = noční varianta se svítícími boudami.
Popisky: Space Grotesk pro vrcholy, Inter pro UI; barvy tras = přesné KČT.

## 4. Technika (Next.js)

- **react-three-fiber + drei** (CameraControls, Html popisky), komponenta
  `<Mapa3D>` s prop `rezim: 'hero' | 'vyrez' | 'plna'`; dynamic import,
  IntersectionObserver, DPR cap 2, WebGL2 check → poster fallback.
- **Data:** výškopis jako kvantovaná binární mřížka (Uint16 → ~70 kB gzip
  místo 1,7 MB JSON); trasy zjednodušené per-zoom; vše servíruje Next
  z `public/` nebo Payload endpointu. Lanovky/řeky/lesy = rozšíření
  `data28` o další Overpass vrstvy (jeden běh).
- **Výkon:** sloučené LineSegments per barva (hotovo v prototypu),
  instancing pro stromy/kabinky, geomorph LOD při zoomu, žádný
  postprocessing kromě jemného bloomu v noci.
- **Poctivost:** atribuce trvale viditelná (Mapy.com výškopis — podmínka
  tarifu; OSM ODbL). Dekorace (kouř, turisté, mraky) jsou VÝSLOVNĚ
  dekorace — nikdy nesmějí vypadat jako data (žádný kouř z boudy, o níž
  nevíme, že topí; turisté jsou anonymní tečky bez vazby na realitu).
  Výškový model zůstává verified:false a v tiráži mapy to stojí.

## 5. Pořadí prací (návrh)

1. Rozšířit `data28` o vrstvy: aerialway, waterway, lesy, sjezdovky
   (1 Actions běh) + binární formát mřížky.
2. Port prototypu do `<Mapa3D>` (r3f) s režimy hero/výřez/plná + fly-to.
3. P0 světlo/noc/sezóny/mraky + diorama sokl.
4. Og-obrázky z headless renderu do Actions.
5. P1 lanovky → řeky → inverze → časová osa.
6. P2 přelety výletů (až budou trasy DATA-06 hotové).

*Krok 1–2 jsou podmínkou nasazení do F1 webu; P0 je „launch look"; P1
se dá pouštět po kusech jako novinky (obsah pro sítě zadarmo).*
