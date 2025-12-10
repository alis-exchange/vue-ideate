import { ref } from 'vue'

export function useScreenshot() {
  const screenshotBlob = ref<Blob | null>(null)
  const screenshotUrl = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Takes a screenshot of the current tab.
   * @returns A promise that resolves with the screenshot as a Blob, or null if an error occurs.
   */
  async function takeScreenshot(): Promise<Blob | null> {
    isLoading.value = true
    error.value = null

    // Clean up previous screenshot
    if (screenshotUrl.value) {
      URL.revokeObjectURL(screenshotUrl.value)
    }
    screenshotBlob.value = null
    screenshotUrl.value = null

    let stream: MediaStream | null = null

    try {
      // Request a video stream of the current tab.
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'browser' },
        audio: false, // No audio needed for a screenshot
        preferCurrentTab: true,
      } as never)

      const videoTrack = stream.getVideoTracks()[0]
      if (!videoTrack) {
        throw new Error('No video track found in the stream.')
      }

      // Use the ImageCapture API to grab a frame.
      const imageCapture = new ImageCapture(videoTrack)
      const bitmap = await imageCapture.grabFrame()

      // Stop the stream immediately after capturing the frame.
      videoTrack.stop()

      // Draw the bitmap onto a canvas.
      const canvas = document.createElement('canvas')
      canvas.width = bitmap.width
      canvas.height = bitmap.height
      const context = canvas.getContext('2d')
      if (!context) {
        throw new Error('Could not get 2D context from canvas.')
      }
      context.drawImage(bitmap, 0, 0)

      // Convert the canvas to a Blob.
      return new Promise<Blob | null>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            screenshotBlob.value = blob
            screenshotUrl.value = URL.createObjectURL(blob)
            isLoading.value = false
            resolve(blob)
          } else {
            reject(new Error('Failed to convert canvas to Blob.'))
          }
        }, 'image/png')
      })
    } catch (e: any) {
      console.error('Error taking screenshot:', e)
      // User might have cancelled the screen share prompt
      if (e.name === 'NotAllowedError') {
        error.value = 'Permission to capture screen was denied.'
      } else {
        error.value = 'Failed to take screenshot.'
      }

      // Ensure stream is stopped in case of error
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }

      isLoading.value = false
      return null
    }
  }

  /**
   * Clears the current screenshot data.
   */
  function clearScreenshot() {
    if (screenshotUrl.value) {
      URL.revokeObjectURL(screenshotUrl.value)
    }
    screenshotBlob.value = null
    screenshotUrl.value = null
    error.value = null
  }

  return {
    takeScreenshot,
    clearScreenshot,
    screenshotBlob,
    screenshotUrl,
    isLoading,
    error,
  }
}
