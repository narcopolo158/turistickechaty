# DATA-41 · Plošný průzkum ČR mimo hlavní pohoří

Zadání Michala 10. 8. 2026: *„prohledej zbytek ceske republiky a najdi
dalsi turistické chaty mimo hlavni pohori — treba hvezda na broumovsku,
tur. chata v prachovskych skalach apod."*

Průzkum navazuje na systém přesahových oblastí (DATA-29) a na klíč
zařazení z CLAUDE.md: **rozhoduje role na trase a občerstvení pro
veřejnost, ne typ stavby ani nadmořská výška** — a kde to nejsou hory,
průvodce to říká (úroveň `turisticka-oblast`).

Stav ke dni 10. 8. 2026. Každá položka nese druh záznamu v repu;
„signály existence" = ověřeno jen hledáním (titulky, domény), obsah
stránek neotevřen — vzor ručního kandidáta Prachov z 27. 7.

## Hotovo touto session (10. 8.)

| objekt | oblast | stav v repu |
|---|---|---|
| Turistická chata Prachov | cesky-raj | **PROFIL** (první profil turistické oblasti; KČT, 1921/22, 40 lůžek) |
| Chata Hvězda | broumovsko (NOVÁ oblast) | **PROFIL** (klášterní hostinec 1856; mimo-provoz — rekonstrukce do IV/2027) |
| Chata Lovoš (České středohoří) | ceske-stredohori | kandidát (signály: KČT Lovosice, chata-lovos.cz, známka č. 489) |
| Chata Macocha (Moravský kras) | moravsky-kras | kandidát (signály: chatamacocha.cz, u horního můstku propasti) |
| Lesní penzion Bunč (Chřiby) | chriby | kandidát (signály: bunc.cz, restaurace dle Trekingu) |
| Chata Tesák (Hostýnské vrchy) | hostynske-vrchy | kandidát (signály: chatatesak.cz; POZOR na překryv s beskydským oknem) |
| Turistická chata Čeřínek (Vysočina) | vysocina | kandidát (signály: DoJihlavy.cz; KČT? dotáhnout) |
| Holubyho chata (V. Javorina, Bílé Karpaty) | bile-karpaty | kandidát (signály: 920 m, hraniční hora; ~1924? dotáhnout; budova nejspíš na SK straně) |

## Už v repu z dřívějška (nezakládat znovu)

- **Raisova chata na Zvičině** — PROFIL (přesahový zápis v sekci
  krkonose z 27. 7.; vlastní oblast podkrkonosi vznikne s dalšími
  objekty). Duplicitní kandidát z dnešního průzkumu smazán — chytila
  ho kontrola kolizí.
- **Hornychova chata na Táboře** — kandidát (podkrkonosi).
- **Riegrova chata na Kozákově** — kandidát (cesky-raj).
- **Milešovka** (chata + rozhledna) — kandidáti v krusne-hory;
  příslušnost k Českému středohoří posoudí redakce (poznámka
  z 9. 8. u kolizí), s oblastí ceske-stredohori teď existuje cíl.
- **Chaty na Tokáni + Daxensteinbaude + Räuberhütte** — kandidáti
  v luzicke-hory / krusne-hory; všechny leží v Českosaském
  Švýcarsku → až vznikne oblast, přesun (poznámky v kandidátech).

## K PROVĚŘENÍ v dalších bězích (zatím BEZ záznamu — jen tipy, nic
## se netvrdí)

Seznam vzešel z dnešního hledání okrajově, NEBYL jednotlivě ověřen —
každá položka potřebuje vlastní rešerši, než se založí byť jen
kandidát:

- **České Švýcarsko:** Mezní Louka (hotel/kemp na hlavní trase),
  Sokolí hnízdo pod Pravčickou branou.
- **Kokořínsko, Křivoklátsko, Brdy:** turistické chaty nedoloženy —
  projít katalog KČT chat (kct.cz/chaty vede kompletní seznam
  klubových chat; dnešní průzkum z něj potvrdil Prachov, Zvičinu
  a Lovoš).
- **Vysočina:** Křemešník (poutní místo s hotelem), Žďárské vrchy
  (Devět skal?).
- **Slavkovský les:** Kladská (lovecký zámeček s restaurací na
  naučné stezce).
- **Drahanská vrchovina / okolí Brna:** chaty kolem Jedovnic
  a Babího lomu.
- **Zlatý chlum (Jesenicko), Háj u Aše, Čerchov (Český les)** —
  rozhledny s občerstvením? Český les nemá oblast vůbec.
- **Pálava, Ždánický les, Litenčické vrchy:** spíš vinařské než
  chatové — pravděpodobně nic, ale neprověřeno.

## Doporučený postup

1. Povyšovat kandidáty z dnešního průzkumu po rešerších (vzor
   Prachov/Hvězda) — každý první profil otvírá oblast.
2. Katalog chat KČT (kct.cz/chaty) projít SYSTEMATICKY — je to
   autoritativní seznam klubových chat a dnešní vzorek ukázal, že
   mimo hlavní pohoří jich vede víc.
3. Oblasti zakládat jako `turisticka-oblast` (vzor cesky-raj,
   broumovsko) — bez oken DATA-01, dokud není důvod plošně
   prohledávat.
