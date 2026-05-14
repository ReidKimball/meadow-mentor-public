import React from 'react';
import { useApiLimits } from '../context/ApiLimitsContext'; // Adjust path if needed
import { Alert, Box, Typography, CircularProgress } from '@mui/material'; // Using MUI for consistency

// Utility function to format the next reset time (can be moved to a utils file)
const formatNextResetTime = (lastResetIsoString) => {
    if (!lastResetIsoString) return 'N/A';
    try {
        const lastResetDate = new Date(lastResetIsoString);
        if (isNaN(lastResetDate.getTime())) {
            console.error("Invalid lastReset date received:", lastResetIsoString);
            return 'Invalid Date';
        }
        // Add 24 hours (1440 minutes) - assuming daily reset
        // Adjust this logic if reset periods differ or come from the backend
        const nextResetDate = new Date(lastResetDate.getTime() + 24 * 60 * 60 * 1000);

        // Format like: 10:00 PM PST (adjust timezone and format as needed)
        return nextResetDate.toLocaleTimeString('en-US', {
            timeZone: 'America/Los_Angeles', // Or user's local timezone
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
            timeZoneName: 'short' // e.g., PST
        });
    } catch (e) {
        console.error("Error formatting next reset time:", e);
        return 'Error';
    }
};

/**
 * Displays the remaining API uses for a specific service.
 * Reads data from ApiLimitsContext.
 *
 * @param {object} props
 * @param {string} props.serviceName - The key for the service in the user.model's apiUsage limits (e.g., 'mealConvert', 'mealPlanner').
 */
export default function ApiUsageDisplay({ serviceName }) {
    const { apiLimits, isLoading, error: contextError } = useApiLimits();

    // --- Safely access nested data ---
    const limitsData = apiLimits?.limits?.[serviceName];
    const remainingUses = limitsData?.remaining;
    const lastResetTime = apiLimits?.lastReset; // Assuming global lastReset for all limits

    // --- Determine Display State ---
    const hasLoaded = !isLoading && remainingUses !== undefined && remainingUses !== null && lastResetTime;
    const showLoading = isLoading && !apiLimits; // Show loading only on initial context load
    const showError = contextError || (!isLoading && (!limitsData || !lastResetTime) && apiLimits); // Show error if context loaded but data is missing


    // --- Render Logic ---
    if (showLoading) {
        return (
            <Box className="text-lg text-center bg-gray-200 rounded-lg m-2 p-2 flex items-center justify-center">
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Loading usage limits...
            </Box>
        );
    }

    if (showError) {
        console.error(`ApiUsageDisplay Error: Could not find limits for service "${serviceName}" or missing lastResetTime. Context Error: ${contextError}`, apiLimits);
        return (
            <Alert severity="warning" className="m-2">
                Could not load usage limits for this service. {contextError}
            </Alert>
        );
    }

    if (hasLoaded) {
        const isLowOnUses = remainingUses < 2; // Example threshold
        const bgColor = isLowOnUses ? 'bg-red-100' : 'bg-blue-100';
        const textColor = isLowOnUses ? 'text-red-600' : 'text-blue-800';
        const borderColor = isLowOnUses ? 'border-red-300' : 'border-blue-300';

        return (
            <div className={`text-lg text-center ${bgColor} ${textColor} border ${borderColor} rounded-lg m-2 p-2`}>
                <span className='font-semibold'>{remainingUses}</span> uses of this service remaining. Resets around <span className='font-semibold'>{formatNextResetTime(lastResetTime)}</span> daily.
            </div>
        );
    }

    // Fallback or state while context is loading but might have partial data
    return (
        <Box className="text-lg text-center bg-gray-200 rounded-lg m-2 p-2">
            Checking usage limits...
        </Box>
    );
}
