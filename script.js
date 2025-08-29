// Subtitle Generator App - Main JavaScript Module

class SubtitleGenerator {
    constructor() {
        this.videoFile = null;
        this.videoPlayer = null;
        this.cues = [];
        this.alternatives = {};
        this.currentTrack = null;
        this.isGenerating = false;
        
        // Default settings
        this.settings = {
            apiToken: '',
            baseUrl: 'https://llmfoundry.straive.com/gemini/v1beta',
            projectId: 'my-test-project',
            model: 'gemini-2.5-pro'
        };
        
        this.init();
    }

    init() {
        this.bindElements();
        this.bindEvents();
        this.loadStoredSettings();
        this.setupQualityControls();
    }

    bindElements() {
        // Main elements
        this.videoFileInput = document.getElementById('video-file');
        this.videoContainer = document.getElementById('video-container');
        this.videoPlayer = document.getElementById('video-player');
        this.generationControls = document.getElementById('generation-controls');
        
        // Buttons
        this.loadSampleBtn = document.getElementById('load-sample-video');
        this.clearVideoBtn = document.getElementById('clear-video');
        this.generateBtn = document.getElementById('generate-subtitles');
        this.downloadVttBtn = document.getElementById('download-vtt');
        this.downloadSrtBtn = document.getElementById('download-srt');
        
        // Progress and alerts
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.errorDisplay = document.getElementById('error-display');
        this.errorMessage = document.getElementById('error-message');
        this.successDisplay = document.getElementById('success-display');
        this.successMessage = document.getElementById('success-message');
        
        // Editor
        this.subtitleEditor = document.getElementById('subtitle-editor');
        this.cueList = document.getElementById('cue-list');
        
        // Modal
        this.alternativesModal = new bootstrap.Modal(document.getElementById('alternatives-modal'));
        this.currentCueText = document.getElementById('current-cue-text');
        this.alternativeOptions = document.getElementById('alternative-options');
        this.applyAlternativeBtn = document.getElementById('apply-alternative');
        
        // Settings Modal
        this.settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
        this.settingsApiToken = document.getElementById('settings-api-token');
        this.settingsBaseUrl = document.getElementById('settings-base-url');
        this.settingsProjectId = document.getElementById('settings-project-id');
        this.settingsModel = document.getElementById('settings-model');
        this.toggleSettingsTokenBtn = document.getElementById('toggle-settings-token');
        this.saveSettingsBtn = document.getElementById('save-settings');
    }

    bindEvents() {
        this.videoFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.loadSampleBtn.addEventListener('click', () => this.loadSampleVideo());
        this.clearVideoBtn.addEventListener('click', () => this.clearVideo());
        this.generateBtn.addEventListener('click', () => this.generateSubtitles());
        this.downloadVttBtn.addEventListener('click', () => this.downloadSubtitles('vtt'));
        this.downloadSrtBtn.addEventListener('click', () => this.downloadSubtitles('srt'));
        this.applyAlternativeBtn.addEventListener('click', () => this.applyAlternative());
        this.toggleSettingsTokenBtn.addEventListener('click', () => this.toggleSettingsTokenVisibility());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    setupQualityControls() {
        const controls = [
            { id: 'max-chars-line', valueId: 'max-chars-value' },
            { id: 'reading-speed', valueId: 'reading-speed-value' },
            { id: 'min-duration', valueId: 'min-duration-value' },
            { id: 'max-duration', valueId: 'max-duration-value' }
        ];

        controls.forEach(({ id, valueId }) => {
            const slider = document.getElementById(id);
            const valueDisplay = document.getElementById(valueId);
            
            slider.addEventListener('input', () => {
                valueDisplay.textContent = slider.value;
            });
        });
    }

    toggleSettingsTokenVisibility() {
        const isPassword = this.settingsApiToken.type === 'password';
        this.settingsApiToken.type = isPassword ? 'text' : 'password';
        this.toggleSettingsTokenBtn.innerHTML = isPassword ? '<i class="bi bi-eye-slash"></i>' : '<i class="bi bi-eye"></i>';
    }

    loadStoredSettings() {
        const storedSettings = localStorage.getItem('api-settings');
        if (storedSettings) {
            try {
                this.settings = { ...this.settings, ...JSON.parse(storedSettings) };
            } catch (e) {
                console.warn('Failed to parse stored settings:', e);
            }
        }
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        this.settingsApiToken.value = this.settings.apiToken || '';
        this.settingsBaseUrl.value = this.settings.baseUrl;
        this.settingsProjectId.value = this.settings.projectId;
        this.settingsModel.value = this.settings.model;
    }

    saveSettings() {
        this.settings = {
            apiToken: this.settingsApiToken.value.trim(),
            baseUrl: this.settingsBaseUrl.value.trim(),
            projectId: this.settingsProjectId.value.trim(),
            model: this.settingsModel.value
        };

        // Validate settings
        if (!this.settings.apiToken) {
            this.showError('API Token is required');
            return;
        }

        if (!this.settings.baseUrl) {
            this.showError('Base URL is required');
            return;
        }

        if (!this.settings.projectId) {
            this.showError('Project ID is required');
            return;
        }

        localStorage.setItem('api-settings', JSON.stringify(this.settings));
        this.settingsModal.hide();
        this.showSuccess('Settings saved successfully');
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('video/')) {
            this.showError('Please select a valid video file.');
            return;
        }

        this.videoFile = file;
        this.displayVideo();
        this.clearSubtitles();
    }

