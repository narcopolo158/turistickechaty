'use client'

/** Tisk stránky průvodce — print CSS skryje chrome a přidá patičku (.pfoot). */
export default function TiskButton() {
  return (
    <button type="button" className="btn gh" onClick={() => window.print()}>
      Vytisknout stránku průvodce ⎙
    </button>
  )
}
