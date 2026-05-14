/**
 * @file Defines the BMTrendChart component.
 * @description Renders a Bristol stool consistency trend line chart with an ideal-range highlight and zoom controls.
 * @requires module:react - Core React library and hooks.
 * @requires module:@mui/material - UI primitives used for layout and controls.
 * @requires module:@mui/x-charts - Line chart rendering.
 * @author Cascade
 * @version 1.0.0
 * @date 2026-02-12
 */

import React, { useMemo, useEffect, useState, useCallback } from 'react';
import {
    Box,
    Paper,
    Typography,
    useTheme,
    useMediaQuery,
    alpha,
    Slider,
    IconButton,
    Tooltip,
    Chip,
    Avatar,
    Divider,
    ToggleButton,
    ToggleButtonGroup,
    Stack,
    Grid
} from '@mui/material';
import { LineChart } from '@mui/x-charts/LineChart';
import { format } from 'date-fns';
import {
    X,
    Heart,
    Calendar,
    Tag as TagIcon,
    MessageSquare,
    Activity,
    AlertCircle,
    Thermometer,
    Droplet,
    Wind,
    Eye,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BristolIcon } from './BMQuickLog';

const BM_TREND_CHART_DEBUG_ENABLED = (() => {
    if (typeof window === 'undefined') return false;
    try {
        const searchParams = new URLSearchParams(window.location.search);
        if (searchParams.has('debugBmChart')) return true;

        const hash = window.location.hash || '';
        const hashQueryIndex = hash.indexOf('?');
        if (hashQueryIndex === -1) return false;

        const hashParams = new URLSearchParams(hash.slice(hashQueryIndex + 1));
        return hashParams.has('debugBmChart');
    } catch {
        return false;
    }
})();

const BM_TREND_CHART_IS_LOCALHOST = (() => {
    if (typeof window === 'undefined') return false;
    const host = window.location.hostname;
    return host === 'localhost' || host === '127.0.0.1';
})();

const BM_TREND_CHART_MODE = import.meta?.env?.MODE ?? (BM_TREND_CHART_IS_LOCALHOST ? 'development' : undefined);
const BM_TREND_CHART_DEV = import.meta?.env?.DEV ?? BM_TREND_CHART_IS_LOCALHOST;

if (BM_TREND_CHART_MODE !== 'production' || BM_TREND_CHART_DEBUG_ENABLED) {
    console.log('[BMTrendChart] module loaded', {
        mode: BM_TREND_CHART_MODE,
        dev: BM_TREND_CHART_DEV,
        debugBmChart: BM_TREND_CHART_DEBUG_ENABLED,
        href: typeof window !== 'undefined' ? window.location.href : null,
    });
}

/**
 * Mockup 1: "The Clinical Sticker"
 * Focuses on empathy and clear visual communication.
 */
const ClinicalStickerMockup = ({ entry, color }) => (
    <Box sx={{ p: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
            <Avatar
                sx={{
                    bgcolor: `${color}20`,
                    width: 70,
                    height: 70,
                    border: `3px solid ${color}`,
                    boxShadow: `0 8px 16px ${color}30`
                }}
            >
                <BristolIcon type={entry.bristolType} color={color} />
            </Avatar>
            <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#013D1D', lineHeight: 1.2 }}>
                    Type {entry.bristolType}
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                    {format(new Date(entry.occurredAt), 'eeee, MMM do • h:mm a')}
                </Typography>
            </Box>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {entry.symptoms?.map((s, i) => (
                <Chip
                    key={i}
                    icon={s.type === 'blood' ? <Droplet size={14} /> : s.type === 'mucus' ? <Wind size={14} /> : <Thermometer size={14} />}
                    label={`${s.type}: ${s.present ? 'Yes' : s.level !== undefined ? s.level : 'No'}`}
                    color={s.present || s.level > 0 ? 'error' : 'default'}
                    variant={s.present || s.level > 0 ? 'filled' : 'outlined'}
                    sx={{ fontWeight: 700, borderRadius: 2 }}
                />
            ))}
        </Box>

        {entry.notes && (
            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 3, mb: 2 }}>
                <Typography variant="caption" sx={{ textTransform: 'uppercase', fontWeight: 900, color: 'text.secondary', mb: 1, display: 'block' }}>
                    Personal Notes
                </Typography>
                <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#334155' }}>
                    "{entry.notes}"
                </Typography>
            </Paper>
        )}

        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {entry.tags?.map((t, i) => (
                <Chip key={i} label={`#${t}`} size="small" variant="outlined" sx={{ borderStyle: 'dashed', opacity: 0.7 }} />
            ))}
        </Box>
    </Box>
);

