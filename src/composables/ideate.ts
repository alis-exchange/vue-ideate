import { Ref, ref } from 'vue';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';
import { AddNoteRequest, AddAudioNoteRequest, AddMultiFileUploadRequest, AddAudioNoteResponse, AddMultiFileUploadResponse } from '@alis-build/ideate/alis/ideate/ideate_pb';
import { CONTENT_EXT_AUDIO, CONTENT_TYPE_AUDIO } from './voiceRecorder';
import { FileWrapper, useFileUploader } from './fileUploader';


/**
 * Composable for interacting with Ideate directly from a Vue application.
 * 
 * Provides simplified endpoints for interacting with the @alis-build/ideate package,
 * handling request creation, error management, and loading states automatically.
 * 
 * @param client - The IdeateServicePromiseClient instance used to communicate with the Ideate service
 * @returns An object containing simplified methods for adding content to Ideate (addNote, addAudioNote, addMultiFileUpload)
 */
export function useIdeate(client: IdeateServicePromiseClient) {

  const loadingSubmit: Ref<boolean> = ref(false);
  const errorSubmit: Ref<string | undefined> = ref(undefined);

  /**
   * Adds a text note to an Ideate target.
   * 
   * Simplified endpoint for the AddNote RPC call in the @alis-build/ideate package.
   * Automatically manages loading state and error handling.
   * 
   * @param target - The Ideate token identifying the target resource (collection, idea, etc.)
   * @param content - The text content of the note to add
   * @throws {Error} If target or content is empty
   * @throws {Error} If the RPC call fails (also sets errorSubmit)
   */
  async function addNote(target: string, content: string) {
    if (target === '' || content === '') {
      throw new Error('Invalid arguments');
    }

    loadingSubmit.value = true;
    errorSubmit.value = undefined;

    try {
      const req = new AddNoteRequest();
      req.setToken(target);
      req.setContent(content);
      await client.addNote(req);
    } catch (error) {
      errorSubmit.value = 'Failed to add note. Please try again.';
      throw error
    } finally {
      loadingSubmit.value = false;
    }
  }

  /**
   * Adds an audio note to an Ideate target.
   * 
   * Simplified endpoint for the AddAudioNote RPC call in the @alis-build/ideate package.
   * This is a two-phase operation:
   * 1. Calls AddAudioNote RPC to get a signed upload URI
   * 2. Uploads the audio blob to the returned URI using the file uploader
   * 
   * Automatically manages loading state and error handling for both phases.
   * 
   * @param target - The Ideate token identifying the target resource (collection, idea, etc.)
   * @param content - The audio data as a Blob
   * @returns {Promise<AddAudioNoteResponse>} The response from the AddAudioNote RPC call
   * @throws {Error} If target is empty or content size is 0
   * @throws {Error} If the RPC call fails (also sets errorSubmit)
   * @throws {Error} If the file upload fails (also sets errorSubmit)
   */
  async function addAudioNote(target: string, content: Blob) {
    if (target === '' || content.size === 0) {
      throw new Error('Invalid arguments');
    }

    loadingSubmit.value = true;
    errorSubmit.value = undefined;

    let resp: AddAudioNoteResponse | undefined;

    try {
      const req = new AddAudioNoteRequest();
      req.setToken(target);
      req.setMimeType(CONTENT_TYPE_AUDIO)
      req.setOriginUri(window.location.origin)
      resp = await client.addAudioNote(req);
    } catch (error) {
      errorSubmit.value = 'Failed to add audio note. Please try again.';
      loadingSubmit.value = false
      throw error
    }

    if (!resp) {
      throw new Error('Failed to add audio note');
    }

    try {
      const { upload } = useFileUploader()

      const f: FileWrapper = {
        blob: content,
        filename: 'recording' + CONTENT_EXT_AUDIO,
        mimeType: CONTENT_TYPE_AUDIO,
      }

      await upload(resp.getUploadUri(), f);
    } catch (error) {
      errorSubmit.value = 'Failed to upload audio note. Please try again.';
      throw error
    } finally {
      loadingSubmit.value = false;
    }

    return resp;
  }

  /**
   * Adds multiple files to an Ideate target.
   * 
   * Simplified endpoint for the AddMultiFileUpload RPC call in the @alis-build/ideate package.
   * This is a two-phase operation:
   * 1. Calls AddMultiFileUpload RPC with file metadata to get signed upload URIs for each file
   * 2. Uploads all files in parallel to their respective URIs using the file uploader
   * 
   * Only files with a valid mimeType are included in the upload request.
   * Automatically manages loading state and error handling for both phases.
   * 
   * @param target - The Ideate token identifying the target resource (collection, idea, etc.)
   * @param files - Array of FileWrapper objects containing the files to upload
   * @throws {Error} If target is empty or files array is empty
   * @throws {Error} If the RPC call fails (also sets errorSubmit)
   * @throws {Error} If any file upload fails (also sets errorSubmit)
   */
  async function addMultiFileUpload(target: string, files: FileWrapper[]) {
    if (target === '' || files.length === 0) {
      throw new Error('Invalid arguments');
    }

    loadingSubmit.value = true;
    errorSubmit.value = undefined;

    let resp: AddMultiFileUploadResponse | undefined;
    try {
      const req = new AddMultiFileUploadRequest();
      req.setToken(target);

      var filesToUpload: AddMultiFileUploadRequest.File[] = [];
      files.forEach((f) => {
        const file = new AddMultiFileUploadRequest.File();
        if (f.mimeType) {
          file.setFilename(f.filename)
          file.setMimeType(f.mimeType)
          filesToUpload.push(file) 
        }
      })

      req.setFilesList(filesToUpload)
      req.setOriginUri(window.location.origin)
      resp = await client.addMultiFileUpload(req);
    } catch (error) {
      errorSubmit.value = 'Failed to add files. Please try again.';
      loadingSubmit.value = false
      throw error
    }
  

    try {
      const { upload } = useFileUploader()

      let uploadPromises: Promise<void>[] = [];
      resp.getFilesList().forEach((f) => {

        const ff = files.find((uf) => uf.filename === f.getFilename())
        if (!ff) {
          return
        }

        const u = upload(f.getUploadUri(), ff)
        uploadPromises.push(u)

      });
      await Promise.all(uploadPromises);

    } catch (error) {
      errorSubmit.value = 'Failed to upload files. Please try again.';
      throw error
    } finally {
      loadingSubmit.value = false;
    }
  }

  return {
    addNote,
    addAudioNote,
    addMultiFileUpload,
  };
}