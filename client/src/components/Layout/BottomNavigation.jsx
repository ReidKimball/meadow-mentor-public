import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router';
import {
    BottomNavigation as MuiBottomNavigation,
    BottomNavigationAction,
    Paper,
    Badge,
    useTheme, // import useTheme to access theme colors
} from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';

import { Home, User, ChartSpline, ChefHat, MessageCircleQuestion, BookmarkIcon, Menu, ForkKnife } from 'lucide-react';
import { useUser } from '../../context/UserContext';

// --- Umami Tracking Function Creator ---
// Creates a function that, when called, tracks a click event for a specific menu item.
const createNavTrackingFunction = (menuItem) => {
    return () => { // This inner function is what gets called on click/change
        if (typeof window !== 'undefined' && window.umami) {
            // Using a general event name 'bottom_nav_click' and specifying the item in the payload
            window.umami.track('bottom_nav_click', {
                // Payload identifies the specific item clicked
                clicked_item: menuItem,
                source: 'bottom_navigation' // Indicate where the click originated
            });
            //console.log(`(BottomNavigation.jsx) - Umami tracked: bottom_nav_click for ${menuItem}`);
        } else {
            // Optional: Log even if Umami isn't present, for local debugging
            //console.log(`(BottomNavigation.jsx) - Clicked ${menuItem}, Umami not available.`);
        }
    };
};
// --- End Umami Tracking ---

export default function BottomNavigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const [value, setValue] = useState(0); // Default to first item if path doesn't match
    const { isSubscriber } = useUser(); // get subscription status (currently unused due to commented code)
    const theme = useTheme();

    // Map indices to descriptive names for tracking
    const indexToNameMap = {
        0: 'saved_recipes',
        1: 'meal_planner',
        2: 'ask_kay',
        3: 'bowel_movements',
        4: 'shopping_list',
    };

    // Map indices to paths for navigation
    const indexToPath = {
        0: '/saved-recipes',
        1: '/meal-planner',
        2: '/ask-kay',
        3: '/bowel-movements',
        4: '/shopping-list',
    };

    // Map paths to navigation indices
    useEffect(() => {
        const pathToIndex = {
            '/saved-recipes': 0,
            '/meal-planner': 1,
            '/ask-kay': 2,
            '/bowel-movements': 3,
            '/shopping-list': 4,
        };
        const currentPath = location.pathname;
        // Set value based on current path, default to 0 if no match
        setValue(pathToIndex[currentPath] !== undefined ? pathToIndex[currentPath] : 0);

    }, [location]); // Removed isSubscriber dependency as it's commented out

    const handleChange = (event, newValue) => {
        // --- Tracking ---
        const menuItemName = indexToNameMap[newValue];
        if (menuItemName) {
            // Create and immediately call the specific tracking function for this item
            const trackClick = createNavTrackingFunction(menuItemName);
            trackClick();
        }
        // --- End Tracking ---

        // --- Navigation ---
        const targetPath = indexToPath[newValue];
        if (targetPath) {
            navigate(targetPath);
        }
        // --- End Navigation ---

        // Note: We don't call setValue(newValue) here because the useEffect hook
        // is responsible for updating the `value` state based on the `location` change
        // triggered by `navigate`. This prevents potential state conflicts or flickers.
    };


    // Generate navigation items based on subscription status (currently shows all items)
    const getNavigationItems = () => {
        const items = [
            // Index 0: My Recipes
            <BottomNavigationAction
                key="saved-recipes"
                label="Recipes"
                icon={<MenuBookIcon />}
            />,

            // Index 1: Meal Planner
            <BottomNavigationAction key="meal-plans" label="Meal Plans" icon={<CalendarTodayIcon />} />,

            // Index 2: Profile
            <BottomNavigationAction key="ask-kay" label="Chef Kay" icon={<ChatIcon />} />,

            // Index 3: Bowel Movements
            <BottomNavigationAction key="bm-logging" label="Trends" icon={<ChartSpline size={24} />} />,

            // Index 4: Shopping List
            <BottomNavigationAction key="shopping-list" label="List" icon={<ShoppingCartIcon />} />,
        ];

        {/*
            '/saved-recipes': 0,
            '/meal-planner': 1,
            '/profile': 2,
            '/shopping-list': 3,
        */}
        return items;
    };

    return (
        <div className='pt-8'>
            <Paper
                sx={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    zIndex: 1000,
                    height: 80 // Makes the entire nav bar taller
                }}
                elevation={3}
            >
                <MuiBottomNavigation
                    showLabels
                    value={value}
                    onChange={handleChange} // This triggers our tracking and navigation
                    sx={{
                        height: '100%', // Fill the paper height
                        '& .MuiBottomNavigationAction-root': {
                            padding: '6px 0', // default padding
                            minWidth: 80, // default min width
                            '@media (max-width: 420px)': {
                                minWidth: 'auto', // allow items to shrink more
                                padding: '6px 2px', // reduce horizontal padding
                            },
                            '& .lucide': { // Target Lucide icons
                                width: 28,
                                height: 28,
                                '@media (max-width: 420px)': {
                                    width: 24,
                                    height: 24,
                                }
                            }
                        },
                        '& .MuiBottomNavigationAction-root.Mui-selected': {
                            backgroundColor: theme.palette.action.selected || 'rgba(0, 0, 0, 0.08)',
                            borderRadius: '8px',
                        },
                        '& .MuiBottomNavigationAction-label': {
                            fontFamily: 'Source Sans Pro',
                            fontSize: '0.95rem', // default font size
                            '@media (max-width: 420px)': {
                                fontSize: '0.78rem',
                            },
                            '@media (max-width: 370px)': {
                                fontSize: '0.70rem', // further reduced font size
                            }
                        }
                    }}
                >
                    {getNavigationItems()}

                </MuiBottomNavigation>
            </Paper>
        </div>
    );
}