    async loadSampleVideo() {
        try {
            this.loadSampleBtn.disabled = true;
            this.loadSampleBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Loading...';
            
            const response = await fetch('samples/Prompting_Not_GPTing_Ideas.mp4');
            
            if (!response.ok) {
                throw new Error(`Failed to load sample video: ${response.status} ${response.statusText}`);
            }
            
            const blob = await response.blob();
            this.videoFile = new File([blob], 'sample-video.mp4', { type: 'video/mp4' });
            
            this.displayVideo();
            this.clearSubtitles();
            this.showSuccess('Sample video loaded successfully!');
            
        } catch (error) {
            this.showError(`Failed to load sample video: ${error.message}`);
        } finally {
            this.loadSampleBtn.disabled = false;
            this.loadSampleBtn.innerHTML = '<i class="bi bi-play-circle me-2"></i>Load Sample Video';
        }
    }

    clearVideo() {
        this.videoFile = null;
        this.videoFileInput.value = '';
        this.videoContainer.style.display = 'none';
        this.generationControls.style.display = 'none';
        this.clearSubtitles();
        this.hideAlerts();
        this.showSuccess('Video cleared successfully');
    }

    displayVideo() {
        const url = URL.createObjectURL(this.videoFile);
        this.videoPlayer.src = url;
        this.videoContainer.style.display = 'block';
        this.generationControls.style.display = 'block';
        
        this.videoPlayer.addEventListener('loadedmetadata', () => {
            const duration = Math.floor(this.videoPlayer.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            this.showSuccess(`Video loaded: ${minutes}:${seconds.toString().padStart(2, '0')} duration`);
        });
    }

    async generateSubtitles() {
        if (!this.validateInputs()) return;

        if (this.videoPlayer && !this.videoPlayer.paused) {
            this.videoPlayer.pause();
        }

        this.isGenerating = true;
        this.updateUIForGeneration(true);

        try {
            this.updateProgress(5, 'Creating video chunks...');
            const chunks = await this.createVideoChunks();
            
            this.updateProgress(10, 'Processing chunks with AI...');
            await this.processChunks(chunks);
            this.finalizeSubtitles();
        } catch (error) {
            this.showError(`Subtitle generation failed: ${error.message}`);
        } finally {
            this.isGenerating = false;
            this.updateUIForGeneration(false);
        }
    }

    validateInputs() {
        if (!this.settings.apiToken) {
            this.showError('Please configure your API settings (API Token is required). Click the Settings button to configure.');
            return false;
        }

        if (!this.settings.baseUrl) {
            this.showError('Please configure your API settings (Base URL is required). Click the Settings button to configure.');
            return false;
        }

        if (!this.settings.projectId) {
            this.showError('Please configure your API settings (Project ID is required). Click the Settings button to configure.');
            return false;
        }

        if (!this.videoFile) {
            this.showError('Please select a video file.');
            return false;
        }

        return true;
    }

    updateUIForGeneration(generating) {
        this.generateBtn.disabled = generating;
        this.videoFileInput.disabled = generating;
        this.progressContainer.style.display = generating ? 'block' : 'none';
        
        if (generating) {
            this.hideAlerts();
            this.generateBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Generating...';
        } else {
            this.generateBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Subtitles';
        }
    }

    async createVideoChunks() {
        const duration = this.videoPlayer.duration;
        const chunkDuration = Math.min(30, duration);
        const chunks = [];

        if (duration <= 30) {
            const fileToUse = this.videoFile.size <= 20 * 1024 * 1024 ? this.videoFile : await this.compressVideo(this.videoFile);
            chunks.push({
                file: fileToUse,
                startTime: 0,
                duration: duration,
                offsetSeconds: 0
            });
        } else {
            const fileToUse = this.videoFile.size <= 20 * 1024 * 1024 ? this.videoFile : await this.compressVideo(this.videoFile);
            
            for (let start = 0; start < duration; start += chunkDuration - 2) {
                const end = Math.min(start + chunkDuration, duration);
                chunks.push({
                    file: fileToUse,
                    startTime: start,
                    duration: end - start,
                    offsetSeconds: start
                });
            }
        }

        return chunks;
    }

    async compressVideo(videoFile) {
        const maxSizeBytes = 15 * 1024 * 1024;
        if (videoFile.size <= maxSizeBytes) {
            return videoFile;
        }

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const video = document.createElement('video');
            
            video.muted = true;
            video.volume = 0;
            
            video.onloadedmetadata = () => {
                canvas.width = Math.min(640, video.videoWidth);
                canvas.height = Math.min(360, video.videoHeight);
                
                const stream = canvas.captureStream(10);
                const mediaRecorder = new MediaRecorder(stream, {
                    mimeType: 'video/webm;codecs=vp8',
                    videoBitsPerSecond: 300000
                });
                
                const chunks = [];
                mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
                mediaRecorder.onstop = () => {
                    const compressedBlob = new Blob(chunks, { type: 'video/webm' });
                    resolve(compressedBlob);
                };
                
                video.onplay = () => {
                    mediaRecorder.start();
                    const drawFrame = () => {
                        if (video.ended) {
                            mediaRecorder.stop();
                            return;
                        }
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        requestAnimationFrame(drawFrame);
                    };
                    drawFrame();
                };
                
                video.play();
            };
            
            video.onerror = reject;
            video.src = URL.createObjectURL(videoFile);
            
            setTimeout(() => reject(new Error('Compression timeout')), 300000); // 5 minutes
        });
    }



    async processChunks(chunks) {
        this.cues = [];
        this.alternatives = {};

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            this.updateProgress((i / chunks.length) * 100, `Processing chunk ${i + 1}/${chunks.length}`);

            try {
                const result = await this.callGeminiAPI(chunk);
                this.parseAndMergeResults(result, chunk.offsetSeconds);
            } catch (error) {
                this.showError(`Failed to process chunk ${i + 1}: ${error.message}`);
            }

            await new Promise(resolve => setTimeout(resolve, 200));
        }
    }

    async callGeminiAPI(chunk) {
        const settings = this.getQualitySettings();
        const prompt = this.buildGeminiPrompt(chunk.offsetSeconds, settings);
        const url = `${this.settings.baseUrl}/models/${this.settings.model}:generateContent`;
        
        const base64Data = await this.fileToBase64(chunk.file);
        
        const payload = {
            contents: [{
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: chunk.file.type,
                            data: base64Data.split(',')[1]
                        }
                    }
                ]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 4096,
                topP: 0.8,
                topK: 40
            }
        };

        const authHeader = `Bearer ${this.settings.apiToken}:${this.settings.projectId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`API error: ${response.status} ${response.statusText}. ${errorData.error?.message || ''}`);
        }

        const data = await response.json();
        
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Invalid response format from API');
        }

        return data.candidates[0].content.parts[0].text;
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    buildGeminiPrompt(offsetSeconds, settings) {
        const startTime = this.secondsToTime(offsetSeconds);
        const chunkDuration = 30; // Our chunk duration
        const endTime = this.secondsToTime(offsetSeconds + chunkDuration);
        
        return `You are a professional subtitle transcriber. Your job is to accurately transcribe the EXACT spoken words and sounds from this video.

