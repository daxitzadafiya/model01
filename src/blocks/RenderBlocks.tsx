import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FormBlock } from '@/blocks/Form/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { HeroBlock } from '@/blocks/HeroBlock/Component'
import { StatsBlock } from '@/blocks/StatsBlock/Component'
import { MissionBlock } from '@/blocks/MissionBlock/Component'
import { PropertiesBlock } from '@/blocks/PropertiesBlock/Component'
import { PropertyListBlock } from '@/blocks/PropertyListBlock/Component'
import { InteractiveMapBlock } from '@/blocks/InteractiveMapBlock/Component'
import { VirtualTourBlock } from '@/blocks/VirtualTourBlock/Component'
import { AdvisorsBlock } from '@/blocks/AdvisorsBlock/Component'
import { TestimonialsBlock } from '@/blocks/TestimonialsBlock/Component'
import { KnowledgeBaseBlock } from '@/blocks/KnowledgeBaseBlock/Component'
import { DualActionBlock } from '@/blocks/DualActionBlock/Component'
import { FounderSpotlightBlock } from '@/blocks/FounderSpotlightBlock/Component'
import { WhoWeAreBlock } from '@/blocks/WhoWeAreBlock/Component'
import { AboutUsHeroBlock } from '@/blocks/AboutUsHeroBlock/Component'
import { MapBlock } from '@/blocks/MapBlock/Component'
import { ContactSectionBlock } from '@/blocks/ContactSectionBlock/Component'
import { PrivacyPolicyBlock } from '@/blocks/PrivacyPolicyBlock/Component'
import { CertificatesBlock } from '@/blocks/CertificatesBlock/Component'

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  heroBlock: HeroBlock,
  statsBlock: StatsBlock,
  missionBlock: MissionBlock,
  propertiesBlock: PropertiesBlock,
  propertyListBlock: PropertyListBlock,
  interactiveMapBlock: InteractiveMapBlock,
  virtualTourBlock: VirtualTourBlock,
  advisorsBlock: AdvisorsBlock,
  testimonialsBlock: TestimonialsBlock,
  knowledgeBaseBlock: KnowledgeBaseBlock,
  dualActionBlock: DualActionBlock,
  founderSpotlightBlock: FounderSpotlightBlock,
  whoWeAreBlock: WhoWeAreBlock,
  aboutUsHeroBlock: AboutUsHeroBlock,
  mapBlock: MapBlock,
  contactSectionBlock: ContactSectionBlock,
  privacyPolicyBlock: PrivacyPolicyBlock,
  certificatesBlock: CertificatesBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              return (
                <Fragment key={index}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </Fragment>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
