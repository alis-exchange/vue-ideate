import { computed, ref } from 'vue'

const CONTENT_TYPE_VIDEO = 'video/webm'

/**
 * Composable for recording the user's screen and microphone.
 */
export function useScreenRecorder() {
  const isRecording = ref(false)
  const recordingDuration = ref(0)
  const recordingTimer = ref<number | undefined>(undefined)
  const videoChunks = ref<Blob[]>([])
  const videoBlob = ref<Blob | undefined>(undefined)
  const videoUrl = ref<string | undefined>(undefined)
  const mediaStream = ref<MediaStream | undefined>(undefined)
  const mediaRecorder = ref<MediaRecorder | undefined>(undefined)

  const recordingDurationFormatted = computed(() => {
    const minutes = Math.floor(recordingDuration.value / 60)
    const remainingSeconds = recordingDuration.value % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  })

  /**
   * Prompts the user for screen and microphone access, then starts the recording.
   */
  async function start() {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          displaySurface: 'browser',
          width: { max: 1280 },
          height: { max: 720 },
        },
        preferCurrentTab: true,
        selfBrowserSurface: 'include',
        surfaceSwitching: 'include',
        monitorTypeSurfaces: 'exclude',
      } as never)
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaStream.value = new MediaStream([...displayStream.getTracks(), ...audioStream.getTracks()])
      
      // When the user stops sharing their screen via the browser UI, stop the recording.
      const videoTrack = displayStream.getVideoTracks()[0]
      if (videoTrack) {
          videoTrack.onended = () => {
              stop()
          }
      }

      // Start the actual recording process
      if (!mediaStream.value) return

      mediaRecorder.value = new MediaRecorder(mediaStream.value.clone())
      videoChunks.value = []
      videoUrl.value = undefined
      videoBlob.value = undefined
      recordingDuration.value = 0

      recordingTimer.value = window.setInterval(() => {
        recordingDuration.value++
      }, 1000)

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        const blob = new Blob(videoChunks.value, { type: CONTENT_TYPE_VIDEO })
        videoBlob.value = blob
        videoUrl.value = URL.createObjectURL(blob)
        if (recordingTimer.value) {
          clearInterval(recordingTimer.value)
          recordingTimer.value = undefined
        }
      }

      mediaRecorder.value.start()
      isRecording.value = true
    } catch (error) {
      console.error('Error initializing media stream or starting recording:', error)
      clearMediaStream()
    }
  }

  /**
   * Stops the screen recording.
   */
  function stop() {
    if (isRecording.value) {
      clearMediaStream(true)
      isRecording.value = false
    }
  }

  /**
   * Deletes the current recording data.
   */
  function deleteRecording() {
    videoUrl.value = undefined
    videoChunks.value = []
    videoBlob.value = undefined
    clearMediaStream()
  }

  /**
   * Cleans up all media streams and recorder instances.
   */
  function clearMediaStream(ignoreStatus?: boolean) {
    if (mediaRecorder.value && mediaRecorder.value.stream) {
      mediaRecorder.value.stream.getTracks().forEach((track) => track.stop())
    }
    if (mediaRecorder.value && mediaRecorder.value.state !== 'inactive') {
      mediaRecorder.value.stop()
    }
    if (mediaStream.value) {
      mediaStream.value.getTracks().forEach((track) => track.stop())
    }
    mediaRecorder.value = undefined
    mediaStream.value = undefined
    if (recordingTimer.value) {
      clearInterval(recordingTimer.value)
      recordingTimer.value = undefined
    }

    if (!ignoreStatus) {
      isRecording.value = false
    }
  }

  return {
    /** A reactive boolean indicating if a recording is in progress. */
    isRecording,
    /** The duration of the current recording in seconds. */
    recordingDuration,
    /** The formatted duration of the current recording (MM:SS). */
    recordingDurationFormatted,
    /** A URL for the recorded video, suitable for playback in a <video> tag. */
    videoUrl,
    /** The Blob object of the recorded video. */
    videoBlob,
    start,
    stop,
    deleteRecording,
  }
}