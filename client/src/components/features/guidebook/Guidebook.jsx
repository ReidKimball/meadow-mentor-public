/**
 * @file Guidebook.jsx
 * @module pages/Guidebook
 * @description This component renders the main dashboard or "Guidebook" of the application.
 * It displays a grid of service cards, each representing a different feature or tool
 * available to the user, such as checking ingredients, getting recipes, or managing a food journal.
 * The component handles user authentication state, premium feature access, API usage limits,
 * and navigation to the respective service pages.
 * @requires react
 * @requires react-router-dom
 * @requires @mui/material
 * @requires lucide-react
 * @requires firebase/auth
 * @requires module:context/ApiLimitsContext
 * @requires module:config/featureFlags
 * @requires module:helpers/getPremiumStatus
 * @requires module:helpers/stripePayment
 * @requires module:config/firestore
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
const meadowCleanCardImg = 'https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_clean_card.webp';
import {
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Button,
    Grid,
    Chip,
    Badge,
    CardActionArea,
    Divider,
    useMediaQuery,
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

import { useTheme } from '@mui/material/styles';
import {
    ChefHat,
    ForkKnife,
    MessageCircleQuestion,
    ListCheck,
    Calendar,
    ImageIcon,
    Stethoscope,
    BookmarkIcon,
    ShoppingCart,
    ExternalLink,
    NotebookPen
} from 'lucide-react';

import SettingsIcon from '@mui/icons-material/Settings';
import HelpIcon from '@mui/icons-material/Help';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ChecklistIcon from '@mui/icons-material/Checklist';

import { FEATURE_FLAGS, COMING_SOON_FEATURES, PREMIUM_FEATURES } from '../../../config/featureFlags.js';
import { getPremiumStatus } from '../../features/payments/getPremiumStatus.jsx';
import { getCheckoutUrl } from '../../features/payments/stripePayment.jsx';
import { app } from '../../../config/firestore.js';
import { getAuth } from 'firebase/auth';
import CircularProgress from '@mui/material/CircularProgress';

/**
 * @const {Array<object>} serviceData
 * @description An array of objects, where each object represents a service or feature
 * available in the Guidebook. Each object contains metadata for the service card,
 * such as its ID, title, description, icon, navigation path, and associated API limit key.
 */
