import React, { useState, useRef, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Dialog,
    DialogContent,
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
    Assessment as SummarizeIcon,
    CheckCircle as CheckCircleIcon,
    History as HistoryIcon,
} from '@material-ui/icons';
import { audioTranscriptionUrl } from '../../../api';

const useStyles = makeStyles((theme) => ({

    fullscreenDialog: {
        '& .MuiDialog-paper': {
            margin: 0,
            maxHeight: '100%',
            width: '100%',
            height: '100%',
        },
    },
    dialogContent: {
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        // padding: theme.spacing(2, 3),
        background: 'linear-gradient(135deg, #004d8a 0%, #0066b3 100%)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainContent: {
        flex: 1,
        display: 'flex',
        gap: theme.spacing(2),
        padding: theme.spacing(3),
        overflow: 'hidden',
        backgroundColor: '#f5f7fa',
    },
    leftPanel: {
        flex: '0 0 45%',
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
        overflowY: 'auto',
    },
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(2),
    },
    recordingCard: {
        padding: theme.spacing(3),
        height: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 1,
        backgroundColor: '#fff',
        '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        },
    },
    recordingCardActive: {
        backgroundColor: '#fff5f5',
        cursor: 'default',
    },
    recordingCardComplete: {
        backgroundColor: '#f0f9f4',
        cursor: 'default',
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: '100%',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        transition: 'width 1s linear',
    },
    waveformContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        height: 40,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        gap: 2,
        padding: theme.spacing(0, 2),
        zIndex: 1,
    },
    waveformBar: {
        width: 3,
        minHeight: 4,
        backgroundColor: '#1976d2',
        borderRadius: 1,
        transition: 'height 0.1s ease',
    },
    micIcon: {
        fontSize: 80,
        marginBottom: theme.spacing(2),
    },
    micIconRecording: {
        color: theme.palette.error.main,
        animation: '$pulse 1.5s infinite',
    },
    micIconComplete: {
        color: theme.palette.success.main,
    },
    '@keyframes pulse': {
        '0%, 100%': {
            opacity: 1,
        },
        '50%': {
            opacity: 0.5,
        },
    },
    timeDisplay: {
        fontSize: 36,
        fontWeight: 700,
        marginTop: theme.spacing(1),
    },
    controlsCard: {
        padding: theme.spacing(2),
        borderRadius: 1,
    },
    settingsCard: {
        padding: theme.spacing(2),
        borderRadius: 1,
    },
    transcriptionCard: {
        padding: theme.spacing(2),
        borderRadius: 1,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#fff',
    },
    transcriptionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing(2),
    },
    transcriptionTextarea: {
        flex: 1,
        border: '2px solid #e0e0e0',
        borderRadius: 1,
        padding: theme.spacing(2),
        fontSize: 16,
        lineHeight: 1.6,
        fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
        resize: 'none',
        '&:focus': {
            outline: 'none',
            borderColor: '#1976d2',
        },
    },
    transcriptionEmpty: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#999',
        border: '2px dashed #e0e0e0',
        borderRadius: 1,
        padding: theme.spacing(4),
    },
    actionButtons: {
        display: 'flex',
        gap: theme.spacing(2),
        marginTop: theme.spacing(2),
    },
    consentBox: {
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: 1,
        padding: theme.spacing(2),
    },
    recordingsList: {
        maxHeight: 150,
        overflowY: 'auto',
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing(1),
        padding: theme.spacing(1),
    },
    statsCard: {
        padding: theme.spacing(2),
        borderRadius: 1,
        backgroundColor: '#fff',
        display: 'flex',
        justifyContent: 'space-around',
    },
    statItem: {
        textAlign: 'center',
    },
    historyToggle: {
        borderRadius: 1,
    },
}));

