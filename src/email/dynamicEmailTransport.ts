import nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'
import type { Payload } from 'payload'


export type ResolvedEmailSettings = {
  enabled?: boolean | null
  smtp?: {
    host?: string | null
    port?: number | null
    secure?: boolean | null
    user?: string | null
    password?: string | null
  } | null
  sender?: {
    fromAddress?: string | null
    fromName?: string | null
  } | null
  notifications?: {
    recipientAddress?: string | null
  } | null
}

type TransportCache = {
  transport: Transporter
  signature: string
}

let transportCache: TransportCache | null = null
let payloadRef: Payload | null = null

export function invalidateEmailTransportCache(): void {
  transportCache?.transport.close()
  transportCache = null
}

export function bindPayloadForEmailTransport(payload: Payload): void {
  payloadRef = payload
}

function buildTransportSignature(settings: ResolvedEmailSettings): string {
  const smtp = settings.smtp
  const sender = settings.sender

  return JSON.stringify({
    enabled: settings.enabled,
    host: smtp?.host,
    port: smtp?.port,
    secure: smtp?.secure,
    user: smtp?.user,
    pass: smtp?.password,
    fromAddress: sender?.fromAddress,
    fromName: sender?.fromName,
  })
}

export async function getEmailSettingsFromPayload(
  payload: Payload,
): Promise<ResolvedEmailSettings | null> {
  try {
    return await payload.findGlobal({
      slug: 'emailSettings',
      depth: 0,
      overrideAccess: true,
    })
  } catch {
    return null
  }
}

export function isEmailConfigured(
  settings: ResolvedEmailSettings | null | undefined,
): settings is ResolvedEmailSettings {
  if (!settings?.enabled) return false

  const smtp = settings.smtp
  const sender = settings.sender
  const notifications = settings.notifications

  return Boolean(
    smtp?.host &&
      smtp.port &&
      smtp.user &&
      smtp.password &&
      sender?.fromAddress &&
      sender.fromName &&
      notifications?.recipientAddress,
  )
}

async function resolvePayload(): Promise<Payload> {
  if (payloadRef) return payloadRef

  const { getPayload } = await import('payload')
  const config = (await import('@payload-config')).default
  payloadRef = await getPayload({ config })
  return payloadRef
}

async function getOrCreateTransport(): Promise<Transporter> {
  const payload = await resolvePayload()
  const settings = await getEmailSettingsFromPayload(payload)

  if (!isEmailConfigured(settings)) {
    throw new Error(
      'Email is not configured. Enable it under Globals → Email settings and fill in SMTP details.',
    )
  }

  const signature = buildTransportSignature(settings)

  if (transportCache?.signature === signature) {
    return transportCache.transport
  }

  invalidateEmailTransportCache()

  const smtp = settings.smtp!
  const transport = nodemailer.createTransport({
    host: smtp.host!,
    port: smtp.port ?? 587,
    secure: smtp.secure ?? false,
    auth: {
      user: smtp.user!,
      pass: smtp.password!,
    },
  })

  transportCache = { transport, signature }
  return transport
}

/**
 * Nodemailer transport that reads SMTP credentials from Globals → Email settings at send time.
 */
export const dynamicEmailTransport = {
  sendMail: async (mailOptions, callback) => {
    try {
      const transport = await getOrCreateTransport()
      const settings = await getEmailSettingsFromPayload(await resolvePayload())
      const sender = settings?.sender
      const from =
        mailOptions.from ??
        (sender?.fromName && sender?.fromAddress
          ? `${sender.fromName} <${sender.fromAddress}>`
          : undefined)

      const result = await transport.sendMail({
        ...mailOptions,
        from,
      })

      if (callback) {
        callback(null, result)
      }

      return result
    } catch (error) {
      if (callback) {
        callback(error as Error, undefined)
      }

      throw error
    }
  },
  verify: async (...args: Parameters<Transporter['verify']>) => {
    const transport = await getOrCreateTransport()
    return transport.verify(...args)
  },
  close: () => {
    invalidateEmailTransportCache()
  },
} as Transporter
