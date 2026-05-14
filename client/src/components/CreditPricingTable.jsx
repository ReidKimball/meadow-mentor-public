// client/src/components/CreditPricingTable.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import {
  Check,
  Star,
  Zap,
  Crown,
  Sparkles,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useCreditsQuery } from '../hooks/useUserQueries';
import { useUser } from '../context/UserContext';
import { API_BASE_URL } from '../env-config.js';
import { getCreditCheckoutUrl } from './features/payments/stripePayment.jsx';
import { app } from '../config/firestore.js';

const CreditBadge = ({ credits }) => (
  <Box sx={{
    position: 'absolute',
    top: 16,
    left: 0,
    bgcolor: '#FFBF00',
    color: '#013D1D',
    px: 2,
    py: 1,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    zIndex: 10,
    boxShadow: '0 4px 12px rgba(255, 191, 0, 0.4)',
    fontWeight: 800,
    fontSize: '0.75rem',
    fontFamily: 'Montserrat, sans-serif',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  }}>
    <Sparkles size={14} strokeWidth={3} />
    {credits} {credits === 1 ? 'Credit' : 'Credits'}
  </Box>
);

/**
 * CreditPricingTable - Displays credit packages for purchase
 * 
 * Replaces the old subscription-based pricing with one-time credit purchases
 */
