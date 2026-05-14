import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    FormControlLabel,
    Switch,
    TextField,
    Slider,
    Collapse,
    IconButton,
    Tooltip,
} from '@mui/material';
import {
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Clock,
    Tag as TagIcon,
    MessageSquare,
    Thermometer,
} from 'lucide-react';
import { LoadingButton } from '@mui/lab';

/**
 * Bristol Stool Chart Data
 */
const BRISTOL_TYPES = [
    { type: 1, label: 'Type 1', desc: 'Separate hard lumps', color: '#B91C1C' },
    { type: 2, label: 'Type 2', desc: 'Lumpy, sausage-shaped', color: '#D97706' },
    { type: 3, label: 'Type 3', desc: 'Sausage with cracks', color: '#F59E0B' },
    { type: 4, label: 'Type 4', desc: 'Smooth, soft sausage', color: '#059669' },
    { type: 5, label: 'Type 5', desc: 'Soft blobs with edges', color: '#10B981' },
    { type: 6, label: 'Type 6', desc: 'Fluffy, mushy pieces', color: '#F59E0B' },
    { type: 7, label: 'Type 7', desc: 'Watery, no solids', color: '#EF4444' },
];

/**
 * Bristol Stool Chart Icons
 * Cute, non-detailed representations of stool types.
 */
export const BristolIcon = ({ type, color }) => {
    const size = 32;
    switch (type) {
        case 1: // Separate hard lumps
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                    <circle cx="6" cy="16" r="2.5" />
                    <circle cx="12" cy="14" r="2" />
                    <circle cx="18" cy="15" r="2.5" />
                    <circle cx="9" cy="8" r="2" />
                    <circle cx="16" cy="7" r="2.5" />
                </svg>
            );
        case 2: // Lumpy sausage
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                    <path d="M4 12c0-2 2-3 4-3s3 1 5 1 3-1 5-1 4 2 4 4-2 3-4 3-3-1-5-1-3 1-5 1-4-2-4-4z" opacity="0.4" />
                    <circle cx="7" cy="12" r="3" />
                    <circle cx="12" cy="13" r="3.5" />
                    <circle cx="17" cy="12" r="3" />
                </svg>
            );
        case 3: // Sausage with cracks
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12c0-3 2-4 8-4s8 1 8 4-2 4-8 4-8-1-8-4z" fill={color} fillOpacity="0.3" stroke="none" />
                    <path d="M4 12c0-3 2-4 8-4s8 1 8 4-2 4-8 4-8-1-8-4z" />
                    <path d="M9 8.5v2" />
                    <path d="M12 7.5v3" />
                    <path d="M15 8.5v2" />
                </svg>
            );
        case 4: // Smooth sausage (The Gold Standard)
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                    <rect x="4" y="9" width="16" height="6" rx="3" />
                    <circle cx="17" cy="10.5" r="1" fill="white" opacity="0.5" />
                    <rect x="7" y="11" width="4" height="0.5" rx="0.25" fill="white" opacity="0.3" />
                </svg>
            );
        case 5: // Soft blobs
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                    <circle cx="7" cy="13" r="3.5" />
                    <circle cx="13" cy="10" r="3" />
                    <circle cx="18" cy="15" r="3.5" />
                </svg>
            );
        case 6: // Mushy pieces
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                    <path d="M4 14c0-2 1-3 3-3s2 1 4 1 2-2 4-2 3 1 3 3-2 3-7 3-7-1-7-2z" opacity="0.6" />
                    <circle cx="9" cy="12" r="3.5" />
                    <circle cx="15" cy="13" r="3" opacity="0.8" />
                </svg>
            );
        case 7: // Watery
            return (
                <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
                    <path d="M2 17c0-2 2-3 4-3s3 1 5 1 3-1 5-1 6 1 6 3-2 3-8 3-12-1-12-3z" />
                    <circle cx="8" cy="11" r="1.5" opacity="0.6" />
                    <circle cx="15" cy="10" r="1" opacity="0.6" />
                    <circle cx="19" cy="14" r="1.5" opacity="0.6" />
                </svg>
            );
        default:
            return null;
    }
};

/**
 * @component BMQuickLog
 * @description A high-end, mobile-first component for logging bowel movements.
 * Prioritizes speed and visual clarity.
 */
