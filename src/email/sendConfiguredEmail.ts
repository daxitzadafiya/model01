import type { Payload } from 'payload'

export type ConfiguredEmailMessage = {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendConfiguredEmail(
  payload: Payload,
  message: ConfiguredEmailMessage,
): Promise<void> {
  await payload.sendEmail(message)
}
