import {
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Avatar,
    MenuItem,
    ListItemIcon,
    ListItemText,
} from '@mui/material';
import { Menu as MenuIcon, User } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import PropTypes from 'prop-types';
import { app } from '../../config/firestore.js';
import { API_BASE_URL } from '../../env-config.js';
import UserMenu from './UserMenu.jsx';

const Chef_Kay = 'https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_app_header.webp';

export default function AppHeader({ onMenuClick }) {
    const auth = getAuth(app);
    const navigate = useNavigate();
    const [user, setUser] = useState(null); // stores the Firebase user object
    const [userFirstName, setUserFirstName] = useState('');

    const fetchUserData = async (currentUser) => {
        // Guard clause: ensure currentUser exists before proceeding
        if (!currentUser) {
            //console.log("(AppHeader.jsx) fetchUserData called with null user.");
            setUserFirstName(''); // Clear name if user is null
            return;
        }

        try {
            const uid = currentUser.uid;
            //console.log('Current Firebase UID:', currentUser.uid)

            // --- Get the Firebase ID token ---
            const idToken = await currentUser.getIdToken();
            // ---------------------------------

            const response = await fetch(`${API_BASE_URL}/api/users/${uid}`, {
                // --- Add the Authorization header ---
                headers: {
                    'Authorization': `Bearer ${idToken}`,
                },
                // ------------------------------------
            });

            if (!response.ok) {
                // Log detailed error
                let errorBody = 'Could not read error body';
                try {
                    errorBody = await response.text();
                } catch {
                    /* ignore read error */
                }
                console.error(`(AppHeader.jsx) Fetch error status: ${response.status}, body: ${errorBody}`);
                throw new Error(`Failed to fetch user data (status ${response.status})`);
            }

            const userData = await response.json();
            setUserFirstName(userData.firstName || '');
        } catch (error) {
            console.error('(AppHeader.jsx) Error fetching user data:', error);
            setUserFirstName(''); // Clear first name on error
        }
    };

    useEffect(() => {
        //console.log("(AppHeader.jsx) Setting up onAuthStateChanged listener.");
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            //console.log("(AppHeader.jsx) Auth state changed. User:", currentUser ? currentUser.uid : 'null');
            setUser(currentUser); // Update the user state (Firebase user object or null)
            // Fetch data only if currentUser exists
            fetchUserData(currentUser); // Pass the whole currentUser object (or null)
        });

        // Cleanup function
        return () => {
            //console.log("(AppHeader.jsx) Cleaning up onAuthStateChanged listener.");
            unsubscribe();
        };
    }, [auth]); // Depend only on auth

    // App-specific menu items (temporary example - customize as needed)
    const appMenuItems = [
        <MenuItem key="profile" onClick={() => navigate('/profile')}>
            <ListItemIcon>
                <User size={20} />
            </ListItemIcon>
            <ListItemText primary="Profile" />
        </MenuItem>
    ];

    return (
        <>
            <AppBar position="sticky" color="primary" sx={{ mb: 0 }}>
                <Toolbar>
                    <IconButton
                        edge="start"
                        color="inherit"
                        aria-label="menu"
                        onClick={onMenuClick}
                        sx={{ mr: 2 }}
                    >
                        <MenuIcon />
                    </IconButton>

                    <Avatar
                        src={Chef_Kay}
                        alt="Meadow Mentor Logo"
                        sx={{
                            width: 64,
                            height: 64,
                            mr: 1,  // Add margin-right for spacing between logo and text
                            bgcolor: 'background.paper' // Optional: adds a background if logo has transparency
                        }}
                    />
                    <Typography
                        className="font-[Montserrat] tracking-[0.015em] leading-[1.2] font-bold text-lg sm:text-xl md:text-3xl"
                        component="div"
                        sx={{ flexGrow: 1 }}
                    >
                        Meadow Mentor
                    </Typography>


                    {user && (
                        <UserMenu
                            user={user}
                            userFirstName={userFirstName}
                            menuItems={appMenuItems}
                            showOpenApp={false}
                            avatarSize={32}
                        />
                    )}
                </Toolbar>
            </AppBar>

        </>
    );
}

AppHeader.propTypes = {
    onMenuClick: PropTypes.func.isRequired,
};