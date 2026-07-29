import React from 'react'

/**
 * Animovaná lanovka jako pozadí sekce (handoff F1, sekce 06 — „grafický prvek,
 * ne panel"). Dvě lana klesají napříč za kartami, tři podpěry, po lanech jedou
 * proti sobě dvě červené kabinky a dvě modré sedačky.
 *
 * PROČ CSS, A NE SMIL, jak návrh píše: SMIL `animateMotion` se nedá vypnout
 * médiem `prefers-reduced-motion` — musel by na to běžet skript
 * (`pauseAnimations()`). Pohyb po přímém laně se ale dá popsat i klíčovými
 * snímky (`left` a `top` v jedněch keyframes = přímka), a ten už systémové
 * nastavení respektuje bez jediného řádku JS. Kdo má animace vypnuté, uvidí
 * kabinky stát v půli lana; sekce tím nepřijde o nic, co by nesla informaci.
 *
 * Pozadí je čistá dekorace: `aria-hidden`, žádný text, žádný údaj. Kabinky
 * nejsou schéma konkrétní dráhy a nesmějí tak vypadat.
 */
export default function LanovkyScena() {
  return (
    <div className="lan-scena" aria-hidden="true">
      <svg className="lan-lana" viewBox="0 0 100 40" preserveAspectRatio="none">
        {/* Lana vedou horním pásem nad kartami: jedno klesá doprava, druhé
            stoupá, kříží se v první třetině. Souřadnice musí sedět s dráhami
            vozů v CSS (`lanA`/`lanB`) — jedno bez druhého by rozešlo lano
            a kabinu. */}
        <path className="lan-lano" d="M-2,3 L102,9" />
        <path className="lan-lano" d="M-2,8.6 L102,2.6" />
        {/* Podpěry: horní konec sedí na klesajícím laně, dolní pokračuje za
            karty — proto nekončí v pásu, ale až dole (karty ho zakryjí). */}
        <path className="lan-podpera" d="M22,20 L22,4.4" />
        <path className="lan-podpera" d="M52,20 L52,6.1" />
        <path className="lan-podpera" d="M80,20 L80,7.7" />
      </svg>

      <div className="lan-vozy">
        <span className="lan-voz lan-voz--a lan-voz--kabina">
          <span className="lan-kyv">
            <svg viewBox="0 0 26 30">
              <path className="lan-zaves" d="M13,0 L13,9" />
              <rect className="lan-telo lan-telo--cerv" x="3" y="9" width="20" height="17" rx="4" />
              <rect className="lan-okno" x="6.5" y="12.5" width="13" height="7" rx="2" />
            </svg>
          </span>
        </span>
        <span className="lan-voz lan-voz--b lan-voz--kabina">
          <span className="lan-kyv">
            <svg viewBox="0 0 26 30">
              <path className="lan-zaves" d="M13,0 L13,9" />
              <rect className="lan-telo lan-telo--cerv" x="3" y="9" width="20" height="17" rx="4" />
              <rect className="lan-okno" x="6.5" y="12.5" width="13" height="7" rx="2" />
            </svg>
          </span>
        </span>
        <span className="lan-voz lan-voz--c lan-voz--sedacka">
          <span className="lan-kyv">
            <svg viewBox="0 0 26 30">
              <path className="lan-zaves" d="M13,0 L13,11" />
              <path className="lan-telo lan-telo--modr" d="M6,11 L20,11 L20,20 L8,20 Z" />
              <path className="lan-noha" d="M8,20 L8,25" />
            </svg>
          </span>
        </span>
        <span className="lan-voz lan-voz--d lan-voz--sedacka">
          <span className="lan-kyv">
            <svg viewBox="0 0 26 30">
              <path className="lan-zaves" d="M13,0 L13,11" />
              <path className="lan-telo lan-telo--modr" d="M6,11 L20,11 L20,20 L8,20 Z" />
              <path className="lan-noha" d="M8,20 L8,25" />
            </svg>
          </span>
        </span>
      </div>
    </div>
  )
}
