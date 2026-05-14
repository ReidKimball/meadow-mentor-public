import { Outlet, useLocation } from 'react-router';
import { Box, CssBaseline } from '@mui/material';
import BottomNavigation from './BottomNavigation';
import { AppHeader } from './Header';

export default function AppLayout() {
    const location = useLocation();
    const isGettingStarted = location.pathname === '/quick_start_guide';

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh',
            backgroundColor: '#FFE9CB' // Add this line
        }}>

            <CssBaseline />

            <AppHeader />

            <Box component="main" sx={{
                display: 'flex',
                flexGrow: 1,
                py: { xs: 2, sm: 2 },
                px: { xs: 0, sm: 2 },
                pb: isGettingStarted ? { xs: 2, sm: 2 } : { xs: 7, sm: 7 } // Remove extra padding if nav is hidden
            }}>
                <Outlet />
            </Box>

            {!isGettingStarted && <BottomNavigation />}
        </Box>
    );
}
