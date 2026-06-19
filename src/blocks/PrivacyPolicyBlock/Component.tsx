'use client'

import React, { useEffect, useMemo, useState } from 'react'

import { CMSLink } from '@/components/Link'
import RichText from '@/components/RichText'
import { Media } from '@/components/Media'
import type { Page } from '@/payload-types'
import { useReveal } from '@/utilities/useReveal'
import { SocialIcon } from '@/components/SocialIcon'

type Props = Extract<Page['layout'][0], { blockType: 'privacyPolicyBlock' }>

type ContactPanel = NonNullable<NonNullable<Props['sections']>[number]['contactPanel']>

function getContactPanelLink(contactPanel: ContactPanel) {
  const { buttonLink, email } = contactPanel
  const hasConfiguredLink = Boolean(
    buttonLink?.url || (buttonLink?.type === 'reference' && buttonLink?.reference),
  )

  if (hasConfiguredLink && buttonLink) {
    return buttonLink
  }

  if (email) {
    return { type: 'custom' as const, url: `mailto:${email}`, newTab: false }
  }

  return null
}

const ContactPanel: React.FC<{ panel: ContactPanel }> = ({ panel }) => {
  const actionLink = getContactPanelLink(panel)

  return (
    <div className="border border-tertiary/30 p-8 md:p-10 bg-surface text-center mt-6">
      {panel.title && <h4 className="font-headline-sm text-headline-sm mb-2">{panel.title}</h4>}
      {panel.email && (
        <p className="font-label-nav text-label-nav text-tertiary mb-6 uppercase">{panel.email}</p>
      )}
      {panel.buttonLabel && actionLink && (
        <CMSLink
          {...actionLink}
          appearance="inline"
          className="inline-flex px-10 py-3.5 bg-primary text-on-primary rounded-full font-label-nav text-label-nav uppercase tracking-widest hover:bg-tertiary text-white transition-all duration-300"
          label={panel.buttonLabel}
        />
      )}
    </div>
  )
}