const serviceData = [
    // UPDATE EACH ONE TO USE JSX FOR THE DESCRIPTION
    {
        id: 'QUICK_START_GUIDE',
        title: 'Set Up Diet Plan',
        description: `Choose your therapeutic diet, restrictions, and your health condition. This information will be used when creating recipes and meal plans. Time to complete: Less than 1 minute.`,
        icon: SettingsIcon,
        path: '/quick_start_guide',
        apiLimitKey: null,
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'HOW_TO_VIDEOS',
        title: 'How-to Videos',
        description: `Learn how to use app features. Create and edit both recipes and meal plans. See how to manage your shopping list.`,
        icon: VideoLibraryIcon,
        path: '/how-to-videos',
        apiLimitKey: null,
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'ASK_KAY',
        title: 'Ask Chef Kay',
        description: 'Get answers about your therapeutic diet, create or edit recipes, find out if ingredients are safe, and more.',
        icon: HelpIcon,
        path: '/ask-kay?topic=diet',
        apiLimitKey: 'askKay',
        cardThumbnail: meadowCleanCardImg,
    },

    // {
    //     id: 'RECIPE_SERVICE',
    //     title: 'Get Recipes',
    //     description: 'Get personalized recipes that align with your therapeutic diet plan. Start with ingredients you have on-hand, ask for a cuisine, or to convert an old favorite.',
    //     icon: ChefHat,
    //     path: '/ask-kay?topic=recipes',
    //     apiLimitKey: 'recipeGeneration',
    //     cardThumbnail: meadowCleanCardImg,
    // },

    {
        id: 'SAVED_RECIPES',
        title: 'My Recipes',
        description: 'View your saved recipes. Add ingredients to your Shopping List.',
        icon: MenuBookIcon,
        path: '/saved-recipes',
        apiLimitKey: null, // No API limit for saved documents
        cardThumbnail: meadowCleanCardImg,
    },
    {
        id: 'MEAL_PLANNER',
        title: 'Meal Planner',
        description: 'Plan your meals for from 1 to 14 days with diet-compliant recipes tailored to your needs.',
        // description: (
        //     <>
        //         <Typography variant="body2" paragraph sx={{ fontWeight: 'normal', color: 'text.primary' }}>
        //             Plan your meals for from 1 to 14 days with diet-compliant recipes tailored to your needs.
        //         </Typography>
        //     </>
        // ),
        icon: CalendarTodayIcon,
        path: '/meal-planner',
        apiLimitKey: 'mealPlan',
        cardThumbnail: meadowCleanCardImg,
    },

    
    {
        id: 'CHECK_INGREDIENTS',
        title: 'Check Ingredients',
        description: 'Upload a photo of an ingredient label and check if the ingredients are allowed on your therapeutic diet.',
        icon: ListCheck,
        path: '/check_ingredients',
        apiLimitKey: 'checkIngredients',
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'FOOD_COMPASS',
        title: 'Food List',
        description: 'Instantly see how any food aligns with your healing plan. Get clarity at the grocery store or in your kitchen.',
        icon: ChecklistIcon,
        path: '/food-compass',
        apiLimitKey: null, // No API limit for food database
        cardThumbnail: meadowCleanCardImg,
        color: '#4caf50', // Green color
        isPremium: false,
        isNew: true,
        comingSoon: false
    },

    {
        id: 'SHOPPING_LIST',
        title: 'Shopping List',
        description: 'View and manage your shopping list.',
        icon: ShoppingCartIcon,
        path: '/shopping-list',
        apiLimitKey: null,
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'FOOD_JOURNAL',
        title: 'Food Journal',
        description: 'Log what you ate and have it analyzed for compliance.',
        icon: NotebookPen,
        path: '/food_journal', // this is the page path set in the App.jsx file
        apiLimitKey: null, // No API limit for saved documents
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'MEAL_SERVICE',
        title: 'Adapt Meal',
        description: 'Tell Kay about a favorite meal or cuisine and receive a compliant recipe for your therapeutic diet.',
        icon: ForkKnife,
        path: '/meal_service',
        apiLimitKey: 'mealConvert',
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'MEAL_ANALYSIS',
        title: 'Analyze Meal',
        description: 'Analyze your meal for nutritional content and compliance with your therapeutic diet.',
        icon: ImageIcon,
        path: '/meal_analysis',
        apiLimitKey: 'mealAnalysis',
        cardThumbnail: meadowCleanCardImg,
    },
    {
        id: 'MEDICAL_REPORT_ANALYSIS',
        title: 'Analyze PDF Report',
        description: 'Upload and analyze your medical reports to receive insights related to your diet.',
        icon: Stethoscope,
        path: '/medical_report_analysis',
        apiLimitKey: 'medicalAnalysis',
        cardThumbnail: meadowCleanCardImg,
    },

    {
        id: 'SAVED_DOCUMENTS',
        title: 'Saved Documents',
        description: 'Access your saved recipes, analyses, and other responses from Kay.',
        icon: BookmarkIcon,
        path: '/saved-documents',
        apiLimitKey: null, // No API limit for saved documents
        cardThumbnail: meadowCleanCardImg,
    },

    

];

/**
 * @function createTrackingFunction
 * @description A factory function for creating event tracking handlers.
 * While not fully implemented in this snippet, its purpose is to generate
 * a function for a given menu item that would track user interaction events (e.g., clicks).
 * @param {string} menuItem - The identifier for the menu item to track.
 * @returns {Function} A function that, when called, would log the tracking event.
 */
// Tracking functions for each menu item
const createTrackingFunction = (menuItem) => {
    return () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track(`${menuItem}_card_click`, {
                source: 'health_tools',
                location: 'health_tools_page',
                menu_item: menuItem,
            });
            //console.log(`(HealthTools.jsx - Umami) - ${menuItem} card clicked`);
        }
    };
};

