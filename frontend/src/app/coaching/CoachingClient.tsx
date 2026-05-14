"use client";

import React, { useState } from 'react';
import { Box, Container, Typography, Card, CardContent, List, ListItem, ListItemIcon, ListItemText, Divider, Accordion, AccordionSummary, AccordionDetails, TextField, IconButton, Snackbar, Alert } from '@mui/material';
import {
  Heart,
  Shield,
  Calendar,
  Target,
  Check,
  Star,
  ChevronDown,
  AlertTriangle,
  Clock,
  Award,
  BookHeart,
  XCircle,
  Ban,
  Sprout,
  Wrench,
  RotateCcw,
  Sparkles,
  Send,
  Smartphone,
} from 'lucide-react';
import CTAButton from '@/components/CTAButton';
import { API_BASE_URL } from '@/lib/api';

// ─── FAQ DATA ───
const faqs = [
  {
    question: "Is this medical advice?",
    answer: "No. I am not a doctor or registered dietitian. This coaching is based on my 20+ years of personal experience managing Crohn's Disease using the Specific Carbohydrate Diet (SCD) and GAPS diet. Everything I share is for informational and educational purposes only. Always consult with your healthcare provider before making changes to your diet or treatment plan."
  },
  {
    question: "Who is this for?",
    answer: "Anyone who has been diagnosed with Crohn's Disease, Ulcerative Colitis, or another form of Inflammatory Bowel Disease (IBD) and wants to explore using diet as part of their management strategy. It's especially helpful for people who are newly diagnosed, struggling with a flare, or looking to deepen their understanding of therapeutic diets."
  },
  {
    question: "What diets do you coach on?",
    answer: "I have deep personal experience with the Specific Carbohydrate Diet (SCD) and the GAPS diet. I can also share knowledge about the Mediterranean diet, AIP (Autoimmune Protocol), and other therapeutic diets I've researched over the years. Your coaching will be tailored to your situation and preferences."
  },
  {
    question: "How do sessions work?",
    answer: "Sessions are conducted via video call (Zoom or Google Meet). Before your first session, you'll complete a brief health questionnaire. During the session, we'll review your current diet, symptoms, goals, and I'll provide personalized food recommendations, meal planning strategies, and lifestyle tips based on the SCD/GAPS framework."
  },
  {
    question: "What if I want ongoing support between sessions?",
    answer: "Weekly check-ins via text or email are included with the 3-session package. For single sessions, you can opt in to ongoing support. I'm here to help you stay on track and adjust as needed."
  },
  {
    question: "Can this replace my medication?",
    answer: "No. Diet can be a powerful complementary tool, but you should never stop or change your medication without talking to your doctor. I respect the role of conventional medicine and aim to work alongside it, not against it."
  },
  {
    question: "What is the Meadow Mentor companion app?",
    answer: "It's a tool I built that helps you track meals, log symptoms, and get AI-powered diet compliance analysis. Coaching clients can optionally use it to reinforce what we discuss in sessions — but it's not required. The coaching is the core service; the app is a bonus."
  },
];

// ─── TESTIMONIAL PLACEHOLDER DATA ───
// Replace these with real testimonials as you get them
const testimonials = [
  {
    quote: "Reid's guidance helped me understand my Crohn's in a way my doctor never could. Practical, compassionate, and based on real experience.",
    name: "Anonymous",
    detail: "Crohn's patient, 3 years in",
  },
  {
    quote: "This coaching gave me hope when I was in the darkest place. The SCD approach changed everything for me.",
    name: "Anonymous",
    detail: "IBD patient",
  },
];

