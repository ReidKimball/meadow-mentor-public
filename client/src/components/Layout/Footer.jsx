import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, TextField } from '@mui/material';
import { Heart, Mail, Phone, MapPin, DollarSign } from 'lucide-react';
import { ChefHat } from 'lucide-react';
import Swal from 'sweetalert2';

import { subscribeToNewsletter } from '../../services/newsletterService'; 

const Footer = () => {
    const [email, setEmail] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        try {
            await subscribeToNewsletter(email); // calls function in newsletterService.js
            Swal.fire({
                title: 'Thank You!',
                text: 'You have successfully subscribed to our newsletter.',
                icon: 'success',
                confirmButtonColor: '#3085d6',
            });
            setEmail('');
        } catch (error) {
            console.error('Failed to subscribe:', error);
            Swal.fire({
                title: 'Oops...',
                text: 'Something went wrong. Please try again.',
                icon: 'error',
                confirmButtonColor: '#d33',
            });
        }
    };

    const currentYear = new Date().getFullYear()

    // Function to track footer link clicks
    const trackClick = (linkText) => {
        //console.log(`(Footer.jsx) - Footer link clicked: ${linkText}`);
        // Check if umami is available in the window object
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('footer_link_click', {
                source: 'home page',
                location: 'footer_section',
                link_text: linkText
            });
        }
    };

    return (
        <>
            <footer className="bg-gray-800 text-gray-300 py-12 px-4 sm:px-6 lg:px-8">
                <div className='flex flex-row flex-wrap gap-16 py-8 justify-center'>
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className='flex items-center space-x-2'>
                            <ChefHat size={20} />
                            <h3
                                className="text-xl font-medium text-white"
                                style={{
                                    fontFamily: 'Montserrat, sans-serif',
                                    fontWeight: 500,
                                    letterSpacing: '0.01em',
                                    lineHeight: 1.3
                                }}
                            >
                                Meadow Mentor
                            </h3>
                        </div>
                        <div
                            className="flex items-center space-x-2 text-lg"
                            style={{
                                fontFamily: 'Source Sans Pro, sans-serif',
                                fontWeight: 400,
                                letterSpacing: '-0.01em',
                                lineHeight: 1.6
                            }}
                        >
                            <Heart size={20} className="text-red-500" />
                            <span>Transform Your Health, One Meal at a Time</span>
                        </div>
                    </div>

                    {/* Product Links */}
                    <div className="space-y-4">
                        <h3
                            className="text-xl font-medium text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 500,
                                letterSpacing: '0.01em',
                                lineHeight: 1.3
                            }}
                        >
                            Product
                        </h3>
                        <ul className="space-y-2 text-lg">
                            {/* <li>
                                <Link
                                    to="/features"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Features')}
                                >
                                    Features
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/updates"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Updates')}
                                >
                                    Updates
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/roadmap"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Roadmap')}
                                >
                                    Roadmap
                                </Link>
                            </li> */}
                            <li>
                                <Link
                                    to="/recipes"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Recipes')}
                                >
                                    Recipes
                                </Link>
                            </li>
                            
                            <li>
                                <Link
                                    to="/signup"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Signup')}
                                >
                                    Sign Up
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/pricing"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Pricing')}
                                >
                                    Pricing
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company Links */}
                    <div className="space-y-4">
                        <h3
                            className="text-xl font-medium text-white"
                            style={{
                                fontFamily: 'Montserrat, sans-serif',
                                fontWeight: 500,
                                letterSpacing: '0.01em',
                                lineHeight: 1.3
                            }}
                        >
                            Company
                        </h3>
                        <ul className="space-y-2 text-lg">
                            <li>
                                <Link
                                    to="/blog"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Blog')}
                                >
                                    Blog
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/about"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('About')}
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/privacy"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Privacy Policy')}
                                >
                                    Privacy policy
                                </Link>
                            </li>
                            <li>
                                <Link
                                    to="/terms"
                                    className=""
                                    style={{
                                        fontFamily: 'Source Sans Pro, sans-serif',
                                        fontWeight: 400,
                                        letterSpacing: '-0.01em',
                                        lineHeight: 1.6
                                    }}
                                    onClick={() => trackClick('Terms of service')}
                                >
                                    Terms of service
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className='text-center w-3/4 md:w-1/2 mx-auto'>
                    <p className="text-lg font-medium text-white">
                        Stay updated
                    </p>

                    {/* use material ui form */}
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Email Address"
                            type="email"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            InputLabelProps={{
                                style: { color: '#ccc' },
                            }}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    '& fieldset': {
                                        borderColor: '#555',
                                    },
                                    '&:hover fieldset': {
                                        borderColor: '#888',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'white',
                                    },
                                    input: { color: 'white' },
                                },
                            }}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            fullWidth
                        >
                            Sign Up
                        </Button>
                    </form>
                    
                </div>

                {/* Bottom Bar */}
                <div className='flex flex-col justify-center items-center p-8 text-sm'>
                    <p
                        style={{
                            fontFamily: 'Source Sans Pro, sans-serif',
                            fontWeight: 300,
                            letterSpacing: '0',
                            lineHeight: 1.5
                        }}
                    >
                        {currentYear} Meadow Mentor by Reid Kimball Design. All rights reserved.
                    </p>
                    <p
                        className="mt-2 text-sm"
                        style={{
                            fontFamily: 'Source Sans Pro, sans-serif',
                            fontWeight: 300,
                            letterSpacing: '0',
                            lineHeight: 1.5
                        }}
                    >
                        Both meadowmentor.com and scd-guide-404532287411.us-central1.run.app are our official domains.
                    </p>
                </div>
            </footer>
        </>
    );
}

export default Footer;