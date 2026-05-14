import React from 'react';
import { Box, Container, Typography, Divider, List, ListItem, ListItemText, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read the Terms of Service for Meadow Mentor. Understand your rights and responsibilities when using our personalized chef and health management tools.',
  openGraph: {
    url: 'https://meadowmentor.com/terms',
  },
};

export default function TermsPage() {
  const dateLastUpdated = 'March 12, 2025';
  const encodedEmail = 'support@meadowmentor.atlassian.net';
  const emailSubject = 'Terms of Service Question';

  return (
    <Box sx={{ bgcolor: '#fafafa', py: 8 }}>
      <Container maxWidth="md">
        <Box sx={{ bgcolor: '#fff', borderRadius: 4, boxShadow: '0 4px 12px rgba(0,0,0,0.05)', p: { xs: 3, md: 6 } }}>
          <Typography 
            variant="h3" 
            component="h1" 
            align="center" 
            sx={{ 
              fontWeight: 700, 
              color: '#013D1D', 
              mb: 1,
              fontFamily: 'var(--font-heading, Montserrat)'
            }}
          >
            Meadow Mentor Terms of Service
          </Typography>
          <Typography align="center" variant="body2" sx={{ color: '#666', mb: 4 }}>
            Last Updated: {dateLastUpdated}
          </Typography>

          {/* Quick Reference Summary */}
          <Box sx={{ bgcolor: '#e6f7ed', p: 4, borderRadius: 2, mb: 6 }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 600, 
                color: '#013D1D', 
                mb: 2,
                fontFamily: 'var(--font-heading, Montserrat)'
              }}
            >
              Quick Reference Summary
            </Typography>
            <List sx={{ listStyleType: 'disc', pl: 4 }}>
              {[
                "Purpose: Meadow Mentor provides personalized tools and information to help you manage therapeutic diets.",
                "Not Medical Advice: Our Services are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Always consult your doctor or a qualified health provider.",
                "AI Limitations: AI responses can sometimes be inaccurate or incomplete. Use the information critically and verify it when necessary.",
                "Your Account: You need an account for most features. Keep your login details secure. You must be 18+ or have guardian permission (and oversight) to use the app.",
                "Subscription: We offer a free Basic plan and a paid Premium plan with more features and higher usage limits. Payments are handled by Stripe.",
                "Your Content: You are responsible for the information you provide (questions, meal logs, etc.).",
                "Our Content: We grant you a license to use the app and its features according to these Terms. AI-generated output (like recipes) is yours to use, subject to these terms and disclaimers.",
                "Acceptable Use: Don't misuse the service (e.g., illegal activities, harming the system, sharing accounts).",
                "Changes: We may update these Terms and will notify you of significant changes.",
                "Termination: You can delete your account anytime. We can suspend or terminate accounts for violating these Terms."
              ].map((item, index) => (
                <ListItem key={index} sx={{ display: 'list-item', p: 0, pb: 1 }}>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 6 }} />

          {/* Sections */}
          <Section title="1. Welcome to Meadow Mentor">
            Meadow Mentor ("Meadow Mentor," "we," "us," "our") is provided by Reid Kimball Design. Our Services include personalized tools like recipe generation, meal adaptation, ingredient checking, diet-specific Q&A ("Ask Kay"), a 7-Day Meal Planner (Premium feature), a Food Journal, and the ability to save generated content.
            <br /><br />
            By accessing or using our Services, you confirm that you accept these Terms and agree to comply with them. If you do not agree, you must not use our Services.
          </Section>

          <Section title="2. Important Disclaimers">
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="No Medical Advice">
                Meadow Mentor provides information related to therapeutic diets but does <strong>not</strong> provide medical advice. The content and AI responses generated are for informational purposes only. They are not intended as a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition or dietary changes. Never disregard professional medical advice or delay in seeking it because of something you have read or received from Meadow Mentor.
              </BulletPoint>
              <BulletPoint title="AI Accuracy">
                Our AI tools strive to provide helpful and relevant information based on your profile (therapeutic diet, conditions) and inputs. However, artificial intelligence can make mistakes, generate inaccurate information, or provide incomplete answers. You should critically evaluate all AI-generated content and, where appropriate, verify information independently, especially concerning health decisions or food safety. Reliance on any information provided by Meadow Mentor is solely at your own risk.
              </BulletPoint>
              <BulletPoint title="&quot;As Is&quot; Service">
                The Services are provided "as is" and "as available" without any warranties of any kind, express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement. We do not guarantee that the Services will always be safe, secure, error-free, or that they will function without disruptions, delays, or imperfections.
              </BulletPoint>
            </List>
          </Section>

          <Section title="3. Your Account and Eligibility">
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="Registration">You need to register for an account to access most features. You agree to provide accurate and complete information (like your name, email, therapeutic diet) and keep it updated.</BulletPoint>
              <BulletPoint title="Age Requirement">
                You must be at least 18 years old to create an account and use our Services. If you are under 18, you may only use Meadow Mentor under the supervision of a parent or legal guardian who agrees to be bound by these Terms and takes responsibility for your activity. Consistent with our <Link href="/privacy" style={{ color: '#047857', fontWeight: 600 }}>Privacy Policy</Link>, Meadow Mentor is not designed for unsupervised use by children.
              </BulletPoint>
              <BulletPoint title="Account Security">You are responsible for maintaining the confidentiality of your account password and for all activities that occur under your account. Notify us immediately if you suspect unauthorized access.</BulletPoint>
              <BulletPoint title="One Account">Please create only one account for your personal use. Sharing accounts is not permitted.</BulletPoint>
            </List>
            <SummaryBox>
              What This Means For You: Keep your account info safe and accurate. If you're under 18, your parent/guardian needs to manage the account and agree to these rules.
            </SummaryBox>
          </Section>

          <Section title="4. Subscription Plans and Payments">
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="Plans">
                We offer a free "Basic" plan with limited features and daily AI usage, and a paid "Premium" plan with expanded features (like the 7-Day Meal Planner) and higher daily usage limits, as described on our <Link href="/pricing" style={{ color: '#047857', fontWeight: 600 }}>Pricing page</Link>.
              </BulletPoint>
              <BulletPoint title="Billing">Premium plans are billed on a subscription basis (e.g., monthly). Payments are processed through our third-party payment processor, Stripe. By providing payment information, you agree to their terms as well.</BulletPoint>
              <BulletPoint title="Cancellation">You can cancel your Premium subscription at any time through your account settings or by contacting us. Cancellation will take effect at the end of the current billing period.</BulletPoint>
              <BulletPoint title="Refunds">We offer a 30-day money-back guarantee for Premium subscriptions as stated on our pricing page.</BulletPoint>
              <BulletPoint title="Price Changes">We reserve the right to change subscription fees. We will provide you with reasonable prior notice of any price changes.</BulletPoint>
            </List>
            <SummaryBox>
              What This Means For You: You can use the app for free with limits, or pay for Premium to get more features and uses. You can cancel anytime.
            </SummaryBox>
          </Section>

          <Section title="5. Using the Services">
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="License">We grant you a limited, non-exclusive, non-transferable, revocable license to access and use the Services for your personal, non-commercial use, according to these Terms.</BulletPoint>
              <BulletPoint title="User Input">When you provide information to the Services (like ingredients, questions for Kay, meal logs - "Input"), you represent that you have the right to provide this Input and that it doesn't violate any laws or third-party rights. You remain responsible for your Input.</BulletPoint>
              <BulletPoint title="AI Output">The Services may generate responses based on your Input (like recipes, answers, meal plans - "Output"). Subject to your compliance with these Terms, we assign to you our rights (if any) in the Output. You can use the Output for personal purposes, keeping in mind the Disclaimers in Section 2.</BulletPoint>
              <BulletPoint title="Acceptable Use">
                You agree not to:
                <List sx={{ listStyleType: 'circle', pl: 4, mt: 1 }}>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <ListItemText primary="Use the Services for any illegal purpose or in violation of any laws." primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <ListItemText primary="Attempt to harm, disrupt, or gain unauthorized access to the Services, our systems, or other users' data." primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <ListItemText primary="Reverse engineer, decompile, or disassemble any part of the Services." primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <ListItemText primary="Scrape, data mine, or extract data from the Services without our explicit permission." primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <Typography variant="body1" color="text.primary">
                      Use the Services to generate content that is hateful, harassing, harmful, or violates our (or our AI providers') prohibited use policies (See also <MuiLink href="https://policies.google.com/terms/generative-ai/use-policy" target="_blank" rel="noopener noreferrer" sx={{ color: '#047857', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Google AI Policy</MuiLink>, <MuiLink href="https://www.anthropic.com/legal/aup" target="_blank" rel="noopener noreferrer" sx={{ color: '#047857', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Anthropic AUP</MuiLink>, <MuiLink href="https://openai.com/policies/usage-policies" target="_blank" rel="noopener noreferrer" sx={{ color: '#047857', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>OpenAI Usage Policies</MuiLink>).
                    </Typography>
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <ListItemText primary="Use the Services to develop competing products or services." primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                  </ListItem>
                  <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}>
                    <ListItemText primary="Share your account credentials or allow others to use your account." primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                  </ListItem>
                </List>
              </BulletPoint>
            </List>
            <SummaryBox>
              What This Means For You: Use the app responsibly and legally. The recipes and answers generated are yours to use personally, but remember they aren't infallible medical advice. Don't try to break the app or use it for bad purposes.
            </SummaryBox>
          </Section>

          <Section title="6. Intellectual Property">
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="Our IP">The Services, including the Meadow Mentor name, logo, visual design, underlying software, and content (excluding User Input and assigned Output), are the property of Reid Kimball Design and its licensors, protected by copyright and other intellectual property laws. You may not use our branding or trademarks without permission.</BulletPoint>
              <BulletPoint title="Your Content">As stated above, you own your Input, and we assign rights to the Output to you, subject to these Terms.</BulletPoint>
            </List>
          </Section>

          <Section title="7. Third-Party Services">
            <Typography paragraph>
              Meadow Mentor integrates with or uses third-party services, such as AI providers (like Google, Anthropic, OpenAI - specific provider may vary), authentication services (Firebase), and payment processing (Stripe). Your use of these third-party services may be subject to their respective terms and privacy policies. We are not responsible for the practices of these third parties. Our website may also contain links to external sites; we are not responsible for their content or privacy practices.
            </Typography>
            <SummaryBox>
              What This Means For You: We rely on other companies for parts of our service (like payments or the core AI). Their rules might apply too when you use those specific parts.
            </SummaryBox>
          </Section>

          <Section title="8. Termination">
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="By You">You can stop using the Services and delete your account at any time by contacting us or using account deletion features if available.</BulletPoint>
              <BulletPoint title="By Us">We may suspend or terminate your access to the Services immediately, without prior notice or liability, if you breach these Terms. We may also terminate accounts for prolonged inactivity or other reasons, providing notice where feasible.</BulletPoint>
            </List>
            <SummaryBox>
              What This Means For You: You're free to leave anytime. We can remove your access if you break the rules.
            </SummaryBox>
          </Section>

          <Section title="9. Limitation of Liability">
            <Typography paragraph>
              To the fullest extent permitted by applicable law, Reid Kimball Design (and its affiliates, officers, employees, agents) shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses, resulting from (a) your access to or use of or inability to access or use the Services; (b) any conduct or content of any third party on the Services; (c) any content obtained from the Services (including AI Output); or (d) unauthorized access, use, or alteration of your transmissions or content, even if we have been advised of the possibility of such damages.
            </Typography>
            <Typography paragraph>
              In no event shall our aggregate liability for all claims relating to the Services exceed the greater of one hundred U.S. dollars (USD $100) or the amount you paid us, if any, in the last twelve months for the Services.
            </Typography>
            <SummaryBox>
              What This Means For You: We are not liable for damages resulting from your use of the app, especially given the health-related nature and AI limitations. Our financial liability is limited.
            </SummaryBox>
          </Section>

          <Section title="10. Changes to These Terms">
            <Typography paragraph>
              We may modify these Terms from time to time. If we make material changes, we will notify you through the Services or via the email address associated with your account at least 30 days before the changes take effect. By continuing to use the Services after the changes become effective, you agree to the revised Terms.
            </Typography>
            <SummaryBox>
              What This Means For You: We'll let you know if we make major changes to these rules. Using the app after updates means you accept the new rules.
            </SummaryBox>
          </Section>

          <Section title="11. Governing Law and Dispute Resolution">
            <Typography paragraph>
              These Terms shall be governed by the laws of California, USA, without regard to its conflict of law provisions.
            </Typography>
            <Typography paragraph>
              We encourage you to contact us first if you have an issue. Most disputes can be resolved informally. If a formal dispute arises, you agree to resolve it through binding arbitration in San Francisco, California, administered by the American Arbitration Association (AAA) under its Commercial Arbitration Rules. You agree to waive any right to participate in a class action lawsuit or class-wide arbitration.
            </Typography>
          </Section>

          <Section title="12. Contact Us">
            <Typography paragraph>
              If you have any questions about these Terms, please{' '}
              <MuiLink href={`mailto:${encodedEmail}?subject=${encodeURIComponent(emailSubject)}`} sx={{ color: '#047857', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Contact Us
              </MuiLink>.
            </Typography>
          </Section>

          <Divider sx={{ my: 6 }} />

          <Typography align="center" variant="h6" sx={{ color: '#333', fontWeight: 600 }}>
            Thank you for using Meadow Mentor!
          </Typography>
          <Typography align="right" variant="caption" display="block" sx={{ color: '#666', mt: 2 }}>
            Last Updated: {dateLastUpdated}
          </Typography>

        </Box>
      </Container>
    </Box>
  );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 6 }}>
      <Typography 
        variant="h5" 
        component="h2" 
        sx={{ 
          fontWeight: 600, 
          color: '#013D1D', 
          mb: 2,
          fontFamily: 'var(--font-heading, Montserrat)'
        }}
      >
        {title}
      </Typography>
      <Box sx={{ color: '#525252', lineHeight: 1.7 }}>
        {children}
      </Box>
    </Box>
  );
}

function BulletPoint({ title, children }: { title: string, children: React.ReactNode }) {
  return (
    <ListItem sx={{ display: 'list-item', p: 0, pb: 1 }}>
      <Typography component="span" sx={{ fontWeight: 600 }}>{title}: </Typography>
      <Typography component="span">{children}</Typography>
    </ListItem>
  );
}

function SummaryBox({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ mt: 2, p: 2, bgcolor: '#fafafa', borderLeft: '4px solid #FFBF00', borderRadius: '0 4px 4px 0' }}>
      <Typography variant="body2" sx={{ color: '#333' }}>
        <strong>{children}</strong>
      </Typography>
    </Box>
  );
}
