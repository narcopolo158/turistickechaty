import React from 'react'
import HutCard from '@/components/HutCard'
import {
  Button,
  ButtonLink,
  Chip,
  HutRow,
  InfoBox,
  SectionBar,
  StatusPill,
  TrailBlaze,
} from '@/components/ui'

export const metadata = {
  title: 'Styleguide komponent — turistickechaty.cz',
  robots: { index: false, follow: false },
}

/* Interní referenční stránka komponent (F0-03). Texty a čísla níže jsou
   UKÁZKOVÁ DATA z designového prototypu — nejsou to ověřené údaje o chatách. */

function Blok(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: '20px 22px', marginBottom: 14 }}>
      <h2
        className="mn"
        style={{ fontSize: 10.5, letterSpacing: '.14em', color: 'var(--muted)', marginBottom: 14 }}
      >
        {props.title}
      </h2>
      {props.children}
    </div>
  )
}

export default function DesignPage() {
  return (
    <section className="wrap sec" style={{ paddingTop: 34, paddingBottom: 30 }}>
      <div className="mn" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 8 }}>
        Interní reference · neindexováno
      </div>
      <h1 className="sg" style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-.02em' }}>
        Komponenty
      </h1>
      <p style={{ color: 'var(--muted)', fontSize: 13.5, maxWidth: 560, margin: '4px 0 18px' }}>
        Designový systém „Moderní průvodce&ldquo; v2.2 — texty a čísla na této stránce jsou
        ukázková data z prototypu, ne ověřené údaje.
      </p>

      <Blok title="Sekční lišty">
        <SectionBar num="01" title="Nejbližší otevřené chaty" action={<a href="#chaty">Celý katalog →</a>} />
        <SectionBar num="02" title="Razítko" variant="red" action="Sbírka →" />
        <SectionBar num="04" title="Tehdy a dnes" variant="night" action="Archiv pohlednic" />
      </Blok>

      <Blok title="Tlačítka a odkazy">
        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
          <Button>＋ Razítko do deníku</Button>
          <ButtonLink href="#rezervace" variant="blue">
            Rezervovat nocleh
          </ButtonLink>
          <Button variant="ghost">Nahlásit změnu</Button>
          <Button variant="done">✓ Ve sbírce · 14. 6. 2026</Button>
          <Button variant="link">Výlet na Sněžku →</Button>
        </div>
      </Blok>

      <Blok title="Stavové pilulky">
        <StatusPill state="open">Otevřeno · dnes 8–18</StatusPill>
        <StatusPill state="closed">Zavřeno · sezóna od 12/26</StatusPill>
        <StatusPill state="gone">Zaniklá · 1982</StatusPill>
      </Blok>

      <Blok title="Chips — sousedé a filtry">
        <div style={{ marginBottom: 8 }}>
          <Chip label="Výrovka" value="0:45" />
          <Chip label="Poštovna" value="1:15" />
          <Chip label="U Bílého Labe" value="1:20" />
        </div>
        <div className="fchips">
          <span className="on">Vše · 37</span>
          <span>Otevřeno teď</span>
          <span>S noclehem</span>
          <span>Chybí mi razítko</span>
          <span>Zaniklé</span>
        </div>
      </Blok>

      <Blok title="Infoboxy">
        <div style={{ display: 'grid', gap: 10 }}>
          <InfoBox label="Tip průvodce">Přes Výrovku a Poštovnu vede nejhezčí okruh na Sněžku.</InfoBox>
          <InfoBox label="Příroda" variant="alpine">
            Hřebeny Krkonoš jsou 1. zóna KRNAP — pohyb jen po značených cestách.
          </InfoBox>
          <InfoBox label="Upozornění" variant="red">
            Ukázkový výstražný infobox — plná plocha, nikdy rámeček.
          </InfoBox>
        </div>
      </Blok>

      <Blok title="Pásové značky — 1:1 s terénem">
        <div style={{ marginBottom: 8 }}>
          <TrailBlaze color="cervena" box />
          <TrailBlaze color="modra" box />
          <TrailBlaze color="zelena" box />
          <TrailBlaze color="zluta" box />
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <TrailBlaze color="cervena" />
          <TrailBlaze color="modra" />
          <TrailBlaze color="zelena" />
          <TrailBlaze color="zluta" />
        </div>
      </Blok>

      <Blok title="Tabulkové řádky katalogu">
        <SectionBar num="01" title="Chaty v pohoří" action="28 + 9 na mapě →" />
        <HutRow
          href="#profil"
          name="Luční bouda"
          sub="hlavní hřeben · přes Modrý důl"
          elevation="1 410 m"
          beds="≈ 90 lůžek"
          status={{ state: 'open', text: '● Otevřeno' }}
        />
        <HutRow
          href="#profil"
          name="Výrovka"
          sub="pod Sněžkou"
          elevation="1 357 m"
          beds="≈ 50 lůžek"
          status={{ state: 'closed', text: 'Zavřeno · od 12/26' }}
        />
        <HutRow
          href="#profil"
          name="Obří bouda"
          sub="Obří sedlo · zanikla 1982"
          elevation="1 394 m"
          status={{ state: 'gone', text: 'Zaniklá · 1982' }}
          linkLabel="Historie →"
          last
        />
      </Blok>

      <Blok title="Karta chaty">
        <div className="hgrid">
          <HutCard
            href="#profil"
            name="Luční bouda"
            region="Krkonoše · hlavní hřeben"
            status={{ state: 'open', text: '● Otevřeno' }}
            facts={[
              { k: 'Výška', v: '1 410 m' },
              { k: 'Nocleh', v: '≈ 90' },
              { k: 'Ověřeno', v: '14. 6.' },
            ]}
          />
          <HutCard
            href="#profil"
            name="Výrovka"
            region="Krkonoše · pod Sněžkou"
            status={{ state: 'closed', text: 'Zavřeno · od 12/26' }}
            facts={[
              { k: 'Výška', v: '1 357 m' },
              { k: 'Nocleh', v: '≈ 50' },
              { k: 'Ověřeno', v: '2. 5.' },
            ]}
          />
          <HutCard
            href="#profil"
            name="Obří bouda"
            region="Krkonoše · Obří sedlo"
            status={{ state: 'gone', text: 'Zaniklá · 1982' }}
            facts={[
              { k: 'Výška', v: '1 394 m' },
              { k: 'Éra', v: '1847–82' },
              { k: 'Pohlednic', v: '6' },
            ]}
          />
        </div>
      </Blok>
    </section>
  )
}