/**
 * Mockup 2: "The Zen Journal"
 * Minimalist, editorial, focus on high-quality typography and spacing.
 */
const ZenJournalMockup = ({ entry, color }) => (
    <Box sx={{ textAlign: 'center', py: 2 }}>
        <Typography variant="caption" sx={{ letterSpacing: 4, textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
            {format(new Date(entry.occurredAt), 'MMMM d, yyyy')}
        </Typography>
        <Typography variant="h3" sx={{ fontFamily: 'var(--font-heading)', fontWeight: 700, color: '#013D1D', mb: 1 }}>
            {format(new Date(entry.occurredAt), 'h:mm a')}
        </Typography>

        <Divider sx={{ width: 40, mx: 'auto', my: 3, borderBottomWidth: 2, borderColor: color }} />

        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color }}>Type {entry.bristolType}</Typography>
                <Typography variant="caption" color="text.secondary">Bristol Scale</Typography>
            </Box>
            <BristolIcon type={entry.bristolType} color={color} />
            <Box sx={{ textAlign: 'left' }}>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{entry.symptoms?.some(s => s.present || s.level > 0) ? 'Action' : 'Steady'}</Typography>
                <Typography variant="caption" color="text.secondary">Vitals</Typography>
            </Box>
        </Box>

        <Stack direction="row" justifyContent="center" spacing={3} sx={{ mb: 4 }}>
            <Box>
                <Droplet color={entry.symptoms?.find(s => s.type === 'blood')?.present ? '#ef4444' : '#e2e8f0'} size={24} />
                <Typography variant="caption" display="block">Blood</Typography>
            </Box>
            <Box>
                <Wind color={entry.symptoms?.find(s => s.type === 'mucus')?.present ? '#f59e0b' : '#e2e8f0'} size={24} />
                <Typography variant="caption" display="block">Mucus</Typography>
            </Box>
            <Box>
                <Thermometer color={entry.symptoms?.find(s => s.type === 'urgency')?.level > 0 ? '#ef4444' : '#e2e8f0'} size={24} />
                <Typography variant="caption" display="block">Urgency</Typography>
            </Box>
        </Stack>

        {entry.notes && (
            <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: '80%', mx: 'auto', fontStyle: 'serif' }}>
                {entry.notes}
            </Typography>
        )}
    </Box>
);



/**
 * @component BMTrendChart
 * @description Visualizes BM trends over time using MUI X Charts.
 * Focuses on Bristol Type over time with color-coded context.
 */
