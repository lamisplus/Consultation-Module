import React, { useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Button,
    Typography,
    TextField,
    CircularProgress,
    FormControlLabel,
    Checkbox,
    Box,
    Snackbar,
    Tooltip,
} from '@material-ui/core';
import {
    Close as CloseIcon,
    CloudDownload as CloudDownloadIcon,
    GetApp as GetAppIcon,
} from '@material-ui/icons';
import axios from 'axios';
import {url as baseUrl, audioTranscriptionUrl} from "../../../api";


const useStyles = makeStyles((theme) => ({
    floatingButton: {
        position: 'fixed',
        bottom: '100px',
        right: '32px',
        zIndex: 1000,
        backgroundColor: '#00796b',
        color: 'white',
        height: '56px',
        width: '56px',
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 121, 107, 0.3)',
        transition: 'all 0.3s ease',
        transform: 'scale(1)',
    },
    dialogPaper: {
        minWidth: 400,
        maxWidth: 500,
    },
    dialogTitle: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: theme.spacing(1),
        backgroundColor: '#00796b',
        color: 'white',
    },
    dialogContent: {
        paddingTop: theme.spacing(3),
    },
    formField: {
        marginBottom: theme.spacing(2),
    },
    submitButton: {
        backgroundColor: '#00796b',
        color: 'white',
        '&:hover': {
            backgroundColor: '#00695c',
        },
        '&:disabled': {
            backgroundColor: '#b2dfdb',
        },
    },
    infoBox: {
        backgroundColor: '#e0f2f1',
        border: '1px solid #80cbc4',
        borderRadius: theme.spacing(1),
        padding: theme.spacing(2),
        marginBottom: theme.spacing(2),
    },
    progressContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing(2),
        padding: theme.spacing(3),
    },
}));