CRITICAL: Listen carefully to the audio and transcribe EXACTLY what is being said. Do not make up dialogue or content that is not actually spoken in the video.

FOCUS ON TIME SEGMENT: ${startTime} to ${endTime} (approximately ${chunkDuration} seconds)

Analyze the video content and transcribe ONLY the actual spoken words and sounds for the time segment from ${startTime} to ${endTime}. Ignore content before or after this time window.

TRANSCRIPTION REQUIREMENTS:

1. ACCURACY: Transcribe the EXACT words spoken - do not paraphrase, summarize, or create fictional dialogue
2. Listen carefully to identify who is speaking and what they actually say
3. If speech is unclear or inaudible, use [inaudible] rather than guessing
4. If there's no speech in a time period, include relevant sound effects only
5. Always include background music, sound effects, and other non-speech audio cues in square brackets - whatever is happening in the background, transcribe it -along with the speech. 
6. Never Miss the speech and the background audio. Transcription should be there for the entire video.

Output strictly in valid WebVTT format (start with WEBVTT).

Use absolute timestamps aligned to the source media's timeline (HH:MM:SS.mmm).

Transcribe the actual spoken words as accurately as possible.

Include important non-speech audio cues in square brackets: [Music playing], [Door closes], [Phone rings], [Laughter], [Footsteps], etc.

