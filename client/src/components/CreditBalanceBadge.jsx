// client/src/components/CreditBalanceBadge.jsx
import React from 'react';
import { useCreditsQuery } from '../hooks/useUserQueries';
import { API_BASE_URL } from '../env-config';
import { getCreditCheckoutUrl } from './features/payments/stripePayment.jsx';
import { app } from '../config/firestore.js';
import {
  Tooltip,
  Avatar,
  CircularProgress,
  Typography,
  Box,
  Button
} from '@mui/material';
import { useNavigate } from 'react-router';
import {
  Coins,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Zap,
  Crown,
  Star,
  Info,
  ExternalLink
} from 'lucide-react';

/**
 * CreditBalanceBadge - Displays user's credit balance in the header
 * 
 * Shows:
 * - Current credit balance
 * - Loading state
 * - Error state
 * - Visual indicators for low credits
 */
export default function CreditBalanceBadge({ size = 'medium', showLabel = false }) {
  const {
    creditBalance,
    isLoading,
    error,
    hasCredits,
    isOutOfCredits
  } = useCreditsQuery();
  const navigate = useNavigate();

  // Handle loading state
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={size === 'small' ? 20 : 24} />
        {showLabel && (
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        )}
      </Box>
    );
  }

  // Handle error state
  if (error) {
    return (
      <Tooltip title="Error loading credits" arrow>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              bgcolor: 'error.main',
              width: size === 'small' ? 32 : 40,
              height: size === 'small' ? 32 : 40,
              fontSize: size === 'small' ? '0.875rem' : '1rem'
            }}
          >
            <AlertCircle size={size === 'small' ? 16 : 20} />
          </Avatar>
          {showLabel && (
            <Typography variant="body2" color="error">
              Error
            </Typography>
          )}
        </Box>
      </Tooltip>
    );
  }

  // Determine badge color and icon based on balance
  const getBadgeProps = () => {
    if (isOutOfCredits) {
      return {
        bgcolor: 'grey.500',
        color: 'white',
        icon: AlertCircle,
        tooltip: 'No credits remaining. Purchase more to continue using AI features.'
      };
    }

    if (creditBalance <= 5) {
      return {
        bgcolor: 'warning.main',
        color: 'white',
        icon: AlertCircle,
        tooltip: `Low credits: ${creditBalance} remaining. Consider purchasing more.`
      };
    }

    if (creditBalance <= 20) {
      return {
        bgcolor: 'info.main',
        color: 'white',
        icon: Coins,
        tooltip: `${creditBalance} credits available`
      };
    }

    return {
      bgcolor: 'success.main',
      color: 'white',
      icon: TrendingUp,
      tooltip: `${creditBalance} credits available`
    };
  };

  const { bgcolor, color, icon: Icon, tooltip } = getBadgeProps();
  const avatarSize = size === 'small' ? 32 : 40;
  const iconSize = size === 'small' ? 16 : 20;

  return (
    <Tooltip
      title={tooltip}
      arrow
      placement="bottom"
      enterTouchDelay={0}
      leaveTouchDelay={3000}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}>
        <Avatar
          sx={{
            bgcolor,
            color,
            width: avatarSize,
            height: avatarSize,
            fontSize: size === 'small' ? '0.875rem' : '1rem',
            fontWeight: 'bold',
            border: theme => `2px solid ${theme.palette.background.paper}`,
            boxShadow: theme => theme.shadows[2]
          }}
        >
          <Icon size={iconSize} />
        </Avatar>

        {showLabel && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ lineHeight: 1 }}
              >
                Credits
              </Typography>
              <Typography
                variant={size === 'small' ? 'body2' : 'body1'}
                fontWeight="bold"
                color={isOutOfCredits ? 'error.main' : 'text.primary'}
              >
                {creditBalance}
              </Typography>
            </Box>

            <Button
              size="small"
              variant="outlined"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/upgrade');
              }}
              sx={{
                height: 24,
                fontSize: '0.65rem',
                px: 1,
                minWidth: 'auto',
                borderColor: '#eee',
                color: '#666',
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                textTransform: 'none',
                '&:hover': {
                  borderColor: '#013D1D',
                  bgcolor: '#DCFCE7',
                  color: '#013D1D'
                }
              }}
            >
              Get More
            </Button>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}

/**
 * Compact version for mobile or tight spaces
 */
export function CompactCreditBadge() {
  const { creditBalance, isLoading, error } = useCreditsQuery();

  if (isLoading || error) {
    return <CreditBalanceBadge size="small" />;
  }

  return (
    <Tooltip
      title={`${creditBalance} credits available`}
      arrow
      enterTouchDelay={0}
      leaveTouchDelay={3000}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 0.5,
          borderRadius: 2,
          bgcolor: creditBalance > 0 ? 'primary.main' : 'grey.500',
          color: 'white',
          fontSize: '0.875rem',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'scale(1.05)',
            boxShadow: theme => theme.shadows[4]
          }
        }}
      >
        <Coins size={14} />
        <span>{creditBalance}</span>
      </Box>
    </Tooltip>
  );
}

/**
 * Fetch credit packages from API.
 * @returns {Promise<Array>} Array of credit packages.
 */
async function fetchCreditPackages() {
  const response = await fetch(`${API_BASE_URL}/api/stripe/credit-packages`);
  if (!response.ok) throw new Error('Failed to fetch credit packages');
  const data = await response.json();
  return data.packages || [];
}

