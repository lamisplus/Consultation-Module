import React, { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    LinearProgress,
    IconButton,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    Close as CloseIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
    dialogPaper: {
        maxWidth: '700px',
        maxHeight: '80vh',
        borderRadius: '12px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    dialogTitle: {
        backgroundColor: '#014d88',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing(2, 3),
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    dialogContent: {
        padding: theme.spacing(3),
        position: 'relative',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    scrollContainer: {
        maxHeight: '400px',
        overflowY: 'auto',
        padding: theme.spacing(2),
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        lineHeight: 1.6,
        '&::-webkit-scrollbar': {
            width: '8px',
        },
        '&::-webkit-scrollbar-track': {
            backgroundColor: '#e9ecef',
            borderRadius: '4px',
        },
        '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#014d88',
            borderRadius: '4px',
            '&:hover': {
                backgroundColor: '#003355',
            },
        },
    },
    sectionTitle: {
        fontWeight: 700,
        color: '#014d88',
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
        fontSize: '1.1rem',
        letterSpacing: '0.01em',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    paragraph: {
        marginBottom: theme.spacing(2),
        lineHeight: 1.7,
        color: '#1a1a1a',
        fontWeight: 500,
        fontSize: '0.95rem',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    bulletList: {
        marginLeft: theme.spacing(3),
        marginBottom: theme.spacing(2),
        '& li': {
            marginBottom: theme.spacing(1),
            lineHeight: 1.6,
            fontWeight: 500,
            fontSize: '0.95rem',
            color: '#1a1a1a',
            fontFamily: '"Plus Jakarta Sans", sans-serif',
        },
    },
    progressContainer: {
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1),
    },
    progressText: {
        fontSize: '0.875rem',
        color: '#6b7280',
        marginBottom: theme.spacing(1),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        fontWeight: 600,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    scrollPrompt: {
        backgroundColor: 'rgba(1, 77, 136, 0.08)',
        color: '#014d88',
        padding: theme.spacing(1.5),
        borderRadius: '12px',
        marginTop: theme.spacing(2),
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        fontWeight: 600,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    agreeButton: {
        backgroundColor: '#4caf50',
        color: 'white',
        padding: theme.spacing(1, 3),
        fontWeight: 700,
        borderRadius: '8px',
        textTransform: 'none',
        letterSpacing: '0.01em',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        '&:hover': {
            backgroundColor: '#388e3c',
            boxShadow: '0 4px 12px rgba(76, 175, 80, 0.15)',
        },
        '&:disabled': {
            backgroundColor: '#e0e0e0',
            color: '#9e9e9e',
        },
    },
    cancelButton: {
        color: '#6b7280',
        textTransform: 'none',
        fontWeight: 600,
        borderRadius: '8px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        '&:hover': {
            backgroundColor: '#f8f9fa',
        },
    },
}));

const ConsentModal = ({ open, onClose, onAgree }) => {
    const classes = useStyles();
    const scrollContainerRef = useRef(null);
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);

    useEffect(() => {
        if (open) {
            setHasScrolledToBottom(false);
            setScrollProgress(0);
        }
    }, [open]);

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollTop, scrollHeight, clientHeight } = container;
        const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;
        
        setScrollProgress(Math.min(scrollPercentage, 100));

        if (scrollTop + clientHeight >= scrollHeight - 10) {
            setHasScrolledToBottom(true);
        }
    };

    const handleAgree = () => {
        if (hasScrolledToBottom) {
            onAgree();
            onClose();
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            classes={{ paper: classes.dialogPaper }}
            maxWidth="md"
        >
            <DialogTitle className={classes.dialogTitle} disableTypography>
                <Typography variant="h6" style={{ 
                    fontWeight: 700, 
                    color: "white",
                    fontFamily: '"Plus Jakarta Sans", sans-serif',
                    letterSpacing: '0.01em'
                }}>
                    Clinician Consent Form for Voice-to-Text Recording
                </Typography>
                <IconButton
                    onClick={onClose}
                    size="small"
                    style={{ color: 'white' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent className={classes.dialogContent}>
                <div
                    ref={scrollContainerRef}
                    className={classes.scrollContainer}
                    onScroll={handleScroll}
                >
                    <Typography variant="h6" className={classes.sectionTitle}>
                        Purpose of Consent
                    </Typography>
                    <Typography className={classes.paragraph}>
                        This form seeks your consent to record and store your spoken clinical notes 
                        and their transcriptions during the pilot phase of our voice-to-text functionality. 
                        These recordings will help us evaluate transcription accuracy and may be used to 
                        improve the model's ability to recognize medical terminology.
                    </Typography>

                    <Typography variant="h6" className={classes.sectionTitle}>
                        What You're Agreeing To
                    </Typography>

                    <Typography variant="subtitle1" style={{ fontWeight: 600, marginTop: 16, color: '#1a1a1a', fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                        Recording and Storage
                    </Typography>
                    <ul className={classes.bulletList}>
                        <li>Your spoken clinical notes will be recorded and securely stored.</li>
                        <li>Transcriptions generated by the voice-to-text system will also be stored.</li>
                    </ul>

                    <Typography variant="subtitle1" style={{ fontWeight: 600, marginTop: 16, color: '#1a1a1a', fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                        Use of Data
                    </Typography>
                    <ul className={classes.bulletList}>
                        <li>Recordings and transcriptions may be reviewed to assess system performance.</li>
                        <li>With your consent, recordings may be used to fine-tune the transcription model 
                            to better recognize clinical language and terminology.</li>
                    </ul>

                    <Typography variant="subtitle1" style={{ fontWeight: 600, marginTop: 16, color: '#1a1a1a', fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                        Privacy and Security
                    </Typography>
                    <ul className={classes.bulletList}>
                        <li>All recordings will be stored securely and accessed only by authorized personnel.</li>
                        <li>No patient-identifiable information will be linked to your recordings.</li>
                        <li>Any use of recordings for model training will follow strict de-identification protocols.</li>
                    </ul>

                    <Typography variant="subtitle1" style={{ fontWeight: 600, marginTop: 16, color: '#1a1a1a', fontFamily: '"Plus Jakarta Sans", sans-serif', }}>
                        Voluntary Participation
                    </Typography>
                    <ul className={classes.bulletList}>
                        <li>Participation is entirely voluntary.</li>
                        <li>You may withdraw your consent at any time by notifying the project team in writing.</li>
                        <li>Withdrawal will not affect your access to other tools or systems.</li>
                    </ul>

                    <Typography variant="h6" className={classes.sectionTitle}>
                        Consent Options
                    </Typography>
                    <Typography className={classes.paragraph}>
                        By clicking "I Agree" below, you acknowledge that you have read and understood 
                        this consent form and agree to participate in the voice-to-text clinical note 
                        recording pilot program under the terms described above.
                    </Typography>

                    <Box style={{ height: 20 }} />
                </div>

                <div className={classes.progressContainer}>
                    <Typography className={classes.progressText}>
                        <InfoIcon fontSize="small" />
                        {hasScrolledToBottom 
                            ? 'You have read the entire consent form' 
                            : 'Please scroll to read the entire consent form'}
                    </Typography>
                    <LinearProgress 
                        variant="determinate" 
                        value={scrollProgress}
                        style={{ 
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#e9ecef'
                        }}
                        color="primary"
                    />
                </div>

                {!hasScrolledToBottom && (
                    <Box className={classes.scrollPrompt}>
                        <InfoIcon fontSize="small" />
                        <Typography variant="body2">
                            Scroll down to continue
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions style={{ padding: '16px 24px' }}>
                <Button
                    onClick={onClose}
                    className={classes.cancelButton}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleAgree}
                    disabled={!hasScrolledToBottom}
                    className={classes.agreeButton}
                    startIcon={hasScrolledToBottom ? <CheckCircleIcon /> : null}
                    variant="contained"
                >
                    {hasScrolledToBottom ? 'I Agree' : 'Scroll to Continue'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ConsentModal;