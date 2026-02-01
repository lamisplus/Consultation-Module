class LiveStreamAudioProcessor {
    constructor(onAudioLevel, chunkDuration = 500) {
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
    }

    async initialize(onDataAvailable) {
        try {
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

            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: 'audio/webm;codecs=opus',
                audioBitsPerSecond: 16000
            });

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.localBuffer.push(event.data);
                    onDataAvailable(event.data);
                }
            };

            this.startAudioLevelMonitoring();

            return true;
        } catch (error) {
            throw new Error(`Failed to initialize audio: ${error.message}`);
        }
    }

    startRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'inactive') {
            this.isRecording = true;
            this.localBuffer = [];
            this.mediaRecorder.start(this.chunkDuration);
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.isRecording = false;
            this.mediaRecorder.stop();
        }
    }

    startAudioLevelMonitoring() {
        const updateLevel = () => {
            if (!this.analyser || !this.isRecording) {
                this.animationFrame = requestAnimationFrame(updateLevel);
                return;
            }

            this.analyser.getByteFrequencyData(this.dataArray);
            const average = this.dataArray.reduce((a, b) => a + b) / this.dataArray.length;
            const normalizedLevel = Math.min(100, (average / 255) * 100);
            
            this.onAudioLevel(normalizedLevel);
            this.animationFrame = requestAnimationFrame(updateLevel);
        };

        updateLevel();
    }

    getLocalBuffer() {
        return new Blob(this.localBuffer, { type: 'audio/webm' });
    }

    clearLocalBuffer() {
        this.localBuffer = [];
    }

    cleanup() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
        }

        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }

        this.localBuffer = [];
        this.isRecording = false;
    }
}

export default LiveStreamAudioProcessor;