// ─── 5-R FRAMEWORK DATA ───
const fiveRs = [
  { letter: 'R1', name: 'Remove', icon: <Ban size={28} />, desc: 'Identify and eliminate foods that inflame your gut — refined sugars, processed grains, seed oils, and triggers specific to your condition.' },
  { letter: 'R2', name: 'Replace', icon: <RotateCcw size={28} />, desc: 'Swap inflammatory foods with gut-safe alternatives — honey for sugar, almond flour for wheat, olive oil for canola.' },
  { letter: 'R3', name: 'Reinnoculate', icon: <Sprout size={28} />, desc: 'Restore beneficial bacteria with SCD-legal fermented foods, targeted probiotics, and prebiotic fibers your gut can tolerate.' },
  { letter: 'R4', name: 'Repair', icon: <Wrench size={28} />, desc: 'Heal the gut lining with bone broth, L-glutamine, omega-3s, and targeted nutrients that support mucosal repair.' },
  { letter: 'R5', name: 'Reconnect', icon: <Sparkles size={28} />, desc: 'Reintroduce foods mindfully, one at a time. Build a personal safe foods; list you can trust for the long term.' },
];

// ─── MAIN COMPONENT ───
export default function CoachingClient() {
  const [email, setEmail] = useState('');
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const handleLeadMagnet = async () => {
    if (!email || !email.includes('@')) {
      setSnackbar({ open: true, message: 'Please enter a valid email address.', severity: 'error' });
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/api/lead-magnet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Failed');
      setSnackbar({ open: true, message: 'Check your inbox! Your 5-R Checklist is on its way.', severity: 'success' });
      setEmail('');
    } catch {
      setSnackbar({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF', fontFamily: 'var(--font-body, "Source Sans 3")' }}>

      {/* ═══════════ 1. HERO — CHARACTER + BOTH CTAs ═══════════ */}
      <Box sx={{ background: 'linear-gradient(135deg, #FFF8E5 0%, #dcfce7 50%, #E0F2FE 100%)', pt: { xs: 10, md: 16 }, pb: { xs: 10, md: 14 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Badge icon={<Star size={14} strokeWidth={3} />} text="20+ Years of Lived Experience" />
          <Typography variant="h1" sx={{ fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' }, fontWeight: 800, color: '#013D1D', mb: 3, fontFamily: 'var(--font-heading, Montserrat)', lineHeight: 1.15 }}>
            Take Back Control of Your Gut Health
          </Typography>
          <Typography variant="h5" sx={{ color: '#444', maxWidth: '700px', mx: 'auto', mb: 2, lineHeight: 1.6, fontSize: { xs: '1.1rem', md: '1.3rem' } }}>
            A clear plan. A personal guide. A companion app to track your progress.
            Everything you need to heal your gut with diet — no more guessing.
          </Typography>
          <Typography sx={{ color: '#666', maxWidth: '650px', mx: 'auto', mb: 5, fontSize: '1rem' }}>
            Diagnosed at 17. Changed my diet. Changed my life. Let&apos;s change yours.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mb: 5 }}>
            <CTAButton href="#pricing" variant="primary" size="large">Book Your Coaching Session</CTAButton>
          </Box>
          {/* Transitional CTA — Lead Magnet */}
          <Box data-lead-magnet sx={{ maxWidth: '480px', mx: 'auto', p: 3, borderRadius: 4, bgcolor: 'rgba(1, 61, 29, 0.04)', border: '1px solid rgba(1, 61, 29, 0.12)' }}>
            <Typography sx={{ fontWeight: 700, color: '#013D1D', mb: 1, fontFamily: 'var(--font-heading, Montserrat)', fontSize: '1rem' }}>
              📋 Free: 5-R Gut Healing Starter Checklist
            </Typography>
            <Typography sx={{ color: '#555', fontSize: '0.9rem', mb: 2 }}>
              A printable checklist to start healing your gut today. Enter your email and I&apos;ll send it to you.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField size="small" placeholder="you@email.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleLeadMagnet(); }} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' } }} />
              <IconButton onClick={handleLeadMagnet} sx={{ bgcolor: '#013D1D', color: '#FFBF00', borderRadius: 2, '&:hover': { bgcolor: '#047857' }, width: 42, height: 42 }}>
                <Send size={18} />
              </IconButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 2. PROBLEM — 3 LAYERS ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            You&apos;re Fighting More Than Symptoms
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#555', maxWidth: '700px', mx: 'auto', mb: 6, fontSize: '1.1rem', lineHeight: 1.7 }}>
            When I was diagnosed at 17, nobody talked to me about <strong>food as medicine</strong>.
            It took me years to find what worked. Here&apos;s what you&apos;re really up against:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            {[
              { icon: <Shield size={28} />, label: 'External', title: "Overwhelmed by Conflicting Advice", desc: "Google gives you 100 answers. Your doctor gives you none. You're lost in a sea of elimination diets and supplements." },
              { icon: <Heart size={28} />, label: 'Internal', title: "Unpredictable Flare-Ups", desc: "Your symptoms rule your schedule. Every meal feels like a gamble. You never know what tomorrow will bring." },
              { icon: <Target size={28} />, label: 'Philosophical', title: "You Deserve a Guide", desc: "It shouldn't take years of trial and error to find what works. Nobody should have to figure this out alone at 2 AM." },
            ].map((item, i) => (
              <Card key={i} sx={{ p: 4, borderRadius: 4, border: '1px solid #f0f0f0', transition: 'all 0.3s ease', textAlign: 'center', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)', borderColor: '#013D1D' } }}>
                <Box sx={{ width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#FFF8E5', color: '#013D1D' }}>
                  {item.icon}
                </Box>
                <Typography sx={{ color: '#FFBF00', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>{item.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2 }}>{item.title}</Typography>
                <Typography sx={{ color: '#555', lineHeight: 1.6 }}>{item.desc}</Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 4. THE PLAN — 5-R FRAMEWORK ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            Your Plan: The 5-R Framework
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#666', maxWidth: '600px', mx: 'auto', mb: 8, fontSize: '1.1rem' }}>
            A proven, step-by-step approach to gut healing. This is the system I use with every client — and the same one I used myself.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {fiveRs.map((r, i) => (
              <Card key={i} sx={{ p: { xs: 3, md: 4 }, borderRadius: 4, border: '1px solid #f0f0f0', display: 'flex', alignItems: { xs: 'flex-start', md: 'center' }, gap: 3, transition: 'all 0.3s ease', '&:hover': { borderColor: '#013D1D', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' } }}>
                <Box sx={{ minWidth: { md: '80px' }, textAlign: 'center' }}>
                  <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#013D1D', color: '#FFBF00' }}>
                    {r.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#FFBF00', textTransform: 'uppercase', letterSpacing: '0.1em', mt: 1, fontFamily: 'var(--font-heading, Montserrat)' }}>{r.letter}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>{r.name}</Typography>
                  <Typography sx={{ color: '#555', lineHeight: 1.6 }}>{r.desc}</Typography>
                </Box>
              </Card>
            ))}
          </Box>
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <CTAButton href="#pricing" variant="primary" size="large">Get Personalized 5-R Guidance</CTAButton>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 3. GUIDE — REID (moved up after problem) ═══════════ */}
      <Box id="about" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            I&apos;ve Been Where You Are
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#555', maxWidth: '600px', mx: 'auto', mb: 6, fontSize: '1.1rem', lineHeight: 1.7 }}>
            I&apos;m not a doctor. I&apos;m someone who&apos;s walked this path for 20+ years — and I know the shortcuts nobody else is telling you.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 6, alignItems: 'flex-start' }}>
            <Box sx={{ minWidth: { md: '220px' }, textAlign: 'center' }}>
              <Box component="img" src="https://storage.googleapis.com/meadow_mentor_public_media/images/chef_kay_in_sun_v4_sm.webp" alt="Reid Kimball - IBD Coach" sx={{ width: { xs: '100%', md: '220px' }, height: { xs: 'auto', md: '220px' }, borderRadius: '24px', objectFit: 'cover', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }} />
              <Typography sx={{ mt: 2, color: '#013D1D', fontWeight: 600, fontFamily: 'var(--font-heading, Montserrat)' }}>Reid Kimball</Typography>
              <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>Founder & Health Coach, Meadow Mentor</Typography>
            </Box>
            <Box sx={{ flex: 1 }}>
              {[
                "I was diagnosed with Crohn's Disease at 17. It derailed my competitive ice hockey career and changed my life forever.",
                "For years, I went from doctor to doctor looking for answers. Conventional medicine helped manage symptoms, but nothing addressed the root cause.",
                "Then I discovered the Specific Carbohydrate Diet (SCD), later expanded into the GAPS protocol. Within months, my symptoms were in remission. For the first time in years, I felt alive.",
                "I spent the next 6 years making a documentary about people like me — folks using alternative treatments for IBD. I've talked to hundreds of people, read the research, and lived this journey every single day.",
              ].map((paragraph, i) => (
                <Typography key={i} sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 2 }}>{paragraph}</Typography>
              ))}
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center', mt: 6 }}>
            {[
              { icon: <Award size={16} />, text: "20+ years managing Crohn's" },
              { icon: <BookHeart size={16} />, text: "SCD & GAPS expert" },
              { icon: <Clock size={16} />, text: "6 years IBD documentary" },
              { icon: <Smartphone size={16} />, text: "Built the Meadow Mentor app" },
            ].map((badge, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1.5, borderRadius: '50px', bgcolor: '#FFF8E5', color: '#013D1D', fontSize: '0.9rem', fontWeight: 600 }}>
                {badge.icon}{badge.text}
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ PRICING + COMPANION APP ═══════════ */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 14 }, background: 'linear-gradient(180deg, #FFF8E5 0%, #FFFFFF 100%)' }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            Invest in Your Health
          </Typography>
          <Typography sx={{ textAlign: 'center', color: '#666', maxWidth: '600px', mx: 'auto', mb: 8, fontSize: '1.1rem' }}>
            Simple, transparent pricing. No subscriptions. No pressure. Optional companion app included.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4, alignItems: 'stretch' }}>
            {/* Single Session */}
            <Card sx={{ borderRadius: 4, border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#013D1D', color: '#FFBF00' }}>
                    <Calendar size={28} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>Single Session</Typography>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', lineHeight: 1 }}>$75</Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 0.5 }}>60-minute session</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                <List sx={{ mb: 4, flexGrow: 1 }}>
                  {[
                    "60-minute 1-on-1 video call",
                    "Personalized diet assessment",
                    "SCD/GAPS food recommendations",
                    "Custom meal plan guidance",
                    "Post-session summary via email",
                    "Optional: Meadow Mentor companion app",
                  ].map((feature, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: '36px', color: '#047857' }}><Check size={18} strokeWidth={3} /></ListItemIcon>
                      <ListItemText primary={feature} sx={{ '& .MuiTypography-root': { fontSize: '0.95rem', color: '#444' } }} />
                    </ListItem>
                  ))}
                </List>
                <CTAButton href="#calendly-single" variant="primary" fullWidth>Book a Session</CTAButton>
              </CardContent>
            </Card>
            {/* 3-Session Bundle */}
            <Card sx={{ borderRadius: 4, border: '3px solid #FFBF00', boxShadow: '0 20px 40px rgba(255, 191, 0, 0.2)', position: 'relative', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 30px 60px rgba(255, 191, 0, 0.3)' }, '&::before': { content: '"BEST VALUE"', position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)', bgcolor: '#FFBF00', color: '#013D1D', px: 3, py: 0.75, borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, zIndex: 10, letterSpacing: '0.05em', fontFamily: 'var(--font-heading, Montserrat)' } }}>
              <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #FFBF00 0%, #FFD700 100%)', color: '#013D1D' }}>
                    <Target size={28} />
                  </Box>
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 1 }}>3-Session Bundle</Typography>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', lineHeight: 1 }}>$200</Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 0.5 }}>3 sessions + ongoing check-ins</Typography>
                  <Typography variant="body2" sx={{ color: '#047857', fontWeight: 700, mt: 1, fontSize: '0.85rem' }}>Save $25 — only $67/session</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                <List sx={{ mb: 4, flexGrow: 1 }}>
                  {[
                    "Everything in Single Session",
                    "3 x 60-minute video calls",
                    "Personalized 5-R progression plan",
                    "Weekly email check-ins between sessions",
                    "Ongoing support & accountability",
                    "Priority scheduling",
                    "Meadow Mentor companion app access",
                  ].map((feature, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: '36px', color: '#047857' }}><Check size={18} strokeWidth={3} /></ListItemIcon>
                      <ListItemText primary={feature} sx={{ '& .MuiTypography-root': { fontSize: '0.95rem', color: '#444' } }} />
                    </ListItem>
                  ))}
                </List>
                <CTAButton href="#calendly-bundle" variant="primary" fullWidth>Get the Bundle</CTAButton>
              </CardContent>
            </Card>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading, Montserrat)',
              color: '#013D1D',
              mb: 6,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            What People Are Saying
          </Typography>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3,
            }}
          >
            {testimonials.map((t, i) => (
              <Card
                key={i}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  bgcolor: '#FFFFFF',
                  border: '1px solid #f0f0f0',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box sx={{ mb: 2, color: '#FFBF00' }}>
                  <Star size={18} fill="#FFBF00" />
                  <Star size={18} fill="#FFBF00" />
                  <Star size={18} fill="#FFBF00" />
                  <Star size={18} fill="#FFBF00" />
                  <Star size={18} fill="#FFBF00" />
                </Box>
                <Typography
                  sx={{
                    color: '#444',
                    lineHeight: 1.6,
                    mb: 3,
                    fontStyle: 'italic',
                    flex: 1,
                  }}
                >
                  &ldquo;{t.quote}&rdquo;
                </Typography>
                <Box sx={{ borderTop: '1px solid #eee', pt: 2 }}>
                  <Typography sx={{ fontWeight: 700, color: '#013D1D', fontFamily: 'var(--font-heading, Montserrat)' }}>
                    {t.name}
                  </Typography>
                  <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>
                    {t.detail}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 6. STAKES — AVOID FAILURE ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="sm">
          <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            What Happens If Nothing Changes?
          </Typography>
          <Box sx={{ mt: 4 }}>
            {[
              { icon: <XCircle size={20} />, text: "Another year of guessing what to eat" },
              { icon: <XCircle size={20} />, text: "More flare-ups, more medications, more frustration" },
              { icon: <XCircle size={20} />, text: "Watching life pass by while you feel trapped in your own body" },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: '#FFF5F5', border: '1px solid #FED7D7' }}>
                <Box sx={{ color: '#C53030', flexShrink: 0 }}>{item.icon}</Box>
                <Typography sx={{ color: '#555', fontSize: '1.05rem', lineHeight: 1.5 }}>{item.text}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 7. SUCCESS — THE TRANSFORMED LIFE ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="sm">
          <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 800, fontFamily: 'var(--font-heading, Montserrat)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
            Imagine This Instead
          </Typography>
          <Box sx={{ mt: 4 }}>
            {[
              { icon: <Check size={20} strokeWidth={3} />, text: "Knowing exactly what to eat — and what to avoid" },
              { icon: <Check size={20} strokeWidth={3} />, text: "Having energy, confidence, and a plan you trust" },
              { icon: <Check size={20} strokeWidth={3} />, text: "Your gut finally feeling calm" },
            ].map((item, i) => (
              <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, p: 2, borderRadius: 2, bgcolor: '#F0FFF4', border: '1px solid #C6F6D5' }}>
                <Box sx={{ color: '#047857', flexShrink: 0 }}>{item.icon}</Box>
                <Typography sx={{ color: '#444', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.5 }}>{item.text}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ CAL.COM SECTION ═══════════ */}
      <Box
        id="cal.com"
        sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading, Montserrat)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            Ready to Start?
          </Typography>

          <Typography
            sx={{
              textAlign: 'center',
              color: '#666',
              maxWidth: '500px',
              mx: 'auto',
              mb: 6,
              fontSize: '1.1rem',
            }}
          >
            Pick a time that works for you below. I&apos;ll meet you there.
          </Typography>

          {/* Calendly inline embed placeholder */}
          <Card
            sx={{
              borderRadius: 4,
              bgcolor: '#F9FAFB',
              minHeight: '650px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px dashed #ddd',
            }}
          >
            <Box sx={{ textAlign: 'center', p: 6 }}>
              <Typography sx={{ color: '#666', mb: 2 }}>
                Calendly widget will be embedded here
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#999', fontSize: '0.85rem' }}
              >
                Paste your Calendly inline embed code in the file at:<br />
                <code>frontend/src/app/coaching/CoachingClient.tsx</code>
              </Typography>
              <Typography
                variant="body2"
                sx={{ color: '#999', fontSize: '0.85rem', mt: 1 }}
              >
                See README for setup instructions.
              </Typography>
            </Box>
          </Card>
        </Container>
      </Box>

      {/* ═══════════ FAQ SECTION ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading, Montserrat)',
              color: '#013D1D',
              mb: 6,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            Frequently Asked Questions
          </Typography>

          {faqs.map((faq, i) => (
            <Accordion
              key={i}
              sx={{
                mb: 2,
                borderRadius: 3,
                bgcolor: '#FFFFFF',
                border: '1px solid #eee',
                boxShadow: 'none',
                '&::before': { display: 'none' },
                '&:hover': {
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ChevronDown />}
                sx={{
                  px: 4,
                  '& .MuiAccordionSummary-content': {
                    margin: '16px 0'
                  }
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 600,
                    fontFamily: 'var(--font-heading, Montserrat)',
                    color: '#013D1D',
                  }}
                >
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 4, pb: 4 }}>
                <Typography sx={{ color: '#555', lineHeight: 1.7 }}>
                  {faq.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <Box
        sx={{
          py: { xs: 8, md: 14 },
          background: 'linear-gradient(135deg, #013D1D 0%, #047857 100%)',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontFamily: 'var(--font-heading, Montserrat)',
              color: '#FFFFFF',
              mb: 3,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
            }}
          >
            Your Path to Gut Healing Starts Here
          </Typography>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              maxWidth: '600px',
              mx: 'auto',
              mb: 5,
              fontSize: '1.15rem',
              lineHeight: 1.7,
            }}
          >
            I spent 6 years figuring this out the hard way. You don&apos;t need to.
            Book a session today — or grab the free 5-R checklist and start now.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <CTAButton href="#calendly" variant="secondary" size="large">
              Book Your Coaching Session
            </CTAButton>
            <Box
              component="a"
              href="#"
              onClick={(e: React.MouseEvent) => { e.preventDefault(); document.querySelector('[data-lead-magnet]')?.scrollIntoView({ behavior: 'smooth' }); }}
              sx={{ textDecoration: 'none' }}
            >
              <CTAButton variant="primary" size="large">
                Get the Free Checklist
              </CTAButton>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Snackbar for lead magnet feedback */}
      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar({ ...snackbar, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <Box
        sx={{
          py: 6,
          bgcolor: '#F0F0F0',
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 2,
              color: '#888',
            }}
          >
            <AlertTriangle size={16} />
          </Box>
          <Typography
            variant="body2"
            sx={{
              color: '#888',
              lineHeight: 1.6,
              maxWidth: '700px',
              mx: 'auto',
              fontSize: '0.8rem',
            }}
          >
            <strong>Disclaimer:</strong> I am not a licensed medical professional, doctor, or registered dietitian.
            The information provided through this coaching service is for educational and informational purposes only,
            based on my personal experience with the Specific Carbohydrate Diet (SCD) and GAPS diet.
            It is not intended as a substitute for professional medical advice, diagnosis, or treatment.
            Always seek the advice of your physician or other qualified health provider with any questions
            you may have regarding a medical condition. Never disregard professional medical advice or delay
            in seeking it because of something discussed during a coaching session. Meadow Mentor and
            Reid Kimball do not provide medical advice and are not responsible for any decisions made based on
            information shared during coaching sessions.
          </Typography>
        </Container>
      </Box>

    </Box>
  );
}

// ─── BADGE COMPONENT ───
function Badge({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        mb: 3,
        px: 3,
        py: 1.5,
        bgcolor: 'rgba(1, 61, 29, 0.06)',
        borderRadius: '50px',
        color: '#013D1D',
        fontSize: '0.85rem',
        fontWeight: 600,
      }}
    >
      {icon}
      {text}
    </Box>
  );
}
