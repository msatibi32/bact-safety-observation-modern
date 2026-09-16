export const COOKIE_CONSENT_KEY = 'soc_cookie_consent'

export function getCookieConsent() {
  try {
    return localStorage.getItem(COOKIE_CONSENT_KEY) === 'accepted'
  } catch {
    return false
  }
}

export function acceptCookieConsent() {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'accepted')
  } catch {
    /* private mode */
  }
}
