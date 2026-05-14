import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  Divider,
} from '@mui/material';
import { Close, ContentCopy } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

/**
 * Duplicate Plan Modal Component
 * Allows user to duplicate a meal plan template and optionally assign it to a date
 */
const DuplicatePlanModal = ({
  open,
  onClose,
  plan,
  startDate,
  onStartDateChange,
  makeActive,
  onMakeActiveChange,
  onConfirm,
}) => {
  if (!plan) return null;

  return (
    <Modal open={open} onClose={onClose}>
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: { xs: '95%', sm: 500 },
          maxHeight: '90vh',
          overflow: 'auto',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Duplicate Meal Plan
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Plan Info */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {plan.planName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            This will create a copy of this meal plan template.
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* Make Active Checkbox */}
        <FormControlLabel
          control={
            <Checkbox
              checked={makeActive}
              onChange={(e) => onMakeActiveChange(e.target.checked)}
            />
          }
          label={
            <Box>
              <Typography variant="body2">Assign and make active</Typography>
              <Typography variant="caption" color="text.secondary">
                The duplicated plan will be assigned to the selected date
              </Typography>
            </Box>
          }
          sx={{ mb: 3 }}
        />

        {/* Date Selection - Only show if makeActive is checked */}
        {makeActive && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
              Assign to Date
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Select the start date for the duplicated plan
            </Typography>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DateCalendar
                value={startDate}
                onChange={onStartDateChange}
                sx={{
                  width: '100%',
                  '& .MuiPickersCalendarHeader-root': {
                    paddingLeft: 1,
                    paddingRight: 1,
                  },
                }}
              />
            </LocalizationProvider>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={onClose}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={<ContentCopy />}
            onClick={onConfirm}
            sx={{ textTransform: 'none' }}
          >
            Duplicate Plan
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default DuplicatePlanModal;
