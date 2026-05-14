import { useState } from 'react';
import { Link, useNavigate } from 'react-router'; // Corrected: react-router-dom for Link
import { Button, Paper, Typography, Tooltip, ButtonGroup, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { BadgeCheck, Crown } from 'lucide-react';
import { getCheckoutUrl } from './stripePayment.jsx';
import { app } from '../../../config/firestore.js';
import { useUser } from '../../../context/UserContext';
import GetEarlyAdopterPlan from './GetEarlyAdopterPlan'; // Added import

// Define your Stripe Price IDs
const STRIPE_PRICE_ID_MONTHLY = 'price_1RLyrhEK9nhVGtg7WyeWPr2K';
const STRIPE_PRICE_ID_YEARLY = 'price_1RLysSEK9nhVGtg7dRExelWt';

export default function PricingTable() {
    const [annualBilling, setAnnualBilling] = useState(false);
    const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Added state for loading
    const { user } = useUser();
    const navigate = useNavigate();

    const monthlyPrice = 10; // $10
    // const annualPrice = 102; // $102 for the year
    // Calculate effective monthly price for annual plan for display
    const effectiveAnnualMonthlyPrice = 102 / 12;


    // For tracking clicks (Umami)
    const trackFreeTierSignupClick = () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('signup_button_click', {
                source: 'pricing_page',
                location: 'pricing_table',
                button_text: 'Get started for free'
            });
        }
    };

    // Handles premium signup and redirects to Stripe
    const handlePremiumSignup = async () => {
        setIsProcessingPayment(true); // Set loading true
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('signup_button_click', {
                source: 'pricing_page',
                location: 'pricing_table',
                button_text: annualBilling ? 'Get premium access - Annual' : 'Get premium access - Monthly'
            });
        }

        if (!user) {
            // If user is not logged in, redirect to signup page
            navigate('/signup', { state: { from: '/pricing' } });
            setIsProcessingPayment(false); // Reset loading if navigating away
            return; // Stop further execution
        }

        const selectedPriceId = annualBilling ? STRIPE_PRICE_ID_YEARLY : STRIPE_PRICE_ID_MONTHLY;
        const currentUrl = window.location.href; // Get current URL

        try {
            const checkoutUrl = await getCheckoutUrl(app, selectedPriceId, currentUrl);
            if (checkoutUrl) {
                window.location.assign(checkoutUrl);
                // No need to set loading false here as page will navigate away
            } else {
                throw new Error('Could not retrieve checkout URL.');
            }
        } catch (error) {
            console.error("Stripe checkout error:", error);
            alert(`Error: Could not proceed to checkout. ${error.message}`);
        } finally {
            // Only set to false if we didn't navigate or throw unhandled error above
            setIsProcessingPayment(false);
        }
    };


    // Define font styles for reuse
    const headingFont = { fontFamily: 'Montserrat, sans-serif' };
    const bodyFont = { fontFamily: '"Source Sans Pro", sans-serif' };


    return (
        <div className="w-full p-8">
            <h1
                className="text-3xl md:text-4xl font-bold text-center mb-2"
                style={{ ...headingFont }}
            >
                Pricing
            </h1>

            <h2
                className="text-xl md:text-2xl font-normal text-center mb-8"
                style={{ ...bodyFont }}
            >
                Take control of your health today
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto pt-8">
                {/* Basic Plan */}
                <Paper elevation={3} className="rounded-2xl overflow-hidden py-4 flex flex-col">
                    <div className="bg-gray-100 p-6 text-center">
                        <Typography variant="h5" className="font-medium" sx={{ ...headingFont, fontWeight: 500 }}>
                            Basic
                        </Typography>
                        <Typography variant="h3" className="my-4 font-medium" sx={{ ...headingFont, fontWeight: 500 }}>
                            Free
                        </Typography>
                        <Typography variant="body1" sx={{ ...bodyFont }}>
                            Get started with basic features
                        </Typography>
                    </div>

                    <div className="p-6 flex-grow">
                        <FeatureItem included={true} text="Free account and profile creation." tooltip="Complete profiles unlock personalized AI responses to your health condition and therapeutic diet" />
                        <FeatureItem included={true} text="Getting started guide - Learn how to use the app and succeed on your therapeutic diet." />
                        <FeatureItem included={true} text="Ask Kay (AI feature) - 5 uses each day. Ask any question related to your therapeutic diet, create recipes, adapt meals, and get general support." tooltip="No need to rely on social media to have your questions answered" />
                        <FeatureItem included={true} text="Food Compass - Search the food database to know which ingredients are aligned with your therapeutic diet." />
                        <FeatureItem included={true} text="Edit Recipes - Edit your own recipes to swap ingredients or change steps." />
                        <FeatureItem included={true} text="Manage Photos - Upload cover photos for your recipes." />
                        <FeatureItem included={true} text="Share Recipes - Share your recipes with friends, family, and the community." />
                        
                        {/* <FeatureItem included={true} text="Food Journal - Log an unlimited number of meals with notes and symptom data." />
                        <FeatureItem included={false} text="Food Journal - View custom range of meal history beyond the last 7 days." />
                        <FeatureItem included={false} text="Food Journal - Use AI to analyze your meal and symptom data for patterns." /> */}
                        {/* <FeatureItem included={true} text="Each day - 5 uses of the AI features listed below" tooltip="Limited AI interactions for basic needs" /> */}
                        {/* <FeatureItem included={true} text="AI feature - Create recipes from ingredients" tooltip="Have ingredients but don't know what to make? Have our AI make a recipe!" /> */}
                        {/* <FeatureItem included={true} text="AI feature - Adapt meals to your therapeutic diet" tooltip="Adapt favorite meals like pizza, burritos, and cuisines to a recipe compliant to your therapeutic diet" /> */}
                        {/* <FeatureItem included={true} text="AI feature - Check ingredient labels for safety" tooltip="While in a store, take photos of food ingredient labels to check if they are allowed on your therapeutic diet" /> */}
                        {/* <FeatureItem included={true} text="Save documents to your account" tooltip="AI responses can be saved as documents to view and share later" /> */}
                        {/* <FeatureItem included={true} text="View saved documents" tooltip="Access your saved documents anytime, anywhere to get the information you need" /> */}
                        {/* <FeatureItem
                            included={false}
                            text={
                                <>
                                    Early preview access to new features. See our <Link to="/roadmap" className="text-blue-600 hover:underline">Roadmap</Link> for future plans.
                                </>
                            }
                            tooltip='New features are added frequently'
                        /> */}
                    </div>
                    <div className="p-6 text-center">
                        <Button
                            variant="outlined"
                            color="primary"
                            component={Link}
                            to="/signup"
                            onClick={trackFreeTierSignupClick}
                            sx={{
                                ...bodyFont,
                                fontWeight: 'bold',
                                //textTransform: 'none',
                                fontSize: '1.1rem',
                                padding: '10px 20px',
                            }}
                        >
                            Get started for free
                        </Button>
                    </div>
                </Paper>

                {/* Premium Plan Panel */}
                <GetEarlyAdopterPlan
                    annualBilling={annualBilling}
                    setAnnualBilling={setAnnualBilling}
                    handlePremiumSignup={handlePremiumSignup}
                    isProcessingPayment={isProcessingPayment}
                    monthlyPrice={monthlyPrice}
                    headingFont={headingFont}
                    bodyFont={bodyFont}
                    isFeaturedCard={true}
                />
            </div>
        </div>
    );
}

// Helper component for feature items
function FeatureItem({ included, text, tooltip, featured = false }) {
    const textClass = featured ? "text-green-800 font-medium" : "text-gray-700";
    const iconColor = included ? "text-green-500" : "text-red-400";

    const itemContent = (
        <div className={`flex items-start space-x-3 mb-3 ${featured ? 'py-1' : ''}`}>
            {/* New group for status icon and tooltip icon */}
            <div className="flex items-center flex-shrink-0 mt-1">
                {included ? (
                    <CheckCircleIcon className={`${iconColor} flex-shrink-0`} />
                ) : (
                    <CancelIcon className={`${iconColor} flex-shrink-0`} />
                )}
                {tooltip && (
                    <Tooltip title={tooltip} placement="top" arrow>
                        <InfoOutlinedIcon className="text-gray-400 ml-1 h-4 w-4 flex-shrink-0 cursor-help" />
                    </Tooltip>
                )}
            </div>
            {/* Feature text */}
            <span className={`${textClass} ${!included ? 'text-gray-500' : ''}`} style={{ fontFamily: '"Source Sans Pro", sans-serif', letterSpacing: '-0.01em' }}>
                {text}
            </span>
        </div>
    );

    return itemContent;
}