const AudioRecorder = ({ onTranscriptionComplete, patient }) => {
    const classes = useStyles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [saveForTraining, setSaveForTraining] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState(null);
    const [modelSizeSelect, setModelSizeSelect] = useState("small");
    const [languageSelect, setLanguageSelect] = useState("en");
    const [isPaused, setIsPaused] = useState(false);
    const [audioLevels, setAudioLevels] = useState(Array(40).fill(0));
    const [showHistory, setShowHistory] = useState(false);
    const [isStartingRecording, setIsStartingRecording] = useState(false);

    const [accumulatedTranscription, setAccumulatedTranscription] = useState("");
    const [recordingCount, setRecordingCount] = useState(0);
    const [totalRecordingTime, setTotalRecordingTime] = useState(0);
    const [recordingHistory, setRecordingHistory] = useState([]);
    const [returnedTranscription, setReturnedTranscription] = useState(null);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const streamRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const dataArrayRef = useRef(null);
    const animationFrameRef = useRef(null);
    
    // Sound refs similar to CheckinPatientsAlert.js
    const audioRefs = useRef({
        startRecording: new Audio(`${process.env.PUBLIC_URL}/tape-start.wav`),
    });

    useEffect(() => {
        // Preload sounds when component mounts
        Object.values(audioRefs.current).forEach((audio) => {
            audio.load();
        });

        return () => {
            cleanupResources();
        };
    }, []);

    const cleanupResources = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (audioUrl) URL.revokeObjectURL(audioUrl);
    };

    const playSound = (soundKey) => {
        return new Promise((resolve, reject) => {
            const audio = audioRefs.current[soundKey];
            if (audio) {
                // Reset audio to start from beginning
                audio.currentTime = 0;
                
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        // Set up event listener for when sound finishes
                        const onEnded = () => {
                            audio.removeEventListener('ended', onEnded);
                            resolve();
                        };
                        audio.addEventListener('ended', onEnded);
                    }).catch(err => {
                        console.log('Audio play failed:', err);
                        reject(err);
                    });
                }
            } else {
                resolve(); // If no audio, resolve immediately
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

    const startAudioAnalysis = (stream) => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioContextRef.current = new AudioContext();
            analyserRef.current = audioContextRef.current.createAnalyser();
            const source = audioContextRef.current.createMediaStreamSource(stream);

            source.connect(analyserRef.current);
            analyserRef.current.fftSize = 128;
            const bufferLength = analyserRef.current.frequencyBinCount;
            dataArrayRef.current = new Uint8Array(bufferLength);

            const updateWaveform = () => {
                if (!analyserRef.current) return;

                analyserRef.current.getByteFrequencyData(dataArrayRef.current);

                if (!isPaused && isRecording) {
                    const levels = [];
                    const step = Math.floor(dataArrayRef.current.length / 40);

                    for (let i = 0; i < 40; i++) {
                        const value = dataArrayRef.current[i * step] || 0;
                        const height = Math.max(4, (value / 255) * 40);
                        levels.push(height);
                    }

                    setAudioLevels(levels);
                }

                animationFrameRef.current = requestAnimationFrame(updateWaveform);
            };

            updateWaveform();
        } catch (err) {
            console.error('Error starting audio analysis:', err);
        }
    };

    const stopAudioAnalysis = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setAudioLevels(Array(40).fill(0));
    };

    const pauseRecording = () => {
        if (mediaRecorderRef.current && isRecording && !isPaused) {
            mediaRecorderRef.current.pause();
            setIsPaused(true);
            stopTimer();
        }
    };

    const resumeRecording = () => {
        if (mediaRecorderRef.current && isRecording && isPaused) {
            mediaRecorderRef.current.resume();
            setIsPaused(false);
            startTimer();
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            setIsStartingRecording(true);
            
            // Play start recording sound and wait for it to finish
            await playSound('startRecording');
            
            // Now start the actual recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            startAudioAnalysis(stream);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                setAudioBlob(audioBlob);
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                stopAudioAnalysis();
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setIsStartingRecording(false);
            setRecordingTime(0);
            startTimer();
        } catch (err) {
            setIsStartingRecording(false);
            setError('Microphone access denied. Please allow microphone permissions and try again.');
            console.error('Error accessing microphone:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setIsPaused(false);
            stopTimer();
            stopAudioAnalysis();
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
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setIsPlaying(false);
        setIsPaused(false);
        audioChunksRef.current = [];
        stopAudioAnalysis();
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;

        setIsTranscribing(true);
        setError(null);

        try {
            const userAccount = JSON.parse(localStorage.getItem('user_account') || '{}');
            const formData = new FormData();
            const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });

            formData.append('audio', audioFile);
            formData.append('model_name', modelSizeSelect);
            formData.append('language', languageSelect);
            formData.append('apply_correction', 'true');
            formData.append('save_transcript', saveForTraining.toString());
            formData.append('location', "OPD-consultation");
            formData.append('patient_id', (patient?.id || 10).toString());
            formData.append('encounter_id', (patient?.visitId || 20).toString());
            formData.append('user_id', (userAccount?.id || '').toString());
            formData.append('facility_id', (userAccount?.currentOrganisationUnitId || '').toString());

            
            const response = await fetch(`${audioTranscriptionUrl}/transcribe`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Transcription failed');
            }

            const result = await response.json();
            setReturnedTranscription(result)
            const currentTime = new Date().toLocaleTimeString();
            const recordingLength = formatTime(recordingTime);

            
            const newEntry = `\n[Recording ${recordingCount + 1} - ${currentTime} - Duration: ${recordingLength}]\n${result.corrected_transcription || result.raw_transcription}\n`;

            setAccumulatedTranscription(prev => prev + newEntry);
            setRecordingCount(prev => prev + 1);
            setTotalRecordingTime(prev => prev + recordingTime);
            setRecordingHistory(prev => [...prev, {
                number: recordingCount + 1,
                duration: recordingTime,
                timestamp: currentTime
            }]);

        
            resetRecording();
            setError(null);

        } catch (err) {
            const errorMessage = err.message || 'Transcription failed';
            setError(`Transcription error: ${errorMessage}`);
            console.error('Transcription error:', err);
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleUseTranscription = () => {
        if (!accumulatedTranscription) return;

        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (onTranscriptionComplete) {
            onTranscriptionComplete({
                corrected_transcription: accumulatedTranscription,
                save_transcript: saveForTraining,
                recording_count: recordingCount,
                total_duration: totalRecordingTime,
                formatted_date: formattedDate,
                recording_uuid: returnedTranscription?.recording_uuid
            });
        }
        closeModal();
    };

    const closeModal = () => {
        if (isRecording) {
            stopRecording();
        }
        cleanupResources();
        setIsModalOpen(false);

        resetRecording();
        setError(null);
        setAccumulatedTranscription("");
        setRecordingCount(0);
        setTotalRecordingTime(0);
        setRecordingHistory([]);
        setIsTranscribing(false);
        setSaveForTraining(false);
        setShowHistory(false);
        setIsStartingRecording(false);
    };

    const getRecordingAreaClass = () => {
        if (isRecording || isStartingRecording) return `${classes.recordingCard} ${classes.recordingCardActive}`;
        if (audioBlob) return `${classes.recordingCard} ${classes.recordingCardComplete}`;
        return classes.recordingCard;
    };

    return (
        <>
            <Tooltip title="Record patient visit note" placement="left">
                <div
                    style={{
                        position: 'fixed',
                        bottom: '32px',
                        right: '32px',
                        zIndex: 1000,
                        backgroundColor: '#004d8a',
                        color: 'white',
                        height: '56px',
                        width: '56px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                    }}
                    onClick={() => setIsModalOpen(true)}
                    aria-label="record"
                >
                    <MicIcon />
                </div>
            </Tooltip>

            <Dialog
                open={isModalOpen}
                onClose={closeModal}
                fullScreen
                className={classes.fullscreenDialog}
            >
                <div className={classes.dialogContent}>
                    {/* Header */}
                    <div className={classes.header}>
                        <Box display="flex" alignItems="center" gap={2}>
                            <Box>
                                <Typography variant="h5" style={{ fontWeight: 600, color: "white" }}>
                                    Transcription
                                </Typography>
                            </Box>
                        </Box>
                        <IconButton onClick={closeModal} style={{ color: 'white' }}>
                            <CloseIcon />
                        </IconButton>
                    </div>

                    {/* Main Content */}
                    <div className={classes.mainContent}>

                        <div className={classes.leftPanel}>

                        <Paper elevation={2} className={classes.settingsCard}>
                                <Typography variant="subtitle2" gutterBottom style={{ fontWeight: 600 }}>
                                    Settings
                                </Typography>
                                <Divider style={{ marginBottom: 12 }} />

                                <FormControl fullWidth size="small" style={{ marginBottom: 12 }}>
                                    <InputLabel>Language</InputLabel>
                                    <Select
                                        value={languageSelect}
                                        onChange={(e) => setLanguageSelect(e.target.value)}
                                        disabled
                                        style={{ borderRadius: 1 }}
                                    >
                                        <MenuItem value="en">English</MenuItem>
                                        <MenuItem value="sw">Swahili</MenuItem>
                                    </Select>
                                </FormControl>

                                <Paper className={classes.consentBox} elevation={0}>
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
                                                <Typography variant="body2" style={{ fontWeight: 500 }}>
                                                    Save audio and transcription for training
                                                </Typography>
                                                <Typography variant="caption" color="textSecondary">
                                                    We will use your audio recording and transcription to improve our medical
                                                    transcription models. All data is anonymized and handled according to NDPR
                                                    guidelines. You can opt out at any time.
                                                </Typography>
                                            </Box>
                                        }
                                    />
                                </Paper>
                            </Paper>

                            <Paper
                                elevation={3}
                                className={getRecordingAreaClass()}
                                onClick={isRecording || isStartingRecording ? null : (!audioBlob ? startRecording : null)}
                            >
                                <Box position="relative" zIndex={10} textAlign="center">
                                    {!isRecording && !audioBlob && !isStartingRecording && (
                                        <>
                                            <MicIcon className={classes.micIcon} color="action" />
                                            <Typography variant="h6" color="textSecondary">
                                                Click to start recording
                                            </Typography>
                                        </>
                                    )}

                                    {isStartingRecording && (
                                        <>
                                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                            <Typography variant="h6" color="error">
                                                Starting recording...
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Please wait for the sound to finish
                                            </Typography>
                                        </>
                                    )}

                                    {isRecording && !isStartingRecording && (
                                        <>
                                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                            <Typography variant="h6" color="error">
                                                {isPaused ? 'Recording Paused' : 'Recording...'}
                                            </Typography>
                                            <Typography variant="h3" color="error" className={classes.timeDisplay}>
                                                {formatTime(recordingTime)}
                                            </Typography>
                                        </>
                                    )}

                                    {audioBlob && !isRecording && (
                                        <>
                                            <CheckCircleIcon className={`${classes.micIcon} ${classes.micIconComplete}`} />
                                            <Typography variant="h6" style={{ color: '#2e7d32' }}>
                                                Recording Complete
                                            </Typography>
                                            <Typography variant="h4" style={{ color: '#1b5e20', marginTop: 8 }}>
                                                {formatTime(recordingTime)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary" style={{ marginTop: 8, display: 'block' }}>
                                                Ready to transcribe
                                            </Typography>
                                        </>
                                    )}
                                </Box>
                            </Paper>

                            {/* Hidden Audio Player */}
                            {audioUrl && (
                                <audio
                                    ref={audioPlayerRef}
                                    src={audioUrl}
                                    onEnded={() => setIsPlaying(false)}
                                    style={{ display: 'none' }}
                                />
                            )}

                            {/* Controls */}
                            <Paper elevation={2} className={classes.controlsCard}>
                                <Box display="flex" gap={1}>
                                    {isRecording && (
                                        <div
                                            style={{
                                                display: "flex",
                                                width: "100%",
                                                justifyContent: "center",
                                                gap: '8px',
                                            }}
                                        >
                                            {!isPaused ? (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<PauseIcon />}
                                                    onClick={pauseRecording}
                                                    color="default"
                                                    fullWidth
                                                    style={{ borderRadius: 1, flexGrow: 1 }} 
                                                >
                                                    Pause
                                                </Button>
                                            ) : (
                                                <Button
                                                    variant="contained"
                                                    startIcon={<PlayIcon />}
                                                    onClick={resumeRecording}
                                                    color="primary"
                                                    fullWidth
                                                    style={{ borderRadius: 1, flexGrow: 1 }}
                                                >
                                                    Resume
                                                </Button>
                                            )}
                                            <Button
                                                variant="contained"
                                                color="secondary"
                                                startIcon={<StopIcon />}
                                                onClick={stopRecording}
                                                fullWidth
                                                style={{ borderRadius: 1, flexGrow: 1 }}
                                            >
                                                Stop Recording
                                            </Button>
                                        </div>
                                    )}

                                    {audioBlob && !isRecording && (
                                        <div
                                            style={{
                                                display: "flex",
                                                width: "100%",
                                                justifyContent: "center",
                                                gap: '8px',
                                            }}
                                        >
                                            <Button
                                                variant="outlined"
                                                startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                                                onClick={togglePlayPause}
                                                style={{ borderRadius: 1, flexGrow: 1 }}
                                                fullWidth
                                            >
                                                {isPlaying ? 'Pause' : 'Play'}
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                startIcon={<ReplayIcon />}
                                                onClick={resetRecording}
                                                style={{ borderRadius: 1, flexGrow: 1 }}
                                                fullWidth
                                            >
                                                Reset
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                startIcon={isTranscribing ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                                                onClick={handleTranscribe}
                                                disabled={isTranscribing}
                                                fullWidth
                                                style={{ flexGrow: 1, borderRadius: 1 }}
                                            >
                                                {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                                            </Button>
                                        </div>
                                    )}
                                </Box>
                            </Paper>

                            {recordingCount > 0 && (
                                <Button
                                    variant="outlined"
                                    startIcon={<HistoryIcon />}
                                    onClick={() => setShowHistory(!showHistory)}
                                    className={classes.historyToggle}
                                    fullWidth
                                >
                                    {showHistory ? 'Hide History' : 'Show History'}
                                </Button>
                            )}

                            {/* Stats and History - Only show when toggled */}
                            {showHistory && recordingCount > 0 && (
                                <>
                                    <Paper elevation={2} className={classes.statsCard}>
                                        <div className={classes.statItem}>
                                            <Typography variant="h4" style={{ fontWeight: 600, color: '#1976d2' }}>
                                                {recordingCount}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Recordings
                                            </Typography>
                                        </div>
                                        <div className={classes.statItem}>
                                            <Typography variant="h4" style={{ fontWeight: 600, color: '#2e7d32' }}>
                                                {formatTime(totalRecordingTime)}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Total Duration
                                            </Typography>
                                        </div>
                                    </Paper>

                                    {/* Recording History Chips */}
                                    {recordingHistory.length > 0 && (
                                        <Paper elevation={2} style={{ padding: 12, borderRadius: 1 }}>
                                            <Typography variant="caption" color="textSecondary" gutterBottom>
                                                Recording History
                                            </Typography>
                                            <div className={classes.recordingsList}>
                                                {recordingHistory.map((rec, idx) => (
                                                    <Chip
                                                        key={idx}
                                                        size="small"
                                                        label={`#${rec.number} - ${formatTime(rec.duration)}`}
                                                        color="primary"
                                                        variant="outlined"
                                                        style={{ borderRadius: 1 }}
                                                    />
                                                ))}
                                            </div>
                                        </Paper>
                                    )}
                                </>
                            )}
                        </div>

                        <div className={classes.rightPanel}>
                            <Paper elevation={3} className={classes.transcriptionCard}>
                                <div className={classes.transcriptionHeader}>
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <DescriptionIcon color="primary" />
                                        <Typography variant="h6" style={{ fontWeight: 600 }}>
                                            Transcription Workspace
                                        </Typography>
                                    </Box>
                                    {accumulatedTranscription && (
                                        <Chip
                                            label={`${accumulatedTranscription.length} characters`}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                            style={{ borderRadius: 1 }}
                                        />
                                    )}
                                </div>

                                {accumulatedTranscription ? (
                                    <textarea
                                        className={classes.transcriptionTextarea}
                                        value={accumulatedTranscription}
                                        onChange={(e) => setAccumulatedTranscription(e.target.value)}
                                        placeholder="Your transcriptions will appear here..."
                                    />
                                ) : (
                                    <div className={classes.transcriptionEmpty}>
                                        <DescriptionIcon style={{ fontSize: 64, color: '#ccc', marginBottom: 16 }} />
                                        <Typography variant="h6" color="textSecondary" gutterBottom>
                                            No transcriptions yet
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary" align="center">
                                            Record audio and click "Transcribe" to see the text here.<br />
                                            You can record multiple times and all transcriptions will be accumulated.
                                        </Typography>
                                    </div>
                                )}

                                <div className={classes.actionButtons}>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        startIcon={<CheckCircleIcon />}
                                        onClick={handleUseTranscription}
                                        disabled={!accumulatedTranscription}
                                        fullWidth
                                        size="large"
                                        style={{ fontWeight: 600, borderRadius: 1 }}
                                    >
                                        Use This Transcription
                                    </Button>
                                </div>
                            </Paper>
                        </div>
                    </div>

                    <Snackbar
                        open={!!error}
                        autoHideDuration={6000}
                        onClose={() => setError(null)}
                        message={error}
                        action={
                            <IconButton
                                size="small"
                                color="inherit"
                                onClick={() => setError(null)}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        }
                    />
                </div>
            </Dialog>
        </>
    );
};

export default AudioRecorder;