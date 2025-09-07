// Single-Page Subtitle Generator Application

// View states enum
const ViewState = {
    LANDING: 'landing',
    RESULTS: 'results'
};

class SubtitleGeneratorApp {
    constructor() {
        this.currentView = ViewState.LANDING;
        this.videoFile = null;
        this.cues = [];
        this.alternatives = {};
        this.chunkSummaries = []; // Store summaries from each chunk
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
        this.setupDragAndDrop();
        this.switchView(ViewState.LANDING);
    }

    bindElements() {
        // Views
        this.landingView = document.getElementById('landing-view');
        this.resultsView = document.getElementById('results-view');

        // Landing view elements
        this.videoFileInput = document.getElementById('video-file');
        this.videoPlayerLanding = document.getElementById('video-player-landing');
        this.videoPreview = document.getElementById('video-preview');
        this.uploadArea = document.getElementById('upload-area');
        this.chooseFileBtn = document.getElementById('choose-file-btn');
        this.loadSampleBtn = document.getElementById('load-sample-video');
        this.clearVideoBtn = document.getElementById('clear-video');
        this.generateBtn = document.getElementById('generate-subtitles');

        // Progress and alerts (landing)
        this.progressContainer = document.getElementById('progress-container');
        this.progressBar = document.getElementById('progress-bar');
        this.progressText = document.getElementById('progress-text');
        this.errorDisplay = document.getElementById('error-display');
        this.errorMessage = document.getElementById('error-message');
        this.successDisplay = document.getElementById('success-display');
        this.successMessage = document.getElementById('success-message');

        // Results view elements
        this.videoPlayer = document.getElementById('video-player');
        this.videoSummary = document.getElementById('video-summary');
        this.videoDuration = document.getElementById('video-duration');
        this.subtitleCount = document.getElementById('subtitle-count');
        this.currentTime = document.getElementById('current-time');
        
        // Results view buttons
        this.downloadVttBtn = document.getElementById('download-vtt');
        this.downloadSrtBtn = document.getElementById('download-srt');
        this.regenerateBtn = document.getElementById('regenerate-subtitles');
        this.backToUploadBtn = document.getElementById('back-to-upload');
        this.toggleSubtitlesBtn = document.getElementById('toggle-subtitles');
        this.searchSubtitlesBtn = document.getElementById('search-subtitles');
        this.expandAllBtn = document.getElementById('expand-all');
        
        // Editor elements
        this.cueList = document.getElementById('cue-list');
        this.searchContainer = document.getElementById('search-container');
        this.searchInput = document.getElementById('search-input');
        this.clearSearchBtn = document.getElementById('clear-search');
        
        // Sliding edit panel
        this.editPanel = document.getElementById('edit-panel');
        this.closeEditPanelBtn = document.getElementById('close-edit-panel');
        this.panelStartTime = document.getElementById('panel-start-time');
        this.panelEndTime = document.getElementById('panel-end-time');
        this.panelText = document.getElementById('panel-text');
        this.subtitlePreview = document.getElementById('subtitle-preview');
        this.savePanelEditBtn = document.getElementById('save-panel-edit');
        this.cancelPanelEditBtn = document.getElementById('cancel-panel-edit');
        
        // Modals
        this.alternativesModal = new bootstrap.Modal(document.getElementById('alternatives-modal'));
        this.currentCueText = document.getElementById('current-cue-text');
        this.alternativeOptions = document.getElementById('alternative-options');
        this.applyAlternativeBtn = document.getElementById('apply-alternative');
        
        this.editModal = new bootstrap.Modal(document.getElementById('edit-modal'));
        this.editStartTime = document.getElementById('edit-start-time');
        this.editEndTime = document.getElementById('edit-end-time');
        this.editText = document.getElementById('edit-text');
        this.saveEditBtn = document.getElementById('save-edit');
        
        this.progressModal = new bootstrap.Modal(document.getElementById('progress-modal'));
        this.progressTitle = document.getElementById('progress-title');
        this.progressMessage = document.getElementById('progress-message');
        this.modalProgressBar = document.getElementById('modal-progress-bar');
        this.modalProgressText = document.getElementById('modal-progress-text');
        
        // Settings Modal
        this.settingsModal = new bootstrap.Modal(document.getElementById('settings-modal'));
        this.settingsApiToken = document.getElementById('settings-api-token');
        this.settingsBaseUrl = document.getElementById('settings-base-url');
        this.settingsProjectId = document.getElementById('settings-project-id');
        this.settingsModel = document.getElementById('settings-model');
        this.toggleSettingsTokenBtn = document.getElementById('toggle-settings-token');
        this.saveSettingsBtn = document.getElementById('save-settings');

        // Toast
        this.successToast = new bootstrap.Toast(document.getElementById('success-toast'));
        this.toastMessage = document.getElementById('toast-message');
    }

