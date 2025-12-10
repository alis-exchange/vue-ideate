import { computed, ref } from 'vue'

const CONTENT_TYPE_AUDIO = 'audio/webm'

/**
 * Composable for recording the user's microphone.
 */
export function useVoiceRecorder() {
  const isRecording = ref(false)
  const recordingDuration = ref(0)
  const recordingTimer = ref<number | undefined>(undefined)
  const audioChunks = ref<Blob[]>([])
  const audioBlob = ref<Blob | undefined>(undefined)
  const audioUrl = ref<string | undefined>(undefined)
  const mediaStream = ref<MediaStream | undefined>(undefined)
  const mediaRecorder = ref<MediaRecorder | undefined>(undefined)
  const volumeLevel = ref(0)
  const audioContext = ref<AudioContext | undefined>(undefined)
  const analyser = ref<AnalyserNode | undefined>(undefined)
  const animationFrameId = ref<number | undefined>(undefined)

  const recordingDurationFormatted = computed(() => {
    const minutes = Math.floor(recordingDuration.value / 60)
    const remainingSeconds = recordingDuration.value % 60
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  })

  function monitorVolume() {
    if (!analyser.value)
      return
    const dataArray = new Uint8Array(analyser.value.frequencyBinCount)
    analyser.value.getByteTimeDomainData(dataArray)

    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      const value = (dataArray[i] - 128) / 128
      sum += value * value
    }
    const rms = Math.sqrt(sum / dataArray.length)
    volumeLevel.value = rms

    animationFrameId.value = requestAnimationFrame(monitorVolume)
  }

  /**
   * Prompts the user for microphone access, then starts the recording.
   */
  async function start() {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true })

      mediaStream.value = audioStream
      
      // When the user stops sharing their audio via the browser UI, stop the recording.
      const audioTrack = audioStream.getAudioTracks()[0]
      if (audioTrack) {
          audioTrack.onended = () => {
              stop()
          }
      }

      // Start the actual recording process
      if (!mediaStream.value) return

      // --- Audio analysis ---
      audioContext.value = new AudioContext()
      const source = audioContext.value.createMediaStreamSource(mediaStream.value)
      analyser.value = audioContext.value.createAnalyser()
      analyser.value.fftSize = 256
      source.connect(analyser.value)
      // --- End audio analysis ---

      mediaRecorder.value = new MediaRecorder(mediaStream.value.clone())
      audioChunks.value = []
      audioUrl.value = undefined
      audioBlob.value = undefined
      recordingDuration.value = 0

      recordingTimer.value = window.setInterval(() => {
        recordingDuration.value++
      }, 1000)

      mediaRecorder.value.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.value.push(event.data)
        }
      }

      mediaRecorder.value.onstop = () => {
        const blob = new Blob(audioChunks.value, { type: CONTENT_TYPE_AUDIO })
        audioBlob.value = blob
        audioUrl.value = URL.createObjectURL(blob)
        if (recordingTimer.value) {
          clearInterval(recordingTimer.value)
          recordingTimer.value = undefined
        }
      }

      mediaRecorder.value.start()
      isRecording.value = true
      monitorVolume()
    } catch (error) {
      console.error('Error initializing media stream or starting recording:', error)
      clearMediaStream()
    }
  }

  /**
   * Stops the audio recording.
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
    audioUrl.value = undefined
    audioChunks.value = []
    audioBlob.value = undefined
    clearMediaStream()
  }

  /**
   * Cleans up all media streams and recorder instances.
   */
  function clearMediaStream(ignoreStatus?: boolean) {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value)
      animationFrameId.value = undefined
    }
    if (audioContext.value && audioContext.value.state !== 'closed') {
      audioContext.value.close()
    }
    volumeLevel.value = 0
    audioContext.value = undefined
    analyser.value = undefined

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
    /** A URL for the recorded audio, suitable for playback in a <audio> tag. */
    audioUrl,
    /** The Blob object of the recorded audio. */
    audioBlob,
    /** A reactive number between 0 and 1 representing the current volume. */
    volumeLevel,
    start,
    stop,
    deleteRecording,
  }
}
