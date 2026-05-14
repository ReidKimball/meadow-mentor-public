import React from 'react';
import { Link } from 'react-router';
import { Button, Paper, Typography, Tooltip, ButtonGroup, CircularProgress, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Crown } from 'lucide-react';

function FeatureItem({ included, text, tooltip, featured = false }) { // The 'featured' prop will now be largely ignored for colors
  const itemColor = 'text-gray-700'; // Matches PricingTable Basic plan
  const iconColorIncluded = 'text-green-500'; // Matches PricingTable Basic plan
  const iconColorNotIncluded = 'text-red-400'; // Matches PricingTable Basic plan
  const tooltipIconColor = 'text-gray-400'; // Matches PricingTable Basic plan

  return (
    <Box display="flex" alignItems="flex-start" mb={1.5} sx={{ fontFamily: '"Source Sans Pro", sans-serif' }}>
      <Box display="flex" alignItems="center" mr={1} mt={0.25}>
        {included ? 
          <CheckCircleIcon sx={{ color: iconColorIncluded, flexShrink: 0 }} /> : 
          <CancelIcon sx={{ color: iconColorNotIncluded, flexShrink: 0 }} />}
        {tooltip && (
          <Tooltip title={tooltip} placement="top" arrow>
            <InfoOutlinedIcon sx={{ color: tooltipIconColor, marginLeft: '4px', cursor: 'pointer', fontSize: '1rem', flexShrink: 0 }} />
          </Tooltip>
        )}
      </Box>
      <Typography variant="body1" sx={{ color: itemColor, flexGrow: 1, letterSpacing: '-0.01em' }}> 
        {text}
      </Typography>
    </Box>
  );
}

export default function GetEarlyAdopterPlan({
    annualBilling,
    setAnnualBilling,
    handlePremiumSignup,
    isProcessingPayment,
    monthlyPrice,
    headingFont,
    bodyFont,
    isFeaturedCard = true // Defaulting to true as this card is usually the 'featured' one, controls border etc.
}) {
    // Determine border style based on isFeaturedCard
    const paperClassName = `rounded-2xl overflow-hidden relative py-4 flex flex-col ${isFeaturedCard ? 'border-2 border-green-500' : 'border border-gray-300'}`;

    return (
        <Paper elevation={isFeaturedCard ? 5 : 3} className={paperClassName}>
            {isFeaturedCard && (
                <div className="absolute top-0 right-0 bg-green-600 text-white px-4 py-1 rounded-bl-lg"
                    style={{ ...bodyFont, fontWeight: 600 }}
                >
                    BEST VALUE
                </div>
            )}

            <div className="flex justify-center my-8">
                <ButtonGroup variant="contained" aria-label="billing period toggle">
                    <Button
                        onClick={() => setAnnualBilling(false)}
                        variant={!annualBilling ? "contained" : "outlined"}
                        sx={{
                            px: 3,
                            bgcolor: !annualBilling ? 'primary.main' : 'transparent',
                            color: !annualBilling ? 'white' : 'primary.main',
                            '&:hover': {
                                bgcolor: !annualBilling ? 'primary.dark' : 'rgba(25, 118, 210, 0.08)',
                            },
                            fontFamily: 'Source Sans Pro, sans-serif',
                            fontWeight: 400,
                            letterSpacing: '-0.01em'
                        }}
                    >
                        Monthly
                    </Button>
                    <Button
                        onClick={() => setAnnualBilling(true)}
                        variant={annualBilling ? "contained" : "outlined"}
                        sx={{
                            px: 3,
                            bgcolor: annualBilling ? 'primary.main' : 'transparent',
                            color: annualBilling ? 'white' : 'primary.main',
                            '&:hover': {
                                bgcolor: annualBilling ? 'primary.dark' : 'rgba(25, 118, 210, 0.08)',
                            },
                            fontFamily: 'Source Sans Pro, sans-serif',
                            fontWeight: 400,
                            letterSpacing: '-0.01em'
                        }}
                    >
                        Annually <span className="ml-1 text-sm" style={{ color: annualBilling ? 'white' : '#2e7d32' }}>Save 15%</span>
                    </Button>
                </ButtonGroup>
            </div>

            <div className="bg-green-900 text-white p-6 text-center">
                <div className="flex justify-center items-center gap-2 mb-2">
                    <Crown className="h-6 w-6" />
                    <Typography variant="h5" className="font-medium" sx={{ ...headingFont, fontWeight: 500 }}>
                        Early Adopter Premium
                    </Typography>
                </div>

                <Typography variant="h3" className="my-1 font-medium" sx={{ ...headingFont, fontWeight: 500 }}>
                    {annualBilling ? `$${(102 / 12).toFixed(2)}` : `$${monthlyPrice.toFixed(2)}`}
                </Typography>
                <Typography variant="body2" sx={{ ...bodyFont, color: 'rgba(255,255,255,0.8)' }}>
                    {annualBilling ? 'Per month, billed as $102.00 per year' : 'Per month'}
                </Typography>
                <Typography variant="body1" sx={{ ...bodyFont, mt: 2, color: 'rgba(255,255,255,0.9)' }}>
                    Unlock the full experience for less than {annualBilling ? `$${(102 / 365).toFixed(2)}` : `$${(10 / 30).toFixed(2)}`}/day
                </Typography>
            </div>

            <div className="p-6 flex-grow">
                {/* Always pass featured={true} here because this section of the card has a dark background */}
                <FeatureItem included={true} text="All Basic features, plus:" featured={true} />
                <FeatureItem included={true} text="Use each AI feature 30 times per day." tooltip="Explore and utilize AI capabilities without daily limits" featured={true} />
                {/* <FeatureItem included={true} text="Food Journal - View unlimited meal and symptom history or custom date ranges" featured={true} />
                <FeatureItem included={true} text="Food Journal - Get personalized AI insights from your meal and symptom data" tooltip="Use AI to analyze your meal and symptom data for patterns." featured={true} /> */}
                {/* <FeatureItem included={true} text="AI feature - Create 7-day meal plans" tooltip="Personalized meal plans that adhere to your therapeutic diet" featured={true} /> */}
                
                {/* <FeatureItem
                    included={true}
                    text={
                        <>
                            Early preview access to new features. See our <Link to="/roadmap" className="text-blue-600 hover:underline">Roadmap</Link> for future plans.
                        </>
                    }
                    tooltip='New features are added weekly'
                    featured={true}
                /> */}
                <FeatureItem included={true} text="Priority support" tooltip="Get faster responses to your questions and issues" featured={true} />
                <FeatureItem included={true} text="Shape development by giving feedback, and requesting new features" tooltip="Help shape the future of Meadow Mentor" featured={true} />
            </div>
            <div className="p-6 text-center">
                <Button
                    variant="contained"
                    color="primary" 
                    onClick={handlePremiumSignup}
                    disabled={isProcessingPayment} // Disable button when loading
                    sx={{
                        ...bodyFont,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        padding: '10px 20px',
                    }}
                >
                    {isProcessingPayment ? (
                        <>
                            <CircularProgress size={24} sx={{ color: 'white', marginRight: '8px' }} />
                            Processing...
                        </>
                    ) : (
                        'Get Early Adopter Access'
                    )}
                </Button>
            </div>
        </Paper>
    );
}
