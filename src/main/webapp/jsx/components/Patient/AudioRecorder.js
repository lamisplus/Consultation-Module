import React, { useState, useRef, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Dialog,
    DialogTitle,
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
    LinearProgress,
    Paper,
    Snackbar,
    Fab,
    Tooltip,
} from '@material-ui/core';
import {
    Close as CloseIcon,
    Mic as MicIcon,
    Stop as StopIcon,
    PlayArrow as PlayIcon,
    Pause as PauseIcon,
    Send as SendIcon,
    Replay as ReplayIcon,
} from '@material-ui/icons';
import { audioTranscriptionUrl } from '../../../api';
import axios from 'axios';

const useStyles = makeStyles((theme) => ({
    floatingButton: {
        position: 'fixed',
        bottom: theme.spacing(4),
        right: theme.spacing(4),
        zIndex: 1000,
        animation: '$pulse 2s infinite',
    },
    '@keyframes pulse': {
        '0%': {
            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)',
        },
        '70%': {
            boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)',
        },
        '100%': {
            boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
        },
    },
    dialogPaper: {
        minWidth: 500,
        maxWidth: 600,
    },
    dialogTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: theme.spacing(1),
    },
    formControl: {
        width: '100%',
        marginBottom: theme.spacing(2),
    },
    recordingArea: {
        height: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.3s',
        position: 'relative',
        overflow: 'hidden',
        '&:hover': {
            backgroundColor: theme.palette.action.hover,
        },
    },
    recordingAreaActive: {
        backgroundColor: '#ffebee',
        cursor: 'default',
        '&:hover': {
            backgroundColor: '#ffebee',
        },
    },
    recordingAreaComplete: {
        backgroundColor: '#e8f5e9',
        cursor: 'default',
        '&:hover': {
            backgroundColor: '#e8f5e9',
        },
    },
    progressBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '100%',
        backgroundColor: 'rgba(244, 67, 54, 0.2)',
        transition: 'width 1s linear',
    },
    micIcon: {
        fontSize: 64,
        marginBottom: theme.spacing(2),
    },
    micIconRecording: {
        color: theme.palette.error.main,
        animation: '$pulse 1.5s infinite',
    },
    micIconComplete: {
        color: theme.palette.success.main,
    },
    controlButtons: {
        display: 'flex',
        gap: theme.spacing(1),
        marginTop: theme.spacing(2),
    },
    consentBox: {
        backgroundColor: '#e3f2fd',
        border: '1px solid #90caf9',
        borderRadius: theme.spacing(1),
        padding: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    timeDisplay: {
        fontSize: 28,
        fontWeight: 'bold',
        marginTop: theme.spacing(1),
    },
    errorAlert: {
        marginBottom: theme.spacing(2),
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
    const [timeLeft, setTimeLeft] = useState(300);
    const [saveForTraining, setSaveForTraining] = useState(false);
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [error, setError] = useState(null);
    const userAccount = JSON.parse(localStorage.getItem('user_account'));
    console.log(userAccount.id);

    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const timerRef = useRef(null);
    const audioPlayerRef = useRef(null);
    const streamRef = useRef(null);

    const MAX_RECORDING_TIME = 180; // 3 minutes

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const startTimer = () => {
        timerRef.current = setInterval(() => {
            setRecordingTime(prev => {
                const newTime = prev + 1;
                setTimeLeft(MAX_RECORDING_TIME - newTime);

                if (newTime >= MAX_RECORDING_TIME) {
                    stopRecording();
                    return prev;
                }
                return newTime;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

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
                }
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setRecordingTime(0);
            setTimeLeft(MAX_RECORDING_TIME);
            startTimer();
        } catch (err) {
            setError('Microphone access denied. Please allow microphone permissions and try again.');
            console.error('Error accessing microphone:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
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
        setAudioBlob(null);
        setAudioUrl(null);
        setRecordingTime(0);
        setTimeLeft(MAX_RECORDING_TIME);
        setIsPlaying(false);
        audioChunksRef.current = [];
        setError(null);
    };

    const handleTranscribe = async () => {
        if (!audioBlob) return;

        setIsTranscribing(true);
        setError(null);

        try {
            const formData = new FormData();

            const audioFile = new File([audioBlob], 'recording.webm', { type: audioBlob.type });
            formData.append('audio', audioFile);
            formData.append('model_name', 'medium');
            formData.append('language', 'en');
            formData.append('apply_correction', true);
            formData.append('save_transcript', saveForTraining);
            formData.append('patient_id', patient?.id || 10);
            formData.append('encounter_id', patient?.visitId || 20);
            formData.append('user_id', userAccount?.id);
            formData.append('facility_id', userAccount?.currentOrganisationUnitId);

            const response = await axios.post(`${audioTranscriptionUrl}/transcribe`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const result = response.data;

            if (onTranscriptionComplete) {
                onTranscriptionComplete({...result, save_transcript: saveForTraining });
            }

            setIsModalOpen(false);
            resetRecording();
        } catch (err) {
            const errorMessage = err.response?.data?.detail || err.message || 'Transcription failed';
            setError(`Transcription error: ${errorMessage}`);
            console.error('Transcription error:', err);
        } finally {
            setIsTranscribing(false);
        }
    };

    const closeModal = () => {
        if (isRecording) {
            stopRecording();
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsModalOpen(false);
        resetRecording();
        setError(null);
    };

    const recordingProgress = (recordingTime / MAX_RECORDING_TIME) * 100;

    const getRecordingAreaClass = () => {
        if (isRecording) return `${classes.recordingArea} ${classes.recordingAreaActive}`;
        if (audioBlob) return `${classes.recordingArea} ${classes.recordingAreaComplete}`;
        return classes.recordingArea;
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
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(33, 150, 243, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(33, 150, 243, 0.3)';
                    }}
                    onClick={() => setIsModalOpen(true)}
                    aria-label="record"
                >
                    <MicIcon />
                </div>
            </Tooltip>

            {/* Modal Dialog */}
            <Dialog
                open={isModalOpen}
                onClose={closeModal}
                maxWidth="sm"
                fullWidth
                classes={{ paper: classes.dialogPaper }}
            >
                <DialogTitle className={classes.dialogTitle}>
                    <Typography variant="h6">Record Patient Visit Note</Typography>
                    <IconButton onClick={closeModal} size="small">
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent>
                    {/* Language Selection */}
                    <FormControl className={classes.formControl}>
                        <InputLabel>Language</InputLabel>
                        <Select value="en">
                            <MenuItem value="en">English</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Model Selection */}
                    <FormControl className={classes.formControl}>
                        <InputLabel>Model</InputLabel>
                        <Select value="medium">
                            <MenuItem value="tiny">Tiny</MenuItem>
                            <MenuItem value="base">Base</MenuItem>
                            <MenuItem value="small">Small</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                        </Select>
                    </FormControl>

                    {/* Training Consent */}
                    <Paper className={classes.consentBox} elevation={0}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={saveForTraining}
                                    onChange={(e) => setSaveForTraining(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label={
                                <Box>
                                    <Typography variant="body2" style={{ fontWeight: 500 }}>
                                        Save audio and transcription for training
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                        We will use your audio recording and transcription to improve our medical
                                        transcription models. All data is anonymized and handled according to HIPAA
                                        guidelines. You can opt out at any time.
                                    </Typography>
                                </Box>
                            }
                        />
                    </Paper>

                    {/* Error Message */}
                    {error && (
                        <Snackbar
                            open={!!error}
                            autoHideDuration={6000}
                            onClose={() => setError(null)}
                            message={error}
                            action={
                                <IconButton
                                    size="small"
                                    aria-label="close"
                                    color="inherit"
                                    onClick={() => setError(null)}
                                >
                                    <CloseIcon fontSize="small" />
                                </IconButton>
                            }
                            className={classes.errorAlert}
                        />
                    )}

                    {/* Recording Area */}
                    <Paper
                        elevation={2}
                        className={getRecordingAreaClass()}
                        onClick={isRecording ? null : (!audioBlob ? startRecording : null)}
                    >
                        {/* Progress Bar */}
                        {isRecording && (
                            <div
                                className={classes.progressBar}
                                style={{ width: `${recordingProgress}%` }}
                            />
                        )}

                        {/* Content */}
                        <Box position="relative" zIndex={10} textAlign="center">
                            {!isRecording && !audioBlob && (
                                <>
                                    <MicIcon className={classes.micIcon} color="action" />
                                    <Typography variant="body1" color="textSecondary">
                                        Click to start recording
                                    </Typography>
                                </>
                            )}

                            {isRecording && (
                                <>
                                    <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                                    <Typography variant="body1" color="error">
                                        Recording...
                                    </Typography>
                                    <Typography variant="h4" color="error" className={classes.timeDisplay}>
                                        {formatTime(recordingTime)}
                                    </Typography>
                                    <Typography variant="caption" color="error">
                                        Time left: {formatTime(timeLeft)}
                                    </Typography>
                                </>
                            )}

                            {audioBlob && !isRecording && (
                                <>
                                    <MicIcon className={`${classes.micIcon} ${classes.micIconComplete}`} />
                                    <Typography variant="body1" style={{ color: '#2e7d32' }}>
                                        Recording complete
                                    </Typography>
                                    <Typography variant="h5" style={{ color: '#1b5e20', marginTop: 8 }}>
                                        {formatTime(recordingTime)}
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
                    <Box className={classes.controlButtons}>
                        {isRecording && (
                            <Button
                                fullWidth
                                variant="contained"
                                color="secondary"
                                startIcon={<StopIcon />}
                                onClick={stopRecording}
                            >
                                Stop Recording
                            </Button>
                        )}

                        {audioBlob && !isRecording && (
                            <>
                                <Button
                                    variant="contained"
                                    startIcon={isPlaying ? <PauseIcon /> : <PlayIcon />}
                                    onClick={togglePlayPause}
                                >
                                    {isPlaying ? 'Pause' : 'Play'}
                                </Button>

                                <Button
                                    variant="contained"
                                    startIcon={<ReplayIcon />}
                                    onClick={resetRecording}
                                    title="New Recording"
                                >
                                    Reset
                                </Button>

                                <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    startIcon={<SendIcon />}
                                    onClick={handleTranscribe}
                                    disabled={isTranscribing}
                                >
                                    {isTranscribing ? 'Transcribing...' : 'Transcribe'}
                                </Button>
                            </>
                        )}
                    </Box>

                    {/* Recording Limit Info */}
                    {!isRecording && !audioBlob && (
                        <Typography variant="caption" color="textSecondary" align="center" display="block" style={{ marginTop: 16 }}>
                            Maximum recording time: 5 minutes
                        </Typography>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
};
export default AudioRecorder