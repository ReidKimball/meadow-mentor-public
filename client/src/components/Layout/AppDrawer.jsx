import {
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Divider,
    Box,
    Typography,
    Chip,
    Button,
    Paper,
    Popper,
    IconButton, // Add IconButton import
    Toolbar, // Add Toolbar import
} from '@mui/material';
import Zoom from '@mui/material/Zoom';
import CircularProgress from '@mui/material/CircularProgress';
import {
    User,
    Settings,
    ForkKnife,
    Calendar,
    ListCheck,
    ImageIcon,
    Stethoscope,
    LogOut,
    ShoppingCart,
    ChefHat,
    MessageCircleQuestion,
    BookmarkIcon,
    Menu,
    Play,
    Database,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { getAuth, signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { FEATURE_FLAGS, COMING_SOON_FEATURES, PREMIUM_FEATURES } from '../../config/featureFlags';
import { app } from '../../config/firestore.js';
import { getPremiumStatus } from '../features/payments/getPremiumStatus.jsx';
import { getCheckoutUrl } from '../features/payments/stripePayment.jsx';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

// Tracking functions for each menu item
const createTrackingFunction = (menuItem) => {
    return () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track(`${menuItem}_menu_click`, {
                source: 'drawer_menu',
                location: 'app_drawer_component',
                menu_item: menuItem
            });
            //console.log(`(AppDrawer.jsx) - ${menuItem} menu item clicked`);
        }
    };
};

