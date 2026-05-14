import React from 'react';
import { Link } from 'react-router'; // Use Link for internal navigation if using React Router
import { Divider, } from '@mui/material';
import MetaTags from '../Common/MetaTags.jsx';

const Terms = () => {
    const dateLastUpdated = 'April 12, 2025';
    // Obfuscate email to potentially reduce scraping
    const encodedEmail = 'support' + String.fromCharCode(64) + 'meadowmentor.atlassian.net';
    const emailSubject = 'Terms of Service Question';

    // Define font styles for reuse
    const headingFont = { fontFamily: 'Montserrat, sans-serif' };
    const bodyFont = { fontFamily: '"Source Sans Pro", sans-serif' }; // Ensure quotes for multi-word font name

    const pageInfo = {
        title: "Terms of Service", // Just the specific part of the title
        description: "Learn about the terms of service for Meadow Mentor, your in-home chef helping you thrive one meal at a time.",
        url: "https://meadowmentor.com/terms",
        // You could add a specific imageUrl here if needed for this page:
        // imageUrl: "https://meadowmentor.com/images/roadmap-specific-image.png",
    };

    return (
        <>
            <MetaTags {...pageInfo} />
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                {/* Match the overall container and card styling from Privacy.jsx */}
                <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
                    {/* H1 with Montserrat font */}
                    <h1
                        className="text-3xl md:text-4xl font-bold text-center mb-2 text-emerald-900"
                        style={{ ...headingFont }} // Use a heavier weight for main title
                    >
                        Meadow Mentor Terms of Service
                    </h1>
                    <p className="text-center text-sm text-gray-500 pb-8" style={bodyFont}>
                        {/* --- IMPORTANT: Replace [Date] with the actual last updated date --- */}
                        Last Updated: March 12, 2025
                    </p>

                    {/* Quick Reference Summary Section - styled like Privacy.jsx */}
                    <section className="mb-8 bg-emerald-50 p-4 rounded-lg">
                        <h2
                            className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900"
                            style={{ ...headingFont }}
                        >
                            Quick Reference Summary
                        </h2>
                        <ul className="list-disc pl-6 space-y-2" style={bodyFont}>
                            <li>Purpose: Meadow Mentor provides personalized tools and information to help you manage therapeutic diets.</li>
                            <li>Not Medical Advice: Our Services are for informational purposes only and <strong style={{ fontWeight: 600 }}>are not a substitute for professional medical advice, diagnosis, or treatment.</strong> Always consult your doctor or a qualified health provider.</li>
                            <li>AI Limitations: AI responses can sometimes be inaccurate or incomplete. Use the information critically and verify it when necessary.</li>
                            <li>Your Account: You need an account for most features. Keep your login details secure. You must be 18+ or have guardian permission (and oversight) to use the app.</li>
                            <li>Subscription: We offer a free Basic plan and a paid Premium plan with more features and higher usage limits. Payments are handled by Stripe.</li>
                            <li>Your Content: You are responsible for the information you provide (questions, meal logs, etc.).</li>
                            <li>Our Content: We grant you a license to use the app and its features according to these Terms. AI-generated output (like recipes) is yours to use, subject to these terms and disclaimers.</li>
                            <li>Acceptable Use: Don't misuse the service (e.g., illegal activities, harming the system, sharing accounts).</li>
                            <li>Changes: We may update these Terms and will notify you of significant changes.</li>
                            <li>Termination: You can delete your account anytime. We can suspend or terminate accounts for violating these Terms.</li>
                        </ul>
                    </section>

                    {/* Divider */}
                    <div className="border-t border-gray-200 my-8"></div>

                    {/* Section 1 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            1. Welcome to Meadow Mentor
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            Meadow Mentor ("Meadow Mentor," "we," "us," "our") is provided by Reid Kimball Design. Our Services include personalized tools like recipe generation, meal adaptation, ingredient checking, diet-specific Q&A ("Ask Kay"), a 7-Day Meal Planner (Premium feature), a Food Journal, and the ability to save generated content.
                        </p>
                        <p className="text-gray-700 leading-relaxed" style={bodyFont}>
                            By accessing or using our Services, you confirm that you accept these Terms and agree to comply with them. If you do not agree, you must not use our Services.
                        </p>
                    </section>

                    {/* Section 2 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            2. Important Disclaimers
                        </h2>
                        <ul className="list-disc pl-6 space-y-3 text-gray-700 leading-relaxed" style={bodyFont}>
                            <li><strong style={{ fontWeight: 600 }}>No Medical Advice:</strong> Meadow Mentor provides information related to therapeutic diets but does <strong style={{ fontWeight: 600 }}>not</strong> provide medical advice. The content and AI responses generated are for informational purposes only. They are not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or dietary changes. Never disregard professional medical advice or delay in seeking it because of something you have read or received from Meadow Mentor.</li>
                            <li><strong style={{ fontWeight: 600 }}>AI Accuracy:</strong> Our AI tools strive to provide helpful and relevant information based on your profile (therapeutic diet, conditions) and inputs. However, artificial intelligence can make mistakes, generate inaccurate information, or provide incomplete answers. You should critically evaluate all AI-generated content and, where appropriate, verify information independently, especially concerning health decisions or food safety. Reliance on any information provided by Meadow Mentor is solely at your own risk.</li>
                            <li><strong style={{ fontWeight: 600 }}>"As Is" Service:</strong> The Services are provided "as is" and "as available" without any warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that the Services will always be safe, secure, error-free, or that they will function without disruptions, delays, or imperfections.</li>
                        </ul>
                    </section>

                    {/* Section 3 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            3. Your Account and Eligibility
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700 leading-relaxed" style={bodyFont}>
                            <li><strong style={{ fontWeight: 600 }}>Registration:</strong> You need to register for an account to access most features. You agree to provide accurate and complete information (like your name, email, therapeutic diet) and keep it updated.</li>
                            <li><strong style={{ fontWeight: 600 }}>Age Requirement:</strong> You must be at least 18 years old to create an account and use our Services. If you are under 18, you may only use Meadow Mentor under the supervision of a parent or legal guardian who agrees to be bound by these Terms and takes responsibility for your activity. Consistent with our <Link to="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link>, Meadow Mentor is not designed for unsupervised use by children.</li>
                            <li><strong style={{ fontWeight: 600 }}>Account Security:</strong> You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. Notify us immediately if you suspect unauthorized access.</li>
                            <li><strong style={{ fontWeight: 600 }}>One Account:</strong> Please create only one account for your personal use. Sharing accounts is not permitted.</li>
                        </ul>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> Keep your account info safe and accurate. If you're under 18, your parent/guardian needs to manage the account and agree to these rules.
                        </p>
                    </section>

                    {/* Section 4 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            4. Subscription Plans and Payments
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700 leading-relaxed" style={bodyFont}>
                            <li><strong style={{ fontWeight: 600 }}>Plans:</strong> We offer a free "Basic" plan with limited features and daily AI usage, and a paid "Premium" plan with expanded features (like the 7-Day Meal Planner) and higher daily usage limits, as described on our <Link to="/pricing" className="text-emerald-600 hover:underline">Pricing page</Link>.</li>
                            <li><strong style={{ fontWeight: 600 }}>Billing:</strong> Premium plans are billed on a subscription basis (e.g., monthly). Payments are processed through our third-party payment processor, Stripe. By providing payment information, you agree to their terms as well.</li>
                            <li><strong style={{ fontWeight: 600 }}>Cancellation:</strong> You can cancel your Premium subscription at any time through your account settings or by contacting us. Cancellation will take effect at the end of the current billing period.</li>
                            <li><strong style={{ fontWeight: 600 }}>Refunds:</strong> We offer a 30-day money-back guarantee for Premium subscriptions as stated on our pricing page.</li>
                            <li><strong style={{ fontWeight: 600 }}>Price Changes:</strong> We reserve the right to change subscription fees. We will provide you with reasonable prior notice of any price changes.</li>
                        </ul>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> You can use the app for free with limits, or pay for Premium to get more features and uses. You can cancel anytime.
                        </p>
                    </section>

                    {/* Section 5 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            5. Using the Services
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700 leading-relaxed" style={bodyFont}>
                            <li><strong style={{ fontWeight: 600 }}>License:</strong> We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your personal, non-commercial use, according to these Terms.</li>
                            <li><strong style={{ fontWeight: 600 }}>User Input:</strong> When you provide information to the Services (like ingredients, questions for Kay, meal logs - "Input"), you represent that you have the right to provide this Input and that it doesn't violate any laws or third-party rights. You remain responsible for your Input.</li>
                            <li><strong style={{ fontWeight: 600 }}>AI Output:</strong> The Services may generate responses based on your Input (like recipes, answers, meal plans - "Output"). Subject to your compliance with these Terms, we assign to you our rights (if any) in the Output. You can use the Output for personal purposes, keeping in mind the Disclaimers in Section 2.</li>
                            <li><strong style={{ fontWeight: 600 }}>Acceptable Use:</strong> You agree not to:
                                <ul className='list-[circle] pl-6 mt-2 space-y-1'>
                                    <li>Use the Services for any illegal purpose or in violation of any laws.</li>
                                    <li>Attempt to harm, disrupt, or gain unauthorized access to the Services, our systems, or other users' data.</li>
                                    <li>Reverse engineer, decompile, or disassemble any part of the Services.</li>
                                    <li>Scrape, data mine, or extract data from the Services without our explicit permission.</li>
                                    <li>Use the Services to generate content that is hateful, harassing, harmful, or violates our (or our AI providers') prohibited use policies (See also <a href="https://policies.google.com/terms/generative-ai/use-policy" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Google AI Policy</a>, <a href="https://www.anthropic.com/legal/aup" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">Anthropic AUP</a>, <a href="https://openai.com/policies/usage-policies" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline">OpenAI Usage Policies</a>).</li>
                                    <li>Use the Services to develop competing products or services.</li>
                                    <li>Share your account credentials or allow others to use your account.</li>
                                </ul>
                            </li>
                        </ul>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> Use the app responsibly and legally. The recipes and answers generated are yours to use personally, but remember they aren't infallible medical advice. Don't try to break the app or use it for bad purposes.
                        </p>
                    </section>

                    {/* Section 6 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            6. Intellectual Property
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700 leading-relaxed" style={bodyFont}>
                            <li><strong style={{ fontWeight: 600 }}>Our IP:</strong> The Services, including the Meadow Mentor name, logo, visual design, underlying software, and content (excluding User Input and assigned Output), are the property of Reid Kimball Design and its licensors, protected by copyright and other intellectual property laws. You may not use our branding or trademarks without permission.</li>
                            <li><strong style={{ fontWeight: 600 }}>Your Content:</strong> As stated above, you own your Input, and we assign rights to the Output to you, subject to these Terms.</li>
                        </ul>
                    </section>

                    {/* Section 7 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            7. Third-Party Services
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            Meadow Mentor integrates with or uses third-party services, such as AI providers (like Google, Anthropic, OpenAI - specific provider may vary), authentication services (Firebase), and payment processing (Stripe). Your use of these third-party services may be subject to their respective terms and privacy policies. We are not responsible for the practices of these third parties. Our website may also contain links to external sites; we are not responsible for their content or privacy practices.
                        </p>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> We rely on other companies for parts of our service (like payments or the core AI). Their rules might apply too when you use those specific parts.
                        </p>
                    </section>

                    {/* Section 8 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            8. Termination
                        </h2>
                        <ul className="list-disc pl-6 space-y-2 mb-4 text-gray-700 leading-relaxed" style={bodyFont}>
                            <li><strong style={{ fontWeight: 600 }}>By You:</strong> You can stop using the Services and delete your account at any time by contacting us or using account deletion features if available.</li>
                            <li><strong style={{ fontWeight: 600 }}>By Us:</strong> We may suspend or terminate your access to the Services immediately, without prior notice or liability, if you breach these Terms. We may also terminate accounts for prolonged inactivity or other reasons, providing notice where feasible.</li>
                        </ul>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> You're free to leave anytime. We can remove your access if you break the rules.
                        </p>
                    </section>

                    {/* Section 9 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            9. Limitation of Liability
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            To the fullest extent permitted by applicable law, Reid Kimball Design (and its affiliates, officers, employees, agents) shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Services; (b) any conduct or content of any third party on the Services; (c) any content obtained from the Services (including AI Output); or (d) unauthorized access, use, or alteration of your transmissions or content, even if we have been advised of the possibility of such damages.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            In no event shall our aggregate liability for all claims relating to the Services exceed the greater of one hundred U.S. dollars (USD $100) or the amount you paid us, if any, in the last twelve months for the Services.
                        </p>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> We are not liable for damages resulting from your use of the app, especially given the health-related nature and AI limitations. Our financial liability is limited.
                        </p>
                    </section>

                    {/* Section 10 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            10. Changes to These Terms
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            We may modify these Terms from time to time. If we make material changes, we will notify you through the Services or via the email address associated with your account at least 30 days before the changes take effect. By continuing to use the Services after the changes become effective, you agree to the revised Terms.
                        </p>
                        <p className="text-gray-700" style={bodyFont}>
                            <strong style={{ fontWeight: 600 }}>What This Means For You:</strong> We'll let you know if we make major changes to these rules. Using the app after updates means you accept the new rules.
                        </p>
                    </section>

                    {/* Section 11 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            11. Governing Law and Dispute Resolution
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            {/* --- IMPORTANT: Replace [Your State/Country] and [Specify method...] --- */}
                            These Terms shall be governed by the laws of California, USA, without regard to its conflict of law provisions.
                            {/* --- Consult a lawyer about this section --- */}
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            We encourage you to contact us first if you have an issue. Most disputes can be resolved informally. If a formal dispute arises, you agree to resolve it through binding arbitration in San Francisco, California, administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.
                            {/* --- This is an EXAMPLE arbitration clause. Consult a lawyer. --- */}
                        </p>
                    </section>

                    {/* Section 12 */}
                    <section className="mb-8">
                        <h2 className="text-xl md:text-2xl font-semibold mb-4 text-emerald-900" style={{ ...headingFont }}>
                            12. Contact Us
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-4" style={bodyFont}>
                            If you have any questions about these Terms, please{' '}
                            <a
                                href="#"
                                className="text-emerald-600 hover:underline"
                                style={bodyFont} // Apply body font to link
                                onClick={(e) => {
                                    e.preventDefault();
                                    // Ensure mailto link opens in a new tab/window if possible, though behavior varies
                                    window.open(`mailto:${encodedEmail}?subject=${encodeURIComponent(emailSubject)}`, '_blank');
                                }}
                            >
                                Contact Us
                            </a>.
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

export default Terms;
