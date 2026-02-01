import React, { useState } from 'react';
import {
    Box,
    Typography,
    FormControlLabel,
    Checkbox,
    Button,
    Chip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    Info as InfoIcon,
    CheckCircle as CheckCircleIcon,
    Description as DescriptionIcon,
} from '@material-ui/icons';
import ConsentModal from './ConsentModal';
import moment from 'moment';

const useStyles = makeStyles((theme) => ({
    container: {
        backgroundColor: 'transparent',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '12px',
        padding: theme.spacing(2),
        transition: 'all 0.3s ease',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    containerActive: {
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
    },
    readConsentButton: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1),
        textTransform: 'none',
        fontWeight: 600,
        color: '#014d88',
        borderRadius: '8px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        '&:hover': {
            backgroundColor: 'rgba(1, 77, 136, 0.08)',
        },
    },
    consentLabel: {
        display: 'flex',
        flexDirection: 'column',
        gap: theme.spacing(0.5),
    },
    consentTitle: {
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(1),
        fontSize: '0.95rem',
        color: '#1a1a1a',
        letterSpacing: '0.01em',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    consentDescription: {
        fontSize: '0.875rem',
        color: '#6b7280',
        marginTop: theme.spacing(0.5),
        lineHeight: 1.5,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
    acknowledgedChip: {
        marginTop: theme.spacing(1),
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        color: '#2e7d32',
        fontWeight: 600,
        borderRadius: '8px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
    },
    warningBox: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: theme.spacing(1),
        padding: theme.spacing(1.5),
        backgroundColor: 'rgba(237, 108, 2, 0.05)',
        borderRadius: '8px',
        marginTop: theme.spacing(1),
        border: '1px solid rgba(237, 108, 2, 0.2)',
    },
    warningText: {
        fontSize: '0.875rem',
        color: '#ED6C02',
        fontWeight: 600,
        lineHeight: 1.5,
        fontFamily: '"Plus Jakarta Sans", sans-serif',
    },
}));

const ConsentCheckbox = ({ 
    hasConsent, 
    setHasConsent, 
    disabled = false 
}) => {
    const classes = useStyles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [consentTimestamp, setConsentTimestamp] = useState(null);

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleAgree = () => {
        setHasConsent(true);
        setConsentTimestamp(new Date());
    };

    const handleCheckboxChange = (e) => {
        e.preventDefault();
        if (!hasConsent) {
            handleOpenModal();
        }
    };

    return (
        <>
            <Box 
                className={`${classes.container} ${hasConsent ? classes.containerActive : ''}`}
            >
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={hasConsent}
                            onChange={handleCheckboxChange}
                            color="primary"
                            disabled={disabled}
                            icon={<InfoIcon />}
                            checkedIcon={<CheckCircleIcon />}
                            style={{
                                color: hasConsent ? '#4caf50' : '#014d88'
                            }}
                        />
                    }
                    label={
                        <Box className={classes.consentLabel}>
                            <Typography variant="body2" className={classes.consentTitle}>
                                {hasConsent ? (
                                    <>
                                        <CheckCircleIcon 
                                            fontSize="small" 
                                            style={{ color: '#4caf50' }} 
                                        />
                                        Patient consent obtained and acknowledged
                                    </>
                                ) : (
                                    <>
                                        <InfoIcon 
                                            fontSize="small" 
                                            style={{ color: '#014d88' }} 
                                        />
                                        Patient consent obtained
                                    </>
                                )}
                            </Typography>
                            <Typography variant="caption" className={classes.consentDescription}>
                                {hasConsent 
                                    ? 'You have confirmed that the patient has agreed to be recorded and their session may be transcribed.'
                                    : 'Please read and acknowledge the consent form to confirm the patient has agreed to recording.'
                                }
                            </Typography>
                        </Box>
                    }
                />

                {!hasConsent && (
                    <>
                        <Button
                            variant="outlined"
                            color="primary"
                            size="small"
                            startIcon={<DescriptionIcon />}
                            onClick={handleOpenModal}
                            className={classes.readConsentButton}
                            fullWidth
                        >
                            Read Consent Form to Continue
                        </Button>
                        
                        <Box className={classes.warningBox}>
                            <InfoIcon fontSize="small" style={{ color: '#ED6C02' }} />
                            <Typography className={classes.warningText}>
                                You must read the complete consent form before recording can begin.
                            </Typography>
                        </Box>
                    </>
                )}

                {hasConsent && consentTimestamp && (
                    <Chip
                        size="small"
                        icon={<CheckCircleIcon fontSize="small" style={{ color: '#4caf50' }} />}
                        label={`Consent acknowledged on ${moment(consentTimestamp).format('MMM DD, YYYY [at] h:mm A')}`}
                        className={classes.acknowledgedChip}
                    />
                )}
            </Box>

            <ConsentModal
                open={isModalOpen}
                onClose={handleCloseModal}
                onAgree={handleAgree}
            />
        </>
    );
};

export default ConsentCheckbox;