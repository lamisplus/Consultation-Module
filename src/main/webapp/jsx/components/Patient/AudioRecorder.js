import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import {
    Dialog,
    IconButton,
    FormControlLabel,
    Checkbox,
    Button,
    Typography,
    Box,
    Paper,
    Tooltip,
    Chip,
    CircularProgress,
    Tabs,
    Tab,
    Fade,
    useMediaQuery,
} from '@material-ui/core';
import {
    Close as CloseIcon,
    Mic as MicIcon,
    Stop as StopIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Send as SendIcon,
    Replay as ReplayIcon,
    Description as DescriptionIcon,
    CheckCircle as CheckCircleIcon,
    Refresh as RefreshIcon,
    CloudUpload as CloudUploadIcon,
    DeleteOutline as DeleteOutlineIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
    SettingsInputAntenna as StreamIcon,
} from '@material-ui/icons';
import axios from 'axios';
import { toast } from 'react-toastify';
import ConsentCheckbox from './ConsentCheckbox';
import { checkServerAvailability } from '../../../../../utils/connectionUtils';
import ConnectionStatusBadge from './ConnectionStatusBadge';
import LiveStreamingTab from './LiveStreamingTab';
import useLocalStorageState from '../../../hooks/useLocalStorageState';

class WavEncoder {
    constructor(sampleRate = 16000, numChannels = 1, bitDepth = 16) {
        this.sampleRate = sampleRate;
        this.numChannels = numChannels;
        this.bitDepth = bitDepth;
    }

    floatTo16BitPCM(float32Array) {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            const s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    encode(audioBuffer) {
        const numOfChan = this.numChannels;
        const length = audioBuffer.length * numOfChan * 2 + 44;
        const buffer = new ArrayBuffer(length);
        const view = new DataView(buffer);
        let pos = 0;

        this.writeString(view, pos, 'RIFF'); pos += 4;
        view.setUint32(pos, length - 8, true); pos += 4;
        this.writeString(view, pos, 'WAVE'); pos += 4;
        this.writeString(view, pos, 'fmt '); pos += 4;
        view.setUint32(pos, 16, true); pos += 4;
        view.setUint16(pos, 1, true); pos += 2;
        view.setUint16(pos, numOfChan, true); pos += 2;
        view.setUint32(pos, this.sampleRate, true); pos += 4;
        view.setUint32(pos, this.sampleRate * numOfChan * 2, true); pos += 4;
        view.setUint16(pos, numOfChan * 2, true); pos += 2;
        view.setUint16(pos, 16, true); pos += 2;
        this.writeString(view, pos, 'data'); pos += 4;
        view.setUint32(pos, length - pos - 4, true); pos += 4;

        const int16 = this.floatTo16BitPCM(audioBuffer);
        for (let i = 0; i < int16.length; i++, pos += 2) {
            view.setInt16(pos, int16[i], true);
        }

        return new Blob([buffer], { type: 'audio/wav' });
    }
}

class AudioProcessor {
    constructor(sampleRate = 16000) {
        this.sampleRate = sampleRate;
        this.audioContext = null;
        this.audioInput = null;
        this.scriptProcessor = null;
        this.recordingBuffers = [];
        this.isRecording = false;
        this.isPaused = false;
        this.wavEncoder = new WavEncoder(sampleRate, 1, 16);
    }

    async initialize(stream) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
            sampleRate: this.sampleRate
        });

        this.audioInput = this.audioContext.createMediaStreamSource(stream);
        const bufferSize = 4096;
        this.scriptProcessor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

        this.scriptProcessor.onaudioprocess = (e) => {
            if (!this.isRecording || this.isPaused) return;
            const inputData = e.inputBuffer.getChannelData(0);
            this.recordingBuffers.push(new Float32Array(inputData));
        };

        this.audioInput.connect(this.scriptProcessor);
        this.scriptProcessor.connect(this.audioContext.destination);
    }

    startRecording() {
        this.recordingBuffers = [];
        this.isRecording = true;
        this.isPaused = false;
    }

    pauseRecording() {
        this.isPaused = true;
    }

    resumeRecording() {
        this.isPaused = false;
    }

    stopRecording() {
        this.isRecording = false;
        this.isPaused = false;

        if (this.scriptProcessor) {
            this.scriptProcessor.disconnect();
            this.scriptProcessor = null;
        }

        if (this.audioInput) {
            this.audioInput.disconnect();
            this.audioInput = null;
        }

        const totalLength = this.recordingBuffers.reduce((acc, buffer) => acc + buffer.length, 0);
        const mergedBuffer = new Float32Array(totalLength);
        let offset = 0;

        for (const buffer of this.recordingBuffers) {
            mergedBuffer.set(buffer, offset);
            offset += buffer.length;
        }

        const wavBlob = this.wavEncoder.encode(mergedBuffer);
        this.recordingBuffers = [];

        return wavBlob;
    }

    cleanup() {
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
        }
        this.recordingBuffers = [];
    }
}

