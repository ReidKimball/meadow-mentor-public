import React, { useMemo } from 'react';
import { Box, Typography, Chip, Paper, CircularProgress, useTheme, alpha } from '@mui/material';
import { CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';

// Helper function for compliance color
const getComplianceColor = (score) => {
    if (score === null || score === undefined) return 'default';
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
};

export default function DateRangeComplianceScore({
    mealsInRange, // Array of meal objects within the selected date range
    isLoading, // Loading state (e.g., while history is being fetched)
}) {
    const theme = useTheme();

    console.log('[DateRangeComplianceScore] Received props:', { mealsInRange, isLoading });
    if (mealsInRange) {
        console.log('[DateRangeComplianceScore] mealsInRange.length:', mealsInRange.length);
        if (mealsInRange.length > 0) {
            console.log('[DateRangeComplianceScore] First meal in range (if any):', mealsInRange[0]);
        }
    }

    const averageScore = useMemo(() => {
        if (!mealsInRange || mealsInRange.length === 0) {
            return null;
        }
        const validScores = mealsInRange
            .map(meal => meal.complianceSnapshot?.score)
            .filter(score => typeof score === 'number'); // Filter out null/undefined scores

        if (validScores.length === 0) {
            return null; // No valid scores to average
        }

        const sum = validScores.reduce((acc, score) => acc + score, 0);
        return Math.round(sum / validScores.length);
    }, [mealsInRange]);

    const scoreLabel = averageScore !== null ? `${averageScore}%` : 'N/A';
    const scoreColor = getComplianceColor(averageScore);
    
    // Get appropriate icon based on score
    const getScoreIcon = () => {
        if (averageScore === null || averageScore === undefined) return null;
        if (averageScore >= 80) return <CheckCircle size={36} color={theme.palette.success.main} />;
        if (averageScore >= 60) return <AlertTriangle size={36} color={theme.palette.warning.main} />;
        return <AlertCircle size={36} color={theme.palette.error.main} />;
    };

    return (
        <Paper 
            elevation={0} 
            sx={{ 
                p: 3, 
                borderRadius: 3,
                background: alpha(theme.palette.background.paper, 0.7),
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: alpha(theme.palette.divider, 0.3),
                backdropFilter: 'blur(8px)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.08)}`
            }}
        >
            {/* Background accent */}
            <Box 
                sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '4px',
                    background: scoreColor !== 'default' 
                        ? theme.palette[scoreColor].main 
                        : theme.palette.grey[400],
                }}
            />
            
            <Typography 
                variant="subtitle1" 
                sx={{ 
                    fontWeight: 500, 
                    mb: 1,
                    color: 'text.primary'
                }}
            >
                Average Diet Compliance
            </Typography>
            
            {isLoading ? (
                <Box sx={{ display: 'flex', py: 2, alignItems: 'center' }}>
                    <CircularProgress size={24} thickness={4} />
                </Box>
            ) : (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    py: 1
                }}>
                    {getScoreIcon()}
                    
                    <Typography 
                        variant="h2" 
                        sx={{ 
                            fontWeight: 700, 
                            my: 1,
                            color: scoreColor !== 'default' 
                                ? theme.palette[scoreColor].main 
                                : theme.palette.text.primary,
                        }}
                    >
                        {scoreLabel}
                    </Typography>
                    
                    <Typography 
                        variant="caption" 
                        sx={{ 
                            color: 'text.secondary',
                            fontSize: '0.75rem',
                            fontWeight: 500
                        }}
                    >
                        Based on {mealsInRange?.length || 0} meals in selected range
                    </Typography>
                </Box>
            )}
        </Paper>
    );
}
