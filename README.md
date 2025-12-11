# Vue Ideate

This package provides utility composables to help users of Alis Ideate better link and integrate their products.

## Installation

```bash
pnpm add @alis-build/vue-ideate
```

## Prerequisites

To use this package, you will need a collection token from Alis Ideate. You can get your token by creating a collection at [https://console.alisx.com/ideate/home/collections](https://console.alisx.com/ideate/home/collections).

## Usage

The main entry point is the `useIdeate` composable.

### `useIdeate`

The `useIdeate` composable is your main tool for creating and managing feedback submissions to the Ideate platform. It holds the feedback details in a reactive state and provides functions to trigger the submission process.

```typescript
import { useIdeate } from '@alis-build/vue-ideate';

const { setOptions, open, generateUrl, options } = useIdeate();
```

#### `setOptions(options)`

This function allows you to set the details for the feedback submission. You can pre-fill the feedback form, add context, or attach media. The options you set are merged with any existing options.

**Available Options:**

| Option      | Type     | Description                                                                                                                                                           |
|-------------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `body`      | `string` | The main text of the feedback to pre-populate the submission form.                                                                                                    |
| `prepend`   | `string` | Text that will be added *before* the user's input in the final submission. Useful for adding tags like `#bug` or `#feature`.                                            |
| `append`    | `string` | Text that will be added *after* the user's input. Ideal for appending system information, logs, or user details.                                                       |
| `mediaUrl`  | `string` | A URL to an image or video file that will be attached to the feedback. You can get this URL from the `useFileUploader` composable.                                      |
| `behaviour` | `string` | Defines an automated action to trigger when the feedback form is opened. Can be `'auto-submit'`, `'auto-record-screen'`, or `'auto-record-voice'`. |

**Example:**
```typescript
const systemInfo = `
---
User Agent: ${navigator.userAgent}`;

setOptions({
  prepend: '# Bug Report',
  body: 'The login button is not working.',
  append: systemInfo,
});
```

#### `open(token, mode)`

Once you have set your options, you call this function to present the feedback form to the user. It takes a collection `token` as the first argument, and an optional `mode` as the second.

-   `open(token)` or `open(token, 'tab')` opens the form in a new full browser tab. This is the default behavior.
-   `open(token, 'popup')` opens the Ideate submission form in a new, small popup window. This is great for a less intrusive experience.
-   For more advanced control, you can provide a custom `windowFeatures` string as the `mode`. This allows you to specify the popup's size, position, and other properties. For more details, see the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/Window/open#windowfeatures).

**Example:**
```typescript
// Open in a new tab (default)
open('YOUR_TOKEN');

// Open in a popup
open('YOUR_TOKEN', 'popup');

// Open in a custom-sized popup
open('YOUR_TOKEN', 'left=100,top=100,width=300,height=500,popup=true');
```

#### `generateUrl(token)`

If you need more control, this function returns the full Ideate URL without opening a new window or tab. You can use this to create a custom link or button.

```typescript
const url = generateUrl('YOUR_TOKEN');
// <a :href="url">Submit Feedback</a>
```


See the `Workflows` section for more advanced examples of combining composables.

### `useScreenRecorder`

Provides functions and reactive state for recording the user's screen.

**Example:**
```vue
<script setup>
import { useScreenRecorder } from '@alis-build/vue-ideate';

const {
  isRecording,
  recordingDurationFormatted,
  videoUrl,
  volumeLevel,
  start,
  stop,
  deleteRecording,
} = useScreenRecorder();
</script>

<template>
  <div>
    <div v-if="isRecording">
      Recording... {{ recordingDurationFormatted }}
      <button @click="stop">Stop</button>
    </div>
    <div v-else>
      <button @click="start">Record Screen</button>
    </div>
    <div v-if="videoUrl">
      <video :src="videoUrl" controls></video>
      <button @click="deleteRecording">Delete Recording</button>
    </div>
  </div>
</template>
```

The `volumeLevel` is a reactive number between 0 and 1 that represents the current microphone volume. You can use it to create a visual indicator that the microphone is active.

### `useVoiceRecorder`

Provides functions and reactive state for recording the user's voice.

**Example:**
```vue
<script setup>
import { useVoiceRecorder } from '@alis-build/vue-ideate';

const {
  isRecording,
  recordingDurationFormatted,
  audioUrl,
  volumeLevel,
  start,
  stop,
  deleteRecording,
} = useVoiceRecorder();
</script>

<template>
  <div>
    <div v-if="isRecording">
      Recording... {{ recordingDurationFormatted }}
      <button @click="stop">Stop</button>
    </div>
    <div v-else>
      <button @click="start">Record Voice</button>
    </div>
    <div v-if="audioUrl">
      <audio :src="audioUrl" controls></audio>
      <button @click="deleteRecording">Delete Recording</button>
    </div>
  </div>
</template>
```

The `volumeLevel` is a reactive number between 0 and 1 that represents the current microphone volume. You can use it to create a visual indicator that the microphone is active.

### `useScreenshot`

Provides functions and reactive state for taking a screenshot of the current tab.

**Example:**
```vue
<script setup>
import { useScreenshot } from '@alis-build/vue-ideate';

const {
  screenshotUrl,
  isLoading,
  error,
  takeScreenshot,
  clearScreenshot,
} = useScreenshot();
</script>

<template>
  <div>
    <button @click="takeScreenshot" :disabled="isLoading">
      {{ isLoading ? 'Taking...' : 'Take Screenshot' }}
    </button>
    <div v-if="error">{{ error }}</div>
    <div v-if="screenshotUrl">
      <img :src="screenshotUrl" alt="Screenshot" />
      <button @click="clearScreenshot">Clear Screenshot</button>
    </div>
  </div>
</template>
```

### `useFileUploader`

Provides a function to upload files to the Ideate service.

```typescript
import { useFileUploader } from '@alis-build/vue-ideate';
import { useScreenshot } from '@alis-build/vue-ideate';

const { takeScreenshot, screenshotBlob } = useScreenshot();
const { upload, loadingUploading, errorUploading } = useFileUploader();

async function takeAndUpload() {
  await takeScreenshot();
  if (screenshotBlob.value) {
    try {
      const downloadUrl = await upload(screenshotBlob.value, 'screenshot.png');
      console.log('File uploaded:', downloadUrl);
    } catch (e) {
      console.error('Upload failed');
    }
  }
}
```

## Workflows

Here are some typical workflows for using `@alis-build/vue-ideate`.

### 1. Screen Recording Feedback

This workflow is ideal for capturing dynamic feedback, such as bug reproductions or feature demonstrations.

```typescript
import { useIdeate, useScreenRecorder, useFileUploader } from '@alis-build/vue-ideate';

const token = 'YOUR_COLLECTION_TOKEN';
const { open, setOptions } = useIdeate();
const { start, stop, videoBlob } = useScreenRecorder();
const { upload } = useFileUploader();

async function captureAndSendVideoFeedback() {
  await start();
  
  // Wait for the user to finish recording and stop it
  // For example, you can have a button that calls stop()
}

async function onRecordingStopped() {
  if (videoBlob.value) {
    const downloadUrl = await upload(videoBlob.value, 'screen-recording.webm');
    const systemInfo = `
---
**System Info:**
- Browser: ${navigator.userAgent}`;

    setOptions({
      prepend: '# General Feedback',
      append: systemInfo,
      mediaUrl: downloadUrl,
    });
    open(token, 'popup');
  }
}
```

### 2. Screenshot with Feature Request

When a user has a specific feature request related to a part of the UI. You can create multiple instances of `useScreenshot` if you need to manage multiple screenshots independently.

```typescript
import { useIdeate, useScreenshot, useFileUploader } from '@alis-build/vue-ideate';

const token = 'YOUR_COLLECTION_TOKEN';
const { open, setOptions } = useIdeate();
const { takeScreenshot, screenshotBlob } = useScreenshot();
const { upload } = useFileUploader();

async function captureAndSendScreenshotFeedback(userText: string) {
  await takeScreenshot();

  if (screenshotBlob.value) {
    const downloadUrl = await upload(screenshotBlob.value, 'screenshot.png');
    const systemInfo = `
---
**System Info:**
- URL: ${window.location.href}`;

    setOptions({
      prepend: '# Feature request',
      body: userText,
      append: systemInfo,
      mediaUrl: downloadUrl,
    });
    open(token, 'popup');
  }
}
```

### 3. Text-Only Bug Report

For quick bug reports where visual context is not necessary.

```typescript
import { useIdeate } from '@alis-build/vue-ideate';

const token = 'YOUR_COLLECTION_TOKEN';
const { open, setOptions } = useIdeate();

function sendTextFeedback(userText: string) {
  const systemInfo = `
---
**System Info:**
- Timestamp: ${new Date().toISOString()}`;

  setOptions({
    prepend: '# Bug',
    body: userText,
    append: systemInfo,
  });
  open(token, 'popup');
}
```

### 4. Voice Message Feedback

This workflow is ideal for capturing voice feedback.

```typescript
import { useIdeate, useVoiceRecorder, useFileUploader } from '@alis-build/vue-ideate';

const token = 'YOUR_COLLECTION_TOKEN';
const { open, setOptions } = useIdeate();
const { start, stop, audioBlob } = useVoiceRecorder();
const { upload } = useFileUploader();

async function captureAndSendVoiceFeedback() {
  await start();
  
  // Wait for the user to finish recording and stop it
  // For example, you can have a button that calls stop()
}

async function onRecordingStopped() {
  if (audioBlob.value) {
    const downloadUrl = await upload(audioBlob.value, 'voice-recording.webm');
    const systemInfo = `
---
**System Info:**
- Browser: ${navigator.userAgent}`;

    setOptions({
      prepend: '# Voice Feedback',
      append: systemInfo,
      mediaUrl: downloadUrl,
    });
    open(token, 'popup');
  }
}
```

### 5. Custom Popup Window

This workflow demonstrates how to open the feedback form in a popup window with custom dimensions and position.

```typescript
import { useIdeate } from '@alis-build/vue-ideate';

const token = 'YOUR_COLLECTION_TOKEN';
const { open, setOptions } = useIdeate();

function openCustomPopup(userText: string) {
  setOptions({
    prepend: '# Feedback',
    body: userText,
  });

  const windowFeatures = 'left=200,top=200,width=500,height=600,popup=true';
  open(token, windowFeatures);
}
```
