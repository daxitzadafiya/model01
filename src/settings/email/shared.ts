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
    /** One or more addresses, comma-separated. */
    recipientAddress?: string | null
  } | null
}

const EMAIL_ADDRESS_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmailAddress(value: string): boolean {
  return EMAIL_ADDRESS_PATTERN.test(value)
}

/** Split a comma-separated recipient string into trimmed non-empty parts. */
export function parseNotificationRecipients(value: string | null | undefined): string[] {
  if (!value?.trim()) return []
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Valid notification recipient emails from a comma-separated field value. */
export function getValidNotificationRecipients(value: string | null | undefined): string[] {
  return parseNotificationRecipients(value).filter(isValidEmailAddress)
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
      getValidNotificationRecipients(notifications?.recipientAddress).length > 0,
  )
}
