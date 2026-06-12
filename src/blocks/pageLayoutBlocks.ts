import type { Block } from 'payload'

import { AboutUsHeroBlock } from '@/blocks/AboutUsHeroBlock/config'
import { AdvisorsBlock } from '@/blocks/AdvisorsBlock/config'
import { Archive } from '@/blocks/ArchiveBlock/config'
import { BlogPostsBlock } from '@/blocks/BlogPostsBlock/config'
import { CallToAction } from '@/blocks/CallToAction/config'
import { CertificatesBlock } from '@/blocks/CertificatesBlock/config'
import { ContactSectionBlock } from '@/blocks/ContactSectionBlock/config'
import { Content } from '@/blocks/Content/config'
import { DualActionBlock } from '@/blocks/DualActionBlock/config'
import { FormBlock } from '@/blocks/Form/config'
import { FounderSpotlightBlock } from '@/blocks/FounderSpotlightBlock/config'
import { HeroBlock } from '@/blocks/HeroBlock/config'
import { InteractiveMapBlock } from '@/blocks/InteractiveMapBlock/config'
import { KnowledgeBaseBlock } from '@/blocks/KnowledgeBaseBlock/config'
import { MapBlock } from '@/blocks/MapBlock/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { MissionBlock } from '@/blocks/MissionBlock/config'
import { PrivacyPolicyBlock } from '@/blocks/PrivacyPolicyBlock/config'
import { PropertiesBlock } from '@/blocks/PropertiesBlock/config'
import { PropertyListBlock } from '@/blocks/PropertyListBlock/config'
import { StatsBlock } from '@/blocks/StatsBlock/config'
import { TestimonialsBlock } from '@/blocks/TestimonialsBlock/config'
import { VirtualTourBlock } from '@/blocks/VirtualTourBlock/config'
import { WhoWeAreBlock } from '@/blocks/WhoWeAreBlock/config'

/**
 * Single source of truth for page layout blocks.
 * Auto-translate discovers localized fields from these configs — no manual registry.
 */
export const pageLayoutBlocks = [
  CallToAction,
  Content,
  MediaBlock,
  Archive,
  FormBlock,
  HeroBlock,
  StatsBlock,
  MissionBlock,
  PropertiesBlock,
  PropertyListBlock,
  InteractiveMapBlock,
  VirtualTourBlock,
  AdvisorsBlock,
  TestimonialsBlock,
  KnowledgeBaseBlock,
  DualActionBlock,
  FounderSpotlightBlock,
  WhoWeAreBlock,
  AboutUsHeroBlock,
  MapBlock,
  ContactSectionBlock,
  PrivacyPolicyBlock,
  CertificatesBlock,
  BlogPostsBlock,
] as const satisfies readonly Block[]
