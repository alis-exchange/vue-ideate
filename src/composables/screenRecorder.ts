import { computed, ref, onUnmounted } from 'vue'

const CONTENT_TYPE_VIDEO = 'video/webm'

// Global state
const isRecording = ref(false)
const recordingDuration = ref(0)
const recordingTimer = ref<number | undefined>(undefined)
const videoChunks = ref<Blob[]>([])
const videoUrl = ref<string | undefined>(undefined)
const mediaStream = ref<MediaStream | undefined>(undefined)
const mediaRecorder = ref<MediaRecorder | undefined>(undefined)

export function useScreenRecorder() {
  const recordingDurationFormatted = computed(() => {
    const minutes = Math.floor(recordingDuration.value / 60)
    const remainingSeconds = recordingDuration.value % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  })

  async function initMediaStream() {
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
      
      
      const videoTrack = displayStream.getVideoTracks()[0]
      if (videoTrack) {
          videoTrack.onended = () => {
              stopRecording()
          }
      }

      await startRecording()
    } catch (error) {
      console.error('Error initializing media stream:', error)
      clearMediaStream()
    }
  }

  async function startRecording() {
    if (!mediaStream.value) return

    try {
      mediaRecorder.value = new MediaRecorder(mediaStream.value.clone())
      videoChunks.value = []
      videoUrl.value = undefined
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
        const videoBlob = new Blob(videoChunks.value, { type: CONTENT_TYPE_VIDEO })
        videoUrl.value = URL.createObjectURL(videoBlob)
        if (recordingTimer.value) {
          clearInterval(recordingTimer.value)
          recordingTimer.value = undefined
        }
      }

      mediaRecorder.value.start()
      isRecording.value = true
    } catch (error) {
      console.error('Error starting recording:', error)
      clearMediaStream()
    }
  }

  function stopRecording() {
    if (isRecording.value) {
      clearMediaStream(true)
      isRecording.value = false
    }
  }

  function deleteRecording() {
    videoUrl.value = undefined
    videoChunks.value = []
    clearMediaStream()
  }

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
    isRecording,
    recordingDuration,
    recordingDurationFormatted,
    videoUrl,
    videoChunks,
    initMediaStream,
    startRecording,
    stopRecording,
    deleteRecording,
  }
}
