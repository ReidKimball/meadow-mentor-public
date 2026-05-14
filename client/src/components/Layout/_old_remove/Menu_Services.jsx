/* 
This implementation provides several benefits:

Centralized Feature Management: All feature toggles are defined in a single featureFlags.js file, making it easy to enable/disable features.

Coming Soon Indicators: Features that are disabled but should be visible as "coming soon" are marked with a special chip and show a different message when clicked.

Flexible Button Rendering: The renderServiceButton helper function makes it easy to add new services with consistent styling and behavior.

Clean UI: Disabled features that aren't marked as "coming soon" won't appear at all, keeping the UI clean.

Future-Proof: When you're ready to enable a feature, you just need to change its flag to true in the configuration file.

To use this system for any new feature:

Add the feature key to the FEATURE_FLAGS object in featureFlags.js
Decide if it should be in the COMING_SOON_FEATURES array
Add a call to renderServiceButton() with the appropriate parameters
This approach allows you to deploy your app with partially completed features hidden, while still showcasing what's coming next.

*/

import { app } from '../../config/firestore.js'
import { getCheckoutUrl } from '../stripePayment.jsx';
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import Button from '@mui/material/Button'
import { Tooltip, Popper, Paper, Typography, Chip } from '@mui/material'
import Zoom from '@mui/material/Zoom';
import CircularProgress from '@mui/material/CircularProgress'

import { ShoppingCart, BookmarkIcon, ChefHat, ForkKnife, MessageCircleQuestion, Calendar, Grid, ListCheck, ImageIcon, Stethoscope } from 'lucide-react'
import { getPremiumStatus } from '../getPremiumStatus.jsx';
import { FEATURE_FLAGS, COMING_SOON_FEATURES } from '../../config/featureFlags.js';

// Create tracking functions for each service
const trackCreateRecipeClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('create_recipe_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Create Recipe'
        });
        //console.log(`(Menu_Services.jsx) - Create Recipe button clicked from menu`)
    }
};

const trackAdaptMealClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('adapt_meal_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Adapt Meal'
        });
        //console.log(`(Menu_Services.jsx) - Adapt Meal button clicked from menu`)
    }
};

const trackAskKayClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('ask_kay_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Ask Kay'
        });
        //console.log(`(Menu_Services.jsx) - Ask Kay button clicked from menu`)
    }
};

const trackMealPlanClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('meal_plan_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: '7-Day Meal Plan'
        });
        //console.log(`(Menu_Services.jsx) - 7-Day Meal Plan button clicked from menu`)
    }
};

const trackCheckIngredientsClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('check_ingredients_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Check Ingredients'
        });
        //console.log(`(Menu_Services.jsx) - Check Ingredients button clicked from menu`)
    }
};

const trackAnalyzeMealClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('analyze_meal_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Analyze Meal'
        });
        //console.log(`(Menu_Services.jsx) - Analyze Meal button clicked from menu`)
    }
};

const trackAnalyzeReportClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('analyze_report_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Analyze PDF Report'
        });
        //console.log(`(Menu_Services.jsx) - Analyze PDF Report button clicked from menu`)
    }
};

const trackSavedDocumentsClick = () => {
    if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('saved_documents_click', {
            source: 'landing_page',
            location: 'menu_services_component',
            button_text: 'Saved Documents'
        });
        //console.log(`(Menu_Services.jsx) - Saved Documents button clicked from menu`)
    }
};


