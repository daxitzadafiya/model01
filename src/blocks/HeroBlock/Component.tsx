'use client'

import React from 'react'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { Media } from '@/components/Media'

type Props = Extract<Page['layout'][0], { blockType: 'heroBlock' }>

export const HeroBlock: React.FC<Props> = ({ title, buttonText, backgroundImage, showSearch }) => {
  const ref = useReveal()

  return (
    <div ref={ref}>
      <section className="relative min-h-[100dvh] md:h-screen w-full overflow-hidden -mt-16 md:-mt-20">
        <div className="absolute inset-0 hero-gradient z-10"></div>
        {typeof backgroundImage === 'object' && backgroundImage !== null && (
          <div className="absolute inset-0 w-full h-full object-cover">
            <Media resource={backgroundImage} fill priority imgClassName="object-cover" />
          </div>
        )}
        <div className="relative z-20 h-full flex flex-col items-center justify-center text-center px-margin-mobile md:px-margin-desktop pt-20 pb-32 md:pt-0 md:pb-0">
          <h1 className="font-headline-lg-mobile md:font-display-lg text-headline-lg-mobile md:text-display-lg text-white max-w-4xl mb-6 md:mb-8 reveal">
            {title}
          </h1>
          <button className="px-8 md:px-10 py-3 md:py-4 bg-tertiary text-white rounded-full font-label-nav text-label-nav uppercase tracking-widest hover:bg-tertiary-container transition-all shadow-xl active:scale-95 reveal">
            {buttonText}
          </button>
        </div>
        {/* Scroll Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-20 hidden sm:flex flex-col items-center animate-bounce text-white/70">
          <span className="font-label-sm text-label-sm mb-2">SCROLL</span>
          <span className="material-symbols-outlined">keyboard_arrow_down</span>
        </div>
      </section>

      {/* Floating Search */}
      {showSearch && (
        <div className="relative z-30 max-w-5xl mx-auto -mt-10 md:-mt-16 px-margin-mobile md:px-margin-desktop reveal">
          <div className="bg-surface-container-lowest p-2 rounded-xl md:rounded-2xl shadow-2xl">
            <div className="flex border-b border-outline-variant/30 px-4 md:px-6">
              <button className="py-3 md:py-4 px-4 md:px-6 font-label-nav text-label-nav text-primary border-b-2 border-tertiary">
                FOR SALE
              </button>
              <button className="py-3 md:py-4 px-4 md:px-6 font-label-nav text-label-nav text-secondary hover:text-primary transition-colors">
                FOR RENT
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 md:p-6 items-end">
              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-2">LOCATION</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-tertiary">location_on</span>
                  <input
                    className="w-full pl-10 pr-4 py-3 bg-surface-container border border-outline-variant rounded-lg focus:border-tertiary focus:ring-0 text-body-md font-body-md"
                    placeholder="Athens, Cyclades..."
                    type="text"
                  />
                </div>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-2">PROPERTY TYPE</label>
                <select className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-lg focus:border-tertiary focus:ring-0 text-body-md font-body-md">
                  <option>All Types</option>
                  <option>Villa</option>
                  <option>Penthouse</option>
                  <option>Private Island</option>
                </select>
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-secondary mb-2">PRICE RANGE</label>
                <select className="w-full px-4 py-3 bg-surface-container border border-outline-variant rounded-lg focus:border-tertiary focus:ring-0 text-body-md font-body-md">
                  <option>Any Price</option>
                  <option>€1M - €3M</option>
                  <option>€3M - €10M</option>
                  <option>€10M+</option>
                </select>
              </div>
              <button className="w-full h-[50px] bg-primary text-white rounded-full font-label-nav text-label-nav uppercase tracking-widest hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                <span className="material-symbols-outlined">search</span>
                Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