    bindEvents() {
        // Landing view events
        this.videoFileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        this.chooseFileBtn.addEventListener('click', () => this.videoFileInput.click());
        this.loadSampleBtn.addEventListener('click', () => this.loadSampleVideo());
        this.clearVideoBtn.addEventListener('click', () => this.clearVideo());
        this.generateBtn.addEventListener('click', () => this.generateSubtitles());

        // Results view events
        this.downloadVttBtn.addEventListener('click', () => this.downloadSubtitles('vtt'));
        this.downloadSrtBtn.addEventListener('click', () => this.downloadSubtitles('srt'));
        this.regenerateBtn.addEventListener('click', () => this.regenerateSubtitles());
        this.backToUploadBtn.addEventListener('click', () => this.backToUpload());
        this.toggleSubtitlesBtn.addEventListener('click', () => this.toggleSubtitles());
        this.searchSubtitlesBtn.addEventListener('click', () => this.toggleSearch());
        this.expandAllBtn.addEventListener('click', () => this.expandAllCues());
        this.clearSearchBtn.addEventListener('click', () => this.clearSearch());
        this.searchInput.addEventListener('input', () => this.performSearch());
        this.applyAlternativeBtn.addEventListener('click', () => this.applyAlternative());
        this.saveEditBtn.addEventListener('click', () => this.saveEdit());
        
        // Sliding edit panel events
        this.closeEditPanelBtn.addEventListener('click', () => this.closeEditPanel());
        this.savePanelEditBtn.addEventListener('click', () => this.savePanelEdit());
        this.cancelPanelEditBtn.addEventListener('click', () => this.closeEditPanel());
        this.panelText.addEventListener('input', () => this.updateSubtitlePreview());
        
        // Video player events
        this.videoPlayer.addEventListener('timeupdate', () => this.updateCurrentTime());
        this.videoPlayer.addEventListener('loadedmetadata', () => this.updateVideoDuration());

        // Settings events
        this.toggleSettingsTokenBtn.addEventListener('click', () => this.toggleSettingsTokenVisibility());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
    }

    switchView(view) {
        this.currentView = view;
        
        // Hide all views
        this.landingView.classList.remove('active');
        this.resultsView.classList.remove('active');
        
        // Show current view
        if (view === ViewState.LANDING) {
            this.landingView.classList.add('active');
        } else if (view === ViewState.RESULTS) {
            this.resultsView.classList.add('active');
            this.setupResultsView();
        }
    }