export default function CreditPricingTable() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingPackage, setProcessingPackage] = useState(null);
  const scrollContainerRef = React.useRef(null);

  const { creditBalance } = useCreditsQuery();
  const { user } = useUser();

  // Fetch credit packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/stripe/credit-packages`);

        if (!response.ok) {
          throw new Error('Failed to fetch credit packages');
        }

        const data = await response.json();
        setPackages(data.packages || []);
      } catch (err) {
        console.error('Error fetching credit packages:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // Handle package purchase
  const handlePurchase = async (packageId) => {
    if (!user) {
      // Redirect to login
      window.location.href = '/signup?from=/pricing';
      return;
    }

    try {
      setProcessingPackage(packageId);

      // Track with Umami
      if (typeof window !== 'undefined' && window.umami) {
        window.umami.track('credit_purchase_click', {
          source: 'credit_pricing_table',
          package: packageId
        });
      }

      // Create Stripe checkout session
      const returnUrl = window.location.origin + '/credits/success?success=true';
      const checkoutUrl = await getCreditCheckoutUrl(app, packageId, returnUrl);

      // Redirect to Stripe
      window.location.assign(checkoutUrl);
    } catch (err) {
      console.error('Purchase failed:', err);
      setError('Failed to initiate purchase. Please try again.');
    } finally {
      setProcessingPackage(null);
    }
  };

  // Get package icon
  const getPackageIcon = (pkg) => {
    switch (pkg.id) {
      case 'sampler':
        return <Sparkles size={24} />;
      case 'starter':
        return <Zap size={24} />;
      case 'healer':
        return <Crown size={24} />;
      case 'healthstyle':
        return <TrendingUp size={24} />;
      default:
        return <Star size={24} />;
    }
  };

  // Get package color
  const getPackageColor = (pkg) => {
    switch (pkg.id) {
      case 'sampler':
        return '#013D1D';
      case 'starter':
        return '#013D1D';
      case 'healer':
        return '#FFBF00';
      case 'healthstyle':
        return '#013D1D';
      default:
        return '#013D1D';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={40} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{
      py: { xs: 4, md: 8 },
      px: { xs: 2, md: 4 },
      background: 'linear-gradient(180deg, #FFF8E5 0%, #FFFFFF 100%)',
      minHeight: '100vh',
      width: '100%'
    }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: 8, maxWidth: '800px', mx: 'auto' }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            color: '#013D1D',
            fontFamily: 'Montserrat, sans-serif',
            mb: 2,
            fontSize: { xs: '2.5rem', md: '3.5rem' }
          }}
        >
          Meadow Credits
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: '#444',
            fontFamily: '"Source Sans 3", sans-serif',
            fontSize: '1.25rem',
            mb: 3
          }}
        >
          Pay-as-you-go credits that never expire. Thrive at your own pace.
        </Typography>

        {user && creditBalance !== undefined && (
          <Box sx={{
            display: 'inline-block',
            bgcolor: '#DCFCE7',
            px: 3,
            py: 1,
            borderRadius: '100px',
            border: '1px solid #013D1D',
            mb: 4
          }}>
            <Typography variant="body1" sx={{ color: '#013D1D', fontWeight: 600 }}>
              Current balance: <strong>{creditBalance} credits</strong>
            </Typography>
          </Box>
        )}
      </Box>

      {/* Main Pricing Table Container */}
      <Box sx={{ maxWidth: '1400px', mx: 'auto', px: { xs: 2, md: 4 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: { xs: 3, md: 3, lg: 4 },
            alignItems: 'stretch'
          }}
        >
          {packages.map((pkg) => {
            const isHealer = pkg.id === 'healer';
            const brandColor = getPackageColor(pkg);

            return (
              <Card
                key={pkg.id}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  borderRadius: 4,
                  overflow: 'visible',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  border: isHealer ? `3px solid ${brandColor}` : '1px solid #eee',
                  boxShadow: isHealer
                    ? '0 20px 40px rgba(255, 191, 0, 0.2)'
                    : '0 4px 20px rgba(0, 0, 0, 0.05)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: isHealer
                      ? '0 30px 60px rgba(255, 191, 0, 0.3)'
                      : '0 12px 30px rgba(0, 0, 0, 0.1)',
                  },
                  ...(isHealer && {
                    '&::before': {
                      content: '"MOST POPULAR"',
                      whiteSpace: 'nowrap',
                      position: 'absolute',
                      top: -16,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: brandColor,
                      color: '#013D1D',
                      px: 3,
                      py: 0.75,
                      borderRadius: '50px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      zIndex: 10,
                      letterSpacing: '0.05em',
                      boxShadow: '0 4px 10px rgba(255, 191, 0, 0.4)'
                    }
                  })
                }}
              >
                <CardContent sx={{ p: { xs: 3, lg: 4 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                  {/* Icon Container with brand style */}
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Box
                      sx={{
                        width: 64,
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '24px',
                        background: isHealer
                          ? `linear-gradient(135deg, ${brandColor} 0%, #FFD700 100%)`
                          : `linear-gradient(135deg, #013D1D 0%, #047857 100%)`,
                        color: isHealer ? '#013D1D' : '#FFFFFF',
                        boxShadow: isHealer
                          ? 'inset 0 0 10px rgba(255, 160, 0, 0.6), 0 10px 20px rgba(255, 191, 0, 0.3)'
                          : '0 10px 20px rgba(1, 61, 29, 0.15)'
                      }}
                    >
                      {getPackageIcon(pkg)}
                    </Box>
                  </Box>

                  {/* Package Name */}
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 700,
                      textAlign: 'center',
                      fontFamily: 'Montserrat, sans-serif',
                      color: '#013D1D',
                      mb: 1
                    }}
                  >
                    {pkg.name}
                  </Typography>

                  {/* Credits */}
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography
                      variant="h2"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'Montserrat, sans-serif',
                        color: isHealer ? '#013D1D' : brandColor,
                        lineHeight: 1
                      }}
                    >
                      {pkg.credits}
                    </Typography>
                    <Typography
                      variant="overline"
                      sx={{
                        fontWeight: 700,
                        letterSpacing: 2,
                        color: '#666'
                      }}
                    >
                      Credits
                    </Typography>
                  </Box>

                  {/* Price */}
                  <Box sx={{ textAlign: 'center', mb: 4 }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        fontFamily: 'Montserrat, sans-serif',
                        color: '#1a1a1a'
                      }}
                    >
                      ${pkg.price}
                      {pkg.recurring && (
                        <Typography component="span" variant="body2" sx={{ fontSize: '1rem', color: '#666' }}>
                          /month
                        </Typography>
                      )}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#666',
                        fontFamily: '"Source Sans 3", sans-serif',
                        fontWeight: 600
                      }}
                    >
                      {pkg.recurring ? 'Billed monthly' : `${(pkg.price / pkg.credits).toFixed(2)} per credit`}
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 4, borderColor: '#eee' }} />

                  {/* Features */}
                  <List sx={{ mb: 4, flexGrow: 1 }}>
                    {[
                      pkg.recurring ? "Monthly credit refresh" : "Credits never expire",
                      "Use for any AI feature",
                      `${pkg.credits} recipe generations`,
                      `${Math.floor(pkg.credits / 5)} meal plans`,
                      ...(pkg.credits >= 25 ? [`${Math.floor(pkg.credits / 2)} recipe photos`] : []),
                      ...(pkg.recurring ? ["Cancel anytime"] : [])
                    ].map((feature, idx) => (
                      <ListItem key={idx} disableGutters sx={{ py: 1, px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 32, color: '#013D1D' }}>
                          <Check size={18} strokeWidth={3} />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          primaryTypographyProps={{
                            variant: 'body2',
                            fontWeight: 500,
                            color: '#333'
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {/* Purchase Button */}
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={processingPackage === pkg.id}
                    sx={{
                      py: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 800,
                      fontSize: '1rem',
                      fontFamily: 'Montserrat, sans-serif',
                      bgcolor: brandColor,
                      color: isHealer ? '#013D1D' : '#FFFFFF',
                      boxShadow: isHealer
                        ? '0 4px 14px rgba(255, 191, 0, 0.4)'
                        : '0 4px 14px rgba(1, 61, 29, 0.3)',
                      '&:hover': {
                        bgcolor: isHealer ? '#FFF8E5' : '#047857',
                        color: isHealer ? '#013D1D' : '#FFFFFF',
                        boxShadow: isHealer
                          ? '0 6px 20px rgba(255, 191, 0, 0.6)'
                          : '0 6px 20px rgba(1, 61, 29, 0.4)',
                        transform: 'translateY(-2px)'
                      },
                      '&:active': {
                        transform: 'translateY(0)'
                      }
                    }}
                  >
                    {processingPackage === pkg.id ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      pkg.recurring ? `Subscribe to ${pkg.name}` : `Purchase ${pkg.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      </Box>

      {/* Info Section */}
      <Box sx={{ mt: 12, textAlign: 'center', maxWidth: '900px', mx: 'auto' }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            fontFamily: 'Montserrat, sans-serif',
            color: '#013D1D',
            mb: 6
          }}
        >
          Simple Pricing. Powerful Results.
        </Typography>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
          gap: 4,
          mb: 8
        }}>
          {[
            { credits: '2 Credits', desc: 'Generate a recipe or modify an existing one.', icon: <Package size={20} /> },
            { credits: '5 Credits', desc: 'Create a complete weekly meal plan with recipes.', icon: <Zap size={20} /> },
            { credits: '1 Credit', desc: 'Add ingredients to your shopping list.', icon: <Sparkles size={20} /> }
          ].map((item, i) => (
            <Box key={i} sx={{
              p: 3,
              borderRadius: 4,
              bgcolor: '#fff',
              border: '1px solid #eee',
              boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
            }}>
              <Box sx={{ color: '#FFBF00', mb: 2, display: 'flex', justifyContent: 'center' }}>
                {item.icon}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 800, fontFamily: 'Montserrat, sans-serif', color: '#013D1D', mb: 1 }}>
                {item.credits}
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.6 }}>
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Personalized Recipe Example (1 Credit) */}
        <Box sx={{ mt: 10, mb: 10 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              color: '#013D1D',
              mb: 1,
              textAlign: 'center'
            }}
          >
            Infinite Culinary Inspiration
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 6,
              textAlign: 'center',
              fontFamily: '"Source Sans 3", sans-serif'
            }}
          >
            Generate fully compliant recipes tailored to your stage and symptoms in seconds.
          </Typography>
          <Box sx={{
            maxWidth: '394px',
            mx: 'auto',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: '1px solid #eee',
            transition: 'all 0.4s ease',
            cursor: 'default',
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.18)',
            }
          }}>
            <CreditBadge credits={2} />
            <Box
              component="img"
              src="https://storage.googleapis.com/meadow_mentor_public_media/images/credit_upgrade_recipe_example.webp"
              alt="1-credit recipe example"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </Box>
        </Box>

        {/* Personalized Meal Plan Example (5 Credits) */}
        <Box sx={{ mt: 10, mb: 10 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              color: '#013D1D',
              mb: 1,
              textAlign: 'center'
            }}
          >
            Your Whole Week, Sorted
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 6,
              textAlign: 'center',
              fontFamily: '"Source Sans 3", sans-serif'
            }}
          >
            Eliminate decision fatigue. Get a structured 7-day plan with one-click shopping lists.
          </Typography>
          <Box sx={{
            maxWidth: '578px',
            mx: 'auto',
            borderRadius: 8,
            overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: '1px solid #eee',
            transition: 'all 0.4s ease',
            cursor: 'default',
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: '0 30px 80px rgba(0,0,0,0.18)',
            }
          }}>
            <CreditBadge credits={5} />
            <Box
              component="img"
              src="https://storage.googleapis.com/meadow_mentor_public_media/images/credit_upgrade_mealplan_example_v2.webp"
              alt="5-credit meal plan example"
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block'
              }}
            />
          </Box>
        </Box>

        {/* Recipe Photo Showcase */}
        <Box sx={{ mt: 10, mb: 10, position: 'relative' }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontFamily: 'Montserrat, sans-serif',
              color: '#013D1D',
              mb: 1,
              textAlign: 'center'
            }}
          >
            Bring Your Recipes to Life
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#666',
              mb: 6,
              textAlign: 'center',
              fontFamily: '"Source Sans 3", sans-serif'
            }}
          >
            Create stunning, high-definition art for every dish you discover.
          </Typography>

          <Box sx={{ position: 'relative', px: { md: 8 } }}>
            {/* Scroll Buttons - Desktop Only */}
            <Box sx={{
              display: { xs: 'none', md: 'flex' },
              position: 'absolute',
              top: '50%',
              left: 0,
              right: 0,
              zIndex: 10,
              justifyContent: 'space-between',
              pointerEvents: 'none',
              transform: 'translateY(-50%)'
            }}>
              <Button
                onClick={() => scrollContainerRef.current?.scrollBy({ left: -400, behavior: 'smooth' })}
                sx={{
                  minWidth: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  color: '#013D1D',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  pointerEvents: 'auto',
                  border: '1px solid #eee',
                  '&:hover': { bgcolor: '#DCFCE7', transform: 'scale(1.1)' },
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronLeft size={24} />
              </Button>
              <Button
                onClick={() => scrollContainerRef.current?.scrollBy({ left: 400, behavior: 'smooth' })}
                sx={{
                  minWidth: 48,
                  height: 48,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.95)',
                  color: '#013D1D',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  pointerEvents: 'auto',
                  border: '1px solid #eee',
                  '&:hover': { bgcolor: '#DCFCE7', transform: 'scale(1.1)' },
                  transition: 'all 0.2s ease'
                }}
              >
                <ChevronRight size={24} />
              </Button>
            </Box>

            <Box
              ref={scrollContainerRef}
              sx={{
                display: 'flex',
                gap: 3,
                overflowX: 'auto',
                pb: 4,
                px: { xs: 2, md: 0 },
                mx: { xs: -2, md: 0 },
                scrollBehavior: 'smooth',
                '&::-webkit-scrollbar': { height: '6px' },
                '&::-webkit-scrollbar-track': { bgcolor: 'transparent' },
                '&::-webkit-scrollbar-thumb': { bgcolor: '#DCFCE7', borderRadius: '10px' },
                scrollSnapType: 'x mandatory'
              }}
            >
              {[
                'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693c47d84ae9c5e903d7dc80/scd-24-hour-fermented-yogurt-with-almond-butter-and-banana-693c47d84ae9c5e903d7dc80-v3-thumbnail.webp',
                'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/693ba24c0b614151d039c3b7/gaps-savory-mediterranean-chicken-cauliflower-rice-bowl-693ba24c0b614151d039c3b7-v3-thumbnail.webp',
                'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/69042634c838e78db6b58296/chewy-scd-honey-ginger-cookies-69042634c838e78db6b58296-v2-thumbnail.webp',
                'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/6933c601e4bfb42e53c19d55/spiced-chicken-and-bell-pepper-skillet-6933c601e4bfb42e53c19d55-v3-thumbnail.webp',
                'https://storage.googleapis.com/meadow_mentor_public_media/images/GenAI_RecipeCardHero/users/67be74b991d0bbf9af1973c9/recipes/694cd5564ba0f78239637c40/aip-ground-beef-sweet-potato-carrot-skillet-v1-thumbnail.webp'
              ].map((url, i) => (
                <Box key={i} sx={{
                  minWidth: { xs: '280px', md: '320px' },
                  height: { xs: '350px', md: '400px' },
                  borderRadius: 6,
                  overflow: 'hidden',
                  position: 'relative',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
                  transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  scrollSnapAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'scale(1.03) rotate(0.5deg)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  }
                }}>
                  <CreditBadge credits={2} />
                  <Box
                    component="img"
                    src={url}
                    alt={`Recipe photo example ${i + 1}`}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box sx={{
          bgcolor: '#FFBF00',
          p: 6,
          borderRadius: 6,
          color: '#013D1D',
          boxShadow: '0 20px 40px rgba(255, 191, 0, 0.2)',
          textAlign: 'center'
        }}>
          <Typography variant="h4" sx={{ fontWeight: 800, fontFamily: 'Montserrat, sans-serif', mb: 2, color: '#013D1D' }}>
            No Subscriptions. No Stress.
          </Typography>
          <Typography variant="h6" sx={{ maxWidth: '700px', mx: 'auto', mb: 0, fontWeight: 500, color: '#013D1D', opacity: 0.9 }}>
            Credits never expire. Buy what you need, use it when you want.
            Perfect for navigating your gut health journey without monthly pressure.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
