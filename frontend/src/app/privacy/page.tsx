import React from 'react';
import { Box, Container, Typography, Divider, List, ListItem, ListItemText, Link as MuiLink } from '@mui/material';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn about the privacy policies for Meadow Mentor, your personal chef helping you thrive one meal at a time.',
  openGraph: {
    url: 'https://meadowmentor.com/privacy',
  },
};

export default function PrivacyPage() {
  const dateLastUpdated = 'April 12, 2025';
  const encodedEmail = 'support@meadowmentor.atlassian.net';
  const emailSubject = 'Privacy Question';

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
            Meadow Mentor Privacy Policy
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
                "We collect your email, name, health conditions, diet preferences, and AI interactions",
                "We use this information to personalize your experience and improve our services",
                "Your data is protected through encryption and secure storage platforms",
                "We don't sell your data (though this may change with notice)",
                "You control what information you share with us"
              ].map((item, index) => (
                <ListItem key={index} sx={{ display: 'list-item', p: 0, pb: 1 }}>
                  <ListItemText primary={item} primaryTypographyProps={{ variant: 'body1', color: 'text.primary' }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ my: 6 }} />

          {/* Sections */}
          <Section title="Welcome to Meadow Mentor">
            At Meadow Mentor, we understand that managing health conditions requires trust. Your privacy
            matters deeply to us, especially when it comes to sensitive health information. This policy
            explains how we collect, use, and protect your personal information while providing you with
            personalized health and wellness support.
          </Section>

          <Section title="What Information We Collect">
            <Typography variant="h6" sx={{ color: '#013D1D', mb: 1, fontSize: '1.1rem', fontWeight: 600 }}>Personal Information</Typography>
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="Account Information">Your email address and first name are required. Last name is optional.</BulletPoint>
              <BulletPoint title="Health Information">Health conditions you're managing and therapeutic diets you follow.</BulletPoint>
              <BulletPoint title="App Interactions">Questions asked to our AI, ingredients submitted for recipe generation, logged meals, and supplements/medications you take.</BulletPoint>
              <BulletPoint title="Payment Information">Your purchase history (payment details are stored by Stripe, not directly by us).</BulletPoint>
            </List>
            <SummaryBox>
              What This Means For You: We only collect information that helps us personalize your experience.
              You control how much you share, and we never collect device or IP information.
            </SummaryBox>
          </Section>

          <Section title="How We Collect Your Information">
            <Typography paragraph>All information we have about you comes directly from you through:</Typography>
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Account creation and profile setup" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Features you use within the app" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Questions you ask our AI assistant" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Recipes you generate" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Meals, supplements, and medications you log" /></ListItem>
            </List>
            <SummaryBox>
              What This Means For You: We don't gather information about you from outside sources or track you across the internet.
              What you share is what we know.
            </SummaryBox>
          </Section>

          <Section title="How We Use Your Information">
            <Typography paragraph>We use your information to:</Typography>
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Provide a personalized experience tailored to your health needs" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Develop and improve app features based on how they're used" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Process payments for subscriptions or purchases" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Communicate important updates about the app" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Analyze usage patterns to make the app more helpful" /></ListItem>
            </List>
            <SummaryBox>
              What This Means For You: Your information helps us make Meadow Mentor more useful for your specific health journey.
              We don't use your data for purposes unrelated to improving your experience.
            </SummaryBox>
          </Section>

          <Section title="How We Protect Your Information">
            <Typography paragraph>Your health information deserves the highest level of protection:</Typography>
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <BulletPoint title="Payment Security">All payment transactions are encrypted through Stripe</BulletPoint>
              <BulletPoint title="Account Security">User login credentials are encrypted through Google Firebase</BulletPoint>
              <BulletPoint title="Health Data Security">Your health information is stored on Google Cloud Platform and Mongo Atlas, which provide enterprise-level security</BulletPoint>
              <BulletPoint title="Data Access">Only authorized team members can access user data, and only for legitimate business purposes</BulletPoint>
            </List>
            <SummaryBox>
              What This Means For You: We use industry-leading security standards to keep your sensitive health information safe.
            </SummaryBox>
          </Section>

          <Section title="Children's Privacy">
            <Typography paragraph>
              Meadow Mentor is not designed for children. We recommend that legal guardians be the account owners for any children using our app.
              If we discover accounts belonging to children, we will delete this data to protect their privacy.
            </Typography>
            <SummaryBox>
              What This Means For You: If you're helping a child manage their health with our app,
              please create and manage the account yourself as their guardian.
            </SummaryBox>
          </Section>

          <Section title="Cookies and Tracking">
            <Typography paragraph>
              At this time, we do not use cookies to track users. If this changes, we will update this privacy policy and notify you.
            </Typography>
            <SummaryBox>
              What This Means For You: We don't follow you around the internet or track your browsing habits.
            </SummaryBox>
          </Section>

          <Section title="Third-Party Links">
            <Typography paragraph>
              Our website may contain links to third-party partners. We are not responsible for the privacy practices of these external sites.
              We encourage you to review their privacy policies before sharing your information.
            </Typography>
            <SummaryBox>
              What This Means For You: When you click on links that take you outside our app, different privacy rules may apply.
            </SummaryBox>
          </Section>

          <Section title="Changes to This Privacy Policy">
            <Typography paragraph>
              If we make significant changes to this privacy policy, we'll notify you via the email address associated with your account.
              We encourage you to review our privacy policy periodically.
            </Typography>
            <SummaryBox>
              What This Means For You: You'll never be surprised by changes in how we handle your data.
              We'll let you know directly if anything changes.
            </SummaryBox>
          </Section>

          <Section title="Your Data Rights">
            <Typography paragraph>Depending on your location, you may have certain rights regarding your personal information, including:</Typography>
            <List sx={{ listStyleType: 'disc', pl: 4, mb: 2 }}>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Accessing your data" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Correcting inaccurate information" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Deleting your account and associated data" /></ListItem>
              <ListItem sx={{ display: 'list-item', p: 0, pb: 0.5 }}><ListItemText primary="Restricting certain uses of your information" /></ListItem>
            </List>
            <Typography paragraph>To exercise these rights, please contact us using the information below.</Typography>
            <SummaryBox>
              What This Means For You: You have control over your data, and we're here to help you exercise your rights.
            </SummaryBox>
          </Section>

          <Section title="Contact Us">
            <Typography paragraph>
              If you have questions or concerns about this privacy policy or your personal information, please{' '}
              <MuiLink href={`mailto:${encodedEmail}?subject=${encodeURIComponent(emailSubject)}`} sx={{ color: '#047857', fontWeight: 600, textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                Contact Us
              </MuiLink>.
            </Typography>
            <SummaryBox>
              What This Means For You: We're here to help with any privacy concerns you might have. Don't hesitate to reach out.
            </SummaryBox>
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
