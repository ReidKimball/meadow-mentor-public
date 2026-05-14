/**
 * @file Defines the BMLoggingDashboard component.
 * @description Provides a bowel-movement logging form (create/update) alongside recent history and a trends chart.
 * The form always defaults to the current date/time ("now") when opened for a new entry.
 * @requires module:react - Core React library and hooks.
 * @requires module:@mui/material - Material UI components used for layout and inputs.
 * @requires module:@mui/x-date-pickers - Date and time pickers.
 * @requires module:dayjs - Date/time manipulation.
 * @author Cascade
 * @version 1.1.0
 * @date 2026-02-11
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    TextField,
    Slider,
    Collapse,
    Divider,
    Container,
    Tooltip,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Snackbar,
    Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { LoadingButton } from '@mui/lab';
import { DatePicker, TimePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import {
    listBowelMovements,
    createBowelMovement,
    updateBowelMovement,
    deleteBowelMovement
} from '../../../services/bowelMovementService';
import { useUser } from '../../../context/UserContext';
import BMTrendChart from './BMTrendChart';
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

const BRISTOL_TYPES = [
    { type: 1, desc: 'Separate hard lumps', color: '#B91C1C' },
    { type: 2, desc: 'Lumpy, sausage-shaped', color: '#D97706' },
    { type: 3, desc: 'Sausage with cracks', color: '#F59E0B' },
    { type: 4, desc: 'Smooth, soft sausage', color: '#059669' },
    { type: 5, desc: 'Soft blobs with edges', color: '#10B981' },
    { type: 6, desc: 'Fluffy, mushy pieces', color: '#F59E0B' },
    { type: 7, desc: 'Watery, no solids', color: '#EF4444' },
];

/**
 * Bristol Stool Chart Icons
 * Cute, non-detailed representations of stool types.
 */
