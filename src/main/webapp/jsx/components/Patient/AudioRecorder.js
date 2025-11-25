import React, { useState, useRef, useEffect } from 'react';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import {
    Dialog,
    IconButton,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    FormControlLabel,
    Checkbox,
    Button,
    Typography,
    Box,
    Paper,
    Snackbar,
    Tooltip,
    Divider,
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
    History as HistoryIcon,
    Refresh as RefreshIcon,
    CloudUpload as CloudUploadIcon,
    DeleteOutline as DeleteOutlineIcon,
    AssignmentTurnedIn as AssignmentTurnedInIcon,
} from '@material-ui/icons';
import axios from 'axios';
import { audioTranscriptionUrl } from '../../../api';


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
            backgroundColor: '#f4f6f8',
        },
    },
    dialogContent: {
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        backgroundColor: theme.palette.primary.main,
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(1, 3),
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        zIndex: theme.zIndex.appBar,
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
        overflow: "auto"
    },
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        minHeight: 0,
    },

    customTabs: {
        backgroundColor: '#fff',
        borderRadius: theme.shape.borderRadius * 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
        padding: theme.spacing(0.5),
        '& .MuiTabs-indicator': {
            height: '100%',
            borderRadius: theme.shape.borderRadius * 2,
            backgroundColor: theme.palette.primary.light,
            opacity: 0.2,
        },
        '& .MuiTab-root': {
            textTransform: 'none',
            fontWeight: 600,
            fontSize: '1rem',
            minHeight: 48,
            zIndex: 1,
            '&.Mui-selected': {
                color: theme.palette.primary.main,
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
        borderRadius: theme.shape.borderRadius * 3,
        backgroundColor: '#fff',
        border: '2px solid transparent',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        '&:hover': {
            borderColor: theme.palette.primary.light,
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
    },
    recordingCardActive: {
        backgroundColor: '#fff',
        borderColor: theme.palette.error.light,
        boxShadow: `0 0 0 4px ${theme.palette.error.light}33`,
        cursor: 'default',
        '&:hover': { transform: 'none' },
    },
    recordingCardComplete: {
        backgroundColor: '#fff',
        borderColor: theme.palette.success.light,
        boxShadow: `0 0 0 4px ${theme.palette.success.light}33`,
        cursor: 'default',
        '&:hover': { transform: 'none' },
    },
    uploadCard: {
        border: `2px dashed ${theme.palette.grey[300]}`,
        backgroundColor: theme.palette.grey[50],
        '&:hover': {
            borderColor: theme.palette.primary.main,
            backgroundColor: '#fff',
        },
    },
    micIcon: {
        fontSize: 96,
        marginBottom: theme.spacing(2),
        color: theme.palette.grey[400],
        transition: 'color 0.3s',
    },
    micIconRecording: {
        color: theme.palette.error.main,
        animation: '$pulse 1.5s infinite ease-in-out',
    },
    micIconComplete: {
        color: theme.palette.success.main,
    },
    '@keyframes pulse': {
        '0%': { transform: 'scale(1)', opacity: 1 },
        '50%': { transform: 'scale(1.1)', opacity: 0.8 },
        '100%': { transform: 'scale(1)', opacity: 1 },
    },
    timeDisplay: {
        fontFamily: 'monospace',
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
        border: `1px solid ${theme.palette.grey[300]}`,
        borderRadius: theme.shape.borderRadius * 2,
        padding: theme.spacing(2),
    },

    transcriptionCard: {
        padding: theme.spacing(3),
        borderRadius: theme.shape.borderRadius * 3,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
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
        border: `1px solid ${theme.palette.grey[200]}`,
        borderRadius: theme.shape.borderRadius * 2,
        padding: theme.spacing(3),
        fontSize: '1.05rem',
        lineHeight: 1.7,
        fontFamily: theme.typography.fontFamily,
        resize: 'none',
        backgroundColor: theme.palette.grey[50],
        transition: 'all 0.2s',
        '&:focus': {
            outline: 'none',
            backgroundColor: '#fff',
            borderColor: theme.palette.primary.main,
            boxShadow: `0 0 0 3px ${theme.palette.primary.light}33`,
        },
    },
    transcriptionEmpty: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.palette.text.secondary,
        backgroundColor: theme.palette.grey[50],
        border: `2px dashed ${theme.palette.grey[200]}`,
        borderRadius: theme.shape.borderRadius * 2,
        padding: theme.spacing(6),
    },
    actionButtons: {
        display: 'flex',
        gap: theme.spacing(2),
        marginTop: theme.spacing(3),
        paddingTop: theme.spacing(2),
        borderTop: `1px solid ${theme.palette.grey[100]}`,
    },
    errorAlert: {
        backgroundColor: theme.palette.error.light,
        color: theme.palette.error.contrastText,
        padding: theme.spacing(2),
        borderRadius: theme.shape.borderRadius,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(2),
        fontWeight: 500,
    },

    largeButton: {
        padding: theme.spacing(1.5, 3),
        fontSize: '1rem',
        borderRadius: theme.shape.borderRadius * 1.5,
        textTransform: 'none',
        fontWeight: 700,
        boxShadow: 'none',
    },
    primaryButton: {
        backgroundColor: theme.palette.primary.main,
        color: '#fff',
        '&:hover': {
            backgroundColor: theme.palette.primary.dark,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
    },
    secondaryButton: {
        backgroundColor: theme.palette.grey[100],
        color: theme.palette.text.primary,
        '&:hover': {
            backgroundColor: theme.palette.grey[200],
        },
    },
}));

