import { ref } from 'vue'
import { Buffer } from 'buffer'

/**
 * Composable for uploading files to the Ideate service.
 * Handles chunked uploading for large files.
 */
export function useFileUploader() {
  const loadingUploading = ref(false)
  const errorUploading = ref<string | undefined>(undefined)

  async function upload(file: Blob, filename: string, errorMessage?: string): Promise<string | undefined> {
    loadingUploading.value = true
    errorUploading.value = undefined
    const finalErrorMessage = errorMessage || 'Failed to upload file. Please try again.'

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

      // 2. Upload File in chunks
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

        // If status is 308, the server has received a part of the file and expects more.
        // The 'Range' header indicates how much has been received.
        if (response.status === 308) {
          const range = response.headers.get('Range')
          if (range) {
            const match = range.match(/bytes=(\d+)-(\d+)/)
            if (match) {
              start = parseInt(match[2]!) + 1
            }
          }
        } else {
          // Upload is complete
          break
        }
      }

      return downloadUrl
    } catch (e) {
      console.error(e)
      errorUploading.value = finalErrorMessage
      // Re-throw to allow caller to handle success/failure logic
      throw e
    } finally {
      loadingUploading.value = false
    }
  }

  return {
    /**
     * Uploads a file (as a Blob) to the Ideate service.
     * @param file The file blob to upload.
     * @param filename The name of the file.
     * @param errorMessage An optional custom error message.
     * @returns A promise that resolves with the download URL of the uploaded file.
     */
    upload,
    /** A reactive boolean indicating if an upload is in progress. */
    loadingUploading,
    /** A reactive string holding the last upload error message, if any. */
    errorUploading,
  }
}