export default function AppDrawer({ open, onClose }) {
    const navigate = useNavigate();
    const auth = getAuth(app);
    const [isPremium, setIsPremium] = useState(false);
    const [popperAnchorEl, setPopperAnchorEl] = useState(null);
    const [activeItem, setActiveItem] = useState(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);

    useEffect(() => {
        const checkPremium = async () => {
            const newPremiumStatus = auth.currentUser
                ? await getPremiumStatus(app)
                : false;
            setIsPremium(newPremiumStatus);
        };
        checkPremium();
    }, [app, auth.currentUser?.uid]);

    const handleNavigation = (path) => {
        navigate(path);
        onClose();
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/login');
            onClose();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const handlePopperToggle = (event, itemType) => {
        event.stopPropagation();
        setActiveItem(itemType);
        setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget);
    };

    const upgradeToPremium = async () => {
        try {
            setIsPaymentLoading(true);
            //console.log(`(AppDrawer.jsx) - Upgrade to Premium`);
            const priceId = 'price_1QwY9REK9nhVGtg7n3wjhAMR';
            const checkOutUrl = await getCheckoutUrl(app, priceId);

            if (checkOutUrl) {
                window.location.href = checkOutUrl;
            }
        } catch (error) {
            console.error('Failed to get payment URL:', error);
        } finally {
            setIsPaymentLoading(false);
        }
    };

    // Get popper content based on active item
    const getPopperContent = () => {
        switch (activeItem) {
            case 'MEAL_SERVICE':
                return {
                    title: "ADAPT MEAL",
                    description: "allows you to tell Kay about a favorite meal or cuisine and you'll receive a new recipe that is compliant for your therapeutic diet."
                };
            case 'MEAL_PLANNER':
                return {
                    title: "MEAL PLANNER",
                    description: "helps you plan your meals from 1 to 14 days with diet-compliant recipes."
                };
            case 'CHECK_INGREDIENTS':
                return {
                    title: "CHECK INGREDIENTS",
                    description: "allows you to upload a photo of an ingredient label and check if the ingredients are allowed on your therapeutic diet."
                };
            case 'MEAL_ANALYSIS':
                return {
                    title: "ANALYZE MEAL",
                    description: "analyzes your meal for nutritional content and compliance with your diet."
                };
            case 'MEDICAL_REPORT_ANALYSIS':
                return {
                    title: "ANALYZE PDF REPORT",
                    description: "analyzes your medical reports and provides insights related to your diet."
                };
            case 'SAVED_DOCUMENTS':
                return {
                    title: "SAVED DOCUMENTS",
                    description: "allows you to access your saved documents such as recipes, and other responses from Kay."
                };
            case 'comingSoon':
                return {
                    title: "COMING SOON",
                    description: "This feature is currently in development and will be available soon!"
                };
            default:
                return {
                    title: "PREMIUM FEATURE",
                    description: "Upgrade to Early Adopter to use this feature!"
                };
        }
    };

    // Helper function to render menu items with proper feature flag support
    const renderMenuItem = (icon, label, path, featureKey, trackingFunction) => {
        const Icon = icon;

        // If no featureKey provided, always show the item (for Profile, Settings, etc.)
        if (!featureKey) {
            return (
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => {
                            if (trackingFunction) trackingFunction();
                            handleNavigation(path);
                        }}
                    >
                        <ListItemIcon>
                            <Icon />
                        </ListItemIcon>
                        <ListItemText primary={label} />
                    </ListItemButton>
                </ListItem>
            );
        }

        const isEnabled = FEATURE_FLAGS[featureKey];
        const isComingSoon = COMING_SOON_FEATURES.includes(featureKey);
        const isPremiumOnly = PREMIUM_FEATURES.includes(featureKey);

        // Don't render if feature is disabled and not marked as coming soon
        if (!isEnabled && !isComingSoon) return null;

        // Handle coming soon features - these should appear but be disabled
        if (isComingSoon && !isEnabled) {
            return (
                <ListItem disablePadding>
                    {/* Wrapping div to capture clicks even when button is disabled */}
                    <div
                        onClick={(e) => handlePopperToggle(e, 'comingSoon')}
                        style={{ width: '100%', cursor: 'pointer' }}
                    >
                        <ListItemButton
                            disabled={true}
                            sx={{
                                '&.Mui-disabled': {
                                    opacity: 0.6,
                                    color: 'text.disabled',
                                    '& .MuiListItemIcon-root': {
                                        color: 'text.disabled',
                                    }
                                }
                            }}
                        >
                            <ListItemIcon>
                                <Icon />
                            </ListItemIcon>
                            <ListItemText
                                primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {label}
                                        <Chip
                                            label="Soon"
                                            size="small"
                                            color="info"
                                            sx={{
                                                ml: 1,
                                                opacity: 0.8,
                                                '& .MuiChip-label': {
                                                    fontSize: '0.7rem',
                                                    fontWeight: 'bold',
                                                    letterSpacing: '0.025rem'
                                                }
                                            }}
                                        />
                                    </Box>
                                }
                            />
                        </ListItemButton>
                    </div>
                </ListItem>
            );
        }


        // Handle premium features
        if (isPremiumOnly && !isPremium) {
            return (
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={(e) => handlePopperToggle(e, featureKey)}
                        sx={{
                            '&.Mui-disabled': {
                                opacity: 0.7
                            }
                        }}
                    >
                        <ListItemIcon>
                            <Icon />
                        </ListItemIcon>
                        <ListItemText
                            primary={label}
                            secondary="Premium Feature"
                        />
                    </ListItemButton>
                </ListItem>
            );
        }

        // Enabled features - should navigate when clicked
        if (isEnabled) {
            return (
                <ListItem disablePadding>
                    <ListItemButton
                        onClick={() => {
                            if (trackingFunction) trackingFunction();
                            handleNavigation(path);
                        }}
                    >
                        <ListItemIcon>
                            <Icon />
                        </ListItemIcon>
                        <ListItemText primary={label} />
                    </ListItemButton>
                </ListItem>
            );
        }

        // Disabled features - should show popper with info
        return (
            <ListItem disablePadding>
                <ListItemButton
                    onClick={(e) => handlePopperToggle(e, featureKey)}
                    sx={{
                        '&.Mui-disabled': {
                            opacity: 0.7
                        }
                    }}
                >
                    <ListItemIcon>
                        <Icon />
                    </ListItemIcon>
                    <ListItemText primary={label} />
                </ListItemButton>
            </ListItem>
        );
    };

    // Add these inside your component, before the return statement
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    return (
        <>
            <Drawer
                anchor="left"
                open={open}
                onClose={onClose}
                sx={{
                    '& .MuiDrawer-paper': {
                        zIndex: 1200, // Make sure drawer has proper z-index
                    },
                }}
            >
                <Box sx={{ width: 280 }} role="presentation">
                    {/* Add a toolbar to match AppHeader layout */}
                    <Toolbar sx={{ px: 1 }}>
                        <IconButton
                            edge="start"
                            color="inherit"
                            aria-label="close menu"
                            onClick={onClose}
                            sx={{ mr: 2 }}
                        >
                            <Menu />
                        </IconButton>
                        <Typography
                            className="font-[Montserrat] tracking-[0.015em] leading-[1.2] font-bold"
                            variant="h6"
                            component="div"
                            sx={{ flexGrow: 1 }}
                        >
                            <Link to="/" className="text-white">Meadow Mentor</Link>
                        </Typography>

                    </Toolbar>

                    <Divider />


                    <List>
                        <ListItem>
                            <Typography variant="subtitle2" color="text.secondary">
                                HEALTH TOOLS
                            </Typography>
                        </ListItem>
                        {renderMenuItem(Play, "Quick Start Guide", "/quick_start_guide", "QUICK_START_GUIDE", createTrackingFunction("quick_start_guide"))}
                        {renderMenuItem(MessageCircleQuestion, "Ask About Diet", "/ask-kay", "ASK_KAY", createTrackingFunction("ask_kay"))}
                        {renderMenuItem(Calendar, "Food Journal", "/food_journal", "FOOD_JOURNAL", createTrackingFunction("food_journal"))}
                        {renderMenuItem(Database, "Food Database", "/food-database", "FOOD_DATABASE", createTrackingFunction("food_database"))}
                        {/* {renderMenuItem(ChefHat, "Create Recipe", "/recipe_service", "RECIPE_SERVICE", createTrackingFunction("create_recipe"))} */}
                        {/* {renderMenuItem(ForkKnife, "Adapt Meal", "/meal_service", "MEAL_SERVICE", createTrackingFunction("adapt_meal"))} */}
                        
                        {/* {renderMenuItem(ListCheck, "Check Ingredients", "/check_ingredients", "CHECK_INGREDIENTS", createTrackingFunction("check_ingredients"))} */}
                        {/* {renderMenuItem(BookmarkIcon, "Saved Documents", "/saved_documents", "SAVED_DOCUMENTS", createTrackingFunction("saved_documents"))} */}

                        <Divider />
                        <ListItemText primary="Tools & Features" sx={{ pl: 2, pt: 2, pb: 1, fontWeight: 'bold' }} />
                        {renderMenuItem(MessageCircleQuestion, 'Ask Kay', '/ask-kay', 'ASK_KAY', createTrackingFunction('ask_kay'))}
                        {renderMenuItem(ForkKnife, 'My Recipes', '/saved-recipes', 'SAVED_RECIPES', createTrackingFunction('saved_recipes'))}
                        {renderMenuItem(ListCheck, 'Food Journal', '/food_journal', 'FOOD_JOURNAL', createTrackingFunction('food_journal'))}
                        {renderMenuItem(ShoppingCart, 'Shopping List', '/shopping-list', 'SHOPPING_LIST', createTrackingFunction('shopping_list'))}

                    </List>
                    {/* <Divider /> */}
                </Box>
            </Drawer>

            {/* Popper for feature information */}
            <Popper
                open={Boolean(popperAnchorEl)}
                anchorEl={popperAnchorEl}
                placement={isMobile ? "bottom" : "right"}
                transition
                style={{
                    zIndex: 1300,
                    ...(isMobile && {
                        left: '50% !important',
                        transform: 'translateX(-50%) !important',
                        maxWidth: '90vw'
                    })
                }} // Higher than the backdrop but same as drawer
                modifiers={[
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: document.body
                        },
                    }
                ]}
            >
                {({ TransitionProps }) => (
                    <Zoom {...TransitionProps} timeout={350}>
                        <Paper
                            elevation={3}
                            variant='elevation'
                            sx={{
                                p: 2,
                                maxWidth: isMobile ? '90vw' : 300,
                                width: isMobile ? '90wv' : 'autio',
                                bgcolor: 'white',
                                color: 'black',
                                // Add this line to make sure it's on top and not affected by the backdrop
                                position: 'relative',
                                zIndex: 1300, // Same z-index as the drawer (or higher)
                                ...(isMobile && {
                                    margin: '0 auto'
                                })
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', paddingBottom: '8px' }}>
                                <Button
                                    size='small'
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setPopperAnchorEl(null);
                                    }}
                                    sx={{
                                        ml: 1,
                                        fontWeight: '600',
                                        backgroundColor: 'rgb(156, 163, 175)',
                                        color: 'white',
                                        '&:hover': {
                                            backgroundColor: 'rgb(107, 114, 128)'
                                        }
                                    }}
                                    variant='contained'
                                >
                                    ✕
                                </Button>
                            </div>

                            <div className='flex flex-col' style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <Typography>
                                    <div className='py-4'>
                                        <span className='font-bold'>{getPopperContent().title}</span> {getPopperContent().description}
                                    </div>
                                </Typography>

                                {activeItem !== 'comingSoon' && activeItem !== null && (
                                    <Button
                                        color='success'
                                        onClick={upgradeToPremium}
                                        variant='contained'
                                        startIcon={isPaymentLoading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCart />}
                                        size='large'
                                        disabled={isPaymentLoading}
                                        className="flex-none cta-button bg-blue-800 shadow-sm hover:shadow-md"
                                        sx={{ mt: 2 }}
                                    >
                                        Upgrade
                                    </Button>
                                )}
                            </div>
                        </Paper>
                    </Zoom>
                )}
            </Popper>
        </>
    );
}
