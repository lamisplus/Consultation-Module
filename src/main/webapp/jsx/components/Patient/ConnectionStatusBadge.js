import React from 'react';
import { Chip, Tooltip, CircularProgress } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
    CloudDone as CloudDoneIcon,
    CloudOff as CloudOffIcon,
    Error as ErrorIcon,
} from '@material-ui/icons';

const useStyles = makeStyles((theme) => ({
    onlineBadge: {
        backgroundColor: '#e8f5e9',
        color: '#2e7d32',
        border: '1px solid #4caf50',
        fontWeight: 600,
        fontSize: '0.85rem',
        padding: theme.spacing(1, 2),
        borderRadius: '12px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        '& .MuiChip-icon': {
            color: '#4caf50',
        },
    },
    offlineBadge: {
        backgroundColor: '#fff3e0',
        color: '#e65100',
        border: '1px solid #ff9800',
        fontWeight: 600,
        fontSize: '0.85rem',
        padding: theme.spacing(1, 2),
        borderRadius: '12px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        '& .MuiChip-icon': {
            color: '#ff9800',
        },
    },
    checkingBadge: {
        backgroundColor: '#e3f2fd',
        color: '#1565c0',
        border: '1px solid #2196f3',
        fontWeight: 600,
        fontSize: '0.85rem',
        padding: theme.spacing(1, 2),
        borderRadius: '12px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
    },
    unavailableBadge: {
        backgroundColor: '#ffebee',
        color: '#c62828',
        border: '1px solid #f44336',
        fontWeight: 600,
        fontSize: '0.85rem',
        padding: theme.spacing(1, 2),
        borderRadius: '12px',
        fontFamily: '"Plus Jakarta Sans", sans-serif',
        letterSpacing: '0.01em',
        '& .MuiChip-icon': {
            color: '#f44336',
        },
    },
}));

const ConnectionStatusBadge = ({ mode, isChecking }) => {
    const classes = useStyles();

    const getBadgeConfig = () => {
        if (isChecking) {
            return {
                label: 'Checking Connection...',
                icon: <CircularProgress size={16} style={{ color: '#014d88' }} />,
                className: classes.checkingBadge,
                tooltip: 'Detecting available transcription server',
            };
        }

        switch (mode) {
            case 'online':
                return {
                    label: 'Online Mode',
                    icon: <CloudDoneIcon />,
                    className: classes.onlineBadge,
                    tooltip: 'Connected to online server - Full transcription & SOAP generation available',
                };
            case 'offline':
                return {
                    label: 'Offline Mode',
                    icon: <CloudOffIcon />,
                    className: classes.offlineBadge,
                    tooltip: 'Using local server (localhost:7860) - Transcription only, SOAP generation unavailable',
                };
            case 'unavailable':
                return {
                    label: 'No Server Available',
                    icon: <ErrorIcon />,
                    className: classes.unavailableBadge,
                    tooltip: 'Cannot connect to any transcription server. Please check your connection.',
                };
            default:
                return {
                    label: 'Unknown',
                    icon: <ErrorIcon />,
                    className: classes.unavailableBadge,
                    tooltip: 'Connection status unknown',
                };
        }
    };

    const config = getBadgeConfig();

    return (
        <Tooltip title={config.tooltip} arrow placement="bottom">
            <Chip
                icon={config.icon}
                label={config.label}
                className={config.className}
                size="medium"
            />
        </Tooltip>
    );
};

export default ConnectionStatusBadge;