export default function Menu_Services() {
    const auth = getAuth(app)
    const [isPremium, setIsPremium] = useState(false)
    const [anchorEl, setAnchorEl] = useState(null);
    const [popperAnchorEl, setPopperAnchorEl] = useState(null);
    const [activeButton, setActiveButton] = useState(null);
    const [isPaymentLoading, setIsPaymentLoading] = useState(false)
    //console.log(`(Menu_Services.jsx) - isPremium value is: ${isPremium}`)

    useEffect(() => {
        const checkPremium = async () => {
            const newPremiumStatus = auth.currentUser
                ? await getPremiumStatus(app)
                : false
            setIsPremium(newPremiumStatus)
        }
        checkPremium()
    }, [app, auth.currentUser?.uid])

    const handlePopperToggle = (event, buttonType) => {
        // If popper is open (anchorEl exists), close it. Otherwise, open it.
        setActiveButton(buttonType)
        setPopperAnchorEl(popperAnchorEl ? null : event.currentTarget);
        //console.log('(Menu_Services.jsx) - popper button clicked and popperAnchorEl is: ', popperAnchorEl)
    };

    // Define button-specific content
    const getPopperContent = () => {
        switch (activeButton) {
            case 'ingredients':
                return {
                    title: "CREATE RECIPE",
                    description: "allows you to list various ingredients you have on hand and Kay will create a recipe with them."
                };
            case 'meal':
                return {
                    title: "ADAPT MEAL",
                    description: "allows you to tell Kay about a favorite meal or cuisine and you'll receive a new recipe that is compliant for your therapeutic diet."
                };
            case 'check':
                return {
                    title: "CHECK INGREDIENTS",
                    description: "allows you to upload a photo of an ingredient label and check if the ingredients are allowed on your therapeutic diet."
                };
            case 'saved':
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
    }

    const upgradeToPremium = async () => {
        try {
            setIsPaymentLoading(true)
            //console.log(`(LandingBuyPage.jsx) - Upgrade to Premium`)
            const priceId = 'price_1QwY9REK9nhVGtg7n3wjhAMR'
            const checkOutUrl = await getCheckoutUrl(app, priceId)

            if (checkOutUrl) {
                window.location.href = checkOutUrl
            }

        } catch (error) {
            console.error('Failed to get payment URL:', error)
            // add user feedback here
        } finally {
            // was set to setIsPaymentLoading(false), but removed to make that set on page mount
        }
    }

    // Helper function to render a service button based on feature flag
    const renderServiceButton = (featureKey, route, icon, label, trackingFunction) => {
        const Icon = icon;
        const isEnabled = FEATURE_FLAGS[featureKey];
        const isComingSoon = COMING_SOON_FEATURES.includes(featureKey);

        if (!isEnabled) {
            if (isComingSoon) {
                return (
                    <div
                        onClick={(e) => handlePopperToggle(e, 'comingSoon')}
                        style={{ display: 'inline-block', cursor: 'pointer' }}
                    >
                        <Button
                            disabled={true}
                            variant='contained' // filled, contained, outlined
                            startIcon={<Icon />}
                            size='small' //small, medium, large
                            className="flex-none w-60 h-11 cta-button bg-blue-800 shadow-sm hover:shadow-md"
                            endIcon={
                                <Chip
                                    label="Soon"
                                    size="small"
                                    color="info"
                                    sx={{
                                        '& .MuiChip-label': {
                                            fontSize: '0.9rem', // adjust this value to change SOON text size
                                            fontWeight: 'bold', //optional
                                            letterSpacing: '0.025rem'
                                        }
                                    }} />
                            } //default, primary, secondary, error, info, success, warning, string
                        >
                            {label}
                        </Button>
                    </div>
                );
            }
            return null; // Don't render disabled features that aren't marked as coming soon
        }

        return (
            <Link to={route}>
                <Button
                    variant='contained'
                    startIcon={<Icon />}
                    size='large'
                    className="flex-none w-60 cta-button bg-blue-800 shadow-sm hover:shadow-md"
                    onClick={trackingFunction}
                >
                    {label}
                </Button>
            </Link>
        );
    };

    return (
        <>
            <section id="menu" className="flex flex-row flex-wrap justify-center gap-4">
                {renderServiceButton('RECIPE_SERVICE', '/recipe_service', ChefHat, 'Create Recipe', trackCreateRecipeClick)}
                {renderServiceButton('MEAL_SERVICE', '/meal_service', ForkKnife, 'Adapt Meal', trackAdaptMealClick)}
                {renderServiceButton('COACH_SERVICE', '/coach_service', MessageCircleQuestion, 'Ask Kay', trackAskKayClick)}
                {renderServiceButton('WEEKLY_MEAL_PLAN', '/weekly_meal_plan', Calendar, '7-Day Meal Plan', trackMealPlanClick)}
                {renderServiceButton('CHECK_INGREDIENTS', '/check_ingredients', ListCheck, 'Check Ingredients', trackCheckIngredientsClick)}
                {renderServiceButton('MEAL_ANALYSIS', '/meal_analysis', ImageIcon, 'Analyze Meal', trackAnalyzeMealClick)}
                {renderServiceButton('MEDICAL_REPORT_ANALYSIS', '/medical_report_analysis', Stethoscope, 'Analyze PDF Report', trackAnalyzeReportClick)}
                {renderServiceButton('NEW_FEATURE', '/new_feature_page', Stethoscope, 'New Feature', null)}

                {/* Saved Documents - special case with premium check */}
                {FEATURE_FLAGS.SAVED_DOCUMENTS && (
                    !isPremium ? (
                        <div
                            onClick={(e) => handlePopperToggle(e, 'saved')}
                            style={{ display: 'inline-block', cursor: 'pointer' }}
                        >
                            <Button
                                disabled={true}
                                variant='contained'
                                startIcon={<BookmarkIcon />}
                                size='large'
                                className="flex-none w-60 cta-button bg-blue-800 shadow-sm hover:shadow-md">
                                Saved Documents
                            </Button>
                        </div>
                    ) : (
                        <Link to="/saved_documents">
                            <Button
                                variant='contained'
                                startIcon={<BookmarkIcon />}
                                size='large'
                                className="flex-none w-60 cta-button bg-blue-800 shadow-sm hover:shadow-md"
                                onClick={trackSavedDocumentsClick}
                            >
                                Saved Documents
                            </Button>
                        </Link>
                    )
                )}

                {/* Single popper for all buttons */}
                <Popper
                    open={Boolean(popperAnchorEl)}
                    anchorEl={popperAnchorEl}
                    placement="bottom" // bottom, bottom-start, bottom-end, left, left-start, left-end, right, right-start, right-end, top, top-start, top-end
                    transition
                >
                    {({ TransitionProps }) => (
                        <Zoom {...TransitionProps} timeout={350}>
                            <Paper
                                elevation={3}
                                variant='elevation'
                                sx={{
                                    p: 2,
                                    maxWidth: 300,
                                    bgcolor: 'white',
                                    color: 'black'
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

                                    {activeButton !== 'comingSoon' && (
                                        <Button
                                            color='success'
                                            onClick={upgradeToPremium}
                                            variant='contained'
                                            startIcon={isPaymentLoading ? <CircularProgress size={20} color="inherit" /> : <ShoppingCart />}
                                            size='large'
                                            disabled={isPaymentLoading}
                                            className="flex-none cta-button bg-blue-800 shadow-sm hover:shadow-md"
                                        >
                                            Upgrade
                                        </Button>
                                    )}
                                </div>
                            </Paper>
                        </Zoom>
                    )}
                </Popper>
            </section>
        </>
    )
}