/**
 * @function Guidebook
 * @description The main component for the Guidebook page. It displays a collection of
 * services as interactive cards. It manages user state, checks for premium access,
 * and handles navigation and actions related to each service.
 * @returns {JSX.Element} The rendered Guidebook component.
 */
export default function Guidebook() {
    const navigate = useNavigate();
    const [isPremium, setIsPremium] = useState(false);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false);
    const auth = getAuth(app);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
    const [loadingCardId, setLoadingCardId] = useState(null);

    useEffect(() => {
        /**
         * @function checkPremium
         * @description Fetches the user's premium status from Firebase and updates the component's state.
         * It sets the user's premium status and UID.
         * @async
         */
        const checkPremium = async () => {
            const newPremiumStatus = auth.currentUser
                ? await getPremiumStatus(app)
                : false;
            setIsPremium(newPremiumStatus);
        };
        checkPremium();
    }, [auth.currentUser]);

    /**
     * @function upgradeToPremium
     * @description Initiates the premium upgrade process for a user.
     * It prevents default event behavior, retrieves a Stripe checkout URL for the specific service,
     * and redirects the user to the Stripe payment page.
     * @param {Event} e - The click event object.
     * @param {string} serviceId - The ID of the service for which the upgrade is being initiated.
     * @async
     */
    const upgradeToPremium = async (e, serviceId) => {
        e.stopPropagation();
        try {
            setLoadingCardId(serviceId); // Set only this card as loading
            //console.log(`(HealthTools.jsx) - Upgrade to Premium from ${serviceId}`);
            const priceId = 'price_1QwY9REK9nhVGtg7n3wjhAMR';
            const checkOutUrl = await getCheckoutUrl(app, priceId);

            if (checkOutUrl) {
                window.location.href = checkOutUrl;
            }
        } catch (error) {
            console.error('Failed to get payment URL:', error);
        } finally {
            setLoadingCardId(null);
        }
    };

    const upgradeToPremiumButton = (
        <Button
            onClick={upgradeToPremium}
            variant='contained'
            startIcon={isPaymentLoading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCart />}
            size='large'
            disabled={isPaymentLoading}
            className="flex-none cta-button bg-blue-800 shadow-sm hover:shadow-md"
        >
            {isPaymentLoading ? 'Please wait...' : 'Upgrade to Early Adopter'}
        </Button>
    );

    /**
     * @function navigateToService
     * @description Navigates the user to the specified service path.
     * @param {string} path - The route path for the service.
     * @param {string} serviceId - The ID of the service being navigated to.
     */
    const navigateToService = (path, serviceId) => {
        createTrackingFunction(serviceId.toLowerCase())();
        navigate(path);
    };

    /**
     * @function getGridSize
     * @description Determines the responsive grid item size based on the screen width.
     * @returns {object} An object containing the grid column spans for different breakpoints (xs, sm, md).
     */
    const getGridSize = () => {
        if (isMobile) return 12; // Full width on mobile
        if (isTablet) return 6;  // 2 per row on tablets
        return 4;                // 3 per row on desktop
    };

    /**
     * @function renderServiceCard
     * @description Renders a single service card based on the service data provided.
     * It handles logic for displaying premium status, feature flags (coming soon/enabled),
     * API usage limits, and user interactions like upgrading or navigating.
     * @param {object} service - The service object from `serviceData`.
     * @returns {JSX.Element} A Grid item containing the rendered Card for the service.
     */
    const renderServiceCard = (service) => {
        const isEnabled = FEATURE_FLAGS[service.id];
        const isComingSoon = COMING_SOON_FEATURES.includes(service.id);
        const isPremiumFeature = PREMIUM_FEATURES.includes(service.id);
        const requiresUpgrade = isPremiumFeature && !isPremium;
        const Icon = service.icon;

        // Don't render if completely disabled
        if (!isEnabled && !isComingSoon) return null;

        return (
            <Grid 
                item
                xs={12} 
                sm={6} 
                md={4} 
                key={service.id}
                sx={{ 
                    display: 'flex',
                    minWidth: 0,
                    maxWidth: '100%'
                }}
            >
                <Card
                    sx={{
                        width: '320px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: 0,
                        maxWidth: '100%',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 6px 12px rgba(0,0,0,0.15)'
                        }
                    }}
                >
                    <CardActionArea
                        onClick={() => isEnabled && !requiresUpgrade && navigateToService(service.path, service.id)}
                        disabled={!isEnabled || requiresUpgrade}
                        sx={{
                            flexGrow: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'stretch',
                            minWidth: 0,
                            width: '100%',
                            opacity: (!isEnabled || isComingSoon) ? 0.9 : 1
                        }}
                    >
                        <Box position="relative" sx={{ width: '100%', overflow: 'hidden' }}>
                            <CardMedia
                                component="img"
                                height="200"
                                image={service.cardThumbnail}
                                alt={service.title}
                                sx={{
                                    width: '100%',
                                    backgroundColor: 'action.hover',
                                    objectFit: 'cover',
                                    filter: (isComingSoon && !isEnabled) ? 'grayscale(50%)' : 'none'
                                }}
                            />
                            {/* Overlay Icon */}
                            <Box
                                position="absolute"
                                top="50%"
                                left="50%"
                                sx={{
                                    transform: 'translate(-50%, -50%)',
                                    backgroundColor: 'rgba(255,255,255,0.85)',
                                    borderRadius: '50%',
                                    padding: '12px',
                                    boxShadow: '0 3px 6px rgba(0,0,0,0.16)',
                                    transition: 'all 0.2s ease',
                                    '&:hover': {
                                        transform: 'translate(-50%, -50%) scale(1.05)',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                                    }
                                }}
                            >
                                <Icon size={64} strokeWidth={2} />
                            </Box>

                            {/* Badges and Tags */}
                            <Box position="absolute" top={8} right={8} display="flex" flexDirection="column" gap={0.5} alignItems="flex-end">
                                {isPremiumFeature && (
                                    <Chip
                                        label="Premium"
                                        color="secondary"
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                )}

                                {isComingSoon && !isEnabled && (
                                    <Chip
                                        label="Coming Soon"
                                        color="info"
                                        size="small"
                                        sx={{ fontWeight: 'bold' }}
                                    />
                                )}
                            </Box>
                        </Box>

                        <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                            <Typography gutterBottom variant="h6" component="div" sx={{ wordWrap: 'break-word' }}>
                                {service.title}
                            </Typography>
                            {typeof service.description === 'string' ? (
                                <Typography variant="body2" sx={{ mb: 2, fontWeight: 'normal', wordWrap: 'break-word', overflowWrap: 'break-word', color: 'text.primary' }}>
                                    {service.description}
                                </Typography>
                            ) : (
                                <Box sx={{ mb: 2, fontWeight: 'normal', color: 'text.primary', wordWrap: 'break-word', overflowWrap: 'break-word' }}>
                                    {service.description}
                                </Box>
                            )}
                        </CardContent>
                    </CardActionArea>

                    {/* Move the button section outside CardActionArea */}
                    <CardContent sx={{ minWidth: 0, width: '100%' }}>
                        {!requiresUpgrade && isEnabled && (
                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    navigateToService(service.path, service.id);
                                }}
                                endIcon={<ExternalLink size={18} />}
                            >
                                Open {service.title}
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </Grid>
        );
    };

    return (
        <Box sx={{ py: 3, px: 2, pb: 10 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
                Guidebook
            </Typography>

            <Typography variant="body1" paragraph sx={{ mb: 4 }}>
            Your resources for a clear, confident journey. Find everything you need to plan meals, shop safely, and get answers.
            </Typography>

            <Grid container spacing={3}>
                {serviceData.map(service => renderServiceCard(service))}
            </Grid>
        </Box>
    );
}