    setupResultsView() {
        if (this.videoFile) {
            const url = URL.createObjectURL(this.videoFile);
            this.videoPlayer.src = url;
        }
        
        // Reset video summary to loading state
        this.videoSummary.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="bi bi-hourglass-split me-2"></i>
                <span>Generating summary...</span>
            </div>
        `;
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

    setupDragAndDrop() {
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.add('dragover');
            }, false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            this.uploadArea.addEventListener(eventName, () => {
                this.uploadArea.classList.remove('dragover');
            }, false);
        });

        this.uploadArea.addEventListener('drop', (e) => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        }, false);

        // Click to upload (but not on buttons)
        this.uploadArea.addEventListener('click', (e) => {
            // Don't trigger file input if clicking on a button
            if (!e.target.closest('button')) {
                this.videoFileInput.click();
            }
        });
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Settings methods
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
        this.updateGenerateButtonState();
    }

    // File handling methods
    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;
        this.handleFileSelection(file);
    }

    async handleFileSelection(file) {
        if (!file.type.startsWith('video/')) {
            this.showError('Please select a valid video file.');
            return;
        }

        this.videoFile = file;
        this.displayVideo();
        this.updateGenerateButtonState();
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
            this.updateGenerateButtonState();
            this.showSuccess('Sample video loaded successfully!');
            
        } catch (error) {
            this.showError(`Failed to load sample video: ${error.message}`);
        } finally {
            this.loadSampleBtn.disabled = false;
            this.loadSampleBtn.innerHTML = '<i class="bi bi-play-circle me-2"></i>Load Sample';
        }
    }

    clearVideo() {
        this.videoFile = null;
        this.videoFileInput.value = '';
        this.videoPreview.style.display = 'none';
        this.updateGenerateButtonState();
        this.hideAlerts();
        this.showSuccess('Video cleared successfully');
    }

    displayVideo() {
        const url = URL.createObjectURL(this.videoFile);
        this.videoPlayerLanding.src = url;
        this.videoPreview.style.display = 'block';
        
        this.videoPlayerLanding.addEventListener('loadedmetadata', () => {
            const duration = Math.floor(this.videoPlayerLanding.duration);
            const minutes = Math.floor(duration / 60);
            const seconds = duration % 60;
            this.showSuccess(`Video loaded: ${minutes}:${seconds.toString().padStart(2, '0')} duration`);
        });
    }

    updateGenerateButtonState() {
        const hasVideo = this.videoFile !== null;
        const hasSettings = this.settings.apiToken && this.settings.baseUrl && this.settings.projectId;
        
        this.generateBtn.disabled = !hasVideo || !hasSettings || this.isGenerating;
        
        if (!hasSettings) {
            this.generateBtn.title = 'Please configure API settings first';
        } else if (!hasVideo) {
            this.generateBtn.title = 'Please upload a video first';
        } else {
            this.generateBtn.title = 'Generate subtitles for your video';
        }
    }

    // Subtitle generation methods
    async generateSubtitles() {
        if (!this.validateInputs()) return;

        if (this.videoPlayerLanding && !this.videoPlayerLanding.paused) {
            this.videoPlayerLanding.pause();
        }

        this.isGenerating = true;
        this.updateUIForGeneration(true);

        try {
            this.updateProgress(20, 'Preparing to switch views...');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Switch to results view
            this.switchView(ViewState.RESULTS);
            
            // Start subtitle generation
            await this.startSubtitleGeneration();
            
        } catch (error) {
            this.showError(`Failed to start subtitle generation: ${error.message}`);
            this.isGenerating = false;
            this.updateUIForGeneration(false);
        }
    }

    async startSubtitleGeneration() {
        this.progressModal.show();
        this.isGenerating = true;

        try {
            this.updateModalProgress(5, 'Creating video chunks...');
            const chunks = await this.createVideoChunks();
            
            this.updateModalProgress(10, 'Processing chunks with AI...');
            await this.processChunks(chunks);
            
            this.finalizeSubtitles();
            
        } catch (error) {
            this.showToast(`Subtitle generation failed: ${error.message}`, 'error');
        } finally {
            this.isGenerating = false;
            this.progressModal.hide();
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
        this.loadSampleBtn.disabled = generating;
        this.clearVideoBtn.disabled = generating;
        this.progressContainer.style.display = generating ? 'block' : 'none';
        
        if (generating) {
            this.hideAlerts();
            this.generateBtn.innerHTML = '<i class="bi bi-hourglass-split me-2"></i>Processing...';
        } else {
            this.generateBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Subtitles';
            this.updateGenerateButtonState();
        }
    }

    getQualitySettings() {
        return {
            maxCharsPerLine: parseInt(document.getElementById('max-chars-line').value),
            readingSpeed: parseInt(document.getElementById('reading-speed').value),
            minDuration: parseInt(document.getElementById('min-duration').value),
            maxDuration: parseInt(document.getElementById('max-duration').value)
        };
    }

    // Video processing methods (from results.js)
    async createVideoChunks() {
        // Ensure video is loaded and get duration
        await new Promise((resolve) => {
            if (this.videoPlayer.readyState >= 1) {
                resolve();
            } else {
                this.videoPlayer.addEventListener('loadedmetadata', resolve, { once: true });
            }
        });
        
        const duration = this.videoPlayer.duration;
        if (!duration || duration <= 0) {
            throw new Error('Unable to determine video duration');
        }
        
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
            
            // Create overlapping chunks to ensure we don't miss any content
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

        console.log(`Created ${chunks.length} chunks for ${duration}s video`);
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
            
            setTimeout(() => reject(new Error('Compression timeout')), 300000);
        });
    }

    async processChunks(chunks) {
        this.cues = [];
        this.alternatives = {};
        this.chunkSummaries = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const progress = 10 + (i / chunks.length) * 70; // Leave 10% for final synthesis
            this.updateModalProgress(progress, `Processing chunk ${i + 1}/${chunks.length}`);

            try {
                const result = await this.callGeminiAPI(chunk);
                this.parseAndMergeResults(result, chunk.offsetSeconds);
                
                // Extract chunk summary from the result
                this.extractChunkSummary(result, chunk, i + 1);
            } catch (error) {
                console.error(`Failed to process chunk ${i + 1}:`, error);
                // Continue with other chunks
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
        const chunkDuration = 30;
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
6. Never Miss the speech and the background audio. Transcription should be there for the entire video. Always show the Music, Sound Effects, and other non-speech audio cues. Never miss the music and sound effects. It should be understandable by deaf people.

Output strictly in valid WebVTT format (start with WEBVTT).

Use absolute timestamps aligned to the source media's timeline in the format HH:MM:SS.mmm (always include hours, minutes, and seconds even if zero, e.g., 00:00:01.320 not 00:01.320).

Transcribe the actual spoken words as accurately as possible.

Include important non-speech audio cues in square brackets: [Music playing], [Door closes], [Phone rings], [Laughter], [Footsteps], etc.

Keep lines under ${settings.maxCharsPerLine} characters; aim reading speed under ${settings.readingSpeed} chars/sec.

Prefer 1-2 lines per cue. Avoid overlapping cues unless necessary.

Merge micro-pauses if they hurt readability.

For each cue, provide 3-4 alternative phrasings of the SAME content (not different content). Return alternatives as JSON.

TIMING REQUIREMENTS:

All cue timestamps MUST be absolute to the full video timeline starting from the beginning (00:00:00.000). 
- For this chunk covering ${startTime} to ${endTime}, adjust all timestamps to reflect their position in the FULL video
- If this chunk starts at ${startTime}, add ${offsetSeconds} seconds to all relative timestamps within this chunk
- Ensure timestamps fall within the ${startTime} to ${endTime} time window but are absolute to the full video

TIMESTAMP FORMAT: Always use the complete format HH:MM:SS.mmm - never use shortened formats like MM:SS.mmm or SS.mmm.

Only transcribe audio/speech that occurs within the specified time segment.

Align subtitle timing precisely with when words are actually spoken.

RETURN FORMAT:

WebVTT cues with actual transcribed dialogue (no commentary), then

A line with exactly ---ALTERNATIVES---

A single-line minified JSON with alternative phrasings: { "alternatives": [ { "start":"HH:MM:SS.mmm", "end":"HH:MM:SS.mmm", "options": ["exact transcription variant 1", "exact transcription variant 2", "exact transcription variant 3"] }, ... ] }

Then a line with exactly ---CHUNK_SUMMARY---

A single, concise sentence (maximum 20 words) summarizing the key action or topic in this time segment.

Remember: Your goal is ACCURATE TRANSCRIPTION of what is actually said in the video, not creative subtitle writing.`;
    }

