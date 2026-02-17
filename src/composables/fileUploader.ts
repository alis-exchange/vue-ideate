import { ref } from 'vue'
import { Buffer } from 'buffer'

/**
 * Wrapper interface for files to be uploaded to the Ideate service.
 * 
 * Encapsulates the file data along with metadata needed for upload operations.
 */
export interface FileWrapper {
  /** The file data as a Blob */
  blob: Blob,
  /** The name of the file including extension */
  filename: string,
  /** Optional MIME type of the file (e.g., 'audio/webm', 'image/png') */
  mimeType?: string,
}

/**
 * Composable for uploading files to the Ideate service.
 * 
 * Implements chunked uploading for large files using a resumable upload protocol.
 * Files are uploaded in 8 MiB chunks, with support for resuming interrupted uploads
 * via HTTP 308 (Resume Incomplete) status codes.
 * 
 * @returns An object containing the upload function and reactive state for loading/error tracking
 */
export function useFileUploader() {
  const loadingUploading = ref(false)
  const errorUploading = ref<string | undefined>(undefined)

  /**
   * Uploads a file to a signed upload URL using chunked, resumable uploads.
   * 
   * Implements a resumable upload protocol:
   * - Files are split into 8 MiB chunks and uploaded sequentially
   * - Each chunk is sent with Content-Range headers indicating position in the file
   * - HTTP 308 responses indicate partial success and provide the server's received byte range
   * - Upload resumes from the last successfully received byte if interrupted
   * - HTTP 200/201 responses indicate successful completion
   * 
   * Automatically manages loading state and error handling.
   * 
   * @param url - The signed upload URL (typically obtained from an Ideate RPC call)
   * @param file - The FileWrapper containing the file data and metadata
   * @param errorMessage - Optional custom error message to display on failure
   * @throws {Error} If any chunk upload fails or receives an unexpected status code
   */
  async function upload(url: string, file: FileWrapper, errorMessage?: string) {
    loadingUploading.value = true
    errorUploading.value = undefined
    const finalErrorMessage = errorMessage || 'Failed to upload file. Please try again.'

    try {

      // 2. Upload File in chunks
      const FILE_UPLOAD_CHUNK_SIZE = 8 * 1024 * 1024 // 8 MiB
      const totalSize = file.blob.size
      let start = 0

      while (start < totalSize) {
        const end = Math.min(start + FILE_UPLOAD_CHUNK_SIZE, totalSize)
        const chunk = file.blob.slice(start, end)
        const arrayBuffer = await chunk.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)

        const headers = new Headers({
          'Content-Length': buffer.length.toString(),
          'Content-Range': `bytes ${start}-${end - 1}/${totalSize}`,
        })

        const response = await fetch(url, {
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

      return
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
     * Uploads a file to a signed upload URL using chunked, resumable uploads.
     * See function documentation above for details on the upload protocol.
     */
    upload,
    /** Reactive boolean indicating if an upload is currently in progress */
    loadingUploading,
    /** Reactive string containing the last upload error message, or undefined if no error */
    errorUploading,
  }
}