// client/src/components/Common/CreditsRequiredModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Box,
    IconButton,
} from '@mui/material';
import { Coins, X } from 'lucide-react';

/**
 * CreditsRequiredModal - Data-driven modal for insufficient credits
 * 
 * Shows users when they don't have enough credits for an action,
 * with a clear path to purchase more credits.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {function} props.onClose - Called when modal is closed
 * @param {string} props.featureName - Name of the feature (e.g., "Recipe Generation", "Meal Plan")
 * @param {number} props.creditsRequired - Number of credits needed for this action
 * @param {number} props.creditsAvailable - User's current credit balance
 */
const CreditsRequiredModal = ({
    open,
    onClose,
    featureName,
    creditsRequired,
    creditsAvailable,
}) => {
    const navigate = useNavigate();
    const creditsNeeded = creditsRequired - creditsAvailable;

    const handleGetCredits = () => {
        navigate('/upgrade');
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    p: 1,
                    position: 'relative',
                },
            }}
        >
            <IconButton
                aria-label="close"
                onClick={onClose}
                sx={{
                    position: 'absolute',
                    right: 8,
                    top: 8,
                    color: 'grey.500',
                }}
            >
                <X size={20} />
            </IconButton>

            <DialogTitle
                sx={{
                    textAlign: 'center',
                    pb: 1,
                    pt: 3,
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1,
                        mb: 1,
                    }}
                >
                    <Coins size={28} color="#f59e0b" />
                </Box>
                <Typography variant="h6" component="div" fontWeight="bold">
                    Credits Required
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ textAlign: 'center', pt: 1 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        {featureName} requires{' '}
                        <Typography component="span" fontWeight="bold" color="primary">
                            {creditsRequired} credit{creditsRequired !== 1 ? 's' : ''}
                        </Typography>
                        .
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                        You have{' '}
                        <Typography
                            component="span"
                            fontWeight="bold"
                            color={creditsAvailable === 0 ? 'error.main' : 'warning.main'}
                        >
                            {creditsAvailable} credit{creditsAvailable !== 1 ? 's' : ''}
                        </Typography>
                        .
                    </Typography>
                    {creditsNeeded > 0 && (
                        <Typography variant="body2" color="text.secondary">
                            Purchase {creditsNeeded} or more credits to continue.
                        </Typography>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 2 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    color="inherit"
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        minWidth: 100,
                    }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleGetCredits}
                    variant="contained"
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        minWidth: 120,
                        backgroundColor: '#013D1D',
                        '&:hover': {
                            backgroundColor: '#025a2b',
                        },
                    }}
                >
                    Get Credits
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreditsRequiredModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    featureName: PropTypes.string.isRequired,
    creditsRequired: PropTypes.number.isRequired,
    creditsAvailable: PropTypes.number.isRequired,
};

export default CreditsRequiredModal;
