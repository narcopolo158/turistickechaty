import { readFile } from 'fs/promises'
import path from 'path'
import { ImageResponse } from 'next/og'

import { formatCislo, getChataBySlug, TYP_NAZEV } from '@/lib/chaty'

export const revalidate = 600
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const alt = 'Profil chaty na turistickechaty.cz'

const font = (soubor: string) =>
  readFile(path.join(process.cwd(), 'src/lib/og-fonty', soubor))

/**
 * OG obrázek generovaný z dat (plán kap. 6): doména · název + výška · stav.
 * Vizuál dle náhledu v prototypu (.og): silueta hor nahoře, bílý datový pruh dole,
 * červený topline jako hřbet průvodce.
 */
export default async function OgImage(props: { params: Promise<{ chata: string }> }) {
  const params = await props.params
  const chata = await getChataBySlug(params.chata)
  const oblast = chata && typeof chata.oblast === 'object' ? chata.oblast : null

  const nazev = chata?.nazev ?? 'Turistické chaty'
  const vyska = chata?.vyska != null ? ` · ${formatCislo(chata.vyska).replace(/\u202F|\u00A0/g, ' ')} m` : ''
  const sub = chata
    ? [
        chata.typ ? TYP_NAZEV[chata.typ] : null,
        chata.stav === 'v-provozu' ? 'otevřeno' : chata.stav === 'zanikla' ? 'zaniklá' : null,
        chata.sezona,
      ]
        .filter(Boolean)
        .join(' · ')
    : 'průvodce turistickými chatami'

  const [sg, inter] = await Promise.all([
    font('space-grotesk-700.ttf'),
    font('inter-600.ttf'),
  ])

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: '#F7F6F0',
          borderTop: '14px solid #E0341F',
          fontFamily: 'Inter',
        }}
      >
        <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
          {/* silueta hor — ilustrace dle placeholder gradientu prototypu */}
          <svg width="1200" height="420" viewBox="0 0 1200 420" style={{ position: 'absolute', top: 0, left: 0 }}>
            <rect width="1200" height="420" fill="#DBE7F0" />
            <circle cx="940" cy="86" r="52" fill="#F4C46A" opacity="0.9" />
            <path
              d="M0,250 C160,205 320,228 450,198 C590,166 690,205 820,178 L950,120 L1060,200 C1120,222 1170,228 1200,232 L1200,420 L0,420 Z"
              fill="#93AB97"
            />
            <path d="M0,310 C210,270 430,295 640,268 C850,242 1040,282 1200,262 L1200,420 L0,420 Z" fill="#64815F" />
            <path d="M0,368 C265,340 560,358 825,336 C985,326 1120,340 1200,332 L1200,420 L0,420 Z" fill="#41573F" />
          </svg>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: '#FFFFFF',
            padding: '34px 56px 38px',
            gap: 6,
          }}
        >
          <div style={{ fontSize: 22, color: '#E0341F', letterSpacing: 3, textTransform: 'uppercase' }}>
            {`turistickechaty.cz${oblast ? ` · ${oblast.nazev}` : ''}`}
          </div>
          <div
            style={{
              fontFamily: 'Space Grotesk',
              fontSize: 64,
              fontWeight: 700,
              color: '#384057',
              letterSpacing: -1.5,
            }}
          >
            {`${nazev}${vyska}`}
          </div>
          {sub && <div style={{ fontSize: 26, color: '#5E6971' }}>{sub}</div>}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: 'Space Grotesk', data: sg, weight: 700, style: 'normal' },
        { name: 'Inter', data: inter, weight: 600, style: 'normal' },
      ],
    },
  )
}
