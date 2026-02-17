# Vue Ideate

A Vue 3 composable library for programmatically submitting content to Alis Ideate. This package provides utilities to capture and submit text notes, audio recordings, screenshots, and files directly to your Ideate collections.

## Installation

```bash
pnpm add @alis-build/vue-ideate @alis-build/ideate
```

## Prerequisites

1. **Collection Token**: Get your token by creating a collection at [https://console.alisx.com/ideate/home/collections](https://console.alisx.com/ideate/home/collections)
2. **Ideate Client**: You'll need to initialize an `IdeateServicePromiseClient` from the `@alis-build/ideate` package

## Quick Start

```typescript
import { useIdeate } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

// Initialize the Ideate client
const client = new IdeateServicePromiseClient(
  'https://your-ideate-endpoint.com',
);

// Use the composable
const { addNote, addAudioNote, addMultiFileUpload } = useIdeate(client);

// Submit a text note
await addNote('YOUR_COLLECTION_TOKEN', 'This is my feedback!');
```

## Core Composables

### `useIdeate(client)`

The main composable for submitting content to Ideate. It provides three methods for different types of submissions.

**Parameters:**

- `client`: An `IdeateServicePromiseClient` instance

**Returns:**

- `addNote(target, content)`: Submit a text note
- `addAudioNote(target, content)`: Submit an audio recording
- `addMultiFileUpload(target, files)`: Submit multiple files

#### `addNote(target, content)`

Submit a text note to an Ideate collection.

```typescript
const { addNote } = useIdeate(client);

try {
  await addNote('YOUR_TOKEN', 'The login button is not working');
  console.log('Note submitted successfully!');
} catch (error) {
  console.error('Failed to submit note:', error);
}
```

**Parameters:**

- `target` (string): Your collection token
- `content` (string): The text content to submit

#### `addAudioNote(target, content)`

Submit an audio recording to an Ideate collection.

```typescript
import { useVoiceRecorder, useIdeate } from '@alis-build/vue-ideate';

const { start, stop, audioBlob } = useVoiceRecorder();
const { addAudioNote } = useIdeate(client);

// Start recording
await start();

// ... user records audio ...

// Stop and submit
await stop();
if (audioBlob.value) {
  await addAudioNote('YOUR_TOKEN', audioBlob.value);
}
```

**Parameters:**

- `target` (string): Your collection token
- `content` (Blob): The audio data as a Blob

#### `addMultiFileUpload(target, files)`

Submit multiple files to an Ideate collection.

```typescript
import { useIdeate } from '@alis-build/vue-ideate';

const { addMultiFileUpload } = useIdeate(client);

const files = [
  {
    blob: screenshotBlob,
    filename: 'screenshot.png',
    mimeType: 'image/png',
  },
  {
    blob: logBlob,
    filename: 'app.log',
    mimeType: 'text/plain',
  },
];

await addMultiFileUpload('YOUR_TOKEN', files);
```

**Parameters:**

- `target` (string): Your collection token
- `files` (FileWrapper[]): Array of file objects with `blob`, `filename`, and `mimeType` properties

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

  const { screenshotUrl, isLoading, error, takeScreenshot, clearScreenshot } =
    useScreenshot();
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

## Workflows

Here are practical workflows for using `@alis-build/vue-ideate` to capture and submit different types of content.

### 1. Simple Text Feedback

Submit a text note directly to your Ideate collection.

```typescript
import { useIdeate } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

const client = new IdeateServicePromiseClient('https://your-endpoint.com');
const token = 'YOUR_COLLECTION_TOKEN';
const { addNote } = useIdeate(client);

async function submitFeedback(userText: string) {
  try {
    await addNote(token, userText);
    console.log('Feedback submitted!');
  } catch (error) {
    console.error('Failed to submit:', error);
  }
}
```

### 2. Voice Note Submission

Record and submit audio feedback.

```typescript
import { useIdeate, useVoiceRecorder } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

const client = new IdeateServicePromiseClient('https://your-endpoint.com');
const token = 'YOUR_COLLECTION_TOKEN';

const { addAudioNote } = useIdeate(client);
const { start, stop, audioBlob, isRecording } = useVoiceRecorder();

async function recordAndSubmit() {
  // Start recording
  await start();

  // Wait for user to finish...
  // Then stop recording
  await stop();

  // Submit the audio
  if (audioBlob.value) {
    try {
      await addAudioNote(token, audioBlob.value);
      console.log('Voice note submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  }
}
```

### 3. Screenshot Submission

Capture a screenshot and submit it along with other files.

```typescript
import { useIdeate, useScreenshot } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

const client = new IdeateServicePromiseClient('https://your-endpoint.com');
const token = 'YOUR_COLLECTION_TOKEN';

const { addMultiFileUpload } = useIdeate(client);
const { takeScreenshot, screenshotBlob } = useScreenshot();

async function captureAndSubmit() {
  await takeScreenshot();

  if (screenshotBlob.value) {
    const files = [
      {
        blob: screenshotBlob.value,
        filename: 'screenshot.png',
        mimeType: 'image/png',
      },
    ];

    try {
      await addMultiFileUpload(token, files);
      console.log('Screenshot submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  }
}
```

### 4. Screen Recording Submission

Record the screen and submit the video.

```typescript
import { useIdeate, useScreenRecorder } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

const client = new IdeateServicePromiseClient('https://your-endpoint.com');
const token = 'YOUR_COLLECTION_TOKEN';

const { addMultiFileUpload } = useIdeate(client);
const { start, stop, videoBlob, isRecording } = useScreenRecorder();

async function recordAndSubmit() {
  // Start recording
  await start();

  // Wait for user to finish...
  // Then stop recording
  await stop();

  // Submit the video
  if (videoBlob.value) {
    const files = [
      {
        blob: videoBlob.value,
        filename: 'screen-recording.webm',
        mimeType: 'video/webm',
      },
    ];

    try {
      await addMultiFileUpload(token, files);
      console.log('Screen recording submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  }
}
```

### 5. Multiple Files Submission

Submit multiple files at once (screenshots, logs, etc.).

```typescript
import { useIdeate } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

const client = new IdeateServicePromiseClient('https://your-endpoint.com');
const token = 'YOUR_COLLECTION_TOKEN';

const { addMultiFileUpload } = useIdeate(client);

async function submitMultipleFiles(userFiles: File[]) {
  // Convert File objects to FileWrapper format
  const files = await Promise.all(
    userFiles.map(async (file) => ({
      blob: file,
      filename: file.name,
      mimeType: file.type,
    })),
  );

  try {
    await addMultiFileUpload(token, files);
    console.log('Files submitted!');
  } catch (error) {
    console.error('Failed to submit:', error);
  }
}
```

### 6. Combined: Screen Recording + Log File

Submit a screen recording along with a log file for comprehensive bug reports.

```typescript
import { useIdeate, useScreenRecorder } from '@alis-build/vue-ideate';
import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

const client = new IdeateServicePromiseClient('https://your-endpoint.com');
const token = 'YOUR_COLLECTION_TOKEN';

const { addMultiFileUpload } = useIdeate(client);
const { start, stop, videoBlob } = useScreenRecorder();

async function submitBugReport(logFile: File) {
  // Start recording
  await start();

  // User reproduces the bug...

  // Stop recording
  await stop();

  // Submit both video and log file
  if (videoBlob.value) {
    const files = [
      {
        blob: videoBlob.value,
        filename: 'bug-reproduction.webm',
        mimeType: 'video/webm',
      },
      {
        blob: logFile,
        filename: logFile.name,
        mimeType: logFile.type,
      },
    ];

    try {
      await addMultiFileUpload(token, files);
      console.log('Bug report submitted!');
    } catch (error) {
      console.error('Failed to submit:', error);
    }
  }
}
```

### 7. Complete Vue Component Example

A full example showing how to build a feedback widget.

```vue
<script setup lang="ts">
  import { ref } from 'vue';
  import {
    useIdeate,
    useVoiceRecorder,
    useScreenshot,
  } from '@alis-build/vue-ideate';
  import { IdeateServicePromiseClient } from '@alis-build/ideate/alis/ideate/ideate_grpc_web_pb';

  const client = new IdeateServicePromiseClient('https://your-endpoint.com');
  const token = 'YOUR_COLLECTION_TOKEN';

  const { addNote, addAudioNote, addMultiFileUpload } = useIdeate(client);
  const {
    start: startVoice,
    stop: stopVoice,
    audioBlob,
    isRecording: isRecordingVoice,
  } = useVoiceRecorder();
  const { takeScreenshot, screenshotBlob } = useScreenshot();

  const feedbackText = ref('');
  const isSubmitting = ref(false);

  async function submitTextFeedback() {
    if (!feedbackText.value) return;

    isSubmitting.value = true;
    try {
      await addNote(token, feedbackText.value);
      feedbackText.value = '';
      alert('Feedback submitted!');
    } catch (error) {
      alert('Failed to submit feedback');
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitVoiceFeedback() {
    if (!audioBlob.value) return;

    isSubmitting.value = true;
    try {
      await addAudioNote(token, audioBlob.value);
      alert('Voice note submitted!');
    } catch (error) {
      alert('Failed to submit voice note');
    } finally {
      isSubmitting.value = false;
    }
  }

  async function submitScreenshot() {
    await takeScreenshot();

    if (!screenshotBlob.value) return;

    isSubmitting.value = true;
    try {
      const files = [
        {
          blob: screenshotBlob.value,
          filename: 'screenshot.png',
          mimeType: 'image/png',
        },
      ];
      await addMultiFileUpload(token, files);
      alert('Screenshot submitted!');
    } catch (error) {
      alert('Failed to submit screenshot');
    } finally {
      isSubmitting.value = false;
    }
  }
</script>

<template>
  <div class="feedback-widget">
    <h2>Submit Feedback</h2>

    <!-- Text Feedback -->
    <div>
      <textarea
        v-model="feedbackText"
        placeholder="Enter your feedback..."
      ></textarea>
      <button
        @click="submitTextFeedback"
        :disabled="isSubmitting || !feedbackText"
      >
        Submit Text
      </button>
    </div>

    <!-- Voice Feedback -->
    <div>
      <button v-if="!isRecordingVoice" @click="startVoice">
        Start Voice Recording
      </button>
      <button v-else @click="stopVoice">Stop Recording</button>
      <button
        v-if="audioBlob"
        @click="submitVoiceFeedback"
        :disabled="isSubmitting"
      >
        Submit Voice Note
      </button>
    </div>

    <!-- Screenshot -->
    <div>
      <button @click="submitScreenshot" :disabled="isSubmitting">
        Take & Submit Screenshot
      </button>
    </div>
  </div>
</template>
```

## API Reference

### FileWrapper Interface

The `FileWrapper` interface is used when submitting files:

```typescript
interface FileWrapper {
  blob: Blob; // The file data
  filename: string; // Name of the file (e.g., 'screenshot.png')
  mimeType?: string; // MIME type (e.g., 'image/png', 'video/webm')
}
```

## Error Handling

All submission methods (`addNote`, `addAudioNote`, `addMultiFileUpload`) throw errors on failure. Always wrap them in try-catch blocks:

```typescript
try {
  await addNote(token, content);
} catch (error) {
  console.error('Submission failed:', error);
  // Handle error (show user message, retry, etc.)
}
```

## License

MIT
