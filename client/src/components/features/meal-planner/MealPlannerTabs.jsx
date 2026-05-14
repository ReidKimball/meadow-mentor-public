import React from 'react';
import { Tabs, Tab, Box } from '@mui/material';
import { CalendarMonth, MenuBook, ShowChart } from '@mui/icons-material';

/**
 * Tab navigation component for Meal Planner
 * Provides switching between Library, Calendar, and Usage views
 */
const MealPlannerTabs = ({ activeTab, onTabChange }) => {
  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
      <Tabs 
        value={activeTab} 
        onChange={onTabChange}
        aria-label="meal planner tabs"
        sx={{
          '& .MuiTab-root': {
            minHeight: 64,
            fontSize: '1rem',
            fontWeight: 500,
          },
        }}
      >
        <Tab 
          icon={<MenuBook />} 
          iconPosition="start"
          label="Meal Plans" 
          value="library"
          sx={{ textTransform: 'none' }}
        />
        <Tab 
          icon={<CalendarMonth />} 
          iconPosition="start"
          label="Calendar" 
          value="calendar"
          sx={{ textTransform: 'none' }}
        />
        <Tab 
          icon={<ShowChart />} 
          iconPosition="start"
          label="Usage" 
          value="usage"
          sx={{ textTransform: 'none' }}
        />
      </Tabs>
    </Box>
  );
};

export default MealPlannerTabs;
