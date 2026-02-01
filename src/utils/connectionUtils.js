import axios from 'axios';

const ONLINE_SERVER_URL = process.env.REACT_APP_TRANSCRIPTION_URL || 'http://96.0.47.224:7860/api/v1';
const OFFLINE_SERVER_URL = 'http://localhost:7860/api/v1';


const HEALTH_CHECK_TIMEOUT = 3000;

/**
 * Check if online transcription server is available
 * @returns {Promise<boolean>}
 */
const checkOnlineServer = async () => {
    try {
        await axios.get(`${ONLINE_SERVER_URL}/health`, {
            timeout: HEALTH_CHECK_TIMEOUT,
        });
        return true;
    } catch (error) {
        console.warn('Online server unavailable:', error.message);
        return false;
    }
};

/**
 * Check if offline transcription server (localhost:7860) is available
 * @returns {Promise<boolean>}
 */
const checkOfflineServer = async () => {
    try {
        // Try to ping the offline server
        await axios.get(`http://localhost:7860/`, {
            timeout: HEALTH_CHECK_TIMEOUT,
        });
        return true;
    } catch (error) {
        console.warn('Offline server unavailable:', error.message);
        return false;
    }
};
//made minor changes

/**
 * Determine which transcription server to use based on availability
 * @returns {Promise<Object>} Server configuration object
 */
export const checkServerAvailability = async () => {
    // First check browser connectivity
    const isNavigatorOnline = navigator.onLine;
    
    if (!isNavigatorOnline) {
        // Browser is offline, try localhost
        const offlineAvailable = await checkOfflineServer();
        
        if (offlineAvailable) {
            return {
                mode: 'offline',
                transcriptionUrl: `${OFFLINE_SERVER_URL}/transcribe`,
                soapUrl: null,
                serverBaseUrl: OFFLINE_SERVER_URL,
            };
        }
        
        // Neither online nor offline available
        return {
            mode: 'unavailable',
            transcriptionUrl: null,
            soapUrl: null,
            serverBaseUrl: null,
        };
    }
    
    // Browser says we're online, verify with actual server
    const onlineAvailable = await checkOnlineServer();
    
    if (onlineAvailable) {
        return {
            mode: 'online',
            transcriptionUrl: `${ONLINE_SERVER_URL}/transcribe`,
            soapUrl: `${ONLINE_SERVER_URL}/soap/generate`,
            serverBaseUrl: ONLINE_SERVER_URL,
        };
    }
    
    // Online server not available, try offline as fallback
    const offlineAvailable = await checkOfflineServer();
    
    if (offlineAvailable) {
        return {
            mode: 'offline',
            transcriptionUrl: `${OFFLINE_SERVER_URL}/transcribe`,
            soapUrl: null,
            serverBaseUrl: OFFLINE_SERVER_URL,
        };
    }
    
    // No server available
    return {
        mode: 'unavailable',
        transcriptionUrl: null,
        soapUrl: null,
        serverBaseUrl: null,
    };
};

/**
 * Quick connectivity check (used for mode switching)
 * @returns {Promise<string>} 'online' | 'offline' | 'unavailable'
 */
export const quickConnectivityCheck = async () => {
    const config = await checkServerAvailability();
    return config.mode;
};

/**
 * Get server URLs for a specific mode
 * @param {string} mode - 'online' | 'offline'
 * @returns {Object} Server configuration
 */
export const getServerConfig = (mode) => {
    if (mode === 'online') {
        return {
            mode: 'online',
            transcriptionUrl: `${ONLINE_SERVER_URL}/transcribe`,
            soapUrl: `${ONLINE_SERVER_URL}/soap/generate`,
            serverBaseUrl: ONLINE_SERVER_URL,
        };
    } else if (mode === 'offline') {
        return {
            mode: 'offline',
            transcriptionUrl: `${OFFLINE_SERVER_URL}/transcribe`,
            soapUrl: null,
            serverBaseUrl: OFFLINE_SERVER_URL,
        };
    }
    
    return {
        mode: 'unavailable',
        transcriptionUrl: null,
        soapUrl: null,
        serverBaseUrl: null,
    };
};

export { ONLINE_SERVER_URL, OFFLINE_SERVER_URL };