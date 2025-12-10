/**
 * Options for configuring the Ideate feedback behavior.
 */
export interface IdeateFeedbackOptions {
  /** The user's input or feedback in the case of pre-populating it. */
  bodyText?: string
  /** Text to prepend to the user's input or feedback. */
  prependText?: string
  /** Text to append to the user's input or feedback. */
  appendText?: string
  /**
   * Automated behavior to trigger when the link is opened.
   * - 'auto-submit': Automatically submits the feedback. Requires at least `bodyText` to be populated.
   * - 'auto-record-screen': Automatically starts a screen recording.
   * - 'auto-record-voice': Automatically starts recording a voice note.
   */
  behaviour?: 'auto-submit' | 'auto-submit-and-close' | 'auto-record-screen' | 'auto-record-voice'

  /** Media to add to the user's input or feedback. */
  mediaUrl?: string
}

/**
 * Composable for handling Ideate feedback URL generation and parameter parsing.
 *
 * @param token - The authentication or session token to include in the URL.
 * @param opts - Optional configuration for the feedback session.
 * @returns An object containing methods to generate the URL and parse parameters.
 */
export function useIdeateFeedback() {
  /**
   * Generates the full Ideate feedback URL with the token and encoded options.
   *
   * @returns The complete URL string.
   */
  const generateUrl = (token: string, opts?: IdeateFeedbackOptions) => {
    let params = ''
    if (opts) {
      const json = JSON.stringify(opts)
      const base64 = btoa(json)
      params = `&params=${base64}`
    }

    return `https://console.alisx.com/ideate/new?token=${token}${params}`
  }

  /**
   * Decodes and parses the base64 encoded parameters string back into an options object.
   *
   * @param params - The base64 encoded parameters string.
   * @returns The parsed IdeateFeedbackOptions object, or undefined if parsing fails or input is empty.
   */
  const parseParams = (params: string): IdeateFeedbackOptions | undefined => {
    if (!params) return undefined
    try {
      const json = atob(params)
      return JSON.parse(json) as IdeateFeedbackOptions
    } catch (e) {
      console.error('Failed to parse params:', e)
      return undefined
    }
  }

  /**
   * Generates the Ideate feedback URL and opens it in a new small popup window.
   *
   * @param token - The authentication or session token to include in the URL.
   */
  const open = (token: string, opts?: IdeateFeedbackOptions) => {
    const url = generateUrl(token, opts)
    const windowFeatures = 'left=100,top=100,width=400,height=400,popup=true'
    window.open(url, '_blank', windowFeatures)
  }

  return {
    generateUrl,
    parseParams,
    open,
  }
}
