import React from 'react'

/**
 * Patička webu: brand řádek 1:1 dle prototypu + tiráž „Zdroje dat" (DATA-01).
 *
 * Tiráž je drobné rozšíření nad rámec prototypu: licence ODbL vyžaduje viditelnou
 * atribuci OpenStreetMap, jakmile průvodce stojí i nad OSM daty (pipeline DATA-01
 * kandidátů už běží) — a mapové podklady i písma si zaslouží řádné uvedení také.
 * Vizuální jazyk drží patičku: stejný wrap, menší mutovaný text, běžné odkazy.
 */
export default function SiteFooter() {
  return (
    <footer className="foot">
      <div className="wrap">
        <span className="sg" style={{ fontWeight: 700 }}>
          Turistické chaty
        </span>
        {/* Brand řádek říká, ČÍM průvodce je — ne kam se zrovna dostal
            (rozhodnutí Michala 31. 7. 2026: „v patičce bych nedával roadmapu,
            rovnou to stav pro finální stav, ať to nemusíme měnit při každé
            aktualizaci"). Do té doby tu stála šipková roadmapa začínající
            Krkonošemi — poslední místo na webu, kde pilotní pohoří stálo
            napevno, a s každou další oblastí by zastarávala. Nové znění je
            totéž jako nadpis homepage, takže se obojí drží pohromadě. */}
        <span>průvodce turistickými chatami od českých hor po Alpy</span>
        <span className="mn" style={{ marginLeft: 'auto', fontSize: 9 }}>
          MAPY.COM · KČT · SIL OFL FONTY
        </span>
      </div>
      {/* Tiráž je od 31. 7. 2026 JEDINÉ místo, kde web mluví o původu dat
          souhrnně (zadání Michala: „zdroje nemusí být na každém řádku textu,
          ale nějak pohromadě v patičce nebo pod textem"). Z homepage kvůli
          tomu zmizely poznámky pod jednotlivými pásy — přibyly sem fotky
          a otisky, aby tu byl výčet úplný. Konkrétní zdroj konkrétního údaje
          zůstává u údaje na profilu; tohle je přehled, ne náhrada. */}
      <div className="wrap zdroje">
        <span className="mn">Zdroje dat:</span> každý údaj o chatě má svůj zdroj uvedený přímo na
        profilu. Databázi chat stavíme nad weby jednotlivých chat a nad daty{' '}
        <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> — © přispěvatelé
        OpenStreetMap, licence <a href="https://opendatacommons.org/licenses/odbl/1-0/">ODbL</a>.
        Mapové podklady <a href="https://api.mapy.com/copyright">Mapy.com</a> © Seznam.cz a.s. a
        další. Turistické značení v terénu spravuje{' '}
        <a href="https://kct.cz">Klub českých turistů</a>. Fotografie přebíráme z{' '}
        <a href="https://commons.wikimedia.org">Wikimedia Commons</a> pod licencemi CC (autor
        a licence u každého snímku), otisky razítek se svolením sbírky{' '}
        <a href="https://razitkuj.cz">razitkuj.cz</a>.
      </div>
    </footer>
  )
}
