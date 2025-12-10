/**
 * This file contains type definitions for the experimental ImageCapture API.
 * This is used by the screenshot composable to grab a frame from a video stream.
 * The API is not yet part of the standard TypeScript library definitions.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageCapture
 */

interface ImageCapture {
  readonly track: MediaStreamTrack;
  takePhoto(photoSettings?: PhotoSettings): Promise<Blob>;
  getPhotoCapabilities(): Promise<PhotoCapabilities>;
  getPhotoSettings(): Promise<PhotoSettings>;
  grabFrame(): Promise<ImageBitmap>;
  readonly videoStreamTrack: MediaStreamTrack;
}

interface PhotoSettings {
  fillLightMode?: "auto" | "off" | "flash";
  imageHeight?: number;
  imageWidth?: number;
  redEyeReduction?: boolean;
}

interface PhotoCapabilities {
  readonly redEyeReduction?: "never" | "always" | "controllable";
  readonly imageHeight?: MediaSettingsRange;
  readonly imageWidth?: MediaSettingsRange;
  readonly fillLightMode?: ("auto" | "off" | "flash")[];
}

interface MediaSettingsRange {
  readonly max: number;
  readonly min: number;
  readonly step: number;
}

declare var ImageCapture: {
  prototype: ImageCapture;
  new(videoTrack: MediaStreamTrack): ImageCapture;
};