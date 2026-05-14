import React from 'react';
import { Typography, Divider, Box, List, ListItem, ListItemIcon, ListItemText, Button } from '@mui/material';
import YouTubeIcon from '@mui/icons-material/YouTube'; // For video links
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord'; // For bullet points
import MetaTags from '../Common/MetaTags';
import { Link } from 'react-router'

// Define font styles reused from Terms.jsx
const headingFont = { fontFamily: 'Montserrat, sans-serif' };
const bodyFont = { fontFamily: '"Source Sans Pro", sans-serif' };

// Define desired font sizes (using rem is often recommended for consistency)
// Tailwind defaults: text-2xl is 1.5rem, text-4xl is 2.25rem
const mobileFontSize = '1.5rem'; // Equivalent to text-2xl
const desktopFontSize = '2.25rem'; // Equivalent to text-4xl

// --- Data for Updates ---
// Add new updates to the TOP of this array.
// Make sure to use the YouTube *embed* link format.
const updatesData = [

    {
        date: "April 26, 2025",
        videoTitle: "Meadow Mentor - Developer Updates for Weeks of April 13th and 20th, 2025",
        videoEmbedLink: "https://www.youtube.com/embed/I6rBflPCC7E", // Use embed link 
        changes: [
            "Food Journal feature is complete and ready for testing by users",
            "Notable improvements to the Food Journal include creating meals, editing meals, deleting meals, adding symptoms, editing symptoms, and deleting symptoms. Overhauled the UI to make viewing meal history and meal details easier. Premium subscribers can use a date picker UI to choose a range of meals to view. Free users can view the previous 7 days of meal data. All meals within the selected dated range get an overall compliance score. Implemented detailed AI analysis of user meal and symptom data. ",

        ]
    },
    {
        date: "April 06, 2025",
        videoTitle: "Meadow Mentor - Developer Updates for Week of April 6, 2025",
        videoEmbedLink: "", // Use embed link 
        changes: [
            "Implemented the Mediterranean Diet",
            "Completed first version of the Food Journal feature",

        ]
    },

    {
        date: "March 30, 2025",
        videoTitle: "Meadow Mentor - Developer Updates for Week of March 30, 2025",
        videoEmbedLink: "https://www.youtube.com/embed/lyCZam-5uhM", // Use embed link
        changes: [
            "AI response time decreased by more than 50%",
            "All users have access to their saved documents",
            "More diets and conditions added for users to set in their profile, such as Gluten, Dairy, and Nut-free diets. Conditions include Diabetes, Heart disease, and many other autoimmune conditions.",
            "Started development on the Food Journal feature"
        ]
    },
    {
        date: "March 23, 2025",
        videoTitle: "Meadow Mentor - Developer Updates for Week of March 23, 2025",
        videoEmbedLink: "https://www.youtube.com/embed/BGq25o334Zw",
        changes: [
            "7-Day Meal Planner feature is complete",
            "Updated AI to refer to have better understanding of their role and character, as well as how to use the meadow metaphor to help users understand gut health",
        ]
    },
    {
        date: "March 16, 2025",
        videoTitle: "Meadow Mentor - Developer Updates for Week of March 16th, 2025",
        videoEmbedLink: "https://www.youtube.com/embed/-4pxDt6AtW4",
        changes: [
            "Revamped user interface with bottom nav bar, sidebar hamburger menu, profile sidebar menu.",
            "Updated marketing copy on home page"
        ]
    },
    {
        date: "March 9, 2025",
        videoTitle: "Meadow Mentor - Developer Updates for Week of March 9th, 2025",
        videoEmbedLink: "https://www.youtube.com/embed/3a_xvRHW4Kw",
        changes: [
            "On the profile page users can see their remaining AI uses count",
            "Development on the 7-day meal planner begins",
            "Improved look and feel of home page"
        ]
    },
    {
        // Example of an update without a video
        date: "Dec, 2024",
        changes: [
            "Development begins with recipe generation from ingredients on hand"
        ]
    },
    {
        // Example with Quick Start Guide (might place this differently, but showing data structure)
        date: "Ongoing", // Or a specific launch date
        videoTitle: "Meadow Mentor Quick Start Guide",
        videoEmbedLink: "https://www.youtube.com/embed/UFz08KwbXhQ",
        changes: [
            "Learn how to get started with Meadow Mentor.",
            "Covers basic navigation and core features.",
            "Tips for getting the most out of the AI tools.",
        ]
    },
    // Add future updates here...
];

// --- Component ---

