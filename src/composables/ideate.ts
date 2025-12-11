import { ref } from 'vue';

/**
 * Options for configuring the Ideate feedback behavior.
 */
export interface IdeateOptions {
  /** The user's input or feedback to pre-populate the submission form. */
  body?: string;
  /** Text to prepend to the user's input. */
  prepend?: string;
  /** Text to append to the user's input. */
  append?: string;
  /** A URL to an image or video file to be attached to the feedback. */
  mediaUrl?: string;
  /**
   * Automated behavior to trigger when the link is opened.
   * - 'auto-submit': Automatically submits the feedback. Requires `body` to be populated.
   * - 'auto-record-screen': Automatically starts a screen recording.
   * - 'auto-record-voice': Automatically starts recording a voice note.
   */
  behaviour?: 'auto-submit' | 'auto-submit-and-close' | 'auto-record-screen' | 'auto-record-voice';
}

/**
 * Composable for generating Ideate feedback URLs and opening the feedback form.
 */
export function useIdeate() {
  const options = ref<IdeateOptions>({});

  const setOptions = (opts: IdeateOptions) => {
    options.value = { ...options.value, ...opts };
  };

  const generateUrl = (token: string) => {
    let params = '';
    
    // Filter out undefined values from options.value before stringifying
    const filteredOpts: Record<string, any> = {};
    for (const [key, value] of Object.entries(options.value)) {
      if (value !== undefined) {
        filteredOpts[key] = value;
      }
    }

    if (Object.keys(filteredOpts).length > 0) {
      const json = JSON.stringify(filteredOpts);
      const base64 = btoa(json);
      params = `&params=${base64}`;
    }

    return `https://console.alisx.com/ideate/new?token=${token}${params}`;
  };

  const open = (token: string, mode: 'tab' | 'popup' | string = 'tab') => {
    const url = generateUrl(token);
    let windowFeatures: string | undefined;

    if (mode === 'popup') {
      windowFeatures = 'left=100,top=100,width=400,height=400,popup=true';
    }
    else if (mode !== 'tab') {
      windowFeatures = mode;
    }

    window.open(url, '_blank', windowFeatures);
  };

  return {
    /**
     * Sets or merges options for the feedback session.
     * @param opts - The options to set.
     */
    setOptions,
    /**
     * Generates the full Ideate feedback URL with the current options.
     * @param token - The collection token.
     * @returns The complete URL string.
     */
    generateUrl,
    /**
     * Opens the Ideate feedback form in a new tab or popup window.
     * @param token - The collection token.
     * @param mode - Determines how the form is opened.
     * - 'tab': (Default) Opens in a new browser tab.
     * - 'popup': Opens in a small popup window with default dimensions.
     * - Custom string: For advanced control, you can provide a custom string for the `windowFeatures` parameter of `window.open()`.
     *   This allows you to specify dimensions, position, and other properties of the popup.
     *   For more details, see the MDN documentation: https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures
     */
    open,
    /** The reactive options object. */
    options,
  };
}

/**
 * Decodes and parses the base64 encoded parameters string back into an options object.
 * This is intended for server-side use.
 *
 * @param params - The base64 encoded parameters string.
 * @returns The parsed IdeateOptions object, or undefined if parsing fails or input is empty.
 */
export function parseIdeateOptions(params: string): IdeateOptions | undefined {
  if (!params) return undefined;
  try {
    // Use Buffer for server-side decoding, and atob for client-side.
    const json = typeof window === 'undefined' ? Buffer.from(params, 'base64').toString('utf-8') : atob(params);
    return JSON.parse(json) as IdeateOptions;
  } catch (e) {
    console.error('Failed to parse params:', e);
    return undefined;
  }
}