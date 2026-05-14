import { useState } from 'react';
import PropTypes from 'prop-types';
import {
    IconButton,
    Avatar,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    Box,
    Typography,

} from '@mui/material';
import VideoIcon from '@mui/icons-material/OndemandVideo';
import LocalLibraryIcon from '@mui/icons-material/LocalLibrary';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';

import { Crown, User, LogOut } from 'lucide-react';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigate } from 'react-router';
import { app } from '../../config/firestore.js';

/**
 * UserMenu Component
 * 
 * A reusable user menu component that displays a user avatar and dropdown menu.
 * Used in both public Header and authenticated AppHeader for consistent UX.
 * 
 * Priority for avatar display: Custom uploaded image > Google profile photo > Default avatar (initials)
 * 
 * @param {Object} props
 * @param {Object} props.user - Firebase user object
 * @param {string} props.userFirstName - User's first name for display
 * @param {string} props.userLastName - User's last name for default avatar initials
 * @param {string} props.customProfileImageUrl - Custom uploaded profile image URL
 * @param {Array} props.menuItems - Additional menu items to display (optional)
 * @param {boolean} props.showOpenApp - Whether to show "Open App" option (for public pages)
 * @param {string} props.avatarSize - Size of avatar in pixels (default: 32)
 */
export default function UserMenu({ 
    user, 
    userFirstName,
    userLastName = '',
    customProfileImageUrl = null,
    menuItems = [], 
    showOpenApp = false,
    avatarSize = 32 
}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const menuOpen = Boolean(anchorEl);
    const navigate = useNavigate();
    const auth = getAuth(app);

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleNavigation = (path) => {
        navigate(path);
        handleMenuClose();
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            handleMenuClose();
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    // Determine which image to display (priority order)
    const getAvatarSrc = () => {
        if (customProfileImageUrl) return customProfileImageUrl;
        if (user?.photoURL) return user.photoURL;
        return null; // Will show initials
    };

    // Get initials for default avatar
    const getInitials = () => {
        const first = userFirstName?.charAt(0)?.toUpperCase() || '';
        const last = userLastName?.charAt(0)?.toUpperCase() || '';
        return `${first}${last}` || '?';
    };

    // Helper function to render menu items
    const menuTypographyProps = {
        fontFamily: 'Montserrat, sans-serif',
        fontWeight: 600,
        fontSize: '1rem',
        color: '#013D1D',
    };

    const renderMenuItem = (IconComponent, label, path, onClick) => {
        return (
            <MenuItem onClick={onClick || (() => handleNavigation(path))}>
                <ListItemIcon sx={{ color: '#013D1D', minWidth: 36 }}>
                    <IconComponent size={20} />
                </ListItemIcon>
                <ListItemText primary={label} primaryTypographyProps={menuTypographyProps} />
            </MenuItem>
        );
    };

    if (!user) return null;

    return (
        <>
            <IconButton
                onClick={handleMenuOpen}
                sx={{ p: 0 }}
                aria-label="user menu"
                aria-controls={menuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={menuOpen ? 'true' : undefined}
            >
                <Avatar
                    alt={user.displayName || `${userFirstName} ${userLastName}`}
                    src={getAvatarSrc()}
                    sx={{ width: avatarSize, height: avatarSize }}
                >
                    {!getAvatarSrc() && getInitials()}
                </Avatar>
            </IconButton>

            <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={handleMenuClose}
                disableScrollLock={true}
                sx={{
                    '& .MuiPaper-root': {
                        borderRadius: 2,
                        minWidth: 200,
                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                    }
                }}
                MenuListProps={{
                    'aria-labelledby': 'user-menu-button',
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem 
                    disableRipple 
                    disableTouchRipple 
                    sx={{ 
                        cursor: 'default',
                        py: 1.5,
                        gap: 1.5,
                        alignItems: 'center',
                        '&:hover': { backgroundColor: 'transparent' }
                    }}
                >
                    <Avatar
                        alt={user.displayName || `${userFirstName} ${userLastName}`}
                        src={getAvatarSrc()}
                        sx={{ width: 40, height: 40 }}
                    >
                        {!getAvatarSrc() && getInitials()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ ...menuTypographyProps, fontWeight: 700 }}>
                            {userFirstName || 'User Profile'}
                        </Typography>
                        <Typography 
                            variant="body2"
                            sx={{ 
                                fontSize: '0.875rem',
                                color: '#4B5563',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {user.email}
                        </Typography>
                    </Box>
                </MenuItem>

                {/* Show "Open App" for public pages */}
                {/* {showOpenApp && renderMenuItem(User, "Open App", "/guidebook")} */}
                
                {/* Render custom menu items */}
                {menuItems.map((item, index) => (
                    <div key={index}>
                        {item}
                    </div>
                ))}
                {renderMenuItem(SettingsIcon, "Set Up Diet Plan", "/quick_start_guide")}
                {renderMenuItem(PersonIcon, "View Profile", "/profile")}
                {renderMenuItem(VideoIcon, "How-To Videos", "/how-to-videos")}
                {renderMenuItem(LocalLibraryIcon, "Guidebook", "/guidebook")}
                {renderMenuItem(Crown, "Upgrade", "/upgrade")}
                {renderMenuItem(LogOut, "Sign Out", null, handleSignOut)}
            </Menu>
        </>
    );
}

UserMenu.propTypes = {
    user: PropTypes.object.isRequired,
    userFirstName: PropTypes.string,
    userLastName: PropTypes.string,
    customProfileImageUrl: PropTypes.string,
    menuItems: PropTypes.array,
    showOpenApp: PropTypes.bool,
    avatarSize: PropTypes.number,
};