const ExportRecords = () => {
    const classes = useStyles();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [includeAudio, setIncludeAudio] = useState(true);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [error, setError] = useState(null);
    const [showPassword, setShowPassword] = useState(false);

    // Get user account from localStorage
    const getUserAccount = () => {
        try {
            const userAccountStr = localStorage.getItem('user_account');
            if (!userAccountStr) {
                throw new Error('User account not found in localStorage');
            }
            return JSON.parse(userAccountStr);
        } catch (err) {
            setError('Unable to retrieve user account information');
            return null;
        }
    };

    const handleOpenModal = () => {
        const userAccount = getUserAccount();
        if (!userAccount) return;
        setIsModalOpen(true);
        setPassword('');
        setError(null);
    };

    const handleCloseModal = () => {
        if (isAuthenticating || isExporting) return;
        setIsModalOpen(false);
        setPassword('');
        setError(null);
    };

    const authenticateUser = async (username, password) => {
        try {
            const response = await axios.post(
                `${baseUrl}authenticate`,
                {
                    username: username,
                    password: password,
                    remember: '',
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
            return response.status === 200;
        } catch (err) {
            console.error('Authentication error:', err);
            throw new Error(
                err.response?.data?.message ||
                'Authentication failed. Please check your password.'
            );
        }
    };

    const triggerExport = async () => {
        try {
            const response = await axios.get(
                `${audioTranscriptionUrl}/export/recordings`,
                {
                    params: {
                        include_audio: includeAudio,
                    },
                    responseType: 'blob',
                    timeout: 3000000, // 5 minutes timeout for large exports
                }
            );

            // Create a download link and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Extract filename from Content-Disposition header if available
            const contentDisposition = response.headers['content-disposition'];
            let filename = `recordings_export_${new Date().toISOString().slice(0, 10)}.zip`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }

            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            return true;
        } catch (err) {
            console.error('Export error:', err);
            throw new Error(
                err.response?.data?.detail ||
                err.message ||
                'Export failed. Please try again.'
            );
        }
    };

    const handleExport = async () => {
        setError(null);

        // Validate password
        if (!password.trim()) {
            setError('Please enter your password');
            return;
        }

        const userAccount = getUserAccount();
        if (!userAccount || !userAccount.userName) {
            setError('Unable to retrieve user information');
            return;
        }

        try {
            // Step 1: Authenticate
            setIsAuthenticating(true);
            const isAuthenticated = await authenticateUser(
                userAccount.userName,
                password
            );

            if (!isAuthenticated) {
                setError('Authentication failed');
                return;
            }

            // Step 2: Trigger export
            setIsAuthenticating(false);
            setIsExporting(true);

            await triggerExport();

            // Success - close modal and reset
            setIsModalOpen(false);
            setPassword('');
            setError(null);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsAuthenticating(false);
            setIsExporting(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !isAuthenticating && !isExporting) {
            handleExport();
        }
    };

    return (
        <>
            {/* Floating Action Button */}
            <Tooltip title="Export recordings" placement="left">
                <div
                    style={{
                        position: 'fixed',
                        bottom: '157px',
                        right: '32px',
                        zIndex: 1000,
                        backgroundColor: '#00796b',
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
                        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 121, 107, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 121, 107, 0.3)';
                    }}
                    onClick={handleOpenModal}
                    aria-label="export recordings"
                >
                    <CloudDownloadIcon />
                </div>
            </Tooltip>

            {/* Modal Dialog */}
            <Dialog
                open={isModalOpen}
                onClose={handleCloseModal}
                maxWidth="sm"
                fullWidth
                classes={{ paper: classes.dialogPaper }}
            >
                <DialogTitle className={classes.dialogTitle}>
                    <Typography variant="h6">Export Recordings</Typography>
                    <IconButton
                        onClick={handleCloseModal}
                        size="small"
                        disabled={isAuthenticating || isExporting}
                        style={{ color: 'white' }}
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <DialogContent className={classes.dialogContent}>
                    {!isAuthenticating && !isExporting ? (
                        <>
                            {/* Info Box */}
                            <Box className={classes.infoBox}>
                                <Typography variant="body2" gutterBottom>
                                    <strong>Export Information:</strong>
                                </Typography>
                                <Typography variant="caption" display="block">
                                    • This will export all recordings as a ZIP file
                                </Typography>
                                <Typography variant="caption" display="block">
                                    • Includes database records (CSV format)
                                </Typography>
                                <Typography variant="caption" display="block">
                                    • Audio files and verification manifest
                                </Typography>
                                <Typography variant="caption" display="block" style={{ marginTop: 8 }}>
                                    Please authenticate to proceed with the export.
                                </Typography>
                            </Box>

                            {/* Include Audio Checkbox
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={includeAudio}
                                        onChange={(e) => setIncludeAudio(e.target.checked)}
                                        color="primary"
                                    />
                                }
                                label={
                                    <Typography variant="body2">
                                        Include audio files in export
                                    </Typography>
                                }
                                className={classes.formField}
                            /> */}

                            {/* Password Field */}
                            <TextField
                                fullWidth
                                label="Password"
                                type={showPassword ? 'text' : 'password'}
                                variant="outlined"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className={classes.formField}
                                required
                                autoFocus
                                helperText="Enter your password to authenticate"
                            />

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={showPassword}
                                        onChange={(e) => setShowPassword(e.target.checked)}
                                        color="primary"
                                        size="small"
                                    />
                                }
                                label={
                                    <Typography variant="caption">
                                        Show password
                                    </Typography>
                                }
                            />

                            {/* Error Message */}
                            {error && (
                                <Typography
                                    color="error"
                                    variant="body2"
                                    style={{ marginTop: 16 }}
                                >
                                    {error}
                                </Typography>
                            )}
                        </>
                    ) : (
                        /* Progress Indicator */
                        <Box className={classes.progressContainer}>
                            <CircularProgress size={60} style={{ color: '#00796b' }} />
                            <Typography variant="body1" align="center">
                                {isAuthenticating ? 'Authenticating...' : 'Exporting recordings...'}
                            </Typography>
                            <Typography variant="caption" color="textSecondary" align="center">
                                {isExporting && 'This may take a few minutes for large exports'}
                            </Typography>
                        </Box>
                    )}
                </DialogContent>

                {!isAuthenticating && !isExporting && (
                    <DialogActions style={{ padding: '16px 24px' }}>
                        <Button
                            onClick={handleCloseModal}
                            color="default"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            className={classes.submitButton}
                            variant="contained"
                            startIcon={<GetAppIcon />}
                            disabled={!password.trim()}
                        >
                            Export
                        </Button>
                    </DialogActions>
                )}
            </Dialog>

            {/* Success Snackbar */}
            <Snackbar
                open={false}
                autoHideDuration={6000}
                message="Export completed successfully"
            />
        </>
    );
};

export default ExportRecords;