    parseAndMergeResults(response, offsetSeconds) {
        console.log(`Processing chunk with offset: ${offsetSeconds}s`);
        const parts = response.split('---ALTERNATIVES---');
        const vttContent = parts[0].trim();
        const alternativesJson = parts[1]?.trim();

        const cuesBefore = this.cues.length;
        this.parseWebVTT(vttContent);
        const cuesAfter = this.cues.length;
        console.log(`Added ${cuesAfter - cuesBefore} cues from this chunk`);

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

    extractChunkSummary(response, chunk, chunkNumber) {
        try {
            console.log(`Extracting summary from chunk ${chunkNumber} response:`, response.substring(0, 300) + '...');
            
            // Split response to get chunk summary
            const parts = response.split('---CHUNK_SUMMARY---');
            console.log(`Chunk ${chunkNumber} split into ${parts.length} parts`);
            
            if (parts.length > 1) {
                let chunkSummary = parts[1].trim();
                console.log(`Chunk ${chunkNumber} raw summary (${chunkSummary.length} chars):`, chunkSummary);
                
                // Truncate overly long summaries to prevent synthesis token issues
                if (chunkSummary.length > 100) {
                    chunkSummary = chunkSummary.substring(0, 100) + '...';
                    console.log(`Chunk ${chunkNumber} summary truncated to:`, chunkSummary);
                }
                
                if (chunkSummary) {
                    const startTime = this.secondsToTime(chunk.offsetSeconds);
                    const endTime = this.secondsToTime(chunk.offsetSeconds + chunk.duration);
                    
                    const summaryObj = {
                        chunkNumber: chunkNumber,
                        startTime: startTime,
                        endTime: endTime,
                        duration: chunk.duration,
                        summary: chunkSummary
                    };
                    
                    this.chunkSummaries.push(summaryObj);
                    console.log(`Chunk ${chunkNumber} summary stored (${chunkSummary.length} chars)`);
                } else {
                    console.warn(`Chunk ${chunkNumber} summary is empty after trim`);
                }
            } else {
                console.warn(`Chunk ${chunkNumber} response doesn't contain ---CHUNK_SUMMARY--- marker`);
            }
        } catch (error) {
            console.error(`Failed to extract summary from chunk ${chunkNumber}:`, error);
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

                if (textLines.length > 0 && start && end) {
                    const startSeconds = this.timeToSeconds(start);
                    const endSeconds = this.timeToSeconds(end);
                    
                    // Only add cue if we have valid time values
                    if (isFinite(startSeconds) && isFinite(endSeconds) && startSeconds >= 0 && endSeconds > startSeconds) {
                        this.cues.push({
                            start: start,
                            end: end,
                            text: textLines.join('\n'),
                            startSeconds: startSeconds,
                            endSeconds: endSeconds
                        });
                    } else {
                        console.warn('Skipping invalid cue with times:', start, '->', end);
                    }
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
        try {
            if (!timeString || typeof timeString !== 'string') {
                console.warn('Invalid timeString:', timeString);
                return 0;
            }
            
            const [time, ms] = timeString.split('.');
            const timeParts = time.split(':');
            
            let hours, minutes, seconds;
            
            // Handle different time formats
            if (timeParts.length === 3) {
                // Full format: HH:MM:SS.mmm
                [hours, minutes, seconds] = timeParts.map(Number);
            } else if (timeParts.length === 2) {
                // Short format: MM:SS.mmm (assume hours = 0)
                hours = 0;
                [minutes, seconds] = timeParts.map(Number);
            } else {
                console.warn('Invalid time format:', timeString);
                return 0;
            }
            
            // Check if any part is NaN
            if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
                console.warn('Invalid time components in:', timeString, { hours, minutes, seconds });
                return 0;
            }
            
            const totalSeconds = hours * 3600 + minutes * 60 + seconds + (ms ? parseInt(ms) / 1000 : 0);
            
            // Check if result is finite
            if (!isFinite(totalSeconds)) {
                console.warn('Non-finite time result for:', timeString);
                return 0;
            }
            
            return totalSeconds;
        } catch (error) {
            console.error('Error parsing time string:', timeString, error);
            return 0;
        }
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
        console.log(`Finalizing ${this.cues.length} total cues`);
        this.applyQualityConstraints();
        this.updateVideoTrack();
        this.updateSubtitleEditor();
        this.enableDownloadButtons();
        this.updateModalProgress(100, 'Subtitles generated successfully!');
        
        // Generate video summary
        this.generateVideoSummary();
        
        setTimeout(() => {
            const lastCue = this.cues[this.cues.length - 1];
            const lastTime = lastCue ? this.secondsToTime(lastCue.endSeconds) : '00:00:00.000';
            this.showToast(`Generated ${this.cues.length} subtitle cues (up to ${lastTime})!`);
        }, 500);
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
        this.cueList.replaceChildren();
        this.subtitleCount.textContent = this.cues.length;

        this.cues.forEach((cue, index) => {
            const cueElement = this.createCueElement(cue, index);
            this.cueList.appendChild(cueElement);
        });
    }

    createCueElement(cue, index) {
        const div = document.createElement('div');
        div.className = 'list-group-item subtitle-cue px-4 py-3';
        
        const hasAlternatives = this.alternatives[`${cue.start}-${cue.end}`];
        
        div.innerHTML = `
            <div class="d-flex justify-content-between align-items-start">
                <div class="flex-grow-1 px-2">
                    <div class="fw-bold text-primary mb-2">${cue.start} → ${cue.end}</div>
                    <div class="subtitle-text mt-1">${cue.text}</div>
                </div>
                <div class="btn-group-vertical btn-group-sm ms-3">
                    <button class="btn btn-outline-primary btn-sm" onclick="app.seekToTime(${cue.startSeconds})" title="Play from here">
                        <i class="bi bi-play"></i>
                    </button>
                    <button class="btn btn-outline-secondary btn-sm" onclick="app.editSubtitle(${index})" title="Edit subtitle">
                        <i class="bi bi-pencil"></i>
                    </button>
                    ${hasAlternatives ? `
                    <button class="btn btn-outline-info btn-sm" onclick="app.showAlternatives(${index})" title="View alternatives">
                        <i class="bi bi-list"></i>
                    </button>
                    ` : ''}
                </div>
            </div>
        `;

        return div;
    }

    // Results view methods
    updateVideoDuration() {
        const duration = this.videoPlayer.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        this.videoDuration.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    updateCurrentTime() {
        const currentTime = this.videoPlayer.currentTime;
        const minutes = Math.floor(currentTime / 60);
        const seconds = Math.floor(currentTime % 60);
        this.currentTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        // Highlight current subtitle
        this.highlightCurrentCue(currentTime);
    }

    highlightCurrentCue(currentTime) {
        const cueElements = this.cueList.querySelectorAll('.subtitle-cue');
        cueElements.forEach((element, index) => {
            const cue = this.cues[index];
            if (cue && currentTime >= cue.startSeconds && currentTime <= cue.endSeconds) {
                element.classList.add('active');
            } else {
                element.classList.remove('active');
            }
        });
    }

    seekToTime(seconds) {
        try {
            // Validate the seconds value
            if (!isFinite(seconds) || seconds < 0) {
                console.warn('Invalid seek time:', seconds);
                this.showToast('Invalid time position', 'error');
                return;
            }
            
            // Make sure video player exists and has duration
            if (!this.videoPlayer || !this.videoPlayer.duration) {
                console.warn('Video player not ready');
                this.showToast('Video not ready for seeking', 'error');
                return;
            }
            
            // Clamp seconds to valid range
            const clampedSeconds = Math.min(seconds, this.videoPlayer.duration);
            
            this.videoPlayer.currentTime = clampedSeconds;
            this.videoPlayer.play().catch(error => {
                console.warn('Could not play video:', error);
            });
        } catch (error) {
            console.error('Error seeking to time:', seconds, error);
            this.showToast('Error seeking to time position', 'error');
        }
    }

    editSubtitle(cueIndex) {
        const cue = this.cues[cueIndex];
        this.panelStartTime.value = cue.start;
        this.panelEndTime.value = cue.end;
        this.panelText.value = cue.text;
        this.editPanel.dataset.cueIndex = cueIndex;
        this.updateSubtitlePreview();
        this.openEditPanel();
    }

    saveEdit() {
        const cueIndex = parseInt(this.editModal._element.dataset.cueIndex);
        const cue = this.cues[cueIndex];
        
        cue.start = this.editStartTime.value;
        cue.end = this.editEndTime.value;
        cue.text = this.editText.value;
        cue.startSeconds = this.timeToSeconds(cue.start);
        cue.endSeconds = this.timeToSeconds(cue.end);
        
        this.updateVideoTrack();
        this.updateSubtitleEditor();
        this.editModal.hide();
        this.showToast('Subtitle updated successfully');
    }

    openEditPanel() {
        this.editPanel.style.display = 'block';
        // Trigger reflow
        this.editPanel.offsetHeight;
        this.editPanel.style.transform = 'translateX(0)';
    }

    closeEditPanel() {
        this.editPanel.style.transform = 'translateX(100%)';
        setTimeout(() => {
            this.editPanel.style.display = 'none';
        }, 300); // Match transition duration
    }

    updateSubtitlePreview() {
        const text = this.panelText.value;
        if (text.trim()) {
            this.subtitlePreview.innerHTML = text.replace(/\n/g, '<br>');
        } else {
            this.subtitlePreview.innerHTML = '<small class="text-muted">Preview will appear here...</small>';
        }
    }

    savePanelEdit() {
        const cueIndex = parseInt(this.editPanel.dataset.cueIndex);
        const cue = this.cues[cueIndex];
        
        // Validate inputs
        const startTime = this.panelStartTime.value.trim();
        const endTime = this.panelEndTime.value.trim();
        const text = this.panelText.value.trim();
        
        if (!startTime || !endTime || !text) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        // Update the cue
        cue.start = startTime;
        cue.end = endTime;
        cue.text = text;
        cue.startSeconds = this.timeToSeconds(cue.start);
        cue.endSeconds = this.timeToSeconds(cue.end);
        
        // Validate time order
        if (cue.startSeconds >= cue.endSeconds) {
            this.showToast('End time must be after start time', 'error');
            return;
        }
        
        this.updateVideoTrack();
        this.updateSubtitleEditor();
        this.closeEditPanel();
        this.showToast('Subtitle updated successfully');
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
        this.showToast('Subtitle updated successfully');
    }

    toggleSubtitles() {
        const track = this.videoPlayer.textTracks[0];
        if (track) {
            track.mode = track.mode === 'showing' ? 'hidden' : 'showing';
            const isShowing = track.mode === 'showing';
            this.toggleSubtitlesBtn.innerHTML = `<i class="bi bi-eye${isShowing ? '-slash' : ''} me-1"></i>${isShowing ? 'Hide' : 'Show'} Subtitles`;
        }
    }

    toggleSearch() {
        const isVisible = this.searchContainer.style.display !== 'none';
        this.searchContainer.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            this.searchInput.focus();
        }
    }

    performSearch() {
        const query = this.searchInput.value.toLowerCase();
        const cueElements = this.cueList.querySelectorAll('.subtitle-cue');
        
        cueElements.forEach((element, index) => {
            const cue = this.cues[index];
            const matches = cue.text.toLowerCase().includes(query);
            element.style.display = matches || query === '' ? 'block' : 'none';
        });
    }

    clearSearch() {
        this.searchInput.value = '';
        this.performSearch();
        this.searchContainer.style.display = 'none';
    }

    expandAllCues() {
        this.showToast('All cues expanded');
    }

    async regenerateSubtitles() {
        if (confirm('Are you sure you want to regenerate subtitles? This will overwrite current subtitles.')) {
            await this.startSubtitleGeneration();
        }
    }



    backToUpload() {
        // Reset processing state
        this.isGenerating = false;
        this.progressContainer.style.display = 'none';
        this.hideAlerts();
        
        // Clear chunk summaries
        this.chunkSummaries = [];
        
        // Reset UI elements
        this.updateGenerateButtonState();
        this.generateBtn.innerHTML = '<i class="bi bi-magic me-2"></i>Generate Subtitles';
        
        // Enable all controls
        this.videoFileInput.disabled = false;
        this.loadSampleBtn.disabled = false;
        this.clearVideoBtn.disabled = false;
        
        // Switch to landing view
        this.switchView(ViewState.LANDING);
        
        this.showToast('Returned to upload page');
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

        this.showToast(`Downloaded ${filename}`);
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

    // Progress and UI methods
    updateProgress(percentage, message) {
        this.progressBar.style.width = percentage + '%';
        this.progressText.textContent = `${Math.round(percentage)}%`;
        
        if (message) {
            this.progressContainer.querySelector('.text-muted').textContent = message;
        }
    }

    updateModalProgress(percentage, message) {
        this.modalProgressBar.style.width = percentage + '%';
        this.modalProgressText.textContent = `${Math.round(percentage)}%`;
        
        if (message) {
            this.progressMessage.textContent = message;
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

    showToast(message, type = 'success') {
        this.toastMessage.textContent = message;
        this.successToast.show();
    }

    async generateVideoSummary() {
        this.updateModalProgress(90, 'Synthesizing video summary...');
        
        try {
            console.log(`Synthesizing summary from ${this.chunkSummaries.length} chunk summaries`);
            
            if (this.chunkSummaries.length === 0) {
                this.videoSummary.innerHTML = `
                    <div class="text-muted text-center py-3">
                        <i class="bi bi-exclamation-circle me-2"></i>
                        No chunk summaries available for synthesis
                    </div>
                `;
                return;
            }

            // Create synthesis prompt with all chunk summaries
            let chunkSummariesText = this.chunkSummaries.map(chunk => 
                `[${chunk.startTime}-${chunk.endTime}]: ${chunk.summary}`
            ).join('\n');

            console.log('Original chunk summaries for synthesis:', chunkSummariesText);
            console.log('Original summaries length:', chunkSummariesText.length, 'characters');
            
            // If summaries are too long, truncate more aggressively
            const maxSummariesLength = 800; // Conservative limit
            if (chunkSummariesText.length > maxSummariesLength) {
                console.log('Chunk summaries too long, truncating...');
                
                // Truncate each summary to be much shorter
                const truncatedSummaries = this.chunkSummaries.map(chunk => {
                    const shortSummary = chunk.summary.length > 50 ? 
                        chunk.summary.substring(0, 50) + '...' : 
                        chunk.summary;
                    return `[${chunk.startTime.substring(0, 8)}]: ${shortSummary}`;
                });
                
                chunkSummariesText = truncatedSummaries.join('\n');
                console.log('Truncated summaries:', chunkSummariesText);
                console.log('Truncated summaries length:', chunkSummariesText.length, 'characters');
            }

            // For short videos with only 1 chunk, just use the chunk summary directly
            if (this.chunkSummaries.length === 1) {
                const singleSummary = this.chunkSummaries[0].summary;
                console.log('Single chunk detected, using direct summary:', singleSummary);
                
                this.videoSummary.innerHTML = `
                    <div class="summary-content">
                        <p class="mb-0">${singleSummary}</p>
                        <hr class="my-2">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            Duration: ${this.videoDuration.textContent} • 
                            <i class="bi bi-chat-text me-1"></i>
                            ${this.cues.length} subtitles • 
                            <i class="bi bi-layers me-1"></i>
                            1 segment analyzed
                        </small>
                    </div>
                `;
                return;
            }

            const prompt = `Combine these segments into 2-3 short sentences:

${chunkSummariesText}

Summary:`;
            
            // Estimate token usage for synthesis
            const promptLength = prompt.length;
            const estimatedTokens = Math.ceil(promptLength / 4); // Rough estimate: 4 chars per token
            console.log(`Synthesis prompt: ${promptLength} characters, ~${estimatedTokens} tokens`);
            
            if (estimatedTokens > 2000) {
                console.warn(`High token count detected: ${estimatedTokens} tokens. May hit limits.`);
            }

            const url = `${this.settings.baseUrl}/models/${this.settings.model}:generateContent`;
            
            const payload = {
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512, // Drastically reduced for 2-3 lines max
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
                throw new Error(`Synthesis API error: ${response.status}`);
            }

            const data = await response.json();
            console.log('Summary synthesis response:', data);
            
            // Enhanced response parsing
            let summary = null;
            const candidate = data.candidates?.[0];
            
            if (candidate?.content?.parts?.[0]?.text) {
                summary = candidate.content.parts[0].text;
            }
            
            // Check for finish reasons that might explain empty response
            if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
                console.warn('Synthesis finished with reason:', candidate.finishReason);
                if (candidate.finishReason === 'MAX_TOKENS') {
                    throw new Error('Synthesis exceeded token limit');
                } else if (candidate.finishReason === 'SAFETY') {
                    throw new Error('Content filtered by safety settings');
                } else {
                    throw new Error(`Synthesis stopped: ${candidate.finishReason}`);
                }
            }
            
            if (!summary || !summary.trim()) {
                console.error('Empty synthesis response:', data);
                throw new Error('Empty response from synthesis API');
            }

            if (summary && summary.trim()) {
                this.videoSummary.innerHTML = `
                    <div class="summary-content">
                        <p class="mb-0">${summary.trim()}</p>
                        <hr class="my-2">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            Duration: ${this.videoDuration.textContent} • 
                            <i class="bi bi-chat-text me-1"></i>
                            ${this.cues.length} subtitles • 
                            <i class="bi bi-layers me-1"></i>
                            ${this.chunkSummaries.length} segments analyzed
                        </small>
                    </div>
                `;
            } else {
                throw new Error('No summary generated from synthesis');
            }

        } catch (error) {
            console.error('Failed to synthesize summary:', error);
            
            // Enhanced fallback: Create smart summary from chunk summaries
            if (this.chunkSummaries.length > 0) {
                // Try to create a flowing summary by combining chunk summaries intelligently
                let combinedSummary = '';
                
                if (this.chunkSummaries.length <= 3) {
                    // For few chunks, combine them with connecting words
                    const summaries = this.chunkSummaries.map(chunk => {
                        // Remove timestamps and clean up
                        return chunk.summary.replace(/^\[.*?\]:\s*/, '').trim();
                    });
                    
                    combinedSummary = summaries.join('. ');
                } else {
                    // For many chunks, take first, middle, and last
                    const first = this.chunkSummaries[0].summary.replace(/^\[.*?\]:\s*/, '').trim();
                    const middle = this.chunkSummaries[Math.floor(this.chunkSummaries.length / 2)].summary.replace(/^\[.*?\]:\s*/, '').trim();
                    const last = this.chunkSummaries[this.chunkSummaries.length - 1].summary.replace(/^\[.*?\]:\s*/, '').trim();
                    
                    combinedSummary = `${first}. ${middle}. ${last}`;
                }
                
                // Truncate if too long
                const finalSummary = combinedSummary.length > 200 ? 
                    combinedSummary.substring(0, 200) + '...' : 
                    combinedSummary;
                
                this.videoSummary.innerHTML = `
                    <div class="summary-content">
                        <p class="mb-0">${finalSummary || 'Video contains multiple segments with various topics.'}</p>
                        <hr class="my-2">
                        <small class="text-muted">
                            <i class="bi bi-clock me-1"></i>
                            Duration: ${this.videoDuration.textContent} • 
                            <i class="bi bi-chat-text me-1"></i>
                            ${this.cues.length} subtitles • 
                            <i class="bi bi-layers me-1"></i>
                            ${this.chunkSummaries.length} segments
                        </small>
                        <div class="mt-2">
                            <small class="text-info">
                                <i class="bi bi-info-circle me-1"></i>
                                Summary created from segment analysis (AI synthesis unavailable)
                            </small>
                        </div>
                    </div>
                `;
            } else {
                this.videoSummary.innerHTML = `
                    <div class="text-muted text-center py-3">
                        <i class="bi bi-exclamation-triangle me-2"></i>
                        Unable to generate summary
                        <br>
                        <small>${error.message}</small>
                    </div>
                `;
            }
        }
    }
}

// Initialize the application
const app = new SubtitleGeneratorApp();

// Make it globally available for onclick handlers
window.app = app; 