const useStyles = makeStyles((theme) => ({
    fullscreenDialog: {
        '& .MuiDialog-paper': {
            margin: 0,
            maxHeight: '100%',
            width: '100%',
            height: '100%',
            backgroundColor: '#f8f9fa',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
        },
    },
    dialogContent: {
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    header: {
        backgroundColor: '#014d88',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(2, 3),
        boxShadow: '0 2px 10px rgba(1, 77, 136, 0.15)',
        zIndex: theme.zIndex.appBar,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        gap: theme.spacing(4),
        padding: theme.spacing(4),
        overflow: 'hidden',
        [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
            padding: theme.spacing(2),
            gap: theme.spacing(2),
            overflowY: 'auto',
        },
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    leftPanel: {
        flex: '0 0 40%',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
        [theme.breakpoints.down('sm')]: {
            flex: 'none',
            width: '100%',
        },
        overflow: "auto",
        paddingRight: theme.spacing(4),
    },
    checkboxContainer: {
        display: 'flex',
        flexDirection: 'row',
        gap: theme.spacing(2),
        [theme.breakpoints.down('sm')]: {
            flexDirection: 'column',
        },
    },
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        minHeight: 0,
    },
    customTabs: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: theme.spacing(0.5),
        '& .MuiTabs-indicator': {
            height: '100%',
            borderRadius: '12px',
            backgroundColor: 'rgba(1, 77, 136, 0.08)',
        },
        '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            minHeight: 48,
            zIndex: 1,
            fontFamily: '"Plus Jakarta Sans", sans-serif',
            letterSpacing: '0.01em',
            '&.Mui-selected': {
                color: '#014d88',
            },
        },
    },
    recordingCard: {
        padding: theme.spacing(4),
        height: '350px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '12px',
        backgroundColor: '#ffffff',
        border: '2px solid transparent',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        '&:hover': {
            borderColor: '#4a7ba6',
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
    },
    recordingCardActive: {
        backgroundColor: '#ffffff',
        borderColor: '#f44336',
        boxShadow: '0 0 0 4px rgba(244, 67, 54, 0.2)',
        cursor: 'default',
        '&:hover': { transform: 'none' },
    },
    recordingCardComplete: {
        backgroundColor: '#ffffff',
        borderColor: '#4caf50',
        boxShadow: '0 0 0 4px rgba(76, 175, 80, 0.2)',
        cursor: 'default',
        '&:hover': { transform: 'none' },
    },
    uploadCard: {
        border: '2px dashed #e0e0e0',
        backgroundColor: '#f8f9fa',
        '&:hover': {
            borderColor: '#014d88',
            backgroundColor: '#ffffff',
        },
    },
    micIcon: {
        fontSize: 96,
        marginBottom: theme.spacing(2),
        color: '#9e9e9e',
        transition: 'color 0.3s',
    },
    micIconRecording: {
        color: '#f44336',
        animation: '$pulse 1.5s infinite ease-in-out',
    },
    micIconComplete: {
        color: '#4caf50',
    },
    '@keyframes pulse': {
        '0%': { transform: 'scale(1)', opacity: 1 },
        '50%': { transform: 'scale(1.1)', opacity: 0.8 },
        '100%': { transform: 'scale(1)', opacity: 1 },
    },
    timeDisplay: {
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        fontSize: 48,
        fontWeight: 700,
        marginTop: theme.spacing(1),
        letterSpacing: '-1px',
    },
    controlsContainer: {
        padding: theme.spacing(1),
    },
    settingsBox: {
        backgroundColor: 'transparent',
        border: '1px solid #e0e0e0',
        borderRadius: '12px',
        padding: theme.spacing(2),
    },
    transcriptionCard: {
        padding: theme.spacing(3),
        borderRadius: '12px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        overflow: 'hidden',
    },
    transcriptionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing(3),
    },
    transcriptionTextarea: {
        flex: 1,
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        padding: theme.spacing(3),
        fontSize: '1.05rem',
        lineHeight: 1.7,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        resize: 'none',
        backgroundColor: '#f8f9fa',
        transition: 'all 0.2s',
        letterSpacing: '0.01em',
        fontWeight: 600,
        color: '#1a1a1a',
        '&:focus': {
            outline: 'none',
            backgroundColor: '#ffffff',
            borderColor: '#014d88',
            boxShadow: '0 0 0 3px rgba(1, 77, 136, 0.1)',
        },
        '&::placeholder': {
            color: '#6b7280',
            fontWeight: 500,
        },
    },
    transcriptionEmpty: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280',
        backgroundColor: '#f8f9fa',
        border: '2px dashed #e0e0e0',
        borderRadius: '12px',
        padding: theme.spacing(6),
    },
    actionButtons: {
        display: 'flex',
        gap: theme.spacing(2),
        marginTop: theme.spacing(3),
        paddingTop: theme.spacing(2),
        borderTop: '1px solid rgba(0, 0, 0, 0.08)',
    },
    errorAlert: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        padding: theme.spacing(2),
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        fontWeight: 500,
        border: '1px solid #f44336',
    },
    largeButton: {
        padding: theme.spacing(1.5, 3),
        fontSize: '1rem',
        borderRadius: '12px',
        textTransform: 'none',
        fontWeight: 700,
        boxShadow: 'none',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        transition: 'all 0.3s ease',
    },
    primaryButton: {
        backgroundColor: '#014d88',
        color: '#ffffff',
        '&:hover': {
            backgroundColor: '#003355',
            boxShadow: '0 4px 12px rgba(1, 77, 136, 0.15)',
            transform: 'translateY(-1px)',
        },
        '&:disabled': {
            backgroundColor: '#e0e0e0',
            color: '#9e9e9e',
        },
    },
    secondaryButton: {
        backgroundColor: '#f8f9fa',
        color: '#1a1a1a',
        border: '1px solid #e0e0e0',
        '&:hover': {
            backgroundColor: '#e9ecef',
            borderColor: '#014d88',
        },
    },
}));


