import type { Field, SelectField, TextareaField, UploadField } from 'payload'

import { link } from '@/fields/link'
import { a } from '@/utilities/adminI18n'

type CertificateSibling = {
  certificateType?: string | null
}

export function isManualCertificate(siblingData?: CertificateSibling | null): boolean {
  return siblingData?.certificateType === 'manual'
}

export function isScriptCertificate(siblingData?: CertificateSibling | null): boolean {
  return siblingData?.certificateType !== 'manual'
}

/** Shared Manual Upload / Using Script choice for page and footer certificates. */
export const certificateTypeField: SelectField = {
  name: 'certificateType',
  type: 'select',
  dbName: 'cert_type',
  enumName: 'cert_type',
  required: true,
  defaultValue: 'script',
  label: a('admin.certificates.type', 'Type'),
  options: [
    {
      label: a('admin.certificates.type.manual', 'Manual Upload'),
      value: 'manual',
    },
    {
      label: a('admin.certificates.type.script', 'Using Script'),
      value: 'script',
    },
  ],
  admin: {
    description: a(
      'admin.certificates.type.description',
      'Manual Upload shows an image field. Using Script shows a script field.',
    ),
  },
}

export function certificateScriptField(options?: { required?: boolean }): TextareaField {
  return {
    name: 'script',
    type: 'textarea',
    label: a('admin.certificates.script', 'Script'),
    admin: {
      condition: (_, siblingData) => isScriptCertificate(siblingData as CertificateSibling),
      description: a(
        'admin.certificates.script.description',
        'Paste one certificate <script> tag. Only that script is shown.',
      ),
      rows: 4,
    },
    validate: (value, { siblingData }) => {
      if (!isScriptCertificate(siblingData as CertificateSibling)) return true
      if (!options?.required) return true
      if (typeof value === 'string' && value.trim()) return true
      return 'Enter the certificate script.'
    },
  }
}

export function certificateImageField(options?: { required?: boolean }): UploadField {
  return {
    name: 'image',
    type: 'upload',
    relationTo: 'media',
    label: a('admin.certificates.image', 'Image'),
    admin: {
      condition: (_, siblingData) => isManualCertificate(siblingData as CertificateSibling),
      description: a(
        'admin.certificates.image.description',
        'Certificate image shown when Manual Upload is selected.',
      ),
    },
    validate: (value, { siblingData }) => {
      if (!isManualCertificate(siblingData as CertificateSibling)) return true
      if (!options?.required) return true
      if (value) return true
      return 'Upload a certificate image.'
    },
  }
}

/** Page link shown only when the certificate row is Manual Upload. */
export function certificatePageLinkField(): Field {
  return link({
    appearances: false,
    disableLabel: true,
    overrides: {
      name: 'link',
      label: a('admin.certificates.pageLink', 'Page'),
      admin: {
        condition: (_, siblingData) => isManualCertificate(siblingData as CertificateSibling),
        description: a(
          'admin.certificates.pageLink.description',
          'Page opened when a visitor clicks this certificate image.',
        ),
      },
    },
  })
}
