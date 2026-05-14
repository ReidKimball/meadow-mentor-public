import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    Slider,
    Switch,
    FormControlLabel,
    Tooltip,
    Alert,
    CircularProgress,
    Stack
} from '@mui/material';
import { useSessionContextQuery, useUpdateSessionContext } from '../hooks/useUserQueries.js';
import BoltIcon from '@mui/icons-material/Bolt';
import PsychologyIcon from '@mui/icons-material/Psychology';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const SessionContextWidget = () => {
    const { data: sessionContext } = useSessionContextQuery();
    const updateSessionContextMutation = useUpdateSessionContext();
    const [energyValue, setEnergyValue] = useState(2); // Mid (Medium)
    const [stress, setStress] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');

    // Brand Colors
    const BRAND_GREEN = '#013D1D';
    const BRAND_AMBER = '#FFBF00';
    const BRAND_MINT = '#DCFCE7';
    const BRAND_CREAM = '#FFF8E5';

    // Map enum to numeric slider
    const mapEnumToVal = (val) => {
        if (val === 'low') return 1;
        if (val === 'medium') return 2;
        if (val === 'high') return 3;
        return 2;
    };

    const mapValToEnum = (val) => {
        if (val === 1) return 'low';
        if (val === 2) return 'medium';
        if (val === 3) return 'high';
        return 'medium';
    };

    useEffect(() => {
        if (sessionContext) {
            setEnergyValue(mapEnumToVal(sessionContext.energyLevel));
            setStress(sessionContext.stressMode || false);
        }
    }, [sessionContext]);

    // Update timer
    useEffect(() => {
        const updateTimer = () => {
            if (!sessionContext?.expiresAt) {
                setTimeLeft('');
                return;
            }

            const expiry = new Date(sessionContext.expiresAt);
            const now = new Date();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeLeft('Needs Refresh');
                return;
            }

            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            setTimeLeft(`${hours}h ${minutes}m`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 60000);
        return () => clearInterval(interval);
    }, [sessionContext]);

    const handleUpdate = async (newEnergy, newStress) => {
        setIsUpdating(true);
        try {
            await updateSessionContextMutation.mutateAsync({
                energyLevel: mapValToEnum(newEnergy),
                stressMode: newStress
            });
        } catch (err) {
            console.error('Failed to update session context:', err);
        } finally {
            setIsUpdating(false);
        }
    };

    const marks = [
        { value: 1, label: 'Quiet' },
        { value: 2, label: 'Balanced' },
        { value: 3, label: 'Active' },
    ];

    return (
        <Card
            elevation={0}
            sx={{
                borderRadius: '22px',
                border: `1px solid ${BRAND_MINT}`,
                bgcolor: '#FFFFFF',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <CardContent sx={{ p: 3, '&:last-child': { pb: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={3}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Typography
                                variant="h6"
                                sx={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 700,
                                    color: BRAND_GREEN,
                                    fontSize: '1.25rem',
                                    lineHeight: 1.2
                                }}
                            >
                                Personalize Kay
                            </Typography>
                            <Tooltip title="This helps Chef Kay personalize recipes based on your energy and stress. Resets every 4 hours.">
                                <InfoOutlinedIcon sx={{ fontSize: '1.2rem', color: BRAND_GREEN, opacity: 0.5, cursor: 'pointer' }} />
                            </Tooltip>
                        </Stack>
                        <Typography
                            variant="body2"
                            sx={{
                                fontFamily: '"Source Sans Pro", sans-serif',
                                color: 'text.secondary',
                                mt: 0.5
                            }}
                        >
                            Help Kay match your current vibe.
                        </Typography>
                    </Box>
                    {timeLeft && (
                        <Box sx={{
                            bgcolor: BRAND_CREAM,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            border: `1px solid ${BRAND_MINT}`
                        }}>
                            <AccessTimeIcon sx={{ fontSize: '0.9rem', color: BRAND_GREEN }} />
                            <Typography
                                variant="caption"
                                sx={{
                                    fontWeight: 600,
                                    color: BRAND_GREEN,
                                    fontFamily: '"Source Sans Pro", sans-serif'
                                }}
                            >
                                {timeLeft}
                            </Typography>
                        </Box>
                    )}
                </Box>

                <Stack spacing={4} sx={{ flexGrow: 1, justifyContent: 'center' }}>
                    <Box>
                        <Stack direction="row" spacing={1} alignItems="center" mb={1}>
                            <BoltIcon sx={{ color: BRAND_AMBER, fontSize: '1.2rem' }} />
                            <Typography
                                variant="subtitle2"
                                sx={{
                                    fontWeight: 600,
                                    color: BRAND_GREEN,
                                    fontFamily: 'Montserrat, sans-serif'
                                }}
                            >
                                Energy Level
                            </Typography>
                        </Stack>
                        <Box sx={{ px: 1.5 }}>
                            <Slider
                                value={energyValue}
                                min={1}
                                max={3}
                                step={1}
                                marks={marks}
                                onChange={(e, val) => {
                                    setEnergyValue(val);
                                    handleUpdate(val, stress);
                                }}
                                sx={{
                                    color: BRAND_GREEN,
                                    height: 6,
                                    '& .MuiSlider-track': { border: 'none' },
                                    '& .MuiSlider-thumb': {
                                        height: 18,
                                        width: 18,
                                        backgroundColor: '#fff',
                                        border: `2px solid ${BRAND_GREEN}`,
                                        '&:focus, &:hover, &.Mui-active, &.Mui-focusVisible': {
                                            boxShadow: 'inherit',
                                        },
                                        '&:before': { display: 'none' },
                                    },
                                    '& .MuiSlider-valueLabel': {
                                        lineHeight: 1.2,
                                        fontSize: 12,
                                        background: 'unset',
                                        padding: 0,
                                        width: 32,
                                        height: 32,
                                        borderRadius: '50% 50% 50% 0',
                                        backgroundColor: BRAND_GREEN,
                                        transformOrigin: 'bottom left',
                                        transform: 'translate(50%, -100%) rotate(-45deg) scale(0)',
                                        '&:before': { display: 'none' },
                                        '&.MuiSlider-valueLabelOpen': {
                                            transform: 'translate(50%, -100%) rotate(-45deg) scale(1)',
                                        },
                                        '& > *': {
                                            transform: 'rotate(45deg)',
                                        },
                                    },
                                    '& .MuiSlider-markLabel': {
                                        fontSize: '0.85rem',
                                        fontFamily: '"Source Sans Pro", sans-serif',
                                        top: 30
                                    }
                                }}
                            />
                        </Box>
                    </Box>

                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            bgcolor: BRAND_MINT,
                            p: 2,
                            borderRadius: '16px',
                            transition: 'all 0.3s ease',
                            border: stress ? `1px solid ${BRAND_GREEN}` : '1px solid transparent'
                        }}
                    >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box sx={{
                                bgcolor: '#FFFFFF',
                                p: 1,
                                borderRadius: '10px',
                                display: 'flex',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                <PsychologyIcon sx={{ color: stress ? BRAND_GREEN : 'text.disabled' }} />
                            </Box>
                            <Box>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        fontWeight: 600,
                                        color: BRAND_GREEN,
                                        fontFamily: 'Montserrat, sans-serif'
                                    }}
                                >
                                    Feeling Stressed?
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                    Kay will suggest simpler meals.
                                </Typography>
                            </Box>
                        </Stack>
                        <Box display="flex" alignItems="center" gap={1}>
                            {isUpdating && <CircularProgress size={16} sx={{ color: BRAND_GREEN }} />}
                            <Switch
                                checked={stress}
                                onChange={(e) => {
                                    const val = e.target.checked;
                                    setStress(val);
                                    handleUpdate(energyValue, val);
                                }}
                                sx={{
                                    '& .MuiSwitch-switchBase.Mui-checked': {
                                        color: BRAND_GREEN,
                                        '&:hover': {
                                            backgroundColor: `rgba(1, 61, 29, 0.08)`,
                                        },
                                    },
                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                        backgroundColor: BRAND_GREEN,
                                    },
                                }}
                            />
                        </Box>
                    </Box>
                </Stack>

                {(!sessionContext || timeLeft === 'Needs Refresh') && (
                    <Alert
                        severity="info"
                        icon={false}
                        sx={{
                            mt: 2,
                            borderRadius: '12px',
                            bgcolor: BRAND_CREAM,
                            color: BRAND_GREEN,
                            border: `1px solid ${BRAND_MINT}`,
                            '& .MuiAlert-message': { width: '100%', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }
                        }}
                    >
                        Please update your status to help Kay!
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};

export default SessionContextWidget;
