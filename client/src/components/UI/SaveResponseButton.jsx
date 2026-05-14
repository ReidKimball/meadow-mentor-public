import { useState } from 'react';
import { Button } from '@mui/material';
import { BookmarkIcon } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { API_BASE_URL } from '../env-config';
import { Alert } from '@mui/material'; // Import Alert for error display

export default function SaveResponseButton({ responseId }) {
    const [isSaved, setIsSaved] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Add saving state
    const [saveError, setSaveError] = useState(null);
    const auth = getAuth();

    const handleSave = async () => {
        //console.log('(SaveResponseButton) - Save button clicked!');
        //console.log('(SaveResponseButton) - responseId:', responseId);
        //console.log('(SaveResponseButton) - isSaved:', isSaved);
        setSaveError(null); // Clear previous errors

        // Basic validation
        if (!responseId || isSaved || isSaving) {
            //console.log('(SaveResponseButton) - Returning early - responseId missing, already saved, or currently saving');
            return;
        }

        // --- Get current user and ID Token ---
        const currentUser = auth.currentUser;
        if (!currentUser) {
            console.error('(SaveResponseButton) - User not logged in.');
            setSaveError('You must be logged in to save responses.');
            return;
        }

        let idToken;
        try {
            idToken = await currentUser.getIdToken();
        } catch (tokenError) {
            console.error('(SaveResponseButton) - Error getting ID token:', tokenError);
            setSaveError('Could not authenticate session. Please try logging in again.');
            return;
        }
        // --- End get ID Token ---

        setIsSaving(true); // Set saving state

        try {
            //console.log('(SaveResponseButton) - Attempting to save response...');
            const response = await fetch(`${API_BASE_URL}/api/save-response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({ responseId: responseId }) // Use the prop
            });

            //console.log('(SaveResponseButton) - Response from save API:', response);

            if (response.ok) {
                //console.log('(SaveResponseButton) - Response successfully saved');
                setIsSaved(true);
            } else {
                const errorData = await response.json();
                console.error('Error saving response:', errorData);
                setSaveError(errorData.message || `Failed to save (Status: ${response.status})`);
            }

        } catch (error) {
            console.error('Error saving responses:', error);
            setSaveError('An unexpected network error occurred while saving.');
        } finally {
            setIsSaving(false); // Clear saving state regardless of outcome
        }
    };

    return (
        <>
            <Button
                onClick={handleSave}
                variant={isSaved ? "contained" : "outlined"}
                color={isSaved ? "success" : "primary"}
                startIcon={<BookmarkIcon />}
                // Disable if saved, saving, or no responseId provided
                disabled={isSaved || isSaving || !responseId}
            >
                {isSaving ? "Saving..." : (isSaved ? "Saved" : "Save Response")}
            </Button>
            {/* Display save error below the button */}
            {saveError && <Alert severity="error" sx={{ mt: 1, width: 'fit-content' }}>{saveError}</Alert>}
        </>
    );
}
