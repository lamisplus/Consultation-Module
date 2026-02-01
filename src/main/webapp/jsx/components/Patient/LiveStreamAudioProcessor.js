class LiveStreamAudioProcessor {
    constructor(onAudioLevel, chunkDuration = 200) {
        this.audioContext = null;
        this.mediaStream = null;
        this.mediaRecorder = null;
        this.onAudioLevel = onAudioLevel;
        this.chunkDuration = chunkDuration;
        this.analyser = null;
        this.dataArray = null;
        this.animationFrame = null;
        this.localBuffer = [];
        this.isRecording = false;
        this.onDataAvailableCallback = null;
        this.chunksGenerated = 0;
    }

    async initialize(onDataAvailable) {
        try {
        
            
            this.onDataAvailableCallback = onDataAvailable;
        
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
        

            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: 16000
            });

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            const bufferLength = this.analyser.frequencyBinCount;
            this.dataArray = new Uint8Array(bufferLength);
            source.connect(this.analyser);

            // Test supported mime types
            const mimeTypes = [
                'audio/webm;codecs=opus',
                'audio/webm',
                'audio/ogg;codecs=opus',
                'audio/mp4',
                ''
            ];

            let selectedMimeType = '';
            for (const mimeType of mimeTypes) {
                if (mimeType === '' || MediaRecorder.isTypeSupported(mimeType)) {
                    selectedMimeType = mimeType;
                    break;
                }
            }

            const recorderOptions = {
                audioBitsPerSecond: 16000
            };
            
            if (selectedMimeType) {
                recorderOptions.mimeType = selectedMimeType;
            }

            
            this.mediaRecorder = new MediaRecorder(this.mediaStream, recorderOptions);
           

            // Set up event handlers BEFORE starting
            this.mediaRecorder.ondataavailable = (event) => {
                this.chunksGenerated++;
                
                if (event.data && event.data.size > 0) {
                    this.localBuffer.push(event.data);
                    
                    // CRITICAL: Call the callback
                    if (this.onDataAvailableCallback) {
                        try {
                            this.onDataAvailableCallback(event.data);
                        } catch (error) {
                            console.error('[AudioProcessor] Error in callback:', error);
                        }
                    } else {
                        console.error('[AudioProcessor] ERROR: onDataAvailableCallback is null!');
                    }
                } else {
                    console.warn('[AudioProcessor] Empty or invalid audio chunk received');
                }
            };

            this.mediaRecorder.onerror = (event) => {
                console.error('[AudioProcessor] MediaRecorder error:', event.error);
            };

            this.mediaRecorder.onstart = () => {
                console.log('[AudioProcessor] MediaRecorder.onstart fired');
            };

            this.mediaRecorder.onstop = () => {
                console.log('[AudioProcessor] MediaRecorder.onstop fired');
            };

            this.mediaRecorder.onpause = () => {
                console.log('[AudioProcessor] MediaRecorder.onpause fired');
            };

            this.mediaRecorder.onresume = () => {
                console.log('[AudioProcessor] MediaRecorder.onresume fired');
            };

            this.startAudioLevelMonitoring();
            return true;
        } catch (error) {
            console.error('[AudioProcessor] Initialization failed:', error);
            throw new Error(`Failed to initialize audio: ${error.message}`);
        }
    }

    startRecording() {
        
        if (!this.mediaRecorder) {
            console.error('[AudioProcessor] Cannot start - MediaRecorder is null');
            return;
        }

        if (this.mediaRecorder.state !== 'inactive') {
            console.warn('[AudioProcessor] Cannot start - MediaRecorder not inactive, current state:', this.mediaRecorder.state);
            return;
        }

        this.isRecording = true;
        this.localBuffer = [];
        this.chunksGenerated = 0;
        
        
        this.mediaRecorder.start(this.chunkDuration);
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.isRecording = false;
            this.mediaRecorder.stop();
         
        } else {
        }
    }

    startAudioLevelMonitoring() {
        const updateLevel = () => {
            if (!this.analyser) {
                this.animationFrame = requestAnimationFrame(updateLevel);
                return;
            }

            this.analyser.getByteFrequencyData(this.dataArray);
            const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
            const normalizedLevel = Math.min(100, (average / 255) * 100);
            
            if (this.onAudioLevel) {
                this.onAudioLevel(normalizedLevel);
            }
            
            this.animationFrame = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    }

    getLocalBuffer() {
        return new Blob(this.localBuffer, { type: this.mediaRecorder?.mimeType || 'audio/webm' });
    }

    clearLocalBuffer() {
        this.localBuffer = [];
    }

    cleanup() {
      
        
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => {
                track.stop();
            });
            this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.localBuffer = [];
        this.isRecording = false;
        this.onDataAvailableCallback = null;
    }
}

export default LiveStreamAudioProcessor;