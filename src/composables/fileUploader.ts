import { ref } from 'vue'
import { Buffer } from 'buffer'

export function useFileUploader() {
  const loadingUploading = ref(false)
  const errorUploading = ref<string | undefined>(undefined)

  async function _upload(file: Blob, filename: string, errorMessage: string): Promise<string | undefined> {
    loadingUploading.value = true
    errorUploading.value = undefined

    try {
      // 1. Get Upload URL
      const safeFilename = encodeURIComponent(filename)
      const safeMimeType = file.type || 'application/octet-stream'
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
      const FILE_UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024 // 8 MiB
      const totalSize = file.size
      let start = 0

      while (start < totalSize) {
        const end = Math.min(start + FILE_UPLOAD_CHUNK_SIZE, totalSize)
        const chunk = file.slice(start, end)
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
      errorUploading.value = errorMessage
      throw e // Re-throw to allow caller to handle success/failure logic
    } finally {
      loadingUploading.value = false
    }
  }

  async function uploadVideo(videoChunks: Blob[], filename?: string, mimeType?: string): Promise<string | undefined> {
    if (!videoChunks || videoChunks.length === 0) {
      return
    }
    const finalFilename = filename || `feedback-${Date.now()}.webm`
    const finalMimeType = mimeType || 'video/webm'
    const videoBlob = new Blob(videoChunks, { type: finalMimeType })

    return _upload(videoBlob, finalFilename, 'Failed to upload video. Please try again.')
  }

  async function uploadFile(file: File): Promise<string | undefined> {
    if (!file) {
      return
    }
    return _upload(file, file.name, 'Failed to upload file. Please try again.')
  }

  return {
    uploadVideo,
    uploadFile,
    loadingUploading,
    errorUploading,
  }
}