Keep lines under ${settings.maxCharsPerLine} characters; aim reading speed under ${settings.readingSpeed} chars/sec.

Prefer 1-2 lines per cue. Avoid overlapping cues unless necessary.

Merge micro-pauses if they hurt readability.

For each cue, provide 3-4 alternative phrasings of the SAME content (not different content). Return alternatives as JSON.

TIMING REQUIREMENTS:

All cue timestamps MUST be absolute to the full video timeline and fall within the ${startTime} to ${endTime} time window.

Only transcribe audio/speech that occurs within the specified time segment.

Align subtitle timing precisely with when words are actually spoken.

RETURN FORMAT:

WebVTT cues with actual transcribed dialogue (no commentary), then

A line with exactly ---ALTERNATIVES---

A single-line minified JSON with alternative phrasings: { "alternatives": [ { "start":"HH:MM:SS.mmm", "end":"HH:MM:SS.mmm", "options": ["exact transcription variant 1", "exact transcription variant 2", "exact transcription variant 3"] }, ... ] }

Remember: Your goal is ACCURATE TRANSCRIPTION of what is actually said in the video, not creative subtitle writing.`;
    }

    getQualitySettings() {
        return {
            maxCharsPerLine: parseInt(document.getElementById('max-chars-line').value),
            readingSpeed: parseInt(document.getElementById('reading-speed').value),
            minDuration: parseInt(document.getElementById('min-duration').value),
            maxDuration: parseInt(document.getElementById('max-duration').value)
        };
    }

    parseAndMergeResults(response, offsetSeconds) {
        const parts = response.split('---ALTERNATIVES---');
        const vttContent = parts[0].trim();
        const alternativesJson = parts[1]?.trim();

        this.parseWebVTT(vttContent);

        if (alternativesJson) {
            try {
                const alternatives = JSON.parse(alternativesJson);
                if (alternatives.alternatives) {
                    alternatives.alternatives.forEach(alt => {
                        const key = `${alt.start}-${alt.end}`;
                        this.alternatives[key] = alt.options;
                    });
                }
            } catch (e) {
                // Ignore JSON parsing errors for alternatives
            }
        }
    }

    parseWebVTT(vttContent) {
        const lines = vttContent.split('\n');
        let i = 0;

        // Skip WEBVTT header
        while (i < lines.length && !lines[i].includes('-->')) i++;

        while (i < lines.length) {
            // Find timestamp line
            if (lines[i].includes('-->')) {
                const [start, end] = lines[i].split('-->').map(t => t.trim());
                i++;

                // Collect text lines
                const textLines = [];
                while (i < lines.length && lines[i].trim() !== '' && !lines[i].includes('-->')) {
                    textLines.push(lines[i].trim());
                    i++;
                }

                if (textLines.length > 0) {
                    this.cues.push({
                        start: start,
                        end: end,
                        text: textLines.join('\n'),
                        startSeconds: this.timeToSeconds(start),
                        endSeconds: this.timeToSeconds(end)
                    });
                }
            } else {
                i++;
            }
        }

        // Sort cues by start time and remove duplicates
        this.cues.sort((a, b) => a.startSeconds - b.startSeconds);
        this.removeDuplicateCues();
    }

    timeToSeconds(timeString) {
        const [time, ms] = timeString.split('.');
        const [hours, minutes, seconds] = time.split(':').map(Number);
        return hours * 3600 + minutes * 60 + seconds + (ms ? parseInt(ms) / 1000 : 0);
    }

    secondsToTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }

    removeDuplicateCues() {
        const uniqueCues = [];
        const seen = new Set();

        for (const cue of this.cues) {
            const key = `${cue.start}-${cue.text}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueCues.push(cue);
            }
        }

        this.cues = uniqueCues;
    }

    finalizeSubtitles() {
        this.applyQualityConstraints();
        this.updateVideoTrack();
        this.updateSubtitleEditor();
        this.enableDownloadButtons();
        this.updateProgress(100, 'Subtitles generated successfully!');
        
        setTimeout(() => {
            this.progressContainer.style.display = 'none';
            this.showSuccess(`Generated ${this.cues.length} subtitle cues`);
        }, 1000);
    }

    applyQualityConstraints() {
        const settings = this.getQualitySettings();
        
        // Apply reading speed and duration constraints
        this.cues.forEach(cue => {
            const textLength = cue.text.replace(/\[.*?\]/g, '').length; // Exclude sound effects
            const minDuration = Math.max(textLength / settings.readingSpeed, settings.minDuration / 1000);
            const maxDuration = settings.maxDuration / 1000;
            
            const currentDuration = cue.endSeconds - cue.startSeconds;
            
            if (currentDuration < minDuration) {
                cue.endSeconds = cue.startSeconds + minDuration;
                cue.end = this.secondsToTime(cue.endSeconds);
            } else if (currentDuration > maxDuration) {
                cue.endSeconds = cue.startSeconds + maxDuration;
                cue.end = this.secondsToTime(cue.endSeconds);
            }
        });

        // Merge cues with tiny gaps
        this.mergeTinyGaps();
    }

    mergeTinyGaps() {
        const mergedCues = [];
        let i = 0;

        while (i < this.cues.length) {
            let currentCue = { ...this.cues[i] };

            // Look ahead for cues to merge
            while (i + 1 < this.cues.length) {
                const nextCue = this.cues[i + 1];
                const gap = nextCue.startSeconds - currentCue.endSeconds;

                // Merge if gap is less than 150ms and combined text isn't too long
                if (gap < 0.15 && (currentCue.text + ' ' + nextCue.text).length < 80) {
                    currentCue.text += ' ' + nextCue.text;
                    currentCue.end = nextCue.end;
                    currentCue.endSeconds = nextCue.endSeconds;
                    i++;
                } else {
                    break;
                }
            }

            mergedCues.push(currentCue);
            i++;
        }

        this.cues = mergedCues;
    }

    updateVideoTrack() {
        // Remove existing track
        if (this.currentTrack) {
            this.videoPlayer.removeChild(this.currentTrack);
        }

        // Create new WebVTT content
        const vttContent = this.generateWebVTT();
        const blob = new Blob([vttContent], { type: 'text/vtt' });
        const url = URL.createObjectURL(blob);

        // Create and add new track
        this.currentTrack = document.createElement('track');
        this.currentTrack.kind = 'subtitles';
        this.currentTrack.label = 'Generated Subtitles';
        this.currentTrack.srclang = 'en';
        this.currentTrack.src = url;
        this.currentTrack.default = true;

        this.videoPlayer.appendChild(this.currentTrack);
    }

    generateWebVTT() {
        let vtt = 'WEBVTT\n\n';
        
        this.cues.forEach((cue, index) => {
            vtt += `${index + 1}\n`;
            vtt += `${cue.start} --> ${cue.end}\n`;
            vtt += `${cue.text}\n\n`;
        });

        return vtt;
    }

    updateSubtitleEditor() {
        this.subtitleEditor.style.display = 'block';
        this.cueList.replaceChildren();

        this.cues.forEach((cue, index) => {
            const cueElement = this.createCueElement(cue, index);
            this.cueList.appendChild(cueElement);
        });
    }

    createCueElement(cue, index) {
        const div = document.createElement('div');
        div.className = 'list-group-item';
        
        const hasAlternatives = this.alternatives[`${cue.start}-${cue.end}`];
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1">
                    <div class="fw-bold text-primary">${cue.start} → ${cue.end}</div>
                    <div class="mt-1">${cue.text}</div>
                </div>
                <div class="btn-group-vertical btn-group-sm">
                    <button class="btn btn-outline-primary btn-sm" onclick="app.seekToTime(${cue.startSeconds})">
                        <i class="bi bi-play"></i>
                    </button>
                    ${hasAlternatives ? `
                    <button class="btn btn-outline-secondary btn-sm" onclick="app.showAlternatives(${index})">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        return div;
    }

    seekToTime(seconds) {
        this.videoPlayer.currentTime = seconds;
        this.videoPlayer.play();
    }

    showAlternatives(cueIndex) {
        const cue = this.cues[cueIndex];
        const alternatives = this.alternatives[`${cue.start}-${cue.end}`];
        
        if (!alternatives) return;

        this.currentCueText.textContent = cue.text;
        this.alternativeOptions.replaceChildren();

        // Add current text as first option
        const currentOption = this.createAlternativeOption(cue.text, true);
        this.alternativeOptions.appendChild(currentOption);

        // Add alternative options
        alternatives.forEach(alt => {
            const option = this.createAlternativeOption(alt, false);
            this.alternativeOptions.appendChild(option);
        });

        // Store current cue index for later use
        this.alternativesModal._element.dataset.cueIndex = cueIndex;
        this.alternativesModal.show();
    }

    createAlternativeOption(text, isCurrent) {
        const div = document.createElement('div');
        div.className = 'form-check mb-2';
        
        div.innerHTML = `
            <input class="form-check-input" type="radio" name="alternative" value="${text}" ${isCurrent ? 'checked' : ''}>
            <label class="form-check-label">
                ${text} ${isCurrent ? '<span class="badge bg-primary">Current</span>' : ''}
            </label>
        `;

        return div;
    }

    applyAlternative() {
        const selectedOption = document.querySelector('input[name="alternative"]:checked');
        if (!selectedOption) return;

        const cueIndex = parseInt(this.alternativesModal._element.dataset.cueIndex);
        const newText = selectedOption.value;

        // Update the cue
        this.cues[cueIndex].text = newText;

        // Refresh the video track and editor
        this.updateVideoTrack();
        this.updateSubtitleEditor();

        this.alternativesModal.hide();
        this.showSuccess('Subtitle updated successfully');
    }

    enableDownloadButtons() {
        this.downloadVttBtn.disabled = false;
        this.downloadSrtBtn.disabled = false;
    }

    downloadSubtitles(format) {
        let content, filename, mimeType;

        if (format === 'vtt') {
            content = this.generateWebVTT();
            filename = 'subtitles.vtt';
            mimeType = 'text/vtt';
        } else if (format === 'srt') {
            content = this.generateSRT();
            filename = 'subtitles.srt';
            mimeType = 'text/srt';
        }

        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showSuccess(`Downloaded ${filename}`);
    }

    generateSRT() {
        let srt = '';
        
        this.cues.forEach((cue, index) => {
            const startTime = this.formatSRTTime(cue.start);
            const endTime = this.formatSRTTime(cue.end);
            
            srt += `${index + 1}\n`;
            srt += `${startTime} --> ${endTime}\n`;
            srt += `${cue.text}\n\n`;
        });

        return srt;
    }

    formatSRTTime(vttTime) {
        // Convert WebVTT time (HH:MM:SS.mmm) to SRT time (HH:MM:SS,mmm)
        return vttTime.replace('.', ',');
    }

    clearSubtitles() {
        this.cues = [];
        this.alternatives = {};
        
        if (this.currentTrack) {
            this.videoPlayer.removeChild(this.currentTrack);
            this.currentTrack = null;
        }
        
        this.subtitleEditor.style.display = 'none';
        this.downloadVttBtn.disabled = true;
        this.downloadSrtBtn.disabled = true;
    }

    updateProgress(percentage, message) {
        this.progressBar.style.width = percentage + '%';
        this.progressText.textContent = `${Math.round(percentage)}%`;
        
        if (message) {
            this.progressContainer.querySelector('.text-muted').textContent = message;
        }
    }

    showError(message) {
        this.hideAlerts();
        this.errorMessage.textContent = message;
        this.errorDisplay.style.display = 'block';
        
        // Auto hide after 10 seconds
        setTimeout(() => {
            this.errorDisplay.style.display = 'none';
        }, 10000);
    }

    showSuccess(message) {
        this.hideAlerts();
        this.successMessage.textContent = message;
        this.successDisplay.style.display = 'block';
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.successDisplay.style.display = 'none';
        }, 5000);
    }

    hideAlerts() {
        this.errorDisplay.style.display = 'none';
        this.successDisplay.style.display = 'none';
    }
}

// Initialize the app
const app = new SubtitleGenerator();

// Make app globally available for onclick handlers
window.app = app;
