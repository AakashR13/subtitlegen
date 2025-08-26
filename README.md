# AI Video Subtitle Generator

A browser-based application that generates accurate video subtitles using AI transcription. Built with vanilla JavaScript and designed to work with custom Gemini API endpoints.

## Features

- **Accurate Transcription**: Uses AI to transcribe actual spoken words from video files
- **Video Upload & Preview**: Supports MP4, WebM, and other common video formats
- **Smart Compression**: Automatically compresses large videos for API compatibility
- **Alternative Phrasings**: Provides multiple transcription options for each subtitle cue
- **Real-time Preview**: See subtitles rendered directly on the video player
- **Export Options**: Download as WebVTT (.vtt) or SubRip (.srt) formats
- **Quality Controls**: Adjustable reading speed, character limits, and cue duration
- **No Backend Required**: Everything runs in your browser

## Quick Start

1. **Open the App**: Open `index.html` in a modern web browser
2. **Configure API**: Click Settings and enter:
   - **API Token**: Your API authentication token
   - **Base URL**: `https://llmfoundry.straive.com/gemini/v1beta`
   - **Project ID**: Your project identifier
   - **Model**: `gemini-2.0-flash` (recommended)
3. **Upload Video**: Select a video file (works best with 2-10 minute videos)
4. **Generate**: Click "Generate Subtitles" and wait for AI processing
5. **Review & Edit**: Choose alternative phrasings if needed
6. **Download**: Export as VTT or SRT format

## API Configuration

The app is configured for custom Gemini API endpoints with the following format:

```
URL: https://llmfoundry.straive.com/gemini/v1beta/models/gemini-2.0-flash:generateContent
Authorization: Bearer YOUR_TOKEN:YOUR_PROJECT_ID
```

### Default Settings
- **Base URL**: `https://llmfoundry.straive.com/gemini/v1beta`
- **Project ID**: `my-test-project`
- **Model**: `gemini-2.0-flash`

## Quality Settings

- **Max Characters per Line**: 20-80 characters
- **Reading Speed**: 8-25 characters per second
- **Min Cue Duration**: 0.5-2 seconds
- **Max Cue Duration**: 3-10 seconds

## Video Requirements

- **Format**: MP4, WebM, AVI, MOV
- **Duration**: 2-10 minutes (optimal)
- **Size**: Automatically compressed if > 20MB
- **Audio**: Clear speech for best transcription results

## Technical Details

- **Frontend Only**: Pure HTML5, CSS (Bootstrap), and vanilla JavaScript
- **ES6 Modules**: Modern JavaScript with async/await
- **WebVTT Standard**: Industry-standard subtitle format
- **Video Compression**: Browser-native MediaRecorder for size optimization
- **Chunked Processing**: Splits long videos into 30-second segments

## How It Works

1. **Video Upload**: File is loaded into browser video element
2. **Compression**: Large files are compressed to 640x360 resolution
3. **Chunking**: Videos are split into 30-second overlapping segments
4. **AI Processing**: Each chunk is sent to Gemini API for transcription
5. **Merging**: Results are combined and duplicates removed
6. **Quality Control**: Timing and length constraints applied
7. **Export**: Final subtitles available for download

## Transcription Accuracy

The app uses a specialized prompt that:
- Focuses on **exact transcription** of spoken words
- Includes important sound effects and non-speech audio
- Uses `[inaudible]` for unclear speech rather than guessing
- Provides alternative phrasings for the same content
- Aligns timing precisely with actual speech

## Browser Compatibility

- **Chrome**: 90+ (recommended)
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

Requires MediaRecorder API support for video compression.

## Privacy & Security

- **Local Processing**: Videos processed entirely in browser
- **API Communication**: Only sends compressed video chunks to configured endpoint
- **No Data Storage**: No user data stored on external servers
- **Settings Persistence**: API settings saved locally in browser storage

## Development

Files:
- `index.html` - Main application interface
- `app.js` - Core application logic
- `README.md` - Documentation

The app uses Bootstrap 5 for styling and requires no build process.

## Troubleshooting

**No network requests**: Check browser console for errors, ensure video is loaded
**413 Request Too Large**: Video will be automatically compressed
**Poor transcription**: Ensure clear audio and proper microphone levels
**Settings not saving**: Check browser local storage permissions

## License

This project is for demonstration purposes. Ensure compliance with your API provider's terms of service.