const AudioRecorder = ({ onTranscriptionComplete, patient }) => {
    const classes = useStyles();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [connectionState, setConnectionState] = useState({
        mode: 'checking',
        isChecking: true,
        activeApiCall: false,
    });
    const [serverConfig, setServerConfig] = useState({
        transcriptionUrl: '',
        soapUrl: null,
        serverBaseUrl: '',
    });

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [saveForTraining, setSaveForTraining] = useLocalStorageState("consultation-module-setSaveForTraining", false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
    const [error, setError] = useState(null);
    const [modelSizeSelect] = useState("small");
    const [languageSelect] = useState("en");
    const [isPaused, setIsPaused] = useState(false);
    const [isStartingRecording, setIsStartingRecording] = useState(false);

    const [hasConsent, setHasConsent] = useLocalStorageState("consultation-module-hasConsent", false);
    const [transcriptionText, setTranscriptionText] = useState("");
    const [soapNote, setSoapNote] = useState("");
    const [originalTranscription, setOriginalTranscription] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const [inputMode, setInputMode] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [hasPlayedUpload, setHasPlayedUpload] = useState(false);
    const [hasProcessedUpload, setHasProcessedUpload] = useState(false);
    const [streamingData, setStreamingData] = useState(null);
    const audioProcessorRef = useRef(null);
    const timerRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const streamRef = useRef(null);
    const modeCheckTimeoutRef = useRef(null);

    const audioRefs = useRef({
        startRecording: new Audio(`${process.env.PUBLIC_URL}/tape-start.wav`),
    });

    useEffect(() => {
        if (isModalOpen) {
            checkConnectivity();
        }
    }, [isModalOpen]);

    useEffect(() => {
        const handleOnline = () => {
            if (!connectionState.activeApiCall && !isRecording && !isTranscribing && !isGeneratingSOAP) {
                if (modeCheckTimeoutRef.current) {
                    clearTimeout(modeCheckTimeoutRef.current);
                }
                modeCheckTimeoutRef.current = setTimeout(() => {
                    checkConnectivity(true);
                }, 2000);
            }
        };

        const handleOffline = () => {
            if (!connectionState.activeApiCall && !isRecording && !isTranscribing && !isGeneratingSOAP) {
                if (modeCheckTimeoutRef.current) {
                    clearTimeout(modeCheckTimeoutRef.current);
                }
                modeCheckTimeoutRef.current = setTimeout(() => {
                    checkConnectivity(true);
                }, 2000);
            }
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (modeCheckTimeoutRef.current) {
                clearTimeout(modeCheckTimeoutRef.current);
            }
        };
    }, [connectionState.activeApiCall, isRecording, isTranscribing, isGeneratingSOAP]);

    useEffect(() => {
        Object.values(audioRefs.current).forEach((audio) => {
            audio.load();
        });

        return () => {
            cleanupResources();
        };
    }, []);

    const checkConnectivity = async (isAutoCheck = false) => {
        const previousMode = connectionState.mode;

        setConnectionState(prev => ({ ...prev, isChecking: true }));

        try {
            const config = await checkServerAvailability();

            setServerConfig({
                transcriptionUrl: config.transcriptionUrl,
                soapUrl: config.soapUrl,
                serverBaseUrl: config.serverBaseUrl,
            });

            setConnectionState({
                mode: config.mode,
                isChecking: false,
                activeApiCall: false,
            });

            if (isAutoCheck && previousMode !== 'checking' && previousMode !== config.mode) {
                if (config.mode === 'online') {
                    toast.info('Connected to online server', {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 5000,
                    });
                } else if (config.mode === 'offline') {
                    toast.warning('Switched to offline mode', {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 5000,
                    });
                } else if (config.mode === 'unavailable') {
                    toast.error('No transcription server available', {
                        position: toast.POSITION.TOP_CENTER,
                        autoClose: 5000,
                    });
                }
            }

            if (config.mode !== 'online' && inputMode === 2) {
                setInputMode(0);
            }

            if (config.mode === 'offline' && activeTab === 1) {
                setActiveTab(0);
            }

        } catch (error) {
            setConnectionState({
                mode: 'unavailable',
                isChecking: false,
                activeApiCall: false,
            });
            setServerConfig({
                transcriptionUrl: null,
                soapUrl: null,
                serverBaseUrl: null,
            });
        }
    };

    const cleanupResources = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioProcessorRef.current) {
            audioProcessorRef.current.cleanup();
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
    };

    const playSound = (soundKey) => {
        return new Promise((resolve) => {
            const audio = audioRefs.current[soundKey];
            if (audio) {
                audio.currentTime = 0;
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        const onEnded = () => {
                            audio.removeEventListener('ended', onEnded);
                            resolve();
                        };
                        audio.addEventListener('ended', onEnded);
                    }).catch(() => resolve());
                }
            } else {
                resolve();
            }
        });
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const pauseRecording = () => {
        if (audioProcessorRef.current && isRecording && !isPaused) {
            audioProcessorRef.current.pauseRecording();
            setIsPaused(true);
            stopTimer();
        }
    };

    const resumeRecording = () => {
        if (audioProcessorRef.current && isRecording && isPaused) {
            audioProcessorRef.current.resumeRecording();
            setIsPaused(false);
            startTimer();
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            setIsStartingRecording(true);

            await playSound('startRecording');

            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    sampleRate: 16000,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            streamRef.current = stream;

            audioProcessorRef.current = new AudioProcessor(16000);
            await audioProcessorRef.current.initialize(stream);
            audioProcessorRef.current.startRecording();

            setIsRecording(true);
            setIsStartingRecording(false);
            setRecordingTime(0);
            startTimer();
        } catch (err) {
            setIsStartingRecording(false);
            setError('Microphone access denied. Please allow microphone permissions and try again.');
        }
    };

    const stopRecording = () => {
        if (audioProcessorRef.current && isRecording) {
            if (recordingTime < 30) {
                setError('Recording must be at least 30 seconds long');
                return;
            }

            const wavBlob = audioProcessorRef.current.stopRecording();
            setAudioBlob(wavBlob);
            const url = URL.createObjectURL(wavBlob);
            setAudioUrl(url);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            setIsRecording(false);
            setIsPaused(false);
            stopTimer();
        }
    };

    const togglePlayPause = () => {
        if (!audioPlayerRef.current) return;

        if (isPlaying) {
            audioPlayerRef.current.pause();
            setIsPlaying(false);
        } else {
            audioPlayerRef.current.play();
            setIsPlaying(true);
        }
    };

    const resetRecording = () => {
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setIsPlaying(false);
        setIsPaused(false);
        setTranscriptionText("");
        setSoapNote("");
        setOriginalTranscription("");
        setActiveTab(0);
        setUploadedFile(null);
        setHasPlayedUpload(false);
        setHasProcessedUpload(false);
        setStreamingData(null);
        setError(null);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        const maxSizeText = connectionState.mode === 'online' ? "50MB" : "20MB"
        const maxSize = connectionState.mode === 'online' ? 50 * 1024 * 1024 : 20 * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`File size exceeds ${maxSizeText} limit`);
            return;
        }

        const supportedExtensions = ['.wav', '.mp3', '.m4a', '.flac', '.ogg', '.aac', '.wma', '.webm'];
        const fileName = file.name.toLowerCase();
        const isSupported = supportedExtensions.some(ext => fileName.endsWith(ext));

        if (!isSupported) {
            setError('Unsupported audio format. Please upload WAV, MP3, M4A, FLAC, OGG, AAC, WMA, or WEBM files.');
            return;
        }

        setError(null);
        setUploadedFile(file);
        setHasPlayedUpload(false);
        setHasProcessedUpload(false);

        const url = URL.createObjectURL(file);
        setAudioUrl(url);
        setAudioBlob(file);

        const audio = new Audio(url);
        audio.addEventListener('loadedmetadata', () => {
            setRecordingTime(Math.floor(audio.duration));
        });
    };

    const handleRemoveUpload = () => {
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
            audioPlayerRef.current.currentTime = 0;
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl);
        setUploadedFile(null);
        setAudioBlob(null);
        setAudioUrl(null);
        setIsPlaying(false);
        setHasPlayedUpload(false);
        setHasProcessedUpload(false);
        setRecordingTime(0);
        setTranscriptionText("");
        setSoapNote("");
        setOriginalTranscription("");
    };

    const handleUploadPlayPause = () => {
        if (!audioPlayerRef.current) return;

        if (isPlaying) {
            audioPlayerRef.current.pause();
            setIsPlaying(false);
        } else {
            audioPlayerRef.current.play();
            setIsPlaying(true);
            setHasPlayedUpload(true);
        }
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;

        if (connectionState.mode === 'unavailable') {
            setError('No transcription server available. Please check your connection.');
            return;
        }

        setError(null);
        setIsTranscribing(true);

        if (connectionState.mode === 'online') {
            setIsGeneratingSOAP(true);
        }

        setConnectionState(prev => ({ ...prev, activeApiCall: true }));

        try {
            const userAccount = JSON.parse(localStorage.getItem('user_account') || '{}');
            const formData = new FormData();
            const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });

            formData.append('audio', audioFile);
            formData.append('model_name', modelSizeSelect);
            formData.append('language', languageSelect);
            formData.append('apply_correction', 'true');
            formData.append('enable_diarization', connectionState.mode === 'online' ? 'true' : 'false');
            formData.append('save_transcript', saveForTraining.toString());
            formData.append('location', "Consultation-Form");
            formData.append('patient_id', (patient?.id || 10).toString());
            formData.append('encounter_id', (patient?.visitId || 20).toString());
            formData.append('user_id', (userAccount?.id || '').toString() || '123');
            formData.append('facility_id', (userAccount?.currentOrganisationUnitId || '').toString() || "123");
            
            const transcriptionResponse = await axios.post(
                serverConfig.transcriptionUrl,
                formData,
                {
                    headers: { 'Content-Type': 'multipart/form-data' },
                    timeout: 300000,
                }
            );

            const result = transcriptionResponse.data;
            let transcriptionContent = '';

            if (result?.diarization_enabled && result?.diarized_segments) {
                transcriptionContent = result.diarized_segments
                    .map(seg => `[${seg.speaker}]: ${seg.text}`)
                    .join('\n');
            } else {
                transcriptionContent = result?.corrected_transcription || result?.raw_transcription || '';
            }

            setTranscriptionText(transcriptionContent);
            setOriginalTranscription(transcriptionContent);
            setIsTranscribing(false);

            if (connectionState.mode === 'online' && serverConfig.soapUrl) {
                try {
                    const soapResponse = await axios.post(
                        serverConfig.soapUrl,
                        { transcription_text: transcriptionContent },
                        {
                            headers: { 'Content-Type': 'application/json' },
                            timeout: 300000,
                        }
                    );

                    setSoapNote(soapResponse.data?.soap_note || soapResponse.data || '');
                    setIsGeneratingSOAP(false);
                    setActiveTab(1);
                } catch (soapError) {
                    setIsGeneratingSOAP(false);
                    const errorDetail = soapError.response?.data?.detail || soapError.response?.data?.message || soapError.message;
                    toast.warning(`Transcription completed but SOAP generation failed: ${errorDetail}`, {
                        position: toast.POSITION.TOP_CENTER,
                    });
                    setActiveTab(0);
                }
            } else {
                setActiveTab(0);
            }

            if (inputMode === 1) setHasProcessedUpload(true);

        } catch (err) {
            setIsTranscribing(false);
            setIsGeneratingSOAP(false);

            const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message;

            if (connectionState.mode === 'online') {
                setError(`Online transcription failed: ${errorDetail}`);
            } else if (connectionState.mode === 'offline') {
                setError(`Offline transcription failed: ${errorDetail}. Ensure the local server is running at localhost:7860`);
            } else {
                setError(`Transcription error: ${errorDetail}`);
            }
        } finally {
            setConnectionState(prev => ({ ...prev, activeApiCall: false }));
        }
    };

    const handleRegenerateSOAP = async () => {
        if (connectionState.mode !== 'online' || !serverConfig.soapUrl) {
            toast.error('SOAP generation is only available in online mode', {
                position: toast.POSITION.TOP_CENTER,
            });
            return;
        }

        if (!transcriptionText || transcriptionText === originalTranscription) {
            return;
        }

        setError(null);
        setIsGeneratingSOAP(true);
        setConnectionState(prev => ({ ...prev, activeApiCall: true }));

        try {
            const soapResponse = await axios.post(
                serverConfig.soapUrl,
                { transcription_text: transcriptionText },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 300000,
                }
            );

            setSoapNote(soapResponse.data?.soap_note || soapResponse.data || '');
            setOriginalTranscription(transcriptionText);
            setActiveTab(1);
            setIsGeneratingSOAP(false);

        } catch (err) {
            setIsGeneratingSOAP(false);
            const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message;
            setError(`Error generating SOAP: ${errorDetail}`);
        } finally {
            setConnectionState(prev => ({ ...prev, activeApiCall: false }));
        }
    };

    const handleStreamingTranscriptReady = async (data) => {
        setStreamingData(data);
        setTranscriptionText(data.transcript);
        setOriginalTranscription(data.transcript);
        setRecordingTime(data.duration);

        if (connectionState.mode === 'online' && serverConfig.soapUrl) {
            setIsGeneratingSOAP(true);
            setConnectionState(prev => ({ ...prev, activeApiCall: true }));

            try {
                const soapResponse = await axios.post(
                    serverConfig.soapUrl,
                    { transcription_text: data.transcript },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 300000,
                    }
                );

                setSoapNote(soapResponse.data?.soap_note || soapResponse.data || '');
                setIsGeneratingSOAP(false);
                setActiveTab(1);
            } catch (err) {
                setIsGeneratingSOAP(false);
                const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message;
                toast.warning(`Streaming completed but SOAP generation failed: ${errorDetail}`, {
                    position: toast.POSITION.TOP_CENTER,
                });
                setActiveTab(0);
            } finally {
                setConnectionState(prev => ({ ...prev, activeApiCall: false }));
            }
        } else {
            setActiveTab(0);
        }
    };

    const handleUseContent = async () => {
        const contentToUse = activeTab === 0 ? transcriptionText : soapNote;

        if (streamingData && inputMode === 2) {
            try {
                const userAccount = JSON.parse(localStorage.getItem('user_account') || '{}');

                await axios.post(
                    `${serverConfig.serverBaseUrl}/api/v1/transcribe/stream/save`,
                    {
                        session_id: streamingData.sessionId,
                        final_text: contentToUse,
                        patient_id: patient?.id || null,
                        encounter_id: patient?.visitId || null,
                        facility_id: userAccount?.currentOrganisationUnitId || null,
                        facility_name: userAccount?.organisationUnit?.name || null,
                        user_id: userAccount?.id || null,
                        total_duration: streamingData.duration,
                        segment_count: streamingData.segmentCount,
                        save_for_training: streamingData.saveForTraining
                    },
                    {
                        headers: { 'Content-Type': 'application/json' },
                        timeout: 30000,
                    }
                );
            } catch (err) {
                toast.error('Failed to save streaming session', {
                    position: toast.POSITION.TOP_CENTER,
                });
            }
        }

        if (onTranscriptionComplete && contentToUse) {
            onTranscriptionComplete({
                corrected_transcription: contentToUse,
                save_transcript: saveForTraining || (streamingData?.saveForTraining || false),
                recording_count: 1,
                total_duration: recordingTime,
                formatted_date: new Date().toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            });
        }
        closeModal();
    };

    const closeModal = () => {
        if (isRecording) stopRecording();
        cleanupResources();
        resetRecording();
        // setHasConsent(false);
        setIsRecording(false);
        setAudioBlob(null);
        setIsPlaying(false);
        setRecordingTime(0);
        // setSaveForTraining(false);
        setIsTranscribing(false);
        setIsGeneratingSOAP(false);
        setError(false);
        setIsPaused(false);
        setIsStartingRecording(false);
        setTranscriptionText("");
        setSoapNote("");
        setOriginalTranscription("");
        setActiveTab(0);
        setInputMode(0);
        setUploadedFile(null);
        setHasPlayedUpload(false);
        setHasProcessedUpload(false);
        setStreamingData(null);
        setIsModalOpen(false);
    };

    const getRecordingAreaClass = () => {
        if (isRecording || isStartingRecording) return `${classes.recordingCard} ${classes.recordingCardActive}`;
        if (audioBlob && inputMode === 0) return `${classes.recordingCard} ${classes.recordingCardComplete}`;
        return classes.recordingCard;
    };

    const isRegenerateDisabled = !transcriptionText || transcriptionText === originalTranscription || isGeneratingSOAP || connectionState.mode !== 'online';

    const getProcessButtonText = () => {
        if (isTranscribing) return 'Transcribing Audio...';
        if (isGeneratingSOAP) return 'Generating SOAP Note...';
        if (connectionState.mode === 'online') return 'Process Recording';
        if (connectionState.mode === 'offline') return 'Generate Transcript';
        return 'Process Recording';
    };

    return (
        <>
            <Tooltip title="Record clinical note" placement="top">
                <div
                    style={{
                        position: 'absolute',
                        bottom: '40px',
                        right: '24px',
                        zIndex: 1000,
                        backgroundColor: "#004d8a",
                        color: 'white',
                        height: '45px',
                        width: '45px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontFamily: '"Plus Jakarta Sans", sans-serif',
                    }}
                    onClick={() => setIsModalOpen(true)}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
                >
                    <MicIcon style={{ fontSize: '20px' }} />
                </div>
            </Tooltip>
            <Dialog
                open={isModalOpen}
                onClose={closeModal}
                fullScreen
                className={classes.fullscreenDialog}
                TransitionComponent={Fade}
                transitionDuration={300}
            >
                <div className={classes.dialogContent}>
                    <div className={classes.header}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Typography variant="h6" style={{ fontWeight: 700, letterSpacing: '0.5px', color: "white", marginRight: 20, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                Clinical Transcription {connectionState.mode === 'online' ? '& SOAP Note Generation' : ''}
                            </Typography>
                            <ConnectionStatusBadge
                                mode={connectionState.mode}
                                isChecking={connectionState.isChecking}
                            />
                        </Box>
                        <IconButton onClick={closeModal} style={{ color: 'white' }} edge="end">
                            <CloseIcon />
                        </IconButton>
                    </div>

                    <div className={classes.mainContent}>
                        <div className={classes.leftPanel}>
                            <Tabs
                                value={inputMode}
                                onChange={(e, val) => {
                                    if (val === 2 && connectionState.mode !== 'online') return;
                                    setInputMode(val);
                                    resetRecording();
                                }}
                                className={classes.customTabs}
                                variant="fullWidth"
                            >
                                <Tab label="" icon={<MicIcon />} iconPosition="start" />
                                <Tab label="" icon={<CloudUploadIcon />} iconPosition="start" />
                                {connectionState.mode === 'online' && (
                                    <Tab label="" icon={<StreamIcon />} iconPosition="start" />
                                )}
                            </Tabs>

                            {inputMode !== 2 && (
                                <div className={classes.checkboxContainer}>
                                    <div className={classes.settingsBox}>
                                        <FormControlLabel
                                            control={
                                                <Checkbox
                                                    checked={saveForTraining}
                                                    onChange={(e) => setSaveForTraining(e.target.checked)}
                                                    color="primary"
                                                    disabled={isRecording || isStartingRecording}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="body2" style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                        Contribute to model improvement
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary" style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                                        Securely save de-identified audio and transcript for training purposes only.
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </div>

                                    <ConsentCheckbox
                                        hasConsent={hasConsent}
                                        setHasConsent={setHasConsent}
                                        disabled={isRecording || isStartingRecording}
                                    />
                                </div>
                            )}

                            {inputMode === 2 && (
                                <div className={classes.checkboxContainer}>
                                    <ConsentCheckbox
                                        hasConsent={hasConsent}
                                        setHasConsent={setHasConsent}
                                        disabled={false}
                                    />
                                </div>
                            )}

                            <Fade in={true} timeout={500}>
                                <Box display="flex" flexDirection="column" gap={3}>
                                    {inputMode === 0 && (
                                        <>
                                            <Paper elevation={0} className={getRecordingAreaClass()} onClick={isRecording || isStartingRecording ? null : (!audioBlob ? startRecording : null)}>
                                                <Box position="relative" zIndex={10} textAlign="center">
                                                    {!isRecording && !audioBlob && !isStartingRecording && (
                                                        <>
                                                            <MicIcon className={classes.micIcon} />
                                                            <Typography variant="h5" style={{ fontWeight: 600, marginBottom: 8, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                Tap to Record
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary" style={{fontFamily: '"Plus Jakarta Sans", sans-serif'}}>
                                                                Minimum 30 seconds required for accurate transcription
                                                            </Typography>
                                                        </>
                                                    )}

                                                    {isStartingRecording && (
                                                        <>
                                                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                                            <Typography variant="h6" color="error" style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>Preparing...</Typography>
                                                        </>
                                                    )}

                                                    {isRecording && !isStartingRecording && (
                                                        <>
                                                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                                            <Typography variant="h6" color="error" style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                {isPaused ? 'Recording Paused' : 'Recording in progress'}
                                                            </Typography>
                                                            <Typography color="error" className={classes.timeDisplay} style={{fontFamily: '"Plus Jakarta Sans", sans-serif'}}>
                                                                {formatTime(recordingTime)}
                                                            </Typography>
                                                            {recordingTime < 30 && (
                                                                <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 8, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                    Keep going for {30 - recordingTime}s more
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}

                                                    {audioBlob && !isRecording && (
                                                        <>
                                                            <CheckCircleIcon className={`${classes.micIcon} ${classes.micIconComplete}`} />
                                                            <Typography variant="h5" style={{ color: theme.palette.success.main, fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>Recording Ready</Typography>
                                                            <Typography className={classes.timeDisplay} style={{ color: theme.palette.success.main, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                {formatTime(recordingTime)}
                                                            </Typography>
                                                        </>
                                                    )}
                                                </Box>
                                            </Paper>

                                            <div className={classes.controlsContainer}>
                                                {isRecording && (
                                                    <Box display="flex" gap={2}>
                                                        {!isPaused ? (
                                                            <Button variant="contained" className={`${classes.largeButton} ${classes.secondaryButton}`} startIcon={<PauseIcon />} onClick={pauseRecording} fullWidth>
                                                                Pause
                                                            </Button>
                                                        ) : (
                                                            <Button variant="contained" className={`${classes.largeButton} ${classes.primaryButton}`} startIcon={<PlayIcon />} onClick={resumeRecording} fullWidth>
                                                                Resume
                                                            </Button>
                                                        )}
                                                        <Button variant="contained" color="secondary" className={classes.largeButton} startIcon={<StopIcon />} onClick={stopRecording} fullWidth disabled={recordingTime < 30}>
                                                            Stop
                                                        </Button>
                                                    </Box>
                                                )}

                                                {audioBlob && !isRecording && (
                                                    <Box display="flex" flexDirection="column" gap={3}>
                                                        <Box display="flex" gap={4}>
                                                            <Button
                                                                variant="outlined"
                                                                className={classes.largeButton}
                                                                startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                                                                onClick={togglePlayPause}
                                                                style={{
                                                                    border: `2px solid ${theme.palette.grey[300]}`,
                                                                    flex: 1
                                                                }}
                                                            >
                                                                {isPlaying ? 'Pause Playback' : 'Preview Audio'}
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="secondary"
                                                                className={classes.largeButton}
                                                                startIcon={<ReplayIcon />}
                                                                onClick={resetRecording}
                                                                style={{
                                                                    border: `2px solid ${theme.palette.error.light}`,
                                                                    color: theme.palette.error.main,
                                                                    flex: 1
                                                                }}
                                                            >
                                                                Discard & Retry
                                                            </Button>
                                                        </Box>
                                                        <Button
                                                            variant="contained"
                                                            className={`${classes.largeButton} ${classes.primaryButton}`}
                                                            size="large"
                                                            startIcon={isTranscribing || isGeneratingSOAP ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                                                            onClick={handleTranscribe}
                                                            disabled={isTranscribing || isGeneratingSOAP || !hasConsent || connectionState.mode === 'unavailable'}
                                                            fullWidth
                                                            style={{ height: 56, marginTop: 20 }}
                                                        >
                                                            {getProcessButtonText()}
                                                        </Button>
                                                    </Box>
                                                )}
                                            </div>
                                        </>
                                    )}

                                    {inputMode === 1 && (
                                        <>
                                            {!uploadedFile ? (
                                                <Paper elevation={0} className={`${classes.recordingCard} ${classes.uploadCard}`} style={{ marginBottom: 10 }}>
                                                    <Box position="relative" zIndex={10} textAlign="center">
                                                        <input
                                                            accept=".wav,.mp3,.m4a,.flac,.ogg,.aac,.wma,.webm"
                                                            style={{ display: 'none' }}
                                                            id="audio-upload"
                                                            type="file"
                                                            onChange={handleFileUpload}
                                                        />
                                                        <label htmlFor="audio-upload">
                                                            <Button
                                                                variant="contained"
                                                                className={`${classes.largeButton} ${classes.primaryButton}`}
                                                                component="span"
                                                                startIcon={<CloudUploadIcon />}
                                                                style={{ marginBottom: 24 }}
                                                            >
                                                                Select Audio File
                                                            </Button>
                                                        </label>
                                                        <Typography variant="body1" style={{ fontWeight: 600, marginBottom: 8, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                            Drag and drop or click to browse
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary" gutterBottom style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                                            WAV, MP3, M4A, FLAC, OGG, AAC, WMA, WEBM
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 16, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                            Maximum file size: {connectionState.mode === 'online' ? "50MB" : "20MB"}
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            ) : (
                                                <>
                                                    <Paper elevation={0} className={`${classes.recordingCard} ${classes.recordingCardComplete}`}>
                                                        <Box position="relative" zIndex={10} textAlign="center" width="100%">
                                                            <AssignmentTurnedInIcon className={`${classes.micIcon} ${classes.micIconComplete}`} style={{ fontSize: 80, fontFamily: '"Plus Jakarta Sans", sans-serif', }} />
                                                            <Typography variant="h6" style={{ color: theme.palette.success.main, fontWeight: 600, marginBottom: 8, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                File Selected
                                                            </Typography>
                                                            <Chip label={uploadedFile.name} variant="outlined" style={{ maxWidth: '90%', marginBottom: 16, fontFamily: '"Plus Jakarta Sans", sans-serif', }} />

                                                            <Typography className={classes.timeDisplay} style={{ color: theme.palette.success.main, fontSize: 36, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                {formatTime(recordingTime)}
                                                            </Typography>
                                                            {!hasPlayedUpload && (
                                                                <Typography variant="body2" color="error" style={{ marginTop: 16, fontWeight: 500, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                                    <PlayIcon style={{ verticalAlign: 'middle', marginRight: 4, fontSize: 18, fontFamily: '"Plus Jakarta Sans", sans-serif', }} />
                                                                    Please review audio before processing
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                    </Paper>

                                                    <div className={classes.controlsContainer}>
                                                        <Box display="flex" flexDirection="column" gap={3}>
                                                            <Box display="flex" gap={2}>
                                                                <Button
                                                                    variant="outlined"
                                                                    className={classes.largeButton}
                                                                    startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                                                                    onClick={handleUploadPlayPause}
                                                                    fullWidth
                                                                    style={{ border: `2px solid ${theme.palette.grey[300]}`, height: 48, fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                                                >
                                                                    {isPlaying ? 'Pause' : 'Preview Audio'}
                                                                </Button>
                                                                <Button
                                                                    variant="outlined"
                                                                    color="secondary"
                                                                    className={classes.largeButton}
                                                                    startIcon={<DeleteOutlineIcon />}
                                                                    onClick={handleRemoveUpload}
                                                                    fullWidth
                                                                    style={{ border: `2px solid ${theme.palette.error.light}`, color: theme.palette.error.main, height: 48, fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                                                >
                                                                    Remove File
                                                                </Button>
                                                            </Box>
                                                            <Button
                                                                variant="contained"
                                                                className={`${classes.largeButton} ${classes.primaryButton}`}
                                                                size="large"
                                                                startIcon={isTranscribing || isGeneratingSOAP ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                                                                onClick={handleTranscribe}
                                                                disabled={!hasPlayedUpload || isTranscribing || isGeneratingSOAP || hasProcessedUpload || !hasConsent || connectionState.mode === 'unavailable'}
                                                                fullWidth
                                                                style={{ height: 56, fontSize: '1.1rem', marginTop: 20, fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                                            >
                                                                {isTranscribing ? 'Transcribing...' : isGeneratingSOAP ? 'Generating SOAP...' : hasProcessedUpload ? 'Processing Complete' : getProcessButtonText()}
                                                            </Button>
                                                        </Box>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                    {inputMode === 2 && (
                                        <LiveStreamingTab
                                            serverBaseUrl={serverConfig.serverBaseUrl}
                                            hasConsent={hasConsent}
                                            saveForTraining={saveForTraining}
                                            onTranscriptReady={handleStreamingTranscriptReady}
                                            onError={setError}
                                            setTranscriptionText={setTranscriptionText}
                                            setStreamingData={setStreamingData}
                                        />
                                    )}

                                    {error && inputMode !== 2 && (
                                        <div className={classes.errorAlert} style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                            <CloseIcon fontSize="small" />
                                            <Typography variant="body2" style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>{error}</Typography>
                                        </div>
                                    )}
                                </Box>
                            </Fade>
                        </div>

                        <div className={classes.rightPanel}>
                            <Paper elevation={0} className={classes.transcriptionCard}>
                                <Tabs
                                    value={activeTab}
                                    onChange={(e, val) => setActiveTab(val)}
                                    className={classes.customTabs}
                                    variant="fullWidth"
                                    style={{ marginBottom: theme.spacing(3), backgroundColor: theme.palette.grey[50], fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                >
                                    <Tab label="Transcript" icon={<DescriptionIcon />} iconPosition="start" />
                                    {connectionState.mode === 'online' && (
                                        <Tab label="SOAP Note" icon={<AssignmentTurnedInIcon />} iconPosition="start" disabled={!soapNote} />
                                    )}
                                </Tabs>

                                <Box flex={1} display="flex" flexDirection="column" style={{ minHeight: 0 }}>
                                    {activeTab === 0 && (
                                        <Fade in={activeTab === 0}>
                                            <Box flex={1} display="flex" flexDirection="column" style={{ minHeight: 0 }}>
                                                <div className={classes.transcriptionHeader}>
                                                    <Typography variant="h6" style={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                        Generated Transcript
                                                    </Typography>
                                                    {transcriptionText && (
                                                        <Chip
                                                            label={`${transcriptionText.length} chars`}
                                                            size="small"
                                                            style={{ fontWeight: 600, backgroundColor: theme.palette.primary.light, color: theme.palette.primary.main, fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                                        />
                                                    )}
                                                </div>

                                                {transcriptionText ? (
                                                    <textarea
                                                        className={classes.transcriptionTextarea}
                                                        value={transcriptionText}
                                                        onChange={(e) => setTranscriptionText(e.target.value)}
                                                        placeholder="Transcription output..."
                                                        spellCheck="false"
                                                        
                                                    />
                                                ) : (
                                                    <div className={classes.transcriptionEmpty}>
                                                        <DescriptionIcon style={{ fontSize: 80, color: theme.palette.grey[300], marginBottom: 16, fontFamily: '"Plus Jakarta Sans", sans-serif', }} />
                                                        <Typography variant="h6" color="textSecondary" gutterBottom style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                            No transcript available
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary" align="center" style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                                            Record or upload audio and click "{getProcessButtonText()}" to generate text.
                                                        </Typography>
                                                    </div>
                                                )}
                                            </Box>
                                        </Fade>
                                    )}

                                    {activeTab === 1 && connectionState.mode === 'online' && (
                                        <Fade in={activeTab === 1}>
                                            <Box flex={1} display="flex" flexDirection="column" style={{ minHeight: 0, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                <div className={classes.transcriptionHeader}>
                                                    <Typography variant="h6" style={{ fontWeight: 700, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                        Structured SOAP Note
                                                    </Typography>
                                                    {soapNote && (
                                                        <Chip
                                                            label="AI Generated"
                                                            size="small"
                                                            color="secondary"
                                                            variant="outlined"
                                                            style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                                        />
                                                    )}
                                                </div>

                                                {soapNote ? (
                                                    <textarea
                                                        className={classes.transcriptionTextarea}
                                                        value={soapNote}
                                                        onChange={(e) => setSoapNote(e.target.value)}
                                                        placeholder="SOAP note output..."
                                                        spellCheck="false"
                                                    />
                                                ) : (
                                                    <div className={classes.transcriptionEmpty}>
                                                        <AssignmentTurnedInIcon style={{ fontSize: 80, color: theme.palette.grey[300], marginBottom: 16 }} />
                                                        <Typography variant="h6" color="textSecondary" gutterBottom style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                                            SOAP Note Not Generated
                                                        </Typography>
                                                    </div>
                                                )}
                                            </Box>
                                        </Fade>
                                    )}
                                </Box>

                                <div className={classes.actionButtons}>
                                    <Button
                                        variant="contained"
                                        className={`${classes.largeButton} ${classes.primaryButton}`}
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleUseContent}
                                        disabled={!transcriptionText && !soapNote}
                                        fullWidth
                                        size="large"
                                        style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}
                                    >
                                        Confirm & Use {activeTab === 0 ? 'Transcript' : 'SOAP Note'}
                                    </Button>
                                    {activeTab === 0 && connectionState.mode === 'online' && (
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            className={classes.largeButton}
                                            startIcon={isGeneratingSOAP ? <CircularProgress size={20} /> : <RefreshIcon />}
                                            onClick={handleRegenerateSOAP}
                                            disabled={isRegenerateDisabled}
                                            fullWidth
                                            size="large"
                                            style={{ border: `2px solid ${theme.palette.primary.main}`, fontFamily: '"Plus Jakarta Sans", sans-serif', }}
                                        >
                                            {isGeneratingSOAP ? 'Regenerating...' : 'Regenerate SOAP Note'}
                                        </Button>
                                    )}
                                </div>
                            </Paper>
                        </div>
                    </div>
                </div>
            </Dialog>

            {audioUrl && (
                <audio
                    ref={audioPlayerRef}
                    src={audioUrl}
                    onEnded={() => setIsPlaying(false)}
                    style={{ display: 'none' }}
                />
            )}
        </>
    );
};

export default AudioRecorder;