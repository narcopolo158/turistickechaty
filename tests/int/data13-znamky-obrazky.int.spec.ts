/**
 * DATA-13: stahovač obrázků známek. Testuje čisté funkce (bez sítě): extrakci
 * URL obrázku z HTML detailu (og:image / twitter / image_src / fallback img),
 * příponu z MIME, absolutizaci relativní URL a — hlavně — **poctivostní filtr**:
 * bere se jen `system:'znamka'` a jen z turisticke-znamky.cz (svolení Holub),
 * bere se jen `system:'znamka'` a jen domény Turistické známky s.r.o.
 * (turisticke-znamky.cz i polská znaczki-turystyczne.pl — týž vydavatel), ne vizitky.
 */
import { describe, expect, it } from 'vitest'

import { absolutniUrl, extractObrazekUrl, jeGenericky, jeStazitelna, priponaObrazku } from '../../scripts/data13-znamky-obrazky'

const BASE = 'https://www.turisticke-znamky.cz/znamky/lucni-bouda-c11'

describe('DATA-13 · extractObrazekUrl', () => {
  it('bere /storage/item_images/ (skutečná cesta známky na tomto CMS)', () => {
    const html = '<img class="znamka" src="https://turisticke-znamky.cz/storage/item_images/medium/5662b3ed7372f7.33069373.png">'
    expect(extractObrazekUrl(html, BASE)).toBe('https://turisticke-znamky.cz/storage/item_images/medium/5662b3ed7372f7.33069373.png')
  })

  it('item_images má přednost před og:image a preferuje větší velikost než thumb', () => {
    const html =
      '<meta property="og:image" content="/img/logo.png">' +
      '<img src="/storage/item_images/thumb/x.png"><img src="/storage/item_images/medium/x.png">'
    expect(extractObrazekUrl(html, BASE)).toBe('https://www.turisticke-znamky.cz/storage/item_images/medium/x.png')
  })

  it('bere og:image (absolutní)', () => {
    const html = '<head><meta property="og:image" content="https://www.turisticke-znamky.cz/img/znamky/11.jpg"></head>'
    expect(extractObrazekUrl(html, BASE)).toBe('https://www.turisticke-znamky.cz/img/znamky/11.jpg')
  })

  it('og:image v opačném pořadí atributů', () => {
    const html = '<meta content="/img/znamky/11.jpg" property="og:image">'
    expect(extractObrazekUrl(html, BASE)).toBe('https://www.turisticke-znamky.cz/img/znamky/11.jpg')
  })

  it('relativní og:image se zabsolutní vůči detailu', () => {
    const html = '<meta property="og:image" content="/upload/znamka-11.png">'
    expect(extractObrazekUrl(html, BASE)).toBe('https://www.turisticke-znamky.cz/upload/znamka-11.png')
  })

  it('fallback na twitter:image, když og:image chybí', () => {
    const html = '<meta name="twitter:image" content="https://x.cz/znamky/11.webp">'
    expect(extractObrazekUrl(html, BASE)).toBe('https://x.cz/znamky/11.webp')
  })

  it('fallback na <img> se známkovým src, když meta chybí', () => {
    const html = '<body><img src="/foto/lucni.png" alt="x"><img src="/loga/znamka-detail.jpg"></body>'
    // první img se „znamk"/„foto"/„image"/„upload" — tady „/foto/lucni.png"
    expect(extractObrazekUrl(html, BASE)).toBe('https://www.turisticke-znamky.cz/foto/lucni.png')
  })

  it('nic bezpečného → null (radši nic než špatný obrázek)', () => {
    expect(extractObrazekUrl('<body><img src="/loga/logo.svg"></body>', BASE)).toBeNull()
    expect(extractObrazekUrl('<p>bez obrázku</p>', BASE)).toBeNull()
  })

  it('odmítne generický og:image (logo webu) → null', () => {
    const html = '<meta property="og:image" content="https://d2.znaczki-turystyczne.pl/images/pages/znacki_turystyczne.jpg">'
    expect(extractObrazekUrl(html, 'https://www.znaczki-turystyczne.pl/x')).toBeNull()
  })
})

describe('DATA-13 · jeGenericky (pojistka proti logu webu)', () => {
  it('generické cesty/soubory zamítne', () => {
    expect(jeGenericky('https://d2.znaczki-turystyczne.pl/images/pages/znacki_turystyczne.jpg')).toBe(true)
    expect(jeGenericky('https://x.cz/assets/logo.png')).toBe(true)
  })
  it('reálný obrázek známky (item_images) není generický', () => {
    expect(jeGenericky('https://turisticke-znamky.cz/storage/item_images/medium/5662b3ed7372f7.33069373.png')).toBe(false)
  })
})

describe('DATA-13 · priponaObrazku', () => {
  it('z MIME', () => {
    expect(priponaObrazku('image/png', 'x')).toBe('.png')
    expect(priponaObrazku('image/jpeg; charset=binary', 'x')).toBe('.jpg')
    expect(priponaObrazku('image/webp', 'x')).toBe('.webp')
  })
  it('z URL, když MIME neznámé', () => {
    expect(priponaObrazku('application/octet-stream', 'https://x.cz/a/b.PNG?v=2')).toBe('.png')
    expect(priponaObrazku('', 'https://x.cz/a/b.jpeg')).toBe('.jpg')
  })
  it('default .jpg', () => {
    expect(priponaObrazku('', 'https://x.cz/a/b')).toBe('.jpg')
  })
})

describe('DATA-13 · absolutniUrl', () => {
  it('relativní i absolutní', () => {
    expect(absolutniUrl('/a.jpg', BASE)).toBe('https://www.turisticke-znamky.cz/a.jpg')
    expect(absolutniUrl('https://y.cz/a.jpg', BASE)).toBe('https://y.cz/a.jpg')
  })
})

describe('DATA-13 · jeStazitelna (poctivostní filtr svolení)', () => {
  const p = (over: Partial<{ system: string; url: string }> = {}) => ({
    system: 'znamka',
    cislo: '11',
    nazev: 'Luční bouda',
    url: 'https://www.turisticke-znamky.cz/znamky/lucni-bouda-c11',
    stav: 'x',
    ...over,
  })

  it('bere známku z turisticke-znamky.cz', () => {
    expect(jeStazitelna(p())).toBe(true)
  })
  it('NEbere vizitku (Wander Book — bez svolení)', () => {
    expect(jeStazitelna(p({ system: 'vizitka', url: 'https://cs.wander-book.com/lucni-bouda-m211.htm' }))).toBe(false)
  })
  it('bere i znaczki-turystyczne.pl (polská verze TÉHOŽ vydavatele — se svolením)', () => {
    expect(jeStazitelna(p({ url: 'https://www.znaczki-turystyczne.pl/znaczkowe-miejsca-turystyczne/karkonosze-schronisko-pttk-samotnia-c52' }))).toBe(true)
  })
  it('NEbere neplatnou URL', () => {
    expect(jeStazitelna(p({ url: 'nonsense' }))).toBe(false)
  })
})
