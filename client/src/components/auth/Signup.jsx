import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link, useLocation } from 'react-router';
import Button from '@mui/material/Button'
import { ClipboardPlus } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import GoogleIcon from '@mui/icons-material/Google';
import { API_BASE_URL } from '../../env-config.js'
import { TextField, FormHelperText, LinearProgress, Box, InputAdornment, IconButton, Divider, CircularProgress, Card, CardContent, Typography, Container } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    getAdditionalUserInfo
} from "firebase/auth"
import { auth } from '../../config/firestore.js';
import { useUser } from '../../context/UserContext';
import Alert from '@mui/material/Alert';

export default function Signup({ setIsAuthenticated }) {
    const { setUser, setIsNewUser } = useUser();
    const [firstName, setFirstName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [googleError, setGoogleError] = useState('');
    const [passwordStrength, setPasswordStrength] = useState(0)
    const [passwordErrors, setPasswordErrors] = useState([])
    const [showPassword, setShowPassword] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false);
    const [firstNameError, setFirstNameError] = useState('');
    const [token, setToken] = useState(null);
    const turnstileRef = useRef(null);

    const navigate = useNavigate()
    const location = useLocation();

    // Check for saveRecipe query param (from frontend /recipes page modal)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const recipeToSave = params.get('saveRecipe');
        if (recipeToSave) {
            localStorage.setItem('recipeToSaveAfterLogin', recipeToSave);
            console.log('[Signup] Stored recipeToSaveAfterLogin:', recipeToSave);
        }

        const anonSessionId = params.get('anonSessionId');
        if (anonSessionId) {
            localStorage.setItem('anonSessionIdToClaimAfterLogin', anonSessionId);
            console.log('[Signup] Stored anonSessionIdToClaimAfterLogin:', anonSessionId);
        }
    }, [location.search]);

    const trackClick = (method = 'email') => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track(`signup_button_click_${method}`, {
                source: 'signup page',
                location: `signup_button_${method}`,
                button_text: method === 'google' ? 'Sign in with Google' : 'Sign Up'
            });
        }
    };

    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    // Validate firstName - only letters, spaces, hyphens, and apostrophes allowed
    const validateFirstName = (name) => {
        if (!name || name.trim().length === 0) {
            return ''; // Required validation handled by form
        }
        const invalidChars = name.match(/[^a-zA-Z\s\-']/g);
        if (invalidChars) {
            const uniqueInvalid = [...new Set(invalidChars)].join(', ');
            return `First name can only contain letters, spaces, hyphens, and apostrophes. Please remove: ${uniqueInvalid}`;
        }
        return '';
    };

    const handleFirstNameChange = (e) => {
        const value = e.target.value;
        setFirstName(value);
        setFirstNameError(validateFirstName(value));
    };

    const passwordValidations = [
        { regex: /.{8,}/, message: 'At least 8 characters' },
        { regex: /[a-z]/, message: 'At least one lowercase letter' },
        { regex: /[A-Z]/, message: 'At least one uppercase letter' },
        { regex: /[0-9]/, message: 'At least one number' },
        { regex: /[^A-Za-z0-9]/, message: 'At least one special character' }
    ]

    useEffect(() => {
        if (password) {
            const errors = []
            let strength = 0

            passwordValidations.forEach(validation => {
                if (validation.regex.test(password)) {
                    strength += 20
                } else {
                    errors.push(validation.message)
                }
            })

            setPasswordStrength(strength)
            setPasswordErrors(errors)

        } else {
            setPasswordStrength(0)
            setPasswordErrors([])
        }
    }, [password])

    const getStrengthColor = () => {
        if (passwordStrength < 40) return 'error'
        if (passwordStrength < 80) return 'warning'
        return 'success'
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');
        setGoogleError('');
        const provider = new GoogleAuthProvider();

        try {
            if (!token) {
                setError('Please complete the security check');
                setGoogleLoading(false);
                return;
            }
            trackClick('google');
            setIsNewUser(true);

            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const additionalUserInfo = getAdditionalUserInfo(result);

            if (additionalUserInfo?.isNewUser) {
                const idToken = await user.getIdToken();

                // Extract and sanitize firstName for validation
                // Backend only allows letters, spaces, hyphens, and apostrophes
                let rawFirstName = user.displayName?.split(' ')[0] || user.email?.split('@')[0] || 'User';
                // Remove any characters that aren't letters, spaces, hyphens, or apostrophes
                let sanitizedFirstName = rawFirstName.replace(/[^a-zA-Z\s\-']/g, '');
                // Fallback if sanitization removes everything
                if (!sanitizedFirstName || sanitizedFirstName.trim().length === 0) {
                    sanitizedFirstName = 'User';
                }

                const profileResponse = await fetch(`${API_BASE_URL}/api/users`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`,
                    },
                    body: JSON.stringify({
                        firebaseUID: user.uid,
                        firstName: sanitizedFirstName,
                        email: user.email,
                        token: token,
                    })
                });

                if (!profileResponse.ok) {
                    let errorBody;
                    try {
                        errorBody = await profileResponse.json();
                    } catch (e) {
                        errorBody = await profileResponse.text();
                    }
                    const errorMessage = typeof errorBody === 'object' && errorBody.message
                        ? errorBody.message
                        : `Failed to create user profile. Status: ${profileResponse.status}`;
                    console.error(errorMessage);
                } else {
                    const savedProfile = await profileResponse.json();
                    setUser(savedProfile);
                    localStorage.setItem('userFirstName', savedProfile.firstName);
                }
            }

            setIsAuthenticated(true);
            setIsNewUser(false);

            if (additionalUserInfo?.isNewUser && window.posthog) {
                window.posthog.identify(user.uid, { email: user.email });
                window.posthog.capture('signup_completed', { method: 'google' });
            }

            const redirectPath = location.state?.from || '/guidebook';
            navigate(redirectPath);

        } catch (error) {
            console.error('Google Sign-in Error:', error);
            setIsNewUser(false);
            if (error.code === 'auth/popup-closed-by-user') {
                setGoogleError('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                setGoogleError('An account already exists with this email address using a different sign-in method. Try logging in with that method.');
            } else {
                setGoogleError(getErrorMessage(error.code) || 'An error occurred during Google Sign-in. Please try again.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleSignup = async (event) => {
        event.preventDefault()
        setError('')
        setGoogleError('');

        if (passwordErrors.length > 0) {
            setError('Please fix the password issues before continuing')
            return
        }

        const nameError = validateFirstName(firstName);
        if (nameError) {
            setFirstNameError(nameError);
            setError('Please fix the first name issue before continuing');
            return;
        }

        if (!token) {
            setError('Please complete the security check');
            return;
        }

        try {
            trackClick('email');
            setIsNewUser(true);

            const userCredential = await createUserWithEmailAndPassword(auth, email, password)
            const firebaseUser = userCredential.user
            const idToken = await firebaseUser.getIdToken();

            const response = await fetch(`${API_BASE_URL}/api/users`, {

                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    firebaseUID: firebaseUser.uid,
                    firstName: firstName,
                    email: firebaseUser.email,
                    token: token,
                })
            })

            if (!response.ok) {
                let errorBody;
                try { errorBody = await response.json(); } catch (e) { try { errorBody = await response.text(); } catch (textError) { errorBody = `Could not read error response body. Status: ${response.status}`; } }
                const errorMessage = typeof errorBody === 'object' && errorBody.message ? errorBody.message : `Failed to create user profile. Status: ${response.status}`;
                throw new Error(errorMessage);
            }

            const savedProfile = await response.json();
            setUser(savedProfile);
            setIsAuthenticated(true);
            localStorage.setItem('userFirstName', savedProfile.firstName);
            setIsNewUser(false);

            if (window.posthog) {
                window.posthog.identify(firebaseUser.uid, { email: firebaseUser.email });
                window.posthog.capture('signup_completed', { method: 'email' });
            }

            const redirectPathAfterSignup = location.state?.from || '/guidebook';
            navigate(redirectPathAfterSignup);

        } catch (error) {
            console.error('Signup Error:', error);
            setIsNewUser(false);

            try {
                await auth.signOut();
            } catch (signOutError) {
                console.error('Error signing out after signup failure:', signOutError);
            }

            let errorMessage;
            if (error.code) {
                errorMessage = getErrorMessage(error.code);
            } else {
                errorMessage = error.message || 'An unexpected error occurred during signup.';
            }
            setError(errorMessage);
            if (turnstileRef.current) {
                turnstileRef.current.reset();
            }
            setToken(null);
        }
    };

    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/email-already-in-use':
                return 'This email is already registered. Please use a different email or try logging in.'
            case 'auth/invalid-email':
                return 'Please enter a valid email address.'
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled. Please contact support.'
            case 'auth/weak-password':
                return 'Password should be at least 8 characters long.'
            case 'auth/popup-closed-by-user':
                return 'Sign-in window closed before completion.';
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with this email using a different sign-in method.';
            default:
                return null;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                if ((location.pathname === '/signup' || location.pathname === '/login') && !error && !googleError) {
                    const redirectPath = location.state?.from || '/guidebook';
                    navigate(redirectPath, { replace: true });
                }
            }
        })

        return () => unsubscribe()
    }, [auth, navigate, location, error, googleError])


    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <Container maxWidth="sm">
                <Card sx={{ borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    <Box sx={{ height: 8, bgcolor: '#013D1D', width: '100%' }} />

                    <CardContent sx={{ p: 4 }}>
                        <Typography
                            variant="h4"
                            component="h1"
                            align="center"
                            sx={{
                                fontWeight: 700,
                                color: '#013D1D',
                                mb: 2,
                                fontFamily: 'Montserrat, sans-serif',
                            }}
                        >
                            Sign Up for Meadow Mentor
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ color: '#525252', mb: 4 }}>
                            Create an account to get started or log in below if you already have one.
                        </Typography>

                        {/* Google Sign-in Button */}
                        <Button
                            variant="outlined"
                            startIcon={googleLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
                            onClick={handleGoogleSignIn}
                            fullWidth
                            size="large"
                            disabled={googleLoading || !token}
                            sx={{
                                textTransform: 'none',
                                justifyContent: 'center',
                                py: 1.5,
                                borderColor: '#e5e7eb',
                                color: '#1f2937',
                                '&:hover': {
                                    borderColor: '#d1d5db',
                                    bgcolor: '#f9fafb'
                                }
                            }}
                        >
                            Sign up with Google
                        </Button>
                        {googleError && (
                            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                                {googleError}
                            </Alert>
                        )}

                        <Divider sx={{ my: 3 }}>
                            <Typography variant="caption" color="text.secondary">OR</Typography>
                        </Divider>

                        {/* Email/Password Form */}
                        <form onSubmit={handleSignup} className='sign-up-form space-y-4'>
                            <TextField
                                id="firstName-signup"
                                label="First Name"
                                name='firstName'
                                value={firstName}
                                onChange={handleFirstNameChange}
                                required
                                fullWidth
                                variant="outlined"
                                error={!!firstNameError}
                                helperText={firstNameError}
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                id="email-signup"
                                label="Email"
                                name='email'
                                type='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />

                            {/* Password */}
                            <TextField
                                id="password-signup"
                                label="Password"
                                name='password'
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                error={password.length > 0 && passwordErrors.length > 0}
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleTogglePasswordVisibility}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    )
                                }}
                                sx={{ mb: 1 }}
                            />
                            {password.length > 0 && (
                                <Box sx={{ width: '100%', mt: 1 }}>
                                    <LinearProgress
                                        variant="determinate"
                                        value={passwordStrength}
                                        color={getStrengthColor()}
                                        sx={{ height: 8, borderRadius: 5 }}
                                    />
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                                        <FormHelperText sx={{ color: passwordStrength < 40 ? 'error.main' : 'text.secondary' }}>Weak</FormHelperText>
                                        <FormHelperText sx={{ color: passwordStrength >= 40 && passwordStrength < 100 ? 'warning.main' : (passwordStrength === 100 ? 'success.main' : 'text.secondary') }}>
                                            {passwordStrength < 80 ? 'Medium' : 'Strong'}
                                        </FormHelperText>
                                    </Box>

                                    {passwordErrors.length > 0 && (
                                        <Box sx={{ mt: 1 }}>
                                            <FormHelperText sx={{ color: 'error.main' }}>
                                                Password must contain:
                                            </FormHelperText>
                                            {passwordErrors.map((errorMsg, index) => (
                                                <FormHelperText key={index} sx={{ color: 'error.main', ml: 2 }}>
                                                    • {errorMsg}
                                                </FormHelperText>
                                            ))}
                                        </Box>
                                    )}
                                </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', my: 2 }}>
                                <Turnstile
                                    ref={turnstileRef}
                                    siteKey={import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY || ''}
                                    onSuccess={(token) => {
                                        setToken(token);
                                        setError('');
                                    }}
                                    onError={() => {
                                        setError('Security check failed. Please try again.');
                                    }}
                                    onExpire={() => setToken(null)}
                                    options={{
                                        theme: 'auto',
                                        size: 'normal',
                                    }}
                                />
                            </Box>

                            {/* Email Signup Button */}
                            <Button
                                type='submit'
                                variant='contained'
                                startIcon={<ClipboardPlus />}
                                size='large'
                                fullWidth
                                disabled={!token}
                                sx={{
                                    bgcolor: '#013D1D',
                                    color: 'white',
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    marginTop: '1rem',
                                    '&:hover': {
                                        bgcolor: '#047857',
                                    },
                                    '&:disabled': {
                                        bgcolor: '#9CA3AF',
                                        color: '#FFFFFF',
                                    }
                                }}
                            >
                                Sign up with Email
                            </Button>

                            {/* Email/Password Error Display */}
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                        </form>

                        <Divider sx={{ my: 4 }} />

                        {/* Link to Login */}
                        <Typography align="center" variant="body2" color="text.secondary">
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: '#013D1D', fontWeight: 600, textDecoration: 'none' }}>
                                Log in here
                            </Link>
                        </Typography>
                    </CardContent>
                </Card>
            </Container>
        </Box>
    );
}