import React, { useState } from 'react';
import {
    Box,
    Paper,
    Typography,
    LinearProgress,
    Chip,
    Stack,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Alert,
    CircularProgress,
    Button
} from '@mui/material';
import {
    CheckCircle,
    AutoAwesome,
    Restaurant,
    Refresh,
    Info,
    Healing
} from '@mui/icons-material';
import { useUser } from '../../../context/UserContext';
import { CreditStatusCard } from '../../CreditBalanceBadge.jsx';

/**
 * UsageView Component
 * Displays remaining meal planner API uses and explains which features consume limits
 * Uses UserContext to access user data (no separate API call needed)
 */
const UsageView = () => {
    const { user, loading } = useUser();
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    if (!user) {
        return (
            <Alert severity="info" sx={{ mb: 3 }}>
                Please log in to view your usage information.
            </Alert>
        );
    }

    return (
        <Box>
            {/* Credit Status Card */}
            <Box sx={{ mb: 3 }}>
                <CreditStatusCard />
            </Box>

            {/* What Uses Your Limits */}
            <Paper elevation={1} sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                    What Uses Credits?
                </Typography>

                <List>
                    <ListItem>
                        <ListItemIcon>
                            <Healing color="primary" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Creating a New Meal Plan"
                            secondary="Generating a complete meal plan template uses 5 credits"
                        />
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <Restaurant color="primary" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Generate Full Recipe"
                            secondary="Converting a meal idea into a complete recipe with ingredients and instructions uses 1 credit"
                        />
                    </ListItem>
                </List>
            </Paper>

            {/* What's Free */}
            <Paper elevation={1} sx={{ p: 3, mb: 3, bgcolor: 'success.50' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2, color: 'success.dark' }}>
                    What's Free (No Limits)
                </Typography>

                <List dense>
                    <ListItem>
                        <ListItemIcon>
                            <Info color="success" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Using Suprise Me to randomly select a recipe."
                        />
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <Info color="success" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Viewing and browsing your meal plans"
                        />
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <Info color="success" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Assigning plans to dates on your calendar"
                        />
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <Info color="success" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Duplicating existing meal plans"
                        />
                    </ListItem>

                    <ListItem>
                        <ListItemIcon>
                            <Info color="success" />
                        </ListItemIcon>
                        <ListItemText
                            primary="Manually replacing meals with your saved recipes"
                        />
                    </ListItem>
                </List>
            </Paper>

        </Box>
    );
};

export default UsageView;