/**
 * Full credit status component for account pages
 */
export function CreditStatusCard() {
  const {
    creditBalance,
    isLoading,
    error,
    hasCredits,
  } = useCreditsQuery();
  const navigate = useNavigate();

  const [packages, setPackages] = React.useState([]);

  React.useEffect(() => {
    fetchCreditPackages()
      .then(setPackages)
      .catch(console.error);
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '1px solid #eee' }}>
        <CircularProgress sx={{ color: '#013D1D' }} thickness={5} />
        <Typography variant="body2" sx={{ mt: 2, fontFamily: '"Source Sans 3", sans-serif', color: '#666' }}>
          Loading credit balance...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 4, border: '1px solid #eee' }}>
        <Typography color="error" sx={{ fontFamily: '"Source Sans 3", sans-serif', fontWeight: 600 }}>
          Error loading credits: {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 4,
        bgcolor: 'background.paper',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        border: '1px solid #eee',
        width: '100%',
        maxWidth: 'none'
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38,
            height: 38,
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #FFBF00 0%, #FFD700 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 8px rgba(255, 160, 0, 0.6)'
          }}>
            <Zap size={20} color="#013D1D" strokeWidth={2.5} />
          </Box>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontFamily: 'Montserrat, sans-serif',
                fontWeight: 700,
                color: '#013D1D',
                lineHeight: 1.2
              }}
            >
              Credit Balance
            </Typography>
            <Button
              onClick={() => navigate('/upgrade')}
              startIcon={<Info size={14} />}
              sx={{
                p: 0,
                fontSize: '0.80rem',
                color: '#666',
                textTransform: 'none',
                fontFamily: '"Source Sans 3", sans-serif',
                '&:hover': { bgcolor: 'transparent', color: '#013D1D', textDecoration: 'underline' }
              }}
            >
              Learn how credits work
            </Button>
          </Box>
        </Box>
        <CreditBalanceBadge />
      </Box>

      <Typography
        variant="h3"
        sx={{
          fontFamily: 'Montserrat, sans-serif',
          fontWeight: 800,
          color: '#013D1D',
          mb: 1
        }}
      >
        {creditBalance} Credits
      </Typography>

      <Typography
        variant="body1"
        sx={{
          fontFamily: '"Source Sans 3", sans-serif',
          color: '#444',
          mb: 4,
          maxWidth: '500px'
        }}
      >
        {hasCredits
          ? 'Credits never expire! Use them for recipes, meal plans, and more.'
          : 'Purchase credits to unlock AI-powered features.'
        }
      </Typography>

      {!hasCredits && (
        <Box sx={{
          mb: 4,
          p: 2,
          bgcolor: '#FFF8E5',
          borderRadius: 2,
          border: '1px solid #FFBF00',
          display: 'flex',
          alignItems: 'center',
          gap: 1.5
        }}>
          <AlertCircle size={20} color="#013D1D" />
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: '#013D1D',
              fontFamily: '"Source Sans 3", sans-serif'
            }}
          >
            You're out of credits! Purchase more to continue using AI features.
          </Typography>
        </Box>
      )}

      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          color: '#666',
          mb: 2,
          fontFamily: 'Montserrat, sans-serif'
        }}
      >
        Quick Fill Packages
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {packages.slice(0, 4).map(pkg => {
          const getPackageIcon = (pkgId) => {
            switch (pkgId) {
              case 'sampler': return <Sparkles size={20} />;
              case 'starter': return <Zap size={20} />;
              case 'healer': return <Crown size={20} />;
              case 'healthstyle': return <TrendingUp size={20} />;
              default: return <Star size={20} />;
            }
          };

          return (
            <Box
              key={pkg.id}
              sx={{
                flex: 1,
                minWidth: 140,
                p: 2.5,
                borderRadius: 3,
                border: '1px solid #eee',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                '&:hover': {
                  borderColor: '#013D1D',
                  bgcolor: '#DCFCE7',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 4px 12px rgba(1, 61, 29, 0.08)'
                }
              }}
              onClick={async () => {
                try {
                  const returnUrl = window.location.origin + '/credits/success?success=true';
                  const checkoutUrl = await getCreditCheckoutUrl(app, pkg.id, returnUrl);
                  window.location.assign(checkoutUrl);
                } catch (err) {
                  console.error('Purchase failed:', err);
                }
              }}
            >
              <Box sx={{
                width: 44,
                height: 44,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '14px',
                mb: 2,
                background: pkg.id === 'healer'
                  ? 'linear-gradient(135deg, #FFBF00 0%, #FFD700 100%)'
                  : 'linear-gradient(135deg, #013D1D 0%, #047857 100%)',
                color: pkg.id === 'healer' ? '#013D1D' : '#FFFFFF',
                boxShadow: pkg.id === 'healer'
                  ? 'inset 0 0 10px rgba(255, 160, 0, 0.6), 0 4px 12px rgba(255, 191, 0, 0.2)'
                  : '0 4px 12px rgba(1, 61, 29, 0.15)'
              }}>
                {getPackageIcon(pkg.id)}
              </Box>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800,
                  color: '#013D1D',
                  mb: 0.5
                }}
              >
                {pkg.credits}
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 600,
                  color: '#666',
                  mb: 1.5,
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                  letterSpacing: '0.05em'
                }}
              >
                Credits
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 700,
                  color: '#013D1D'
                }}
              >
                ${pkg.price}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