const BristolIcon = ({ type, color }) => {
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

// NOTE: localStorage date persistence was removed in v1.1.0.
// The form now always defaults to the current date/time ("now") when adding a new entry.

/**
 * @component BMLoggingDashboard
 * @description Dashboard for logging bowel movements and reviewing trends/history.
 * The form always defaults to the current date/time when opened for a new entry.
 * @returns {JSX.Element} The rendered BMLoggingDashboard page.
 */
export default function BMLoggingDashboard() {
    const { user, getFreshIdToken } = useUser();
    const userUid = user?.firebaseUID || user?.uid;
    const [bmHistory, setBmHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [recentSortOrder, setRecentSortOrder] = useState('desc');

    // Form State
    const [occurredAt, setOccurredAt] = useState(dayjs());
    const [bristolType, setBristolType] = useState(null);
    const [hasBlood, setHasBlood] = useState(false);
    const [hasMucus, setHasMucus] = useState(false);
    const [urgency, setUrgency] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [notes, setNotes] = useState('');
    const [tags, setTags] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Deletion State
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [idToDelete, setIdToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Snackbar State
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    const fetchBMHistory = useCallback(async () => {
        if (!user || !getFreshIdToken) return;
        setIsLoadingHistory(true);
        try {
            const response = await listBowelMovements({}, getFreshIdToken);
            const history = response.data || [];
            setBmHistory(history);
        } catch (error) {
            console.error('Error fetching BM history:', error);
        } finally {
            setIsLoadingHistory(false);
        }
    }, [user, getFreshIdToken]);

    useEffect(() => {
        fetchBMHistory();
    }, [fetchBMHistory]);

    const handleSave = async () => {
        if (bristolType === null || !getFreshIdToken) return;
        setIsSaving(true);

        try {
            const payload = {
                occurredAt: occurredAt.toISOString(),
                bristolType,
                symptoms: [
                    { type: 'blood', present: hasBlood },
                    { type: 'mucus', present: hasMucus },
                    { type: 'urgency', level: urgency },
                ],
                notes: notes.trim(),
                tags: tags.split(',').map(t => t.trim()).filter(t => t),
            };

            if (editingId) {
                await updateBowelMovement(editingId, payload, getFreshIdToken);
                MySwal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'Entry updated successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            } else {
                const idempotencyKey = crypto.randomUUID();
                await createBowelMovement(payload, getFreshIdToken, idempotencyKey);
                MySwal.fire({
                    icon: 'success',
                    title: 'Logged!',
                    text: 'Bowel movement recorded successfully.',
                    timer: 2000,
                    showConfirmButton: false,
                });
            }

            resetForm();
            fetchBMHistory();
            setIsModalOpen(false);
        } catch (error) {
            MySwal.fire('Error', error?.message || 'Failed to save entry', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (entry) => {
        setEditingId(entry._id);
        setOccurredAt(dayjs(entry.occurredAt));
        setBristolType(entry.bristolType);
        setHasBlood(entry.symptoms?.find(s => s.type === 'blood')?.present || false);
        setHasMucus(entry.symptoms?.find(s => s.type === 'mucus')?.present || false);
        setUrgency(entry.symptoms?.find(s => s.type === 'urgency')?.level || 0);
        setNotes(entry.notes || '');
        setTags(entry.tags?.join(', ') || '');
        if (entry.notes || entry.tags?.length > 0) {
            setShowAdvanced(true);
        }
        setIsModalOpen(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setBristolType(null);
        setHasBlood(false);
        setHasMucus(false);
        setUrgency(0);
        // Always default to current date/time for new entries
        setOccurredAt(dayjs());
        setNotes('');
        setTags('');
    };

    const handleDeleteClick = (id) => {
        setIdToDelete(id);
        setDeleteConfirmOpen(true);
    };

    const confirmDelete = async () => {
        if (!idToDelete || !getFreshIdToken) return;
        setIsDeleting(true);
        try {
            await deleteBowelMovement(idToDelete, getFreshIdToken);
            setSnackbar({
                open: true,
                message: 'Entry deleted successfully',
                severity: 'success'
            });
            fetchBMHistory();
        } catch (error) {
            console.error('Error deleting entry:', error);
            setSnackbar({
                open: true,
                message: error?.message || 'Failed to delete entry',
                severity: 'error'
            });
        } finally {
            setIsDeleting(false);
            setDeleteConfirmOpen(false);
            setIdToDelete(null);
        }
    };

    const handleCloseSnackbar = (event, reason) => {
        if (reason === 'clickaway') return;
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    return (
        <Container maxWidth={false} sx={{ py: { xs: 1, sm: 3 }, mb: 10 }}>
            {/* Logging Dialog */}
            <Dialog
                open={isModalOpen}
                onClose={() => !isSaving && setIsModalOpen(false)}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 4, p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800, color: 'primary.main', pb: 1 }}>
                    {editingId ? 'Edit Movement' : 'Log New Movement'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1 }}>
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <DatePicker
                                    label="Date"
                                    value={occurredAt}
                                    onChange={(val) => {
                                        if (val) {
                                            const newDate = occurredAt.year(val.year()).month(val.month()).date(val.date());
                                            setOccurredAt(newDate);
                                        }
                                    }}
                                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <TimePicker
                                    label="Time"
                                    value={occurredAt}
                                    onChange={(val) => {
                                        if (val) {
                                            const newTime = occurredAt.hour(val.hour()).minute(val.minute()).second(val.second());
                                            setOccurredAt(newTime);
                                        }
                                    }}
                                    slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                                />
                            </Grid>
                        </Grid>

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1.5, display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ fontSize: 16, mr: 1 }} />
                            Bristol Consistency
                        </Typography>

                        <Grid container spacing={1} sx={{ mb: 4 }}>
                            {BRISTOL_TYPES.map((bt) => (
                                <Grid size={4} key={bt.type}>
                                    <Tooltip title={bt.desc} arrow placement="top">
                                        <Paper
                                            elevation={0}
                                            onClick={() => setBristolType(bt.type)}
                                            sx={{
                                                p: 1.5,
                                                textAlign: 'center',
                                                cursor: 'pointer',
                                                borderRadius: 3,
                                                border: '2px solid',
                                                borderColor: bristolType === bt.type ? bt.color : '#e2e8f0',
                                                transition: 'all 0.2s ease',
                                                bgcolor: bristolType === bt.type ? `${bt.color}10` : 'background.paper',
                                                '&:hover': {
                                                    borderColor: bt.color,
                                                    bgcolor: `${bt.color}05`,
                                                    transform: 'translateY(-2px)',
                                                }
                                            }}
                                        >
                                            <Box sx={{ mb: 1, display: 'flex', justifyContent: 'center' }}>
                                                <BristolIcon type={bt.type} color={bt.color} />
                                            </Box>
                                            <Typography variant="h5" sx={{ color: bt.color, fontWeight: 900, lineHeight: 1 }}>{bt.type}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 600, display: 'block', fontSize: '0.65rem' }}>Type {bt.type}</Typography>
                                        </Paper>
                                    </Tooltip>
                                </Grid>
                            ))}
                        </Grid>

                        <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 1.5 }}>
                            Symptoms & Urgency
                        </Typography>

                        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                            <Button
                                variant={hasBlood ? "contained" : "outlined"}
                                color="error"
                                fullWidth
                                onClick={() => setHasBlood(!hasBlood)}
                                sx={{ borderRadius: 2, textTransform: 'none', py: 1 }}
                            >
                                Blood
                            </Button>
                            <Button
                                variant={hasMucus ? "contained" : "outlined"}
                                color="warning"
                                fullWidth
                                onClick={() => setHasMucus(!hasMucus)}
                                sx={{ borderRadius: 2, textTransform: 'none', py: 1 }}
                            >
                                Mucus
                            </Button>
                        </Box>

                        <Box sx={{ mb: 3, px: 1 }}>
                            <Slider
                                value={urgency}
                                onChange={(_, val) => setUrgency(val)}
                                step={1}
                                marks={[
                                    { value: 0, label: 'None' },
                                    { value: 1, label: 'Mild' },
                                    { value: 2, label: 'Mod' },
                                    { value: 3, label: 'Urgent' }
                                ]}
                                min={0}
                                max={3}
                                sx={{ color: urgency > 1 ? 'error.main' : 'primary.main' }}
                            />
                        </Box>

                        <Button
                            fullWidth
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            endIcon={showAdvanced ? <KeyboardArrowUpIcon sx={{ fontSize: 18 }} /> : <KeyboardArrowDownIcon sx={{ fontSize: 18 }} />}
                            sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, textTransform: 'none' }}
                        >
                            Notes & Tags
                        </Button>

                        <Collapse in={showAdvanced}>
                            <Box sx={{ mb: 2 }}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={2}
                                    placeholder="Notes..."
                                    variant="outlined"
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                                <TextField
                                    fullWidth
                                    placeholder="Tags (travel, fiber...)"
                                    variant="outlined"
                                    value={tags}
                                    onChange={(e) => setTags(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
                                />
                            </Box>
                        </Collapse>
                    </Box>
                </DialogContent>
                <DialogActions sx={{ p: 3, pt: 1 }}>
                    <Button
                        onClick={() => setIsModalOpen(false)}
                        disabled={isSaving}
                        sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        variant="contained"
                        loading={isSaving}
                        disabled={bristolType === null}
                        onClick={handleSave}
                        sx={{
                            px: 4,
                            borderRadius: 3,
                            fontWeight: 700,
                            boxShadow: '0 4px 12px rgba(1, 61, 29, 0.2)'
                        }}
                    >
                        {editingId ? 'Update Log' : 'Save Movement'}
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            {/* Deletion Confirmation Dialog */}
            <Dialog
                open={deleteConfirmOpen}
                onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
                PaperProps={{
                    sx: { borderRadius: 3, p: 1 }
                }}
            >
                <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete this record? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button
                        onClick={() => setDeleteConfirmOpen(false)}
                        disabled={isDeleting}
                        sx={{ fontWeight: 600, color: 'text.secondary' }}
                    >
                        Cancel
                    </Button>
                    <LoadingButton
                        onClick={confirmDelete}
                        loading={isDeleting}
                        variant="contained"
                        color="error"
                        sx={{ borderRadius: 2, fontWeight: 700 }}
                    >
                        Delete
                    </LoadingButton>
                </DialogActions>
            </Dialog>

            {/* Feedback Snackbar */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={4000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={snackbar.severity}
                    variant="filled"
                    sx={{ borderRadius: 2, fontWeight: 600 }}
                >
                    {snackbar.message}
                </Alert>
            </Snackbar>

            <Grid container spacing={3}>
                {/* Visualization Column (Full Width) */}
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={2} sx={{ p: 3, borderRadius: 4, display: 'flex', flexDirection: 'column', minHeight: '800px' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                            <ShowChartIcon sx={{ fontSize: 28, color: '#047857' }} />
                            <Typography variant="h5" sx={{ fontWeight: 700 }}>Health Trends</Typography>
                        </Box>

                        <BMTrendChart data={bmHistory} loading={isLoadingHistory} />

                        <Divider sx={{ my: 4 }} />

                        <Box sx={{ mb: 4, textAlign: 'center' }}>
                            <Button
                                variant="contained"
                                size="large"
                                startIcon={<AddIcon sx={{ fontSize: 20 }} />}
                                onClick={() => {
                                    resetForm();
                                    setIsModalOpen(true);
                                }}
                                sx={{
                                    py: 1.5,
                                    px: 6,
                                    borderRadius: 4,
                                    fontSize: '1.1rem',
                                    fontWeight: 800,
                                    textTransform: 'none',
                                    boxShadow: '0 8px 16px rgba(1, 61, 29, 0.2)',
                                    backgroundImage: 'linear-gradient(135deg, #013D1D 0%, #10B981 100%)',
                                    '&:hover': {
                                        boxShadow: '0 12px 20px rgba(1, 61, 29, 0.3)',
                                        transform: 'translateY(-2px)'
                                    }
                                }}
                            >
                                Add New Entry
                            </Button>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Recent Entries</Typography>
                            <Button
                                size="small"
                                variant="outlined"
                                color="inherit"
                                onClick={() => setRecentSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                            >
                                {recentSortOrder === 'desc' ? 'Newest' : 'Oldest'}
                            </Button>
                        </Box>
                        <Box sx={{ maxHeight: 400, overflowY: 'auto', pr: 1 }}>
                            {bmHistory.length === 0 ? (
                                <Typography variant="body2" color="text.secondary">No entries found yet.</Typography>
                            ) : (
                                [...bmHistory]
                                    .sort((a, b) => {
                                        const aTime = dayjs(a.occurredAt).valueOf();
                                        const bTime = dayjs(b.occurredAt).valueOf();
                                        return recentSortOrder === 'desc' ? bTime - aTime : aTime - bTime;
                                    })
                                    .map((entry) => (
                                        <Paper
                                            key={entry._id}
                                            variant="outlined"
                                            sx={{ p: 1.5, mb: 1, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                                        >
                                            <Box>
                                                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                                                    {dayjs(entry.occurredAt).format('MMM D, h:mm A')}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    Type {entry.bristolType} • {entry.symptoms?.find(s => s.type === 'blood')?.present ? 'Blood Present' : 'No Blood'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Tooltip title="Edit Entry">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleEditClick(entry)}
                                                        sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main', bgcolor: 'primary.lighter' } }}
                                                    >
                                                        <EditIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>

                                                {/* Bristol Type Indicator in between buttons for spacing */}
                                                <Box sx={{
                                                    width: 32,
                                                    height: 32,
                                                    borderRadius: '50%',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    bgcolor: (BRISTOL_TYPES.find(b => b.type === entry.bristolType)?.color || '#000') + '20',
                                                    color: BRISTOL_TYPES.find(b => b.type === entry.bristolType)?.color || '#000',
                                                    fontWeight: 800,
                                                    mx: 1
                                                }}>
                                                    {entry.bristolType}
                                                </Box>

                                                <Tooltip title="Delete Entry">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDeleteClick(entry._id)}
                                                        sx={{ color: 'text.secondary', '&:hover': { color: 'error.main', bgcolor: 'error.lighter' } }}
                                                    >
                                                        <DeleteIcon sx={{ fontSize: 16 }} />
                                                    </IconButton>
                                                </Tooltip>
                                            </Box>
                                        </Paper>
                                    ))
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
}
