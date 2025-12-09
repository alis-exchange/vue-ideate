import { ref } from 'vue'
import { Buffer } from 'buffer'

export function useVideoUploader(filename?: string, mimeType?: string) {
  const loadingUploading = ref(false)
  const errorUploading = ref<string | undefined>(undefined)

  async function uploadVideo(videoChunks: Blob[]): Promise<string | undefined> {
    if (!videoChunks || videoChunks.length === 0) {
      return
    }
    loadingUploading.value = true
    errorUploading.value = undefined

    try {
      // 1. Get Upload URL
      const safeFilename = filename ? encodeURIComponent(filename) : encodeURIComponent(`feedback-${Date.now()}.webm`)
      const safeMimeType = mimeType || 'video/webm'
      const encodedMimeType = encodeURIComponent(safeMimeType)

      const uploadUrlResponse = await fetch(`https://ideatepublicintake.alisx.com/upload?filename=${safeFilename}&mime-type=${encodedMimeType}`, {
        method: 'POST',
      })

      if (!uploadUrlResponse.ok) {
        throw new Error('Failed to get upload URL')
      }

      const responseData = await uploadUrlResponse.json()
      const uploadUrl = responseData.upload_uri
      const downloadUrl = responseData.download_uri

      // 2. Upload File
      const videoBlob = new Blob(videoChunks, { type: safeMimeType })
      const FILE_UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024 // 8 MiB
      const totalSize = videoBlob.size
      let start = 0

      while (start < totalSize) {
        const end = Math.min(start + FILE_UPLOAD_CHUNK_SIZE, totalSize)
        const chunk = videoBlob.slice(start, end)
        const arrayBuffer = await chunk.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const headers = new Headers({
          'Content-Length': buffer.length.toString(),
          'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`,
        })

        const response = await fetch(uploadUrl, {
          method: 'PUT',
          headers: headers,
          body: buffer,
        })

        if (!response.ok && response.status !== 308) {
          throw new Error(`Upload failed with status ${response.status}`)
        }

        if (response.status === 308) {
          const range = response.headers.get('Range')
          if (range) {
            const match = range.match(/bytes=(\d+)-(\d+)/)
            if (match) {
              start = parseInt(match[2]!) + 1
            }
          }
        } else {
          break
        }
      }

      return downloadUrl
    } catch (e) {
      console.error(e)
      errorUploading.value = 'Failed to upload video. Please try again.'
      throw e // Re-throw to allow caller to handle success/failure logic (like closing drawer)
    } finally {
      loadingUploading.value = false
    }
  }

  return {
    uploadVideo,
    loadingUploading,
    errorUploading,
  }
}
