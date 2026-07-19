import React from 'react'

export default function HomePage() {
  return (
    <section className="wrap hero">
      <div className="kick mn">
        <i aria-hidden="true" />
        Průvodce horskými chatami · Česko a Slovensko
      </div>
      <h1>
        Každá bouda, <span style={{ color: 'var(--red)' }}>útulna</span> i bivak.
        <br />S horami, příběhem a <span style={{ color: 'var(--blue)' }}>razítkem</span>.
      </h1>
      <p>
        Připravujeme profily chat s ověřenými otvíračkami a trasami, historii s dobovými
        pohlednicemi a sbírku razítek jako za mlada. Začínáme Krkonošemi.
      </p>
    </section>
  )
}
