import React from 'react';
import { Divider } from '@mui/material';
import MetaTags from '../Common/MetaTags.jsx';

const Privacy = () => {
    const pageInfo = {
        title: "Privacy Policy", // Just the specific part of the title
        description: "Learn about the privacy policies for Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/privacy",
        // You could add a specific imageUrl here if needed for this page:
        // imageUrl: "https://meadowmentor.com/images/roadmap-specific-image.png",
    };

    const dateLastUpdated = 'April 12, 2025';
    const encodedEmail = 'support' + String.fromCharCode(64) + 'meadowmentor.atlassian.net' //support@meadowmentor.atlassian.net
    const emailSubject = 'Privacy Question'

    // Define font styles for reuse
    const headingFont = { fontFamily: 'Montserrat, sans-serif' };
    const bodyFont = { fontFamily: '"Source Sans Pro", sans-serif' }; // Ensure quotes for multi-word font name

    return (
        <>
            <MetaTags {...pageInfo} />
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-emerald-900">Meadow Mentor Privacy Policy</h1>
                    <p className="text-center text-sm text-gray-500 pb-8">
                        Last Updated: March 12, 2025
                    </p>

                    <section className="mb-8 bg-emerald-50 p-4 rounded-lg">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Quick Reference Summary</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We collect your email, name, health conditions, diet preferences, and AI interactions</li>
                            <li>We use this information to personalize your experience and improve our services</li>
                            <li>Your data is protected through encryption and secure storage platforms</li>
                            <li>We don't sell your data (though this may change with notice)</li>
                            <li>You control what information you share with us</li>
                        </ul>
                    </section>

                    <div className="border-t border-gray-200 my-8"></div>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Welcome to Meadow Mentor</h2>
                        <p className="text-gray-700 leading-relaxed">
                            At Meadow Mentor, we understand that managing health conditions requires trust. Your privacy
                            matters deeply to us, especially when it comes to sensitive health information. This policy
                            explains how we collect, use, and protect your personal information while providing you with
                            personalized health and wellness support.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">What Information We Collect</h2>

                        <h3 className="text-lg font-medium mb-3 text-emerald-900">Personal Information</h3>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li><span className="font-medium">Account Information</span>: Your email address and first name are required. Last name is optional.</li>
                            <li><span className="font-medium">Health Information</span>: Health conditions you're managing and therapeutic diets you follow.</li>
                            <li><span className="font-medium">App Interactions</span>: Questions asked to our AI, ingredients submitted for recipe generation, logged meals, and supplements/medications you take.</li>
                            <li><span className="font-medium">Payment Information</span>: Your purchase history (payment details are stored by Stripe, not directly by us).</li>
                        </ul>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: We only collect information that helps us personalize your experience.
                            You control how much you share, and we never collect device or IP information.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">How We Collect Your Information</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            All information we have about you comes directly from you through:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Account creation and profile setup</li>
                            <li>Features you use within the app</li>
                            <li>Questions you ask our AI assistant</li>
                            <li>Recipes you generate</li>
                            <li>Meals, supplements, and medications you log</li>
                        </ul>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: We don't gather information about you from outside sources or track you across the internet.
                            What you share is what we know.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">How We Use Your Information</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            We use your information to:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Provide a personalized experience tailored to your health needs</li>
                            <li>Develop and improve app features based on how they're used</li>
                            <li>Process payments for subscriptions or purchases</li>
                            <li>Communicate important updates about the app</li>
                            <li>Analyze usage patterns to make the app more helpful</li>
                        </ul>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: Your information helps us make Meadow Mentor more useful for your specific health journey.
                            We don't use your data for purposes unrelated to improving your experience.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">How We Protect Your Information</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Your health information deserves the highest level of protection:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li><span className="font-medium">Payment Security</span>: All payment transactions are encrypted through Stripe</li>
                            <li><span className="font-medium">Account Security</span>: User login credentials are encrypted through Google Firebase</li>
                            <li><span className="font-medium">Health Data Security</span>: Your health information is stored on Google Cloud Platform and Mongo Atlas, which provide enterprise-level security</li>
                            <li><span className="font-medium">Data Access</span>: Only authorized team members can access user data, and only for legitimate business purposes</li>
                        </ul>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: We use industry-leading security standards to keep your sensitive health information safe.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Children's Privacy</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Meadow Mentor is not designed for children. We recommend that legal guardians be the account owners for any children using our app.
                            If we discover accounts belonging to children, we will delete this data to protect their privacy.
                        </p>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: If you're helping a child manage their health with our app,
                            please create and manage the account yourself as their guardian.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Cookies and Tracking</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            At this time, we do not use cookies to track users. If this changes, we will update this privacy policy and notify you.
                        </p>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: We don't follow you around the internet or track your browsing habits.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Third-Party Links</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Our website may contain links to third-party partners. We are not responsible for the privacy practices of these external sites.
                            We encourage you to review their privacy policies before sharing your information.
                        </p>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: When you click on links that take you outside our app, different privacy rules may apply.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Changes to This Privacy Policy</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            If we make significant changes to this privacy policy, we'll notify you via the email address associated with your account.
                            We encourage you to review our privacy policy periodically.
                        </p>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: You'll never be surprised by changes in how we handle your data.
                            We'll let you know directly if anything changes.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Your Data Rights</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            Depending on your location, you may have certain rights regarding your personal information, including:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Accessing your data</li>
                            <li>Correcting inaccurate information</li>
                            <li>Deleting your account and associated data</li>
                            <li>Restricting certain uses of your information</li>
                        </ul>

                        <p className="text-gray-700 mb-4">
                            To exercise these rights, please contact us using the information below.
                        </p>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: You have control over your data, and we're here to help you exercise your rights.
                        </p>
                    </section>

                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900">Contact Us</h2>
                        <p className="text-gray-700 leading-relaxed mb-4">
                            If you have questions or concerns about this privacy policy or your personal information,
                            please <a
                                href="#"
                                className="text-emerald-600 hover:underline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    window.open(`mailto:${encodedEmail}?subject=${encodeURIComponent(emailSubject)}`, '_blank');
                                }}
                            >
                                Contact Us
                            </a>.
                        </p>

                        <p className="text-gray-700">
                            <span className="font-bold">What This Means For You</span>: We're here to help with any privacy concerns you might have.
                            Don't hesitate to reach out.
                        </p>
                    </section>

                    <div className="my-8">
                        <Divider />
                    </div>


                    <p className="text-center text-lg font-medium text-gray-800 mt-12" style={bodyFont}>
                        Thank you for using Meadow Mentor!
                    </p>

                    <p className="text-right text-sm text-gray-500 mt-8">
                        Last Updated: {dateLastUpdated}
                    </p>
                </div>
            </div>
        </>
    );
};

export default Privacy;
