import { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { Avatar, Box, IconButton, CircularProgress, Snackbar, Alert } from '@mui/material';
import { Camera } from 'lucide-react';
import { uploadProfileImage } from '../../services/userService.js';
import { useUser } from '../../context/UserContext.jsx';

/**
 * ProfileAvatarUpload Component
 * 
 * Displays user avatar with upload functionality on hover.
 * Priority: Custom uploaded image > Google profile photo > Default avatar (initials)
 * 
 * @param {Object} props
 * @param {Object} props.firebaseUser - Firebase user object (for Google photo)
 * @param {string} props.customProfileImageUrl - Custom uploaded profile image URL
 * @param {string} props.firstName - User's first name for default avatar
 * @param {string} props.lastName - User's last name for default avatar
 * @param {Function} props.onUploadSuccess - Callback when upload succeeds
 */
export default function ProfileAvatarUpload({ 
    firebaseUser, 
    customProfileImageUrl, 
    firstName, 
    lastName,
    onUploadSuccess 
}) {
    const [isHovered, setIsHovered] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
    const fileInputRef = useRef(null);
    const { getFreshIdToken } = useUser();

    // Determine which image to display (priority order)
    const getAvatarSrc = () => {
        if (customProfileImageUrl) return customProfileImageUrl;
        if (firebaseUser?.photoURL) return firebaseUser.photoURL;
        return null; // Will show initials
    };

    // Get initials for default avatar
    const getInitials = () => {
        const first = firstName?.charAt(0)?.toUpperCase() || '';
        const last = lastName?.charAt(0)?.toUpperCase() || '';
        return `${first}${last}` || '?';
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            setSnackbar({
                open: true,
                message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.',
                severity: 'error'
            });
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setSnackbar({
                open: true,
                message: 'File size exceeds 5MB limit.',
                severity: 'error'
            });
            return;
        }

        setIsUploading(true);

        try {
            const response = await uploadProfileImage(file, getFreshIdToken);
            setSnackbar({
                open: true,
                message: 'Profile image uploaded successfully!',
                severity: 'success'
            });
            
            // Call the callback to update parent component
            if (onUploadSuccess) {
                onUploadSuccess(response.profileImageUrl);
            }
        } catch (error) {
            console.error('Error uploading profile image:', error);
            setSnackbar({
                open: true,
                message: error.message || 'Failed to upload profile image',
                severity: 'error'
            });
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleCloseSnackbar = () => {
        setSnackbar({ ...snackbar, open: false });
    };

    return (
        <>
            <Box
                sx={{
                    position: 'relative',
                    display: 'inline-block',
                    cursor: 'pointer',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleAvatarClick}
            >
                <Avatar
                    src={getAvatarSrc()}
                    alt={`${firstName} ${lastName}`}
                    sx={{
                        width: 120,
                        height: 120,
                        fontSize: '2.5rem',
                        bgcolor: 'primary.main',
                    }}
                >
                    {!getAvatarSrc() && getInitials()}
                </Avatar>

                {/* Overlay with camera icon on hover */}
                {(isHovered || isUploading) && (
                    <Box
                        sx={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            borderRadius: '50%',
                            backgroundColor: 'rgba(0, 0, 0, 0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'opacity 0.2s',
                        }}
                    >
                        {isUploading ? (
                            <CircularProgress size={40} sx={{ color: 'white' }} />
                        ) : (
                            <IconButton
                                sx={{
                                    color: 'white',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    },
                                }}
                            >
                                <Camera size={32} />
                            </IconButton>
                        )}
                    </Box>
                )}

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleFileChange}
                    disabled={isUploading}
                />
            </Box>

            {/* Snackbar for notifications */}
            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
}

ProfileAvatarUpload.propTypes = {
    firebaseUser: PropTypes.object,
    customProfileImageUrl: PropTypes.string,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string,
    onUploadSuccess: PropTypes.func,
};
