import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { app } from '../../config/firestore.js';
import { Button, CircularProgress, Alert } from '@mui/material';
import { KeyRound } from 'lucide-react';

function ResetPassword() {
    const [isResetting, setIsResetting] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [resetError, setResetError] = useState(null);
    const auth = getAuth(app);

    const handleResetPassword = async () => {
        if (!auth.currentUser?.email) {
            setResetError("No email associated with this account");
            return;
        }

        setIsResetting(true);
        setResetError(null);
        setResetSuccess(false);

        try {
            await sendPasswordResetEmail(auth, auth.currentUser.email);
            setResetSuccess(true);
            setTimeout(() => setResetSuccess(false), 5000);
        } catch (error) {
            console.error("Error sending password reset email:", error);
            setResetError(error.message);
        } finally {
            setIsResetting(false);
        }
    };

    return (
        <>
            {resetSuccess && (
                <Alert severity="success" className="mb-4">
                    Password reset email sent! Check your inbox.
                </Alert>
            )}

            {resetError && (
                <Alert severity="error" className="mb-4">
                    {resetError}
                </Alert>
            )}
            <div className='flex pt-3'>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleResetPassword}
                    disabled={isResetting}
                    startIcon={isResetting ? <CircularProgress size={20} /> : <KeyRound />}
                >
                    {isResetting ? 'Sending...' : 'Reset Password'}
                </Button>
            </div>
        </>
    );
}

export default ResetPassword;
