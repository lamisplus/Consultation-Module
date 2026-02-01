/**
 * Formats diarization segments into a readable string format
 * @param {Array} diarizationSegments - Array of diarization objects from API
 * @returns {string} - Formatted string with speaker turns
 */
const formatDiarizationOutput = (diarizationSegments) => {
    if (!diarizationSegments || !Array.isArray(diarizationSegments) || diarizationSegments.length === 0) {
        return "";
    }

    return diarizationSegments
        .map(segment => {
            const { start, end, text, speaker } = segment;
            const startTime = start.toFixed(1);
            const endTime = end.toFixed(1);
            return `[${speaker}](${startTime}s-${endTime}s): ${text.trim()}`;
        })
        .join('\n');
};

/**
 * Alternative format with better readability and paragraph grouping
 * Groups consecutive statements by the same speaker
 * @param {Array} diarizationSegments - Array of diarization objects from API
 * @returns {string} - Formatted string with grouped speaker turns
 */
const formatDiarizationOutputGrouped = (diarizationSegments) => {
    if (!diarizationSegments || !Array.isArray(diarizationSegments) || diarizationSegments.length === 0) {
        return "";
    }

    const grouped = [];
    let currentSpeaker = null;
    let currentGroup = {
        speaker: null,
        startTime: null,
        endTime: null,
        texts: []
    };

    diarizationSegments.forEach((segment, index) => {
        if (segment.speaker !== currentSpeaker) {
            // Save previous group if exists
            if (currentGroup.speaker !== null) {
                grouped.push({ ...currentGroup });
            }
            
            // Start new group
            currentSpeaker = segment.speaker;
            currentGroup = {
                speaker: segment.speaker,
                startTime: segment.start,
                endTime: segment.end,
                texts: [segment.text.trim()]
            };
        } else {
            // Continue current group
            currentGroup.endTime = segment.end;
            currentGroup.texts.push(segment.text.trim());
        }

        // Push last group
        if (index === diarizationSegments.length - 1) {
            grouped.push({ ...currentGroup });
        }
    });

    return grouped
        .map(group => {
            const startTime = group.startTime.toFixed(1);
            const endTime = group.endTime.toFixed(1);
            const combinedText = group.texts.join(' ');
            return `[${group.speaker}](${startTime}s-${endTime}s): ${combinedText}`;
        })
        .join('\n\n');
};

/**
 * Format with timestamps in minutes:seconds format
 * @param {Array} diarizationSegments - Array of diarization objects from API
 * @returns {string} - Formatted string with MM:SS timestamps
 */
const formatDiarizationOutputWithTime = (diarizationSegments) => {
    if (!diarizationSegments || !Array.isArray(diarizationSegments) || diarizationSegments.length === 0) {
        return "";
    }

    const formatTimestamp = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins}:${secs.padStart(4, '0')}`;
    };

    return diarizationSegments
        .map(segment => {
            const { start, end, text, speaker } = segment;
            const startTime = formatTimestamp(start);
            const endTime = formatTimestamp(end);
            return `[${speaker}](${startTime}-${endTime}): ${text.trim()}`;
        })
        .join('\n');
};

/**
 * Format with speaker labels replaced with friendly names
 * @param {Array} diarizationSegments - Array of diarization objects from API
 * @param {Object} speakerMap - Optional mapping of SPEAKER_XX to friendly names
 * @returns {string} - Formatted string with custom speaker names
 */
const formatDiarizationOutputWithNames = (diarizationSegments, speakerMap = {}) => {
    if (!diarizationSegments || !Array.isArray(diarizationSegments) || diarizationSegments.length === 0) {
        return "";
    }

    // Default speaker mapping if none provided
    const defaultMap = {
        'SPEAKER_00': 'Doctor',
        'SPEAKER_01': 'Patient',
        'SPEAKER_02': 'Nurse',
        'SPEAKER_03': 'Other'
    };

    const nameMap = { ...defaultMap, ...speakerMap };

    return diarizationSegments
        .map(segment => {
            const { start, end, text, speaker } = segment;
            const speakerName = nameMap[speaker] || speaker;
            const startTime = start.toFixed(1);
            const endTime = end.toFixed(1);
            return `[${speakerName}](${startTime}s-${endTime}s): ${text.trim()}`;
        })
        .join('\n');
};


export {
    formatDiarizationOutput,
    formatDiarizationOutputGrouped,
    formatDiarizationOutputWithTime,
    formatDiarizationOutputWithNames
};