const BMTrendChart = ({ data = [], loading }) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isDev = BM_TREND_CHART_DEV === true;
    const debugEnabled = isDev || BM_TREND_CHART_DEBUG_ENABLED;
    const [selectedEntryIndex, setSelectedEntryIndex] = useState(null);
    const [mockupIndex, setMockupIndex] = useState('1');

    const markSize = isMobile ? 8 : 6;

    useEffect(() => {
        if (!debugEnabled) return;
        console.log('[BMTrendChart] mounted', {
            mode: BM_TREND_CHART_MODE,
            dev: BM_TREND_CHART_DEV,
            debugBmChart: BM_TREND_CHART_DEBUG_ENABLED,
        });
    }, [debugEnabled]);

    const ZOOM_PRESETS = useMemo(() => {
        return {
            day: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000,
        };
    }, []);

    const chartHeight = isMobile ? 420 : 600;
    const xAxisHeight = isMobile ? 64 : 80;
    const chartMarginBottom = isMobile ? 32 : 80;

    const chartMargin = useMemo(() => {
        return { left: 60, right: 20, top: 20, bottom: chartMarginBottom };
    }, [chartMarginBottom]);

    const healthyZone = useMemo(() => {
        const yMin = 1;
        const yMax = 7;
        const yLow = 2.8;
        const yHigh = 4.5;

        const yRange = yMax - yMin;
        const plotHeight = Math.max(0, chartHeight - chartMargin.top - chartMargin.bottom);
        const top = chartMargin.top + ((yMax - yHigh) / yRange) * plotHeight;
        const height = ((yHigh - yLow) / yRange) * plotHeight;

        return {
            top,
            height,
            left: chartMargin.left,
            right: chartMargin.right,
        };
    }, [chartHeight, chartMargin]);

    // Prepare data for the chart
    const fullSortedData = useMemo(() => {
        if (!data || data.length === 0) return [];
        return [...data].sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());
    }, [data]);

    const chartData = useMemo(() => {
        return fullSortedData.map(entry => ({
            x: new Date(entry.occurredAt),
            y: entry.bristolType,
            id: entry._id,
            occurredAt: entry.occurredAt,
            blood: entry.symptoms?.find(s => s.type === 'blood')?.present || false,
        }));
    }, [fullSortedData]);

    const zoomDomain = useMemo(() => {
        if (!chartData || chartData.length === 0) return null;
        const times = chartData.map((d) => d.x.getTime());
        const min = Math.min(...times);
        const max = Math.max(...times);
        return { min, max };
    }, [chartData]);

    const [zoomRange, setZoomRange] = useState(null);
    const [zoomPreset, setZoomPreset] = useState(null);
    // Track previous domain bounds to detect when new data extends the range
    const prevDomainRef = React.useRef(null);

    const applyZoomPreset = useCallback((preset) => {
        if (!zoomDomain) return;
        const windowMs = ZOOM_PRESETS[preset];
        if (!windowMs) return;

        const end = zoomDomain.max;
        const start = Math.max(zoomDomain.min, end - windowMs);
        setZoomRange([start, end]);
    }, [ZOOM_PRESETS, zoomDomain]);

    useEffect(() => {
        if (!zoomDomain) {
            setZoomRange(null);
            prevDomainRef.current = null;
            return;
        }
        setZoomRange((prev) => {
            const prevDomain = prevDomainRef.current;
            // First load — show the full range
            if (!prev) {
                prevDomainRef.current = { ...zoomDomain };
                return [zoomDomain.min, zoomDomain.max];
            }
            // If the domain expanded (new entry added), extend the zoom to include it
            // while keeping the user's existing start position
            const domainExpanded =
                prevDomain && (zoomDomain.max > prevDomain.max || zoomDomain.min < prevDomain.min);
            if (domainExpanded) {
                prevDomainRef.current = { ...zoomDomain };
                // Extend whichever end grew, keep the user's chosen opposite end
                const newStart = zoomDomain.min < (prevDomain?.min ?? prev[0])
                    ? zoomDomain.min
                    : prev[0];
                const newEnd = zoomDomain.max > (prevDomain?.max ?? prev[1])
                    ? zoomDomain.max
                    : prev[1];
                return [newStart, newEnd];
            }
            // Normal clamp (e.g. data was deleted)
            prevDomainRef.current = { ...zoomDomain };
            const clampedStart = Math.max(zoomDomain.min, prev[0]);
            const clampedEnd = Math.min(zoomDomain.max, prev[1]);
            if (clampedStart > clampedEnd) return [zoomDomain.min, zoomDomain.max];
            return [clampedStart, clampedEnd];
        });
    }, [zoomDomain?.min, zoomDomain?.max]);

    const zoomedChartData = useMemo(() => {
        if (!zoomRange) return chartData;
        const [start, end] = zoomRange;
        return chartData.filter((d) => {
            const t = d.x.getTime();
            return t >= start && t <= end;
        });
    }, [chartData, zoomRange]);


    const presetWindowMs = zoomPreset ? ZOOM_PRESETS[zoomPreset] : null;
    const canPanPresetWindow = useMemo(() => {
        if (!zoomDomain || !presetWindowMs) return false;
        return (zoomDomain.max - zoomDomain.min) > presetWindowMs;
    }, [zoomDomain, presetWindowMs]);

    const handlePresetRangeChange = useCallback((_, nextValue, activeThumb) => {
        if (!zoomDomain || !presetWindowMs) return;
        if (!Array.isArray(nextValue) || nextValue.length !== 2) return;

        const [rawStart, rawEnd] = nextValue;
        const desiredWindow = presetWindowMs;

        // If the user drags the whole range, MUI tends to keep the window size.
        // In that case, accept the proposed range and just clamp it.
        const withinWindowEpsilon = Math.abs((rawEnd - rawStart) - desiredWindow) <= 30 * 60 * 1000;
        if (withinWindowEpsilon) {
            let start = rawStart;
            let end = rawEnd;
            if (start < zoomDomain.min) {
                start = zoomDomain.min;
                end = start + desiredWindow;
            }
            if (end > zoomDomain.max) {
                end = zoomDomain.max;
                start = end - desiredWindow;
            }
            setZoomRange([start, end]);
            return;
        }

        // Otherwise, a thumb is being dragged — keep a fixed window size.
        if (activeThumb === 0) {
            let start = rawStart;
            let end = start + desiredWindow;
            if (end > zoomDomain.max) {
                end = zoomDomain.max;
                start = end - desiredWindow;
            }
            if (start < zoomDomain.min) {
                start = zoomDomain.min;
                end = start + desiredWindow;
            }
            setZoomRange([start, end]);
            return;
        }

        let end = rawEnd;
        let start = end - desiredWindow;
        if (start < zoomDomain.min) {
            start = zoomDomain.min;
            end = start + desiredWindow;
        }
        if (end > zoomDomain.max) {
            end = zoomDomain.max;
            start = end - desiredWindow;
        }
        setZoomRange([start, end]);
    }, [zoomDomain, presetWindowMs]);

    const handleMarkClick = (event, { dataIndex }) => {
        const entry = zoomedChartData?.[dataIndex];
        if (!entry) {
            if (debugEnabled) {
                console.log('[BMTrendChart] onMarkClick: no entry for dataIndex', {
                    dataIndex,
                    zoomedChartDataLength: zoomedChartData?.length,
                    zoomRange,
                });
            }
            return;
        }

        const clickedTimeMs = entry.x?.getTime?.();
        const originalIndex = entry.id
            ? fullSortedData.findIndex((d) => d?._id === entry.id)
            : fullSortedData.findIndex((d) => new Date(d.occurredAt).getTime() === clickedTimeMs);

        if (debugEnabled) {
            console.log('[BMTrendChart] onMarkClick', {
                eventType: event?.type,
                dataIndex,
                clickedTimeMs,
                clickedTimeIso: clickedTimeMs ? new Date(clickedTimeMs).toISOString() : null,
                bristolType: entry.y,
                zoomRange,
                fullSortedDataLength: fullSortedData.length,
                zoomedChartDataLength: zoomedChartData.length,
                originalIndex,
                originalOccurredAt: originalIndex >= 0 ? fullSortedData[originalIndex]?.occurredAt : null,
                originalId: originalIndex >= 0 ? fullSortedData[originalIndex]?._id : null,
            });
        }

        if (originalIndex === -1) {
            if (debugEnabled) {
                const sample = fullSortedData.slice(0, 5).map((d) => ({
                    id: d?._id,
                    occurredAt: d?.occurredAt,
                    timeMs: new Date(d.occurredAt).getTime(),
                }));
                console.log('[BMTrendChart] onMarkClick: could not map clicked point to fullSortedData', {
                    clickedTimeMs,
                    sample,
                });
            }
            return;
        }

        if (debugEnabled) {
            console.log('[BMTrendChart] setSelectedEntryIndex', {
                prev: selectedEntryIndex,
                next: originalIndex,
            });
        }

        setSelectedEntryIndex(originalIndex);
    };


    const selectedEntry = selectedEntryIndex !== null ? fullSortedData[selectedEntryIndex] : null;

    if (loading) {
        return (
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.secondary">Loading trends...</Typography>
            </Box>
        );
    }

    if (chartData.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 4,
                    bgcolor: '#f8fafc',
                    border: '2px dashed #e2e8f0'
                }}
            >
                <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 600 }}>
                    No movements logged for this period.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Trends will appear once you log at least two movements.
                </Typography>
            </Paper>
        );
    }

    const BRISTOL_COLORS = {
        1: '#B91C1C', 2: '#D97706', 3: '#F59E0B', 4: '#059669',
        5: '#10B981', 6: '#F59E0B', 7: '#EF4444'
    };

    return (
        <Box sx={{ width: '100%', flexGrow: 1, mt: 2, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, px: 2 }}>
                Stool Consistency Trend
            </Typography>

            <Box sx={{ position: 'relative', height: chartHeight, width: '100%', flexGrow: 1 }}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: healthyZone.top,
                        height: healthyZone.height,
                        left: healthyZone.left,
                        right: healthyZone.right,
                        bgcolor: alpha(theme.palette.success.main, 0.05),
                        zIndex: 0,
                        pointerEvents: 'none',
                        borderRadius: 1
                    }}
                />

                <LineChart
                    dataset={zoomedChartData}
                    onMarkClick={handleMarkClick}
                    xAxis={[
                        {
                            dataKey: 'x',
                            scaleType: 'utc',
                            ...(zoomRange ? { min: new Date(zoomRange[0]), max: new Date(zoomRange[1]) } : {}),
                            valueFormatter: (date, context) => (
                                context.location === 'tick'
                                    ? format(date, 'MMM d')
                                    : format(date, 'MMM d, h:mm a')
                            ),
                            label: 'Date',
                            tickNumber: 4,
                            height: xAxisHeight,
                        },
                    ]}
                    yAxis={[
                        {
                            min: 1,
                            max: 7,
                            tickInterval: [1, 2, 3, 4, 5, 6, 7],
                            label: 'Bristol Type',
                            valueFormatter: (val) => `Type ${val}`,
                        },
                    ]}
                    series={[
                        {
                            dataKey: 'y',
                            label: 'Consistency',
                            color: theme.palette.primary.main,
                            showMark: true,
                            markSize,
                            valueFormatter: (val) => `Bristol Type ${val}`,
                            curve: 'monotoneX',
                        },
                    ]}
                    height={chartHeight}
                    margin={chartMargin}
                    sx={{
                        cursor: 'pointer',
                        '& .MuiLineElement-root': { strokeWidth: 3 },
                        '& .MuiMarkElement-root': {
                            fill: theme.palette.primary.main,
                            pointerEvents: 'all',
                            cursor: 'pointer',
                            stroke: '#fff',
                            strokeWidth: 2,
                            transition: 'transform 0.15s ease',
                            '&:hover': { transform: 'scale(1.4)' }
                        },
                    }}
                />


                {/* Floating Detail Card Overlay */}
                <AnimatePresence>
                    {selectedEntry && (
                        <Box
                            data-bmtrend-detail-card="true"
                            component={motion.div}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            sx={{
                                position: 'absolute',
                                top: 20,
                                right: 20,
                                width: { xs: 'calc(100% - 40px)', sm: 400 },
                                zIndex: 10,
                                pointerEvents: 'auto'
                            }}
                        >
                            <Paper
                                elevation={10}
                                sx={{
                                    borderRadius: 5,
                                    overflow: 'hidden',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    position: 'relative'
                                }}
                            >
                                {/* Header Toggle & Navigation Controls */}
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        <ToggleButtonGroup
                                            value={mockupIndex}
                                            exclusive
                                            onChange={(_, next) => next && setMockupIndex(next)}
                                            size="small"
                                            sx={{
                                                '& .MuiToggleButton-root': {
                                                    border: 'none',
                                                    borderRadius: '20px !important',
                                                    px: 1.5,
                                                    py: 0.5,
                                                    fontWeight: 800,
                                                    fontSize: '0.65rem'
                                                }
                                            }}
                                        >
                                            <ToggleButton value="1">STICKER</ToggleButton>
                                            <ToggleButton value="2">ZEN</ToggleButton>
                                        </ToggleButtonGroup>

                                        <Divider orientation="vertical" flexItem sx={{ mx: 0.5, height: 20, my: 'auto' }} />

                                        <Stack direction="row" spacing={0.5}>
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedEntryIndex(prev => Math.max(0, prev - 1))}
                                                disabled={selectedEntryIndex === 0}
                                                sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 0.5 }}
                                            >
                                                <ChevronLeft size={16} />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => setSelectedEntryIndex(prev => Math.min(fullSortedData.length - 1, prev + 1))}
                                                disabled={selectedEntryIndex === fullSortedData.length - 1}
                                                sx={{ bgcolor: 'white', border: '1px solid #e2e8f0', p: 0.5 }}
                                            >
                                                <ChevronRight size={16} />
                                            </IconButton>
                                        </Stack>
                                    </Box>

                                    <IconButton size="small" onClick={() => setSelectedEntryIndex(null)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
                                        <X size={16} />
                                    </IconButton>
                                </Box>

                                <Box sx={{ p: 2.5, minHeight: 300 }}>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={mockupIndex}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            {mockupIndex === '1' && <ClinicalStickerMockup entry={selectedEntry} color={BRISTOL_COLORS[selectedEntry.bristolType]} />}
                                            {mockupIndex === '2' && <ZenJournalMockup entry={selectedEntry} color={BRISTOL_COLORS[selectedEntry.bristolType]} />}
                                        </motion.div>
                                    </AnimatePresence>
                                </Box>
                            </Paper>
                        </Box>
                    )}
                </AnimatePresence>
            </Box>

            {zoomDomain && zoomRange && zoomDomain.min !== zoomDomain.max && (
                <Box sx={{ px: 2, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                            Zoom: {format(new Date(zoomRange[0]), 'MMM d, yyyy')} - {format(new Date(zoomRange[1]), 'MMM d, yyyy')}
                        </Typography>

                        <ToggleButtonGroup
                            value={zoomPreset}
                            exclusive
                            onChange={(_, nextPreset) => {
                                setZoomPreset(nextPreset);
                                if (nextPreset) {
                                    applyZoomPreset(nextPreset);
                                }
                            }}
                            size="small"
                            sx={{
                                bgcolor: 'background.paper',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 2,
                                overflow: 'hidden',
                                '& .MuiToggleButton-root': {
                                    border: 'none',
                                    px: 1.5,
                                    fontWeight: 800,
                                    textTransform: 'none',
                                },
                            }}
                        >
                            <ToggleButton value="day">Day</ToggleButton>
                            <ToggleButton value="week">Week</ToggleButton>
                            <ToggleButton value="month">Month</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {zoomPreset ? (
                        <Slider
                            value={zoomRange}
                            min={zoomDomain.min}
                            max={zoomDomain.max}
                            step={60 * 60 * 1000}
                            onChange={handlePresetRangeChange}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => format(new Date(value), 'MMM d')}
                            disabled={!canPanPresetWindow}
                            disableSwap
                            sx={{
                                '& .MuiSlider-track': {
                                    cursor: 'grab',
                                },
                                '& .MuiSlider-track:active': {
                                    cursor: 'grabbing',
                                },
                                '& .MuiSlider-thumb': {
                                    width: 18,
                                    height: 18,
                                },
                            }}
                        />
                    ) : (
                        <Slider
                            value={zoomRange}
                            min={zoomDomain.min}
                            max={zoomDomain.max}
                            step={60 * 60 * 1000}
                            onChange={(_, nextValue) => {
                                if (Array.isArray(nextValue) && nextValue.length === 2) {
                                    setZoomRange(nextValue);
                                }
                            }}
                            valueLabelDisplay="auto"
                            valueLabelFormat={(value) => format(new Date(value), 'MMM d')}
                            disableSwap
                            sx={{
                                '& .MuiSlider-track': {
                                    cursor: 'grab',
                                },
                                '& .MuiSlider-track:active': {
                                    cursor: 'grabbing',
                                },
                            }}
                        />
                    )}
                </Box>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'primary.main' }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Log Entry (Click to view details)</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box sx={{ width: 12, height: 4, borderRadius: 1, bgcolor: alpha(theme.palette.success.main, 0.2) }} />
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>Ideal Range (3-4)</Typography>
                </Box>
            </Box>
        </Box>
    );
};

export default BMTrendChart;
