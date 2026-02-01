import React, { useState, useRef, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Box,
    Button,
    Typography,
    Paper,
    Chip,
    CircularProgress,
    LinearProgress,
} from '@material-ui/core';
import {
    Mic as MicIcon,
    Stop as StopIcon,
    FiberManualRecord as RecordingIcon,
    SignalCellularAlt as SignalIcon,
    VolumeUp as VolumeIcon,
    Close as CloseIcon,
} from '@material-ui/icons';
import WebSocketManager from './WebSocketManager';
import LiveStreamAudioProcessor from './LiveStreamAudioProcessor';

const useStyles = makeStyles((theme) => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(3),
        height: '100%',
    },
    statusBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(2),
        backgroundColor: theme.palette.grey[50],
        borderRadius: theme.shape.borderRadius * 2,
        border: `1px solid ${theme.palette.grey[200]}`,
    },
    recordingCard: {
        padding: theme.spacing(4),
        minHeight: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.shape.borderRadius * 3,
        backgroundColor: '#fff',
        border: '2px solid transparent',
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        position: 'relative',
        overflow: 'hidden',
    },
    recordingCardActive: {
        borderColor: theme.palette.error.light,
        boxShadow: `0 0 0 4px ${theme.palette.error.light}33`,
    },
    recordingCardConnecting: {
        borderColor: theme.palette.primary.light,
        boxShadow: `0 0 0 4px ${theme.palette.primary.light}33`,
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
    micIconConnecting: {
        color: theme.palette.primary.main,
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
    connectionChip: {
        fontWeight: 600,
    },
    statusChip: {
        fontWeight: 600,
        animation: '$blink 1.5s infinite',
    },
    '@keyframes blink': {
        '0%, 100%': { opacity: 1 },
        '50%': { opacity: 0.6 },
    },
    controlButton: {
        padding: theme.spacing(1.5, 4),
        fontSize: '1rem',
        borderRadius: theme.shape.borderRadius * 1.5,
        textTransform: 'none',
        fontWeight: 700,
        minWidth: 200,
    },
    warningBox: {
        padding: theme.spacing(1.5),
        backgroundColor: theme.palette.warning.light + '20',
        border: `1px solid ${theme.palette.warning.light}`,
        borderRadius: theme.shape.borderRadius,
        marginTop: theme.spacing(2),
    },
    sessionInfo: {
        display: 'flex',
        gap: theme.spacing(2),
        alignItems: 'center',
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
        marginTop: theme.spacing(2),
    },
    audioLevelContainer: {
        marginTop: theme.spacing(2),
        width: '100%',
    },
    audioLevelBar: {
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.palette.grey[200],
    },
}));