const BMQuickLog = ({ onSave, isLoading }) => {
    const [bristolType, setBristolType] = useState(null);
    const [hasBlood, setHasBlood] = useState(false);
    const [hasMucus, setHasMucus] = useState(false);
    const [urgency, setUrgency] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState('');

    const handleSave = () => {
        if (bristolType === null) return;

        const data = {
            occurredAt: new Date().toISOString(),
            bristolType,
            symptoms: [
                { type: 'blood', present: hasBlood },
                { type: 'mucus', present: hasMucus },
                { type: 'urgency', level: urgency },
            ],
            notes: notes.trim(),
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
        };

        onSave(data);
    };

    return (
        <Box sx={{ maxWidth: 500, mx: 'auto', p: 2 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, color: 'primary.main', mb: 3 }}>
                How was your movement?
            </Typography>

            {/* Bristol Chart Selection */}
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <LoadingButton loading={false} size="small" sx={{ p: 0, minWidth: 0, mr: 1 }}>
                    <Clock size={16} />
                </LoadingButton>
                Select Type (Bristol Chart)
            </Typography>

            <Grid container spacing={1.5} sx={{ mb: 4 }}>
                {BRISTOL_TYPES.map((bt) => (
                    <Grid xs={4} sm={3} key={bt.type}>
                        <Tooltip title={bt.desc} arrow placement="top">
                            <Paper
                                elevation={bristolType === bt.type ? 4 : 1}
                                onClick={() => setBristolType(bt.type)}
                                sx={{
                                    p: 1.5,
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    borderRadius: 3,
                                    border: '2px solid',
                                    borderColor: bristolType === bt.type ? bt.color : 'transparent',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translateY(-4px)',
                                        boxShadow: 3,
                                    },
                                    bgcolor: bristolType === bt.type ? `${bt.color}10` : 'background.paper',
                                }}
                            >
                                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                                    <BristolIcon type={bt.type} color={bt.color} />
                                </Box>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: bt.color,
                                        fontWeight: 800,
                                        mb: 0.2,
                                        lineHeight: 1
                                    }}
                                >
                                    {bt.type}
                                </Typography>
                                <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', lineHeight: 1.1, fontSize: '0.65rem' }}>
                                    {bt.label}
                                </Typography>
                            </Paper>
                        </Tooltip>
                    </Grid>
                ))}
            </Grid>

            {/* Primary Toggles */}
            <Paper elevation={0} sx={{ p: 2, borderRadius: 4, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 3 }}>
                <Grid container spacing={2}>
                    <Grid xs={6}>
                        <FormControlLabel
                            control={<Switch checked={hasBlood} onChange={(e) => setHasBlood(e.target.checked)} color="error" />}
                            label={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>Blood</Typography>
                                    {hasBlood && <AlertCircle size={14} color="#ef4444" style={{ marginLeft: 4 }} />}
                                </Box>
                            }
                        />
                    </Grid>
                    <Grid xs={6}>
                        <FormControlLabel
                            control={<Switch checked={hasMucus} onChange={(e) => setHasMucus(e.target.checked)} color="warning" />}
                            label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Mucus</Typography>}
                        />
                    </Grid>
                    <Grid xs={12}>
                        <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
                                Urgency
                                <Tooltip title="0 = None, 3 = Severe">
                                    <IconButton size="small">
                                        <LoadingButton loading={false} size="small" sx={{ p: 0, minWidth: 0 }}>
                                            <AlertCircle size={14} />
                                        </LoadingButton>
                                    </IconButton>
                                </Tooltip>
                            </Typography>
                            <Slider
                                value={urgency}
                                onChange={(_, val) => setUrgency(val)}
                                step={1}
                                marks
                                min={0}
                                max={3}
                                valueLabelDisplay="auto"
                                sx={{
                                    color: urgency > 1 ? 'error.main' : 'primary.main',
                                    '& .MuiSlider-mark': { backgroundColor: 'currentColor' },
                                }}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Advanced Toggle */}
            <Button
                fullWidth
                onClick={() => setShowAdvanced(!showAdvanced)}
                endIcon={showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}
            >
                {showAdvanced ? 'Fewer Details' : 'More Details (Notes, Tags)'}
            </Button>

            <Collapse in={showAdvanced}>
                <Box sx={{ mb: 3 }}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Any specific notes? (e.g., pain, specific foods)"
                        variant="outlined"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        InputProps={{
                            startAdornment: <MessageSquare size={18} style={{ marginRight: 12, color: '#94a3b8', marginTop: -40 }} />,
                        }}
                        sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                    <TextField
                        fullWidth
                        placeholder="Tags (comma separated: travel, fiber, stress)"
                        variant="outlined"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        InputProps={{
                            startAdornment: <TagIcon size={18} style={{ marginRight: 12, color: '#94a3b8' }} />,
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                    />
                </Box>
            </Collapse>

            {/* Action Button */}
            <LoadingButton
                fullWidth
                variant="contained"
                size="large"
                disabled={bristolType === null}
                loading={isLoading}
                onClick={handleSave}
                sx={{
                    py: 2,
                    borderRadius: 4,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: '0 10px 15px -3px rgba(1, 61, 29, 0.3)',
                    '&:hover': {
                        transform: 'scale(1.02)',
                        transition: 'transform 0.2s',
                    },
                }}
            >
                Log Movement
            </LoadingButton>
        </Box>
    );
};

export default BMQuickLog;
