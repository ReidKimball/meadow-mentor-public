import React from 'react';
import { Button } from '@mui/material';
import { Link } from 'react-router'
import MetaTags from '../Common/MetaTags';

export default function Features() {

    // For a button in the bottom section
    const handleUmamiBottomSignupClick = () => {
        if (typeof window !== 'undefined' && window.umami) {
            window.umami.track('signup_button_click', {
                source: 'features_page',
                location: 'bottom_section',
                button_text: 'Create your free account today'
            });
            //console.log(`(Features.jsx) - Bottom section signup button clicked`);
        }

    }

    const pageInfo = {
        title: "Features", // Just the specific part of the title
        description: "Learn about the available features for Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/features",
        // You could add a specific imageUrl here if needed for this page:
        imageUrl: "https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_og_image_1200x630.webp",
    };

    return (
        <>
            <MetaTags {...pageInfo} />
            {/* <main className="p-8"> */}
            <main className="text-center p-8 sm:px-16 md:px-24 w-full md:w-[95%] lg:w-[95%] xl:w-[80%] mx-auto">
                <div className="font-[Montserrat] tracking-[0.015em] text-6xl leading-normal text-left">Features</div>
                {/* <div className="text-normal leading-normal text-left">HOME > Features</div> */}


                {/* Set Profile */}
                {/* Container div: Set position relative, background black, padding, etc. */}
                {/* Added relative and overflow-hidden, removed opacity-70 */}
                <div className='relative text-4xl md:text-5xl lg:text-6xl text-left uppercase bg-black opacity-80 text-white p-2 sm:p-4 md:p-8 rounded-lg my-8 w-full overflow-hidden'>

                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 rounded-lg" // Positioned absolutely, covers parent, applies opacity, rounded corners
                        style={{ backgroundImage: `url(${})` }} // Set background image via inline style
                    ></div>

                    {/* Text Content Layer */}
                    {/* Added relative and z-10 */}
                    <h1 className='relative z-10 font-bold text-center p-20 font-[Montserrat] tracking-[0.015em] leading-[1.2]'>
                        Health diets have never been this easy
                    </h1>


                </div>
                <div className='text-left bg-emerald-900 text-white p-8 rounded-lg my-8 w-full'>
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        Forget writing complicated instructions in your AI prompts.
                    </div>
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        All you need to do is set up your profile.
                    </div>
                    <img
                        src={profile_settings_v01}
                        alt="image of user profile settings showing therapeutic diet and health condition"
                        className="place-self-center"
                    />
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        We take care of the rest so you can focus on healing.
                    </div>
                </div>

                {/* Check Ingredients */}

                <div className='relative text-4xl md:text-5xl lg:text-6xl text-left uppercase bg-black opacity-80 text-white p-2 sm:p-4 md:p-8 rounded-lg my-8 w-full overflow-hidden'>

                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 rounded-lg" // Positioned absolutely, covers parent, applies opacity, rounded corners
                        style={{ backgroundImage: `url(${foodPlate_01})` }} // Set background image via inline style
                    ></div>

                    {/* Text Content Layer */}
                    {/* Added relative and z-10 */}
                    <h1 className='relative z-10 font-bold text-center p-20 font-[Montserrat] tracking-[0.015em] leading-[1.2]'>
                        Check Ingredients
                    </h1>
                    <div className='text-right text-sm'>photo credit: Anh Nguyen</div>


                </div>
                <div className='text-left bg-emerald-900 text-white p-8 rounded-lg my-8 w-full'>
                    <div className='flex flex-col lg:flex-row gap-8 justify-between'>
                        <div className='flex flex-col text-2xl font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                            <div className='pb-4'>
                                Skip the time consuming internet searches and conflicting opinions.
                            </div>

                            <div className='pb-4'>
                                Snap a photo of your ingredient label, upload, and get clear answers.
                            </div>
                        </div>

                        <img
                            src={ingredients}
                            alt="Flax muffin ingredients label showing nutrition facts" // More descriptive alt text
                            // w-full: Full width on small (stacked) screens
                            // lg:w-2/5: Takes 2/5 of the width on large (row) screens
                            // max-w-full: Prevents exceeding container width
                            // h-auto: Maintains aspect ratio
                            // object-cover: Fills space, crops if needed
                            // rounded-lg: Optional styling
                            className="w-full max-w-full h-auto object-cover rounded-lg lg:w-2/5"
                        />
                    </div>

                    <div className='bg-white text-black p-4 rounded-lg my-8 w-full'>
                        <div className='text-xl font-bold text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                            AI Response:
                        </div>

                        <div className='text-xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                            Reid, due to the high placement of added sugar and the use of refined flour and oils, this product is <span className='font-bold'>best to limit or avoid</span> while following a <span className='font-bold'>Mediterranean pattern</span>, especially when managing Crohn's disease. Focus on whole, unprocessed foods to best tend to your meadow. Hoot hoot!
                        </div>

                    </div>

                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        Now you can eat with confidence.
                    </div>

                </div>


                {/* Track your progress */}
                {/* Container div: Set position relative, background black, padding, etc. */}
                {/* Added relative and overflow-hidden, removed opacity-70 */}
                <div className='relative text-4xl md:text-5xl lg:text-6xl text-left uppercase bg-black opacity-80 text-white p-2 sm:p-4 md:p-8 rounded-lg my-8 w-full overflow-hidden'>

                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 rounded-lg" // Positioned absolutely, covers parent, applies opacity, rounded corners
                        style={{ backgroundImage: `url(${kabobs})` }} // Set background image via inline style
                    ></div>

                    {/* Text Content Layer */}
                    {/* Added relative and z-10 */}
                    <h1 className='relative z-10 font-bold text-center p-20 font-[Montserrat] tracking-[0.015em] leading-[1.2]'>
                        Track your progress
                    </h1>


                </div>
                <div className='text-left bg-emerald-900 text-white p-8 rounded-lg my-8 w-full'>
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        Our food journal gives you instant feedback on every meal you eat.


                    </div>

                    <img
                        src={foodJournal}
                        alt="image of food journal"
                        className="place-self-center py-8"
                    />
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        No searching through long lists of confusing ingredient names. Simply type or select from the list the whole ingredient name.
                    </div>
                </div>

                {/* Meal log history */}
                {/* Container div: Set position relative, background black, padding, etc. */}
                {/* Added relative and overflow-hidden, removed opacity-70 */}
                <div className='relative text-4xl md:text-5xl lg:text-6xl text-left uppercase bg-black opacity-80 text-white p-2 sm:p-4 md:p-8 rounded-lg my-8 w-full overflow-hidden'>

                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 rounded-lg" // Positioned absolutely, covers parent, applies opacity, rounded corners
                        style={{ backgroundImage: `url(${kabobs})` }} // Set background image via inline style
                    ></div>

                    {/* Text Content Layer */}
                    {/* Added relative and z-10 */}
                    <h1 className='relative z-10 font-bold text-center p-20 font-[Montserrat] tracking-[0.015em] leading-[1.2]'>
                        Know where you stand
                    </h1>
                </div>
                <div className='text-left bg-emerald-900 text-white p-8 rounded-lg my-8 w-full'>
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        See how well you are sticking to your therapeutic diet.


                    </div>

                    <img
                        src={mealHistory}
                        alt="image of meal history"
                        className="place-self-center py-8"
                    />
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        Use AI to analyze your entire meal history and give you personalized feedback based on hidden patterns it detects in your data.
                    </div>
                </div>


                {/* Create account */}
                {/* Container div: Set position relative, background black, padding, etc. */}
                {/* Added relative and overflow-hidden, removed opacity-70 */}
                <div className='relative text-4xl md:text-5xl lg:text-6xl text-left uppercase bg-black opacity-80 text-white p-2 sm:p-4 md:p-8 rounded-lg my-8 w-full overflow-hidden'>

                    {/* Background Image Layer */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 rounded-lg" // Positioned absolutely, covers parent, applies opacity, rounded corners
                        style={{ backgroundImage: `url(${kabobs})` }} // Set background image via inline style
                    ></div>

                    {/* Text Content Layer */}
                    {/* Added relative and z-10 */}
                    <h1 className='relative z-10 font-bold text-center p-20 font-[Montserrat] tracking-[0.015em] leading-[1.2]'>
                        And more
                    </h1>
                </div>
                <div className='text-left bg-white text-black p-8 rounded-lg my-8 w-full'>
                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        We've got more features already implemented, and more on the way.
                    </div>

                    <div className='text-2xl text-left pb-4 font-[Source_Sans_Pro] leading-[1.6] tracking-[-0.01em]'>
                        Check out our development <Link to="/updates">Updates</Link> to learn more or take a look for your self.
                    </div>

                    <div className='flex flex-row pt-8 items-center justify-center'>
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
                </div>
            </main>
        </>
    )
}