const LiveStreamingTab = ({ 
    serverBaseUrl, 
    hasConsent, 
    saveForTraining,
    onTranscriptReady,
    onError,
    setTranscriptionText,
    setStreamingData
}) => {
    const classes = useStyles();
    
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [isRecording, setIsRecording] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [sessionTimeLeft, setSessionTimeLeft] = useState(2700);
    const [audioLevel, setAudioLevel] = useState(0);
    const [connectionQuality, setConnectionQuality] = useState('excellent');
    const [lastSpeechTime, setLastSpeechTime] = useState(null);
    const [silenceWarning, setSilenceWarning] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [localError, setLocalError] = useState(null);
    const [chunksSent, setChunksSent] = useState(0);
    const [messagesReceived, setMessagesReceived] = useState(0);

    const wsManagerRef = useRef(null);
    const audioProcessorRef = useRef(null);
    const recordingTimerRef = useRef(null);
    const sessionTimerRef = useRef(null);
    const silenceCheckRef = useRef(null);
    const isConnectedRef = useRef(false);
    const currentTranscriptRef = useRef('');

    useEffect(() => {
        return () => {
            cleanup();
        };
    }, []);

    useEffect(() => {
        if (lastSpeechTime && isRecording) {
            if (silenceCheckRef.current) {
                clearInterval(silenceCheckRef.current);
            }

            silenceCheckRef.current = setInterval(() => {
                const silenceDuration = (Date.now() - lastSpeechTime) / 1000;
                
                if (silenceDuration > 7 && silenceDuration < 10) {
                    setSilenceWarning(true);
                } else if (silenceDuration >= 10) {
                    setSilenceWarning(false);
                }
            }, 1000);
        }

        return () => {
            if (silenceCheckRef.current) {
                clearInterval(silenceCheckRef.current);
            }
        };
    }, [lastSpeechTime, isRecording]);

    const cleanup = () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        if (silenceCheckRef.current) clearInterval(silenceCheckRef.current);
        
        if (wsManagerRef.current) {
            wsManagerRef.current.close();
            wsManagerRef.current = null;
        }
        
        if (audioProcessorRef.current) {
            audioProcessorRef.current.cleanup();
            audioProcessorRef.current = null;
        }

        isConnectedRef.current = false;
    };

    const handleWebSocketMessage = (data) => {
        setMessagesReceived(prev => prev + 1);
        
        switch (data.type) {
            case 'status':
                if (data.session_id) {
                    setSessionId(data.session_id);
                }
                break;

            case 'partial':
            case 'final':
                setTranscriptionText(data.text);
                currentTranscriptRef.current = data.text;
                setLastSpeechTime(Date.now());
                setSilenceWarning(false);
                setIsSpeaking(true);
                setTimeout(() => setIsSpeaking(false), 1000);
                break;

            case 'warning':
                if (data.message.includes('Session time limit')) {
                    handleStopRecording();
                }
                break;

            case 'error':
                setLocalError(data.message);
                onError(data.message);
                break;
        }
    };

    const handleWebSocketError = (error) => {
        const errorMsg = `WebSocket error: ${error.message || 'Connection failed'}`;
        setLocalError(errorMsg);
        onError(errorMsg);
        
        if (isRecording) {
            setConnectionStatus('buffering');
        }
    };

    const handleStatusChange = (status) => {
        setConnectionStatus(status);
        isConnectedRef.current = (status === 'connected');
        
        if (status === 'connected' && wsManagerRef.current) {
            const quality = wsManagerRef.current.getConnectionQuality();
            setConnectionQuality(quality);
        }
    };

    const handleAudioDataAvailable = (audioBlob) => {
        if (!wsManagerRef.current) {
            return;
        }

        if (!isConnectedRef.current) {
            return;
        }

        wsManagerRef.current.send(audioBlob);
        setChunksSent(prev => prev + 1);
    };

    const handleStartRecording = async () => {
        if (!hasConsent) {
            const errorMsg = 'Please acknowledge consent before starting';
            setLocalError(errorMsg);
            onError(errorMsg);
            return;
        }

        try {
            setIsConnecting(true);
            setLocalError(null);
            setRecordingTime(0);
            setSessionTimeLeft(2700);
            setChunksSent(0);
            setMessagesReceived(0);
            isConnectedRef.current = false;
            setTranscriptionText('');
            currentTranscriptRef.current = '';

            let cleanBaseUrl = serverBaseUrl.replace(/\/$/, '');
            
            if (cleanBaseUrl.includes('/api/v1')) {
                cleanBaseUrl = cleanBaseUrl.replace('/api/v1', '');
            }
            
            const wsProtocol = cleanBaseUrl.replace('https://', 'wss://').replace('http://', 'ws://');
            const wsUrl = `${wsProtocol}/api/v1/transcribe/stream`;
            
            wsManagerRef.current = new WebSocketManager(
                wsUrl,
                handleWebSocketMessage,
                handleWebSocketError,
                handleStatusChange
            );

            await wsManagerRef.current.connect();

            audioProcessorRef.current = new LiveStreamAudioProcessor(setAudioLevel, 500);
            await audioProcessorRef.current.initialize(handleAudioDataAvailable);
            audioProcessorRef.current.startRecording();
            
            setIsRecording(true);
            setIsConnecting(false);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

            sessionTimerRef.current = setInterval(() => {
                setSessionTimeLeft(prev => {
                    if (prev <= 1) {
                        handleStopRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);

        } catch (error) {
            setIsConnecting(false);
            const errorMsg = `Failed to start recording: ${error.message}`;
            setLocalError(errorMsg);
            onError(errorMsg);
        }
    };

    const handleStopRecording = () => {
        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        if (silenceCheckRef.current) clearInterval(silenceCheckRef.current);

        if (audioProcessorRef.current) {
            audioProcessorRef.current.stopRecording();
        }

        if (wsManagerRef.current) {
            wsManagerRef.current.close();
        }

        setIsRecording(false);
        setConnectionStatus('disconnected');
        setSilenceWarning(false);
        setIsSpeaking(false);
        isConnectedRef.current = false;

        setStreamingData({
            sessionId,
            duration: recordingTime,
            saveForTraining
        });
        onTranscriptReady({
            transcript: currentTranscriptRef.current,
            sessionId,
            duration: recordingTime,
            saveForTraining
        });
        if (audioProcessorRef.current) {
            audioProcessorRef.current.cleanup();
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getConnectionColor = () => {
        switch (connectionQuality) {
            case 'excellent': return '#4caf50';
            case 'good': return '#8bc34a';
            case 'fair': return '#ff9800';
            case 'poor': return '#f44336';
            default: return '#9e9e9e';
        }
    };

    const getRecordingCardClass = () => {
        if (isRecording) return `${classes.recordingCard} ${classes.recordingCardActive}`;
        if (isConnecting) return `${classes.recordingCard} ${classes.recordingCardConnecting}`;
        return classes.recordingCard;
    };

    return (
        <Box className={classes.container}>
            {/* <Paper elevation={0} className={classes.statusBar}>
                <Box className={classes.sessionInfo}>
                    {isRecording && (
                        <>
                            <Chip
                                icon={<RecordingIcon />}
                                label={isSpeaking ? 'Speaking' : 'Silence Detected'}
                                className={classes.statusChip}
                                size="small"
                                style={{
                                    backgroundColor: isSpeaking ? '#f44336' : '#9e9e9e',
                                    color: '#fff'
                                }}
                            />
                            <Chip
                                icon={<SignalIcon />}
                                label={connectionQuality.charAt(0).toUpperCase() + connectionQuality.slice(1)}
                                className={classes.connectionChip}
                                size="small"
                                style={{
                                    backgroundColor: getConnectionColor(),
                                    color: '#fff'
                                }}
                            />
                        </>
                    )}
                </Box>
                <Box className={classes.sessionInfo}>
                    {isRecording && (
                        <>
                            <Typography variant="body2" color="textSecondary">
                                Session: {formatTime(sessionTimeLeft)} remaining
                            </Typography>
                            <Typography variant="caption" style={{ 
                                backgroundColor: chunksSent === 0 ? '#f44336' : '#4caf50',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontWeight: 600
                            }}>
                                Chunks: {chunksSent} | Messages: {messagesReceived}
                            </Typography>
                        </>
                    )}
                </Box>
            </Paper> */}

            <Paper elevation={0} className={getRecordingCardClass()}>
                <Box position="relative" zIndex={10} textAlign="center" width="100%">
                    {!isRecording && !isConnecting && (
                        <>
                            <MicIcon className={classes.micIcon} />
                            <Typography variant="h5" style={{ fontWeight: 600, marginBottom: 8, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                Start Live Streaming
                            </Typography>
                            <Typography variant="body2" color="textSecondary" style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                Real-time transcription as you speak
                            </Typography>
                        </>
                    )}

                    {isConnecting && (
                        <>
                            <MicIcon className={`${classes.micIcon} ${classes.micIconConnecting}`} />
                            <CircularProgress size={60} style={{ marginBottom: 16 , fontFamily: '"Plus Jakarta Sans", sans-serif',}} />
                            <Typography variant="h6" color="primary" style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                Connecting to server...
                            </Typography>
                        </>
                    )}

                    {isRecording && (
                        <>
                            <MicIcon className={`${classes.micIcon} ${classes.micIconRecording}`} />
                            <Typography variant="h6" color="error" style={{ fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                Live Streaming Active
                            </Typography>
                            <Typography color="error" className={classes.timeDisplay} style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                {formatTime(recordingTime)}
                            </Typography>

                            <Box className={classes.audioLevelContainer}>
                                <Box display="flex" alignItems="center" gap={1} marginBottom={1}>
                                    <VolumeIcon style={{ color: '#9e9e9e', fontSize: 20 }} />
                                    <Typography variant="caption" color="textSecondary" style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>
                                        Audio Level
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={audioLevel}
                                    className={classes.audioLevelBar}
                                    style={{
                                        backgroundColor: '#e0e0e0',
                                        fontFamily: '"Plus Jakarta Sans", sans-serif'
                                    }}
                                />
                            </Box>

                            {chunksSent === 0 && recordingTime > 2 && (
                                <Box className={classes.warningBox}>
                                    <Typography variant="body2" style={{ color: '#f44336', fontWeight: 600, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                        No audio chunks being sent
                                    </Typography>
                                </Box>
                            )}

                            {silenceWarning && (
                                <Box className={classes.warningBox}>
                                    <Typography variant="body2" style={{ color: '#ED6C02', fontWeight: 500, fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                                        Recording will auto-finalize in a few seconds due to silence
                                    </Typography>
                                </Box>
                            )}
                        </>
                    )}

                    <Box marginTop={4}>
                        {!isRecording && !isConnecting && (
                            <Button
                                variant="contained"
                                color="primary"
                                size="large"
                                startIcon={<MicIcon />}
                                onClick={handleStartRecording}
                                className={classes.controlButton}
                                disabled={!hasConsent}
                                style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}
                            >
                                Start Live Streaming
                            </Button>
                        )}

                        {isRecording && (
                            <Button
                                variant="contained"
                                color="secondary"
                                size="large"
                                startIcon={<StopIcon />}
                                onClick={handleStopRecording}
                                className={classes.controlButton}
                                style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}
                            >
                                Stop Recording
                            </Button>
                        )}
                    </Box>
                </Box>
            </Paper>

            {localError && (
                <div className={classes.errorAlert}>
                    <CloseIcon fontSize="small" />
                    <Typography variant="body2" style={{fontFamily: '"Plus Jakarta Sans", sans-serif',}}>{localError}</Typography>
                </div>
            )}
        </Box>
    );
};

export default LiveStreamingTab;