export const PrivacyPolicyBlock: React.FC<Props> = ({
  eyebrow,
  title,
  introText,
  tocTitle,
  sections,
}) => {
  const ref = useReveal()
  const validSections = useMemo(
    () => (sections || []).filter((section) => Boolean(section.anchorId)),
    [sections],
  )
  const [activeSectionId, setActiveSectionId] = useState<string | null>(
    validSections[0]?.anchorId || null,
  )

  useEffect(() => {
    if (!validSections.length) return

    const sectionElements = validSections
      .map((section) => document.getElementById(section.anchorId || ''))
      .filter((el): el is HTMLElement => Boolean(el))

    if (!sectionElements.length) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible.length > 0) {
          setActiveSectionId(visible[0].target.id)
        }
      },
      {
        rootMargin: '-25% 0px -60% 0px',
        threshold: [0.15, 0.35, 0.55],
      },
    )

    sectionElements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [validSections])

  return (
    <section ref={ref} className="bg-surface py-20 md:py-24">
      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop mb-14 md:mb-20 reveal">
        {eyebrow && (
          <span className="font-label-sm text-label-sm text-tertiary uppercase tracking-[0.2em] block mb-4">
            {eyebrow}
          </span>
        )}
        {title && (
          <h1 className="font-display-lg text-display-lg border-b border-outline-variant pb-6 md:pb-8">
            {title}
          </h1>
        )}
        {introText && (
          <p className="font-body-lg text-body-lg text-on-surface-variant mt-6 md:mt-8 max-w-2xl">
            {introText}
          </p>
        )}
      </div>

      <div className="max-w-max-width mx-auto px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row gap-gutter">
        <aside className="md:w-1/4 hidden md:block">
          <div className="sticky top-28 border-l border-outline-variant pl-8 space-y-5 reveal">
            {tocTitle && (
              <h3 className="font-label-sm text-label-sm text-medium-grey uppercase tracking-wider mb-3">
                {tocTitle}
              </h3>
            )}
            {(sections || []).map((section, i) =>
              section.anchorId && section.tocLabel ? (
                <a
                  key={section.id || i}
                  className={`block font-label-nav text-label-nav transition-colors ${
                    activeSectionId === section.anchorId
                      ? 'text-primary border-l-2 border-tertiary pl-3 ml-[-14px]'
                      : 'text-on-surface-variant hover:text-tertiary'
                  }`}
                  href={`#${section.anchorId}`}
                >
                  {section.tocLabel}
                </a>
              ) : null,
            )}
          </div>
        </aside>

        <article className="md:w-3/4 max-w-none">
          {(sections || []).map((section, i) => (
            <React.Fragment key={section.id || i}>
              {section.showDividerBefore && (
                <hr className="border-t border-outline-variant my-12 md:my-16 reveal" />
              )}
              <section
                className="mb-12 md:mb-16 reveal scroll-mt-32"
                id={section.anchorId || undefined}
              >
                {section.heading && (
                  <h2 className="font-headline-md text-headline-md mb-6">{section.heading}</h2>
                )}

                {section.body && (
                  <RichText
                    className="[&_p]:font-body-md [&_p]:text-body-md [&_p]:text-on-surface [&_p]:leading-relaxed [&_p]:mb-5"
                    data={section.body}
                    enableGutter={false}
                  />
                )}

                {section.highlightQuote && (
                  <div className="bg-surface-container p-6 md:p-8 border-l-4 border-tertiary my-6 md:my-8">
                    <p className="font-body-md text-on-surface-variant italic m-0">
                      {section.highlightQuote}
                    </p>
                  </div>
                )}

                {section.featureCards && section.featureCards.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6 md:my-8">
                    {section.featureCards.map((card, cardIndex) => (
                      <div
                        className="p-5 md:p-6 border border-outline-variant hover:border-tertiary transition-colors"
                        key={card.id || cardIndex}
                      >
                        {card.icon && (
                          <SocialIcon className="text-tertiary mb-3" name={card.icon} size={24} />
                        )}
                        {card.title && (
                          <h4 className="font-label-nav text-label-nav uppercase mb-2">
                            {card.title}
                          </h4>
                        )}
                        {card.description && (
                          <p className="font-label-sm text-label-sm text-on-surface-variant">
                            {card.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {section.bulletItems && section.bulletItems.length > 0 && (
                  <ul className="list-none space-y-4 font-body-md text-on-surface-variant">
                    {section.bulletItems.map((item, itemIndex) => (
                      <li className="flex items-start gap-4" key={item.id || itemIndex}>
                        <SocialIcon
                          className="text-tertiary mt-1"
                          name={item.icon || 'FiCheckCircle'}
                          size={20}
                        />
                        <span>{item.text}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {section.visualPanel &&
                  typeof section.visualPanel.image === 'object' &&
                  section.visualPanel.image !== null && (
                    <div className="relative overflow-hidden aspect-16/6 bg-black my-6 md:my-8 rounded-lg group">
                      <Media
                        imgClassName="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700"
                        resource={section.visualPanel.image}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center flex flex-wrap gap-2 text-sm lg:text-base lg:gap-4 justify-center items-center">
                          {section.visualPanel.icon && (
                            <SocialIcon
                              className="text-on-primary mb-4"
                              name={section.visualPanel.icon}
                              size={48}
                            />
                          )}
                          {section.visualPanel.title && (
                            <h3 className="text-on-primary font-headline-sm uppercase tracking-widest">
                              {section.visualPanel.title}
                            </h3>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                {section.contactPanel &&
                  (section.contactPanel.title ||
                    section.contactPanel.email ||
                    section.contactPanel.buttonLabel) && (
                    <ContactPanel panel={section.contactPanel} />
                  )}
              </section>
            </React.Fragment>
          ))}
        </article>
      </div>
    </section>
  )
}
