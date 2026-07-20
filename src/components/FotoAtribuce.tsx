import type { Fotky as Fotka } from '@/payload-types'

/** Zobrazovaný text licence — u CC licencí přesné znění z licencePoznamka (např. „CC BY-SA 4.0"). */
const LICENCE_TEXT: Record<string, string> = {
  'cc-by': 'CC BY',
  'cc-by-sa': 'CC BY-SA',
  cc0: 'CC0',
  pd: 'volné dílo',
}

/**
 * Atribuce převzaté fotky přímo u snímku (licenční povinnost CC BY / CC BY-SA;
 * viz kolekce Fotky: „u převzatých se atribuce zobrazuje přímo u fotky na webu").
 * Prototyp fotoatribuci neřeší (image-slot je placeholder) — štítek jde vědomě
 * mírně nad jeho rámec, ve vizuálním jazyce hero (mini text, tmavá kapsle).
 * U vlastních fotek redakce (licence „vlastni") se nezobrazuje nic.
 */
export function FotoAtribuce({ fotka }: { fotka: Fotka }) {
  if (!fotka.autor || fotka.licence === 'vlastni') return null
  const licence = fotka.licencePoznamka || (fotka.licence ? LICENCE_TEXT[fotka.licence] : null)
  const text = ['Foto: ' + fotka.autor, licence].filter(Boolean).join(' · ')
  return fotka.zdrojUrl ? (
    <a className="fatr" href={fotka.zdrojUrl} target="_blank" rel="noopener noreferrer">
      {text}
    </a>
  ) : (
    <span className="fatr">{text}</span>
  )
}
