import React from 'react';
import { useApiLimits } from './ApiLimitsContext.jsx';
import { Tooltip, Avatar, Box, CircularProgress } from '@mui/material';

/**
 * A badge component that displays the remaining API uses in a circle.
 * On hover, it shows a tooltip with the reset time.
 *
 * @param {object} props
 * @param {string} props.serviceName - The key for the service in the user.model's apiUsage limits (e.g., 'askKay').
 */
export default function ApiUsesRemainingBadge({ serviceName }) {
    const { apiLimits, isLoading, error, formattedNextResetTime } = useApiLimits();

    const remainingUses = apiLimits?.limits?.[serviceName]?.remaining;

    // Handle loading state
    if (isLoading && !apiLimits) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32 }}>
                <CircularProgress size={20} />
            </Box>
        );
    }

    // Handle error or missing data state
    if (error || remainingUses === undefined || remainingUses === null) {
        return (
            <Tooltip title="Could not load usage data." arrow>
                <Avatar sx={{ bgcolor: 'action.disabledBackground', color: 'action.disabled', width: 32, height: 32, fontSize: '1rem' }}>
                    !
                </Avatar>
            </Tooltip>
        );
    }

    const tooltipTitle = `${remainingUses} uses remaining. Resets around ${formattedNextResetTime || 'the next cycle'}.`;

    const getBgColor = () => {
        if (remainingUses <= 2) return 'error.main';
        if (remainingUses <= 5) return 'warning.main';
        return 'primary.main';
    };

    return (
        <Tooltip title={tooltipTitle} arrow placement="top">
            <Avatar sx={{ bgcolor: getBgColor(), width: 32, height: 32, fontSize: '1rem', color: 'white' }}>
                {remainingUses}
            </Avatar>
        </Tooltip>
    );
}