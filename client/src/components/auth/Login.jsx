import { API_BASE_URL } from '../../env-config.js'
import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router'
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    signInWithPopup, 
    GoogleAuthProvider
} from "firebase/auth"
import { Button, CircularProgress, Divider, Box, Card, CardContent, Typography, Container } from '@mui/material' 
import { Mail } from 'lucide-react';
import GoogleIcon from '@mui/icons-material/Google';
import { TextField, InputAdornment, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import Alert from '@mui/material/Alert';
import { auth } from '../../config/firestore.js';

export default function Login({ setIsAuthenticated }) {

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [googleError, setGoogleError] = useState('');
    const [showPassword, setShowPassword] = useState(false)
    const [googleLoading, setGoogleLoading] = useState(false);
    const navigate = useNavigate()
    const location = useLocation(); 

    // Add these new states for password reset functionality
    const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false)
    const [resetEmail, setResetEmail] = useState('')
    const [resetEmailSent, setResetEmailSent] = useState(false)
    const [resetError, setResetError] = useState('')
    const [isResetting, setIsResetting] = useState(false)

    // Toggle password visibility
    const handleTogglePasswordVisibility = () => {
        setShowPassword(!showPassword)
    }

    // getErrorMessage
    const getErrorMessage = (errorCode) => {
        switch (errorCode) {
            case 'auth/invalid-email':
                return 'Please enter a valid email address';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
            case 'auth/invalid-credential':
                return 'Invalid login credentials, please try again';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/popup-closed-by-user':
                return 'Sign-in window closed before completion.';
            case 'auth/account-exists-with-different-credential':
                return 'An account already exists with this email using a different sign-in method.';
            default:
                return 'Login error - please try again';
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const redirectPath = location.state?.from || '/ask-kay';
                navigate(redirectPath, { replace: true });
            }
        });
        return () => unsubscribe();
    }, [auth, navigate, location]);

    const handleLogin = async (event) => {
        event.preventDefault()
        setError('')
        setGoogleError('');

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setIsAuthenticated(true);
            
            // Update last login time
            try {
              const idToken = await userCredential.user.getIdToken();
              await fetch(`${API_BASE_URL}/api/users/${userCredential.user.uid}/last-login`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
                }
              });
            } catch (error) {
              console.error('Error updating last login time:', error);
            }
            
            const redirectPathEmail = location.state?.from || '/ask-kay';
            navigate(redirectPathEmail); 
        } catch (error) {
            console.error('Firebase auth error', error)
            const errorCode = error.code || 'unknown-error'
            const errorMessage = getErrorMessage(errorCode)
            setError(errorMessage)
        }
    }

    const handleGoogleSignIn = async () => {
        setGoogleLoading(true);
        setError('');
        setGoogleError('');
        const provider = new GoogleAuthProvider();

        try {
            const result = await signInWithPopup(auth, provider);
            setIsAuthenticated(true);
            
            // Update last login time
            try {
              const idToken = await result.user.getIdToken();
              await fetch(`${API_BASE_URL}/api/users/${result.user.uid}/last-login`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${idToken}`,
                  'Content-Type': 'application/json'
                }
              });
            } catch (error) {
              console.error('Error updating last login time:', error);
            }
            
            const redirectPathGoogle = location.state?.from || '/ask-kay';
            navigate(redirectPathGoogle); 
        } catch (error) {
            console.error('Google Sign-in Error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                setGoogleError('Sign-in cancelled. Please try again.');
            } else if (error.code === 'auth/account-exists-with-different-credential') {
                setGoogleError('An account exists with this email using a different sign-in method. Try logging in with email/password or resetting your password.');
            } else {
                setGoogleError(getErrorMessage(error.code) || 'An error occurred during Google Sign-in. Please try again.');
            }
        } finally {
            setGoogleLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        setResetError('')
        setResetEmailSent(false)
        setIsResetting(true)

        try {
            await sendPasswordResetEmail(auth, resetEmail)
            setResetEmailSent(true)
            setTimeout(() => {
                setForgotPasswordOpen(false)
                setResetEmailSent(false)
                setResetEmail('')
            }, 3000)
        } catch (error) {
            console.error('Password reset error:', error)
            const errorCode = error.code || 'unknown-error'

            if (errorCode === 'auth/user-not-found') {
                setResetError('No account found with this email address')
            } else if (errorCode === 'auth/invalid-email') {
                setResetError('Please enter a valid email address')
            } else {
                setResetError('Error sending password reset email. Please try again.')
            }
        } finally {
            setIsResetting(false)
        }
    }

    return (
        <Box sx={{ minHeight: '100vh', bgcolor: '#fafafa', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 8 }}>
            <Container maxWidth="sm">
                <Card sx={{ borderRadius: 4, boxShadow: '0 8px 24px rgba(0,0,0,0.08)', overflow: 'hidden' }}>
                    {/* Green Header Strip */}
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
                          Log In to Meadow Mentor
                        </Typography>
                        <Typography variant="body1" align="center" sx={{ color: '#525252', mb: 4 }}>
                            Access your personalized health tools and insights.
                        </Typography>

                        {/* Google Sign-in Button */}
                        <Button
                            variant="outlined"
                            startIcon={googleLoading ? <CircularProgress size={20} color="inherit" /> : <GoogleIcon />}
                            onClick={handleGoogleSignIn}
                            fullWidth
                            size="large"
                            disabled={googleLoading}
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
                            Log in with Google
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
                        <form onSubmit={handleLogin} className='login-form space-y-4'>
                            <TextField
                                id="email-login"
                                label="Email"
                                type='email'
                                name='email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                sx={{ mb: 2 }}
                            />

                            <TextField
                                id="password-login"
                                label='Password'
                                name='password'
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                fullWidth
                                variant="outlined"
                                sx={{ mb: 1 }}
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
                            />

                            {/* Forgot Password link */}
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                                <Button
                                    variant="text"
                                    onClick={() => setForgotPasswordOpen(true)}
                                    size="small"
                                    sx={{ textTransform: 'none', color: '#013D1D' }}
                                >
                                    Forgot Password?
                                </Button>
                            </Box>

                            {/* Email Login Button */}
                            <Button
                                type='submit'
                                variant='contained'
                                size='large'
                                fullWidth
                                sx={{ 
                                    bgcolor: '#013D1D',
                                    color: 'white',
                                    py: 1.5,
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '1rem',
                                    '&:hover': {
                                        bgcolor: '#047857',
                                    }
                                }}
                            >
                                Log in with Email
                            </Button>

                            {/* Email/Password Error Display */}
                            {error && (
                                <Alert severity="error" sx={{ mt: 2 }}>
                                    {error}
                                </Alert>
                            )}
                        </form>

                        <Divider sx={{ my: 4 }} />

                        {/* Link to Signup */}
                        <Typography align="center" variant="body2" color="text.secondary">
                            Need an account?{' '}
                            <Link to="/signup" style={{ color: '#013D1D', fontWeight: 600, textDecoration: 'none' }}>
                                Sign up here
                            </Link>
                        </Typography>
                    </CardContent>
                </Card>
            </Container>

            {/* Forgot Password Dialog (Keep existing) */}
            <Dialog open={forgotPasswordOpen} onClose={() => !isResetting && setForgotPasswordOpen(false)}>
                <DialogTitle>Reset Password</DialogTitle>
                <DialogContent>
                    {resetEmailSent ? (
                        <Alert severity="success" className="mb-4">
                            Password reset email sent! Check your inbox.
                        </Alert>
                    ) : (
                        <>
                            <Typography sx={{ mb: 2 }}>Enter your email address and we'll send you a link to reset your password.</Typography>
                            <TextField
                                autoFocus
                                margin="dense"
                                id="reset-email"
                                label="Email Address"
                                type="email"
                                fullWidth
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                disabled={isResetting}
                                variant="outlined"
                            />
                            {resetError && (
                                <Alert severity="error" className="mt-3">
                                    {resetError}
                                </Alert>
                            )}
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={() => setForgotPasswordOpen(false)}
                        color="inherit"
                        disabled={isResetting}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleForgotPassword}
                        sx={{ color: '#013D1D' }}
                        disabled={!resetEmail || isResetting || resetEmailSent}
                        startIcon={isResetting ? <CircularProgress size={20} /> : <Mail />}
                    >
                        {isResetting ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}