export default function Updates() {

    // For a button in the bottom section
    const handleUmamiBottomSignupClick = () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('signup_button_click', {
                source: 'updates_page',
                location: 'bottom_section',
                button_text: 'Create your free account today'
            });
            console.log(`(Updates.jsx) - Bottom section signup button clicked`);
        }
    }

    const pageInfo = {
        title: "Development Updates",
        description: "Catch up on the latest updates, features, and tutorials for Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/updates",
        imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
    };

    return (
        <>
            <MetaTags {...pageInfo} />
            {/* Mimic container and card styling from Terms.jsx */}
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white rounded-lg shadow-md p-6 md:p-8">

                    {/* Page Title */}
                    <div className="text-center text-6xl pb-4 mb-4 text-emerald-900 font-[Montserrat] tracking-[0.015em] leading-[1.2]">
                        Meadow Mentor Updates
                    </div>
                    <Typography
                        variant="body1"
                        className="text-center text-gray-600 pb-8"
                        sx={{ ...bodyFont, fontSize: '1.25rem' }}
                    >
                        Follow along with the latest developments, feature releases, and tutorials.
                    </Typography>

                    {/* Divider */}
                    <Divider sx={{ my: 4 }} />

                    {/* Map through updates data */}
                    {updatesData.map((update, index) => (
                        <Box key={update.date + index} component="section" className="mb-10"> {/* Use Box as section */}
                            {/* Update Date */}
                            <Typography
                                variant="overline" // Or h3/h4 if preferred
                                component="p" // Render as paragraph semantically
                                className="text-xs text-gray-500 mb-2 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]"
                                sx={{ ...bodyFont, fontSize: '1.15rem' }}
                            >
                                {update.date}
                            </Typography>

                            {/* Optional Video Section */}
                            {update.videoEmbedLink && (
                                <Box className="mb-6">
                                    <Typography
                                        variant="h2" // Or h3
                                        component="h3" // More semantic
                                        className="text-xl md:text-2xl font-semibold mb-3 text-emerald-900"
                                        sx={{ ...headingFont, fontSize: '2.35rem' }}
                                    >
                                        {update.videoTitle || "Update Video"} {/* Fallback title */}
                                    </Typography>
                                    {/* Video container with explicit styling */}
                                    <div className="w-full relative mb-6" style={{ paddingBottom: '56.25%' }}>
                                        <iframe
                                            src={update.videoEmbedLink}
                                            title={update.videoTitle || "Meadow Mentor Update"}
                                            className="pt-4 absolute top-0 left-0 w-full h-full rounded-lg shadow-md"
                                            frameBorder="0"
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                            allowFullScreen
                                            loading="lazy"
                                        ></iframe>
                                    </div>
                                </Box>
                            )}

                            {/* Changes List */}
                            <Typography
                                variant="h3" // Or h4
                                component="h4" // More semantic
                                className="text-lg md:text-xl font-semibold mb-2 text-emerald-800" // Slightly less prominent than video title
                                sx={{ ...headingFont, fontSize: '2.35rem', paddingBottom: '1rem' }}
                            >
                                {update.videoEmbedLink ? "Key Changes & Features:" : "Changes this week:"}
                            </Typography>
                            {/* Mimic list style from Terms.jsx using Tailwind */}
                            <ul className="list-disc pl-6 space-y-2 text-gray-700 leading-relaxed" style={{ ...bodyFont, fontSize: '1.15rem' }}>
                                {update.changes.map((change, idx) => (
                                    <li key={idx}>{change}</li>
                                ))}
                            </ul>

                            {/* Add Divider between updates (except the last one) */}
                            {index < updatesData.length - 1 && (
                                <Divider sx={{ mt: 6, mb: 6 }} /> // Add more margin to the divider
                            )}
                        </Box>
                    ))}

                    {/* Optional: Add a closing message or link back */}
                    <Typography
                        variant="body1"
                        className="text-center text-gray-600 pt-8"
                        sx={{ ...bodyFont, fontSize: '1.15rem' }}
                    >
                        Check back weekly for more updates!
                    </Typography>

                </div>
            </div>
            <div className='flex flex-row p-8 items-center justify-center'>
                <Link to='/signup'>
                    <Button
                        variant='contained'
                        color='primary'
                        size='large'
                        className="rounded-md px-4 py-2 font-medium text-gray-800 "
                        onClick={handleUmamiBottomSignupClick}
                    // data-umami-event="signup_button_click"
                    >
                        Create your free account today
                    </Button>
                </Link>
            </div>
        </>
    );
}
