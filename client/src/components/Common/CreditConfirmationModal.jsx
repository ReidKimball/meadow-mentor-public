// client/src/components/Common/CreditConfirmationModal.jsx
import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Typography,
    Box,
    Checkbox,
    FormControlLabel,
} from '@mui/material';
import { Coins } from 'lucide-react';

/**
 * CreditConfirmationModal - A compact modal for confirming credit spending
 * 
 * Shows users the cost and remaining balance before proceeding with
 * credit-consuming actions. Designed to be non-intrusive but clear.
 * 
 * @param {Object} props
 * @param {boolean} props.open - Whether the modal is open
 * @param {function} props.onConfirm - Called when user clicks "Yes"
 * @param {function} props.onCancel - Called when user clicks "No" or closes modal
 * @param {string} props.featureName - Name of the feature (e.g., "Recipe Generation")
 * @param {number} props.cost - Number of credits this action costs
 * @param {number} props.currentBalance - User's current credit balance
 * @param {number} props.balanceAfter - Balance after deduction
 */
const CreditConfirmationModal = ({
    open,
    onConfirm,
    onCancel,
    featureName,
    cost,
    currentBalance,
    balanceAfter,
    showConfirmationsInFuture,
    onShowConfirmationsInFutureChange,
}) => {
    const checkedValue = typeof showConfirmationsInFuture === 'boolean' ? showConfirmationsInFuture : true;

    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    p: 1,
                },
            }}
        >
            <DialogTitle
                sx={{
                    textAlign: 'center',
                    pb: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 1,
                }}
            >
                <Coins size={24} color="#f59e0b" />
                <Typography variant="h6" component="span">
                    Confirm Credit Usage
                </Typography>
            </DialogTitle>

            <DialogContent sx={{ textAlign: 'center', pt: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body1" sx={{ mb: 1 }}>
                        This {featureName.toLowerCase()} will cost{' '}
                        <Typography
                            component="span"
                            fontWeight="bold"
                            color="primary"
                        >
                            {cost} credit{cost !== 1 ? 's' : ''}
                        </Typography>
                        .
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        You will have{' '}
                        <Typography
                            component="span"
                            fontWeight="bold"
                            color={balanceAfter <= 3 ? 'warning.main' : 'text.primary'}
                        >
                            {balanceAfter} credit{balanceAfter !== 1 ? 's' : ''}
                        </Typography>
                        {' '}remaining.
                    </Typography>
                </Box>

                <FormControlLabel
                    control={(
                        <Checkbox
                            checked={checkedValue}
                            onChange={(e) => onShowConfirmationsInFutureChange?.(e.target.checked)}
                        />
                    )}
                    label="Show credit spend confirmations in the future."
                    sx={{ justifyContent: 'center', '& .MuiFormControlLabel-label': { fontSize: '0.9rem' } }}
                />
            </DialogContent>

            <DialogActions sx={{ justifyContent: 'center', pb: 2, gap: 2 }}>
                <Button
                    onClick={onCancel}
                    variant="outlined"
                    color="inherit"
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        minWidth: 80,
                    }}
                >
                    No
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        minWidth: 80,
                        backgroundColor: '#013D1D',
                        '&:hover': {
                            backgroundColor: '#025a2b',
                        },
                    }}
                >
                    Yes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

CreditConfirmationModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    featureName: PropTypes.string.isRequired,
    cost: PropTypes.number.isRequired,
    currentBalance: PropTypes.number.isRequired,
    balanceAfter: PropTypes.number.isRequired,
    showConfirmationsInFuture: PropTypes.bool,
    onShowConfirmationsInFutureChange: PropTypes.func,
};

export default CreditConfirmationModal;
