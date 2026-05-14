import React from 'react';
import {
  Modal,
  Box,
  Typography,
  Button,
  IconButton,
  FormControlLabel,
  Checkbox,
  Paper,
  Divider,
} from '@mui/material';
import { Close, CalendarMonth } from '@mui/icons-material';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

/**
 * Assign Plan to Date Modal
 * Allows user to select a date and assign a meal plan template
 */
const AssignPlanModal = ({
  open,
  onClose,
  plan,
  selectedDate,
  onDateChange,
  makeActive,
  onMakeActiveChange,
  onConfirm,
}) => {
  if (!plan) return null;

  // Calculate end date based on duration
  const endDate = selectedDate.add(plan.duration - 1, 'day');

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
          borderRadius: 2,
          p: 4,
        }}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
            Assign to Date
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>

        {/* Plan Info */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {plan.planName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Duration: {plan.duration} {plan.duration === 1 ? 'day' : 'days'}
          </Typography>
        </Paper>

        {/* Date Picker */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
            Select Start Date
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <DateCalendar
              value={selectedDate}
              onChange={onDateChange}
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

        {/* Date Range Preview */}
        <Paper elevation={0} sx={{ p: 2, bgcolor: 'primary.light', color: 'primary.contrastText', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <CalendarMonth />
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              Assignment Preview
            </Typography>
          </Box>
          <Typography variant="body2">
            {selectedDate.format('MMM DD, YYYY')} - {endDate.format('MMM DD, YYYY')}
          </Typography>
          <Typography variant="caption">
            ({plan.duration} {plan.duration === 1 ? 'day' : 'days'})
          </Typography>
        </Paper>

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
              <Typography variant="body2">Make this assignment active</Typography>
              <Typography variant="caption" color="text.secondary">
                This will deactivate any overlapping assignments
              </Typography>
            </Box>
          }
          sx={{ mb: 3 }}
        />

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
            onClick={onConfirm}
            sx={{ textTransform: 'none' }}
          >
            Assign Plan
          </Button>
        </Box>
      </Box>
    </Modal>
  );
};

export default AssignPlanModal;
