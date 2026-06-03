/**
 * Minimal reCAPTCHA v2 token verification for server-side enforcement.
 *
 * Env vars:
 * - RECAPTCHA_SECRET_KEY (server-side)
 */
export async function verifyRecaptchaToken({
  token,
  remoteip,
}: {
  token: string
  remoteip?: string
}): Promise<boolean> {
  const secret =
    process.env.RECAPTCHA_SECRET_KEY ||
    process.env.RECAPTCHA_V2_SECRET_KEY ||
    process.env.RECAPTCHA_API_SECRET_KEY ||
    process.env.NEXT_PUBLIC_RECAPTCHA_SECRET_KEY

  if (!secret) {
    throw new Error('reCAPTCHA secret key is not configured on the server.')
  }

  const params = new URLSearchParams({
    secret,
    response: token,
    ...(remoteip ? { remoteip } : {}),
  })

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: {
      'content-type': 'application/x-www-form-urlencoded; charset=utf-8',
    },
    body: params.toString(),
  })

  const json: any = await res.json().catch(() => ({}))
  if (!res.ok) return false
  return Boolean(json?.success)
}