const AudioRecorder = ({ onTranscriptionComplete, patient }) => {
    const classes = useStyles();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [saveForTraining, setSaveForTraining] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
    const [error, setError] = useState(null);
    const [modelSizeSelect] = useState("small");
    const [languageSelect] = useState("en");
    const [isPaused, setIsPaused] = useState(false);
    const [isStartingRecording, setIsStartingRecording] = useState(false);

    const [transcriptionText, setTranscriptionText] = useState("");
    const [soapNote, setSoapNote] = useState("");
    const [originalTranscription, setOriginalTranscription] = useState("");
    const [activeTab, setActiveTab] = useState(0);


    const [inputMode, setInputMode] = useState(0);
    const [uploadedFile, setUploadedFile] = useState(null);
    const [hasPlayedUpload, setHasPlayedUpload] = useState(false);
    const [hasProcessedUpload, setHasProcessedUpload] = useState(false);

    const audioProcessorRef = useRef(null);
    const timerRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const streamRef = useRef(null);

    const audioRefs = useRef({
        startRecording: new Audio(`${process.env.PUBLIC_URL}/tape-start.wav`),
    });

    useEffect(() => {
        Object.values(audioRefs.current).forEach((audio) => {
            audio.load();
        });

        return () => {
            cleanupResources();
        };
    }, []);

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
        setError(null);
    };

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('File size exceeds 50MB limit');
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

        setError(null);
        setIsTranscribing(true);
        setIsGeneratingSOAP(true);

        try {
            const userAccount = JSON.parse(localStorage.getItem('user_account') || '{}');
            const formData = new FormData();
            const audioFile = new File([audioBlob], 'recording.wav', { type: 'audio/wav' });

            formData.append('audio', audioFile);
            formData.append('model_name', modelSizeSelect);
            formData.append('language', languageSelect);
            formData.append('apply_correction', 'true');
            formData.append('enable_diarization', 'true');
            formData.append('save_transcript', saveForTraining.toString());
            formData.append('location', "HIV-Care-Card");
            formData.append('patient_id', (patient?.id || 10).toString());
            formData.append('encounter_id', (patient?.visitId || 20).toString());
            formData.append('user_id', (userAccount?.id || '').toString());
            formData.append('facility_id', (userAccount?.currentOrganisationUnitId || '').toString());


            const transcriptionResponse = await axios.post(
                `${audioTranscriptionUrl}/transcribe`,
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


            const soapResponse = await axios.post(
                `${audioTranscriptionUrl}/soap/generate`,
                { transcription_text: transcriptionContent },
                {
                    headers: { 'Content-Type': 'application/json' },
                    timeout: 300000,
                }
            );

            setSoapNote(soapResponse.data?.soap_note || soapResponse.data || '');
            setIsGeneratingSOAP(false);
            setActiveTab(0);
            if (inputMode === 1) setHasProcessedUpload(true);

        } catch (err) {
            setIsTranscribing(false);
            setIsGeneratingSOAP(false);

            const errorDetail = err.response?.data?.detail || err.response?.data?.message || err.message;
            setError(`Error: ${errorDetail}`);
        }
    };

    const handleRegenerateSOAP = async () => {
        if (!transcriptionText || transcriptionText === originalTranscription) {
            return;
        }

        setError(null);
        setIsGeneratingSOAP(true);

        try {
            const soapResponse = await axios.post(
                `${audioTranscriptionUrl}/soap/generate`,
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
        }
    };

    const handleUseContent = () => {
        const contentToUse = activeTab === 0 ? transcriptionText : soapNote;
        const contentTypeLoaded = activeTab === 0 ? "transcription" : "soapNote";
        if (onTranscriptionComplete && contentToUse) {
            onTranscriptionComplete(
                {
                    corrected_transcription: contentToUse,
                    save_transcript: saveForTraining,
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
                },
                contentTypeLoaded
            );
        }
        closeModal();
    };

    const closeModal = () => {
        if (isRecording) stopRecording();
        cleanupResources();
        setIsModalOpen(false);
        resetRecording();
        setActiveTab(0);
        setIsRecording(false)
    };

    const getRecordingAreaClass = () => {
        if (isRecording || isStartingRecording) return `${classes.recordingCard} ${classes.recordingCardActive}`;
        if (audioBlob && inputMode === 0) return `${classes.recordingCard} ${classes.recordingCardComplete}`;
        return classes.recordingCard;
    };

    const isRegenerateDisabled = !transcriptionText || transcriptionText === originalTranscription || isGeneratingSOAP;

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
                            <Typography variant="h6" style={{ fontWeight: 700, letterSpacing: '0.5px', color: "white" }}>
                                Clinical Transcription & SOAP Note Generation
                            </Typography>
                        </Box>
                        <IconButton onClick={closeModal} style={{ color: 'white' }} edge="end">
                            <CloseIcon />
                        </IconButton>
                    </div>

                    <div className={classes.mainContent}>
                        <div className={classes.leftPanel}>
                            <Tabs
                                value={inputMode}
                                onChange={(e, val) => { setInputMode(val); resetRecording(); }}
                                className={classes.customTabs}
                                variant="fullWidth"
                            >
                                <Tab label="Record Audio" icon={<MicIcon />} iconPosition="start" />
                                <Tab label="Upload File" icon={<CloudUploadIcon />} iconPosition="start" />
                            </Tabs>

                            <Fade in={true} timeout={500}>
                                <Box display="flex" flexDirection="column" gap={3}>

                                    <div className={classes.settingsBox} style={{marginBottom: 20 }}>
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
                                                    <Typography variant="body2" style={{ fontWeight: 600 }}>
                                                        Contribute to model improvement
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Securely save de-identified audio and transcript for training purposes only.
                                                    </Typography>
                                                </Box>
                                            }
                                        />
                                    </div>

                                    {/* Record Mode */}
                                    {inputMode === 0 && (
                                        <>
                                            <Paper elevation={0} className={getRecordingAreaClass()} onClick={isRecording || isStartingRecording ? null : (!audioBlob ? startRecording : null)}>
                                                <Box position="relative" zIndex={10} textAlign="center">
                                                    {!isRecording && !audioBlob && !isStartingRecording && (
                                                        <>
                                                            <MicIcon className={classes.micIcon} />
                                                            <Typography variant="h5" style={{ fontWeight: 600, marginBottom: 8 }}>
                                                                Tap to Record
                                                            </Typography>
                                                            <Typography variant="body2" color="textSecondary">
                                                                Minimum 30 seconds required for accurate transcription
                                                            </Typography>
                                                        </>
                                                    )}

                                                    {isStartingRecording && (
                                                        <>
                                                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                                            <Typography variant="h6" color="error" style={{ fontWeight: 600 }}>Preparing...</Typography>
                                                        </>
                                                    )}

                                                    {isRecording && !isStartingRecording && (
                                                        <>
                                                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                                            <Typography variant="h6" color="error" style={{ fontWeight: 600 }}>
                                                                {isPaused ? 'Recording Paused' : 'Recording in progress'}
                                                            </Typography>
                                                            <Typography color="error" className={classes.timeDisplay}>
                                                                {formatTime(recordingTime)}
                                                            </Typography>
                                                            {recordingTime < 30 && (
                                                                <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 8 }}>
                                                                    Keep going for {30 - recordingTime}s more
                                                                </Typography>
                                                            )}
                                                        </>
                                                    )}

                                                    {audioBlob && !isRecording && (
                                                        <>
                                                            <CheckCircleIcon className={`${classes.micIcon} ${classes.micIconComplete}`} />
                                                            <Typography variant="h5" style={{ color: theme.palette.success.main, fontWeight: 600 }}>Recording Ready</Typography>
                                                            <Typography className={classes.timeDisplay} style={{ color: theme.palette.success.main }}>
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
                                                        <Box display="flex" gap={2}>
                                                            <Button variant="outlined" className={classes.largeButton} startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />} onClick={togglePlayPause} fullWidth style={{ border: `2px solid ${theme.palette.grey[300]}` }}>
                                                                {isPlaying ? 'Pause Playback' : 'Preview Audio'}
                                                            </Button>
                                                            <Button variant="outlined" color="secondary" className={classes.largeButton} startIcon={<ReplayIcon />} onClick={resetRecording} fullWidth style={{ border: `2px solid ${theme.palette.error.light}`, color: theme.palette.error.main }}>
                                                                Discard & Retry
                                                            </Button>
                                                        </Box>
                                                        <Button
                                                            variant="contained"
                                                            className={`${classes.largeButton} ${classes.primaryButton}`}
                                                            size="large"
                                                            startIcon={isTranscribing || isGeneratingSOAP ? <CircularProgress size={24} color="inherit" /> : <SendIcon />}
                                                            onClick={handleTranscribe}
                                                            disabled={isTranscribing || isGeneratingSOAP}
                                                            fullWidth
                                                            style={{ height: 56, marginTop: 20 }}
                                                        >
                                                            {isTranscribing ? 'Transcribing Audio...' : isGeneratingSOAP ? 'Generating SOAP Note...' : 'Process Recording'}
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
                                                        <Typography variant="body1" style={{ fontWeight: 600, marginBottom: 8 }}>
                                                            Drag and drop or click to browse
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary" gutterBottom>
                                                            WAV, MP3, M4A, FLAC, OGG, AAC, WMA, WEBM
                                                        </Typography>
                                                        <Typography variant="caption" color="textSecondary" style={{ display: 'block', marginTop: 16 }}>
                                                            Maximum file size: 50MB
                                                        </Typography>
                                                    </Box>
                                                </Paper>
                                            ) : (
                                                <>
                                                    <Paper elevation={0} className={`${classes.recordingCard} ${classes.recordingCardComplete}`}>
                                                        <Box position="relative" zIndex={10} textAlign="center" width="100%">
                                                            <AssignmentTurnedInIcon className={`${classes.micIcon} ${classes.micIconComplete}`} style={{ fontSize: 80 }} />
                                                            <Typography variant="h6" style={{ color: theme.palette.success.main, fontWeight: 600, marginBottom: 8 }}>
                                                                File Selected
                                                            </Typography>
                                                            <Chip label={uploadedFile.name} variant="outlined" style={{ maxWidth: '90%', marginBottom: 16 }} />

                                                            <Typography className={classes.timeDisplay} style={{ color: theme.palette.success.main, fontSize: 36 }}>
                                                                {formatTime(recordingTime)}
                                                            </Typography>
                                                            {!hasPlayedUpload && (
                                                                <Typography variant="body2" color="error" style={{ marginTop: 16, fontWeight: 500 }}>
                                                                    <PlayIcon style={{ verticalAlign: 'middle', marginRight: 4, fontSize: 18 }} />
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
                                                                    style={{ border: `2px solid ${theme.palette.grey[300]}`, height: 48 }}
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
                                                                    style={{ border: `2px solid ${theme.palette.error.light}`, color: theme.palette.error.main, height: 48 }}
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
                                                                disabled={!hasPlayedUpload || isTranscribing || isGeneratingSOAP || hasProcessedUpload}
                                                                fullWidth
                                                                style={{ height: 56, fontSize: '1.1rem', marginTop: 20 }}
                                                            >
                                                                {isTranscribing ? 'Transcribing...' : isGeneratingSOAP ? 'Generating SOAP...' : hasProcessedUpload ? 'Processing Complete' : 'Process Audio File'}
                                                            </Button>
                                                        </Box>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}

                                    {error && (
                                        <div className={classes.errorAlert}>
                                            <CloseIcon fontSize="small" />
                                            <Typography variant="body2">{error}</Typography>
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
                                    style={{ marginBottom: theme.spacing(3), backgroundColor: theme.palette.grey[50] }}
                                >
                                    <Tab label="Transcript" icon={<DescriptionIcon />} iconPosition="start" />
                                    <Tab label="SOAP Note" icon={<AssignmentTurnedInIcon />} iconPosition="start" disabled={!soapNote} />
                                </Tabs>

                                <Box flex={1} display="flex" flexDirection="column" style={{ minHeight: 0 }}>
                                    {activeTab === 0 && (
                                        <Fade in={activeTab === 0}>
                                            <Box flex={1} display="flex" flexDirection="column" style={{ minHeight: 0 }}>
                                                <div className={classes.transcriptionHeader}>
                                                    <Typography variant="h6" style={{ fontWeight: 700 }}>
                                                        Generated Transcript
                                                    </Typography>
                                                    {transcriptionText && (
                                                        <Chip
                                                            label={`${transcriptionText.length} chars`}
                                                            size="small"
                                                            style={{ fontWeight: 600, backgroundColor: theme.palette.primary.light, color: theme.palette.primary.main }}
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
                                                        <DescriptionIcon style={{ fontSize: 80, color: theme.palette.grey[300], marginBottom: 16 }} />
                                                        <Typography variant="h6" color="textSecondary" gutterBottom style={{ fontWeight: 600 }}>
                                                            No transcript waiting
                                                        </Typography>
                                                        <Typography variant="body2" color="textSecondary" align="center">
                                                            Record or upload audio and click "Process" to generate text.
                                                        </Typography>
                                                    </div>
                                                )}
                                            </Box>
                                        </Fade>
                                    )}

                                    {activeTab === 1 && (
                                        <Fade in={activeTab === 1}>
                                            <Box flex={1} display="flex" flexDirection="column" style={{ minHeight: 0 }}>
                                                <div className={classes.transcriptionHeader}>
                                                    <Typography variant="h6" style={{ fontWeight: 700 }}>
                                                        Structured SOAP Note
                                                    </Typography>
                                                    {soapNote && (
                                                        <Chip
                                                            label="AI Generated"
                                                            size="small"
                                                            color="secondary"
                                                            variant="outlined"
                                                            style={{ fontWeight: 600 }}
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
                                                        <Typography variant="h6" color="textSecondary" gutterBottom style={{ fontWeight: 600 }}>
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
                                    >
                                        Confirm & Use {activeTab === 0 ? 'Transcript' : 'SOAP Note'}
                                    </Button>
                                    {activeTab === 0 && (
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            className={classes.largeButton}
                                            startIcon={isGeneratingSOAP ? <CircularProgress size={20} /> : <RefreshIcon />}
                                            onClick={handleRegenerateSOAP}
                                            disabled={isRegenerateDisabled}
                                            fullWidth
                                            size="large"
                                            style={{ border: `2px solid ${theme.palette.primary.main}` }}
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