'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import { Grid } from '@mui/material';
import { motion } from 'framer-motion';
import {
  Heart,
  Shield,
  Target,
  Check,
  Star,
  Award,
  BookHeart,
  Clock,
  Smartphone,
  Sparkles,
  Ban,
  RotateCcw,
  Sprout,
  Wrench,
  Play,
  Send,
  XCircle,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react';
import CTAButton from '@/components/CTAButton';
import RecipeSummaryCard from '@/components/RecipeSummaryCard';
import { Recipe } from '@/types/recipe';
import { API_BASE_URL } from '@/lib/api';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' as const } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fiveRs = [
  { letter: 'R1', name: 'Remove', icon: <Ban size={24} />, desc: 'Identify and eliminate foods that inflame your gut — refined sugars, processed grains, seed oils, and triggers specific to your condition.' },
  { letter: 'R2', name: 'Replace', icon: <RotateCcw size={24} />, desc: 'Swap inflammatory foods with gut-safe alternatives — honey for sugar, almond flour for wheat, olive oil for canola.' },
  { letter: 'R3', name: 'Reinnoculate', icon: <Sprout size={24} />, desc: 'Restore beneficial bacteria with SCD-legal fermented foods, targeted probiotics, and prebiotic fibers your gut can tolerate.' },
  { letter: 'R4', name: 'Repair', icon: <Wrench size={24} />, desc: 'Heal the gut lining with bone broth, L-glutamine, omega-3s, and targeted nutrients that support mucosal repair.' },
  { letter: 'R5', name: 'Reconnect', icon: <Sparkles size={24} />, desc: 'Reconnect with yourself, family, community, and reintroduce foods mindfully to build a sustainable diet you can trust for the long term.' },
];

const faqs = [
  {
    question: 'Is this medical advice?',
    answer: "No. I am not a doctor or registered dietitian. This coaching is based on my 20+ years of personal experience managing Crohn's Disease using the Specific Carbohydrate Diet (SCD) and GAPS diet. Everything I share is for informational and educational purposes only. Always consult with your healthcare provider before making changes to your diet or treatment plan.",
  },
  {
    question: 'Who is this for?',
    answer: "Anyone who has been diagnosed with Crohn's Disease, Ulcerative Colitis, or another form of Inflammatory Bowel Disease (IBD) and wants to explore using diet as part of their management strategy. It's especially helpful for people who are newly diagnosed, struggling with a flare, or looking to deepen their understanding of therapeutic diets.",
  },
  {
    question: 'What diets do you coach on?',
    answer: "I have deep personal experience with the Specific Carbohydrate Diet (SCD) and the GAPS diet. I can also share knowledge about the Mediterranean diet, AIP (Autoimmune Protocol), and other therapeutic diets I've researched over the years. Your coaching will be tailored to your situation and preferences.",
  },
  {
    question: 'How do sessions work?',
    answer: "Sessions are conducted via video call (Zoom or Google Meet). Before your first session, you'll complete a brief health questionnaire. During the session, we'll review your current diet, symptoms, goals, and I'll provide personalized food recommendations, meal planning strategies, and lifestyle tips based on the SCD/GAPS framework.",
  },
  {
    question: 'What if I want ongoing support between sessions?',
    answer: "Weekly check-ins via text or email are included with the 3-session package. For single sessions, you can opt in to ongoing support. I'm here to help you stay on track and adjust as needed.",
  },
  {
    question: 'Can this replace my medication?',
    answer: 'No. Diet can be a powerful complementary tool, but you should never stop or change your medication without talking to your doctor. I respect the role of conventional medicine and aim to work alongside it, not against it.',
  },
  {
    question: 'What is the Meadow Mentor companion app?',
    answer: "It's a tool I built that helps you track meals, log symptoms, and get AI-powered diet compliance analysis. Coaching clients can optionally use it to reinforce what we discuss in sessions — but it's not required. The coaching is the core service; the app is a bonus.",
  },
];

const testimonials = [
  {
    quote: "Reid's guidance helped me understand my Crohn's in a way my doctor never could. Practical, compassionate, and based on real experience.",
    name: 'Anonymous',
    detail: "Crohn's patient, 3 years in",
  },
  {
    quote: 'This coaching gave me hope when I was in the darkest place. The SCD approach changed everything for me.',
    name: 'Anonymous',
    detail: 'IBD patient',
  },
];

function LeadMagnetForm() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
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
      setSubmitted(true);
    } catch {
      setSnackbar({ open: true, message: 'Something went wrong. Please try again.', severity: 'error' });
    }
  };

  return (
    <>
      <Box
        data-lead-magnet
        sx={{
          maxWidth: '480px',
          mx: 'auto',
          p: 3,
          borderRadius: 4,
          bgcolor: 'rgba(1, 61, 29, 0.04)',
          border: '1px solid rgba(1, 61, 29, 0.12)',
          textAlign: 'left',
        }}
      >
        <Typography
          sx={{
            fontWeight: 700,
            color: '#013D1D',
            mb: 1,
            fontFamily: 'var(--font-heading)',
            fontSize: '1rem',
            textAlign: 'center',
          }}
        >
          📋 Free: 5R Framework for Gut Health Checklist
        </Typography>
        <Typography sx={{ color: '#555', fontSize: '0.9rem', mb: 2, textAlign: 'center' }}>
          A printable checklist to start healing your gut today. Enter your email and I&apos;ll send it to you.
        </Typography>
        {submitted ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1.5,
              py: 1.25,
              px: 2,
              borderRadius: 2,
              bgcolor: 'rgba(1, 61, 29, 0.08)',
              border: '1px solid rgba(1, 61, 29, 0.2)',
            }}
          >
            <Box
              sx={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                bgcolor: '#013D1D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Check size={14} color="#FFBF00" strokeWidth={3} />
            </Box>
            <Typography
              sx={{
                color: '#013D1D',
                fontWeight: 600,
                fontSize: '0.95rem',
                fontFamily: 'var(--font-body)',
              }}
            >
              Check your inbox, your checklist is on its way!
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              size="small"
              placeholder="you@email.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleLeadMagnet();
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': { borderRadius: 2, bgcolor: '#fff' },
              }}
            />
            <IconButton
              onClick={handleLeadMagnet}
              sx={{
                bgcolor: '#013D1D',
                color: '#FFBF00',
                borderRadius: 2,
                '&:hover': { bgcolor: '#047857' },
                width: 42,
                height: 42,
              }}
            >
              <Send size={18} />
            </IconButton>
          </Box>
        )}
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

interface HomeClientProps {
  teaserRecipe: Recipe;
}

export default function HomeClient({ teaserRecipe }: HomeClientProps) {
  // Load cal.com inline embed once on mount. The embed script self-injects,
  // queues calls until ready, and is idempotent — safe under React StrictMode.
  useEffect(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (function (C: any, A: string, L: string) {
      const p = function (a: any, ar: any) {
        a.q.push(ar);
      };
      const d = C.document;
      C.Cal =
        C.Cal ||
        function () {
          const cal = C.Cal;
          // eslint-disable-next-line prefer-rest-params
          const ar = arguments;
          if (!cal.loaded) {
            cal.ns = {};
            cal.q = cal.q || [];
            d.head.appendChild(d.createElement('script')).src = A;
            cal.loaded = true;
          }
          if (ar[0] === L) {
            const api: any = function () {
              // eslint-disable-next-line prefer-rest-params
              p(api, arguments);
            };
            const namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === 'string') {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ['initNamespace', namespace]);
            } else {
              p(cal, ar);
            }
            return;
          }
          p(cal, ar);
        };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');

    const w = window as any;
    w.Cal('init', '60min', { origin: 'https://cal.com' });
    w.Cal.ns['60min']('inline', {
      elementOrSelector: '#cal-inline-embed',
      config: { layout: 'month_view' },
      calLink: 'reid-kimball-fkshix/60-min-meeting',
    });
    w.Cal.ns['60min']('ui', { hideEventTypeDetails: false, layout: 'month_view' });
    /* eslint-enable @typescript-eslint/no-explicit-any */
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FFFFFF' }}>

      {/* ═══════════ HERO ═══════════ */}
      <Box
        sx={{
          backgroundImage: 'url(https://storage.googleapis.com/meadow_mentor_public_media/images/meadow_mentor_coaching_transformation_v03c.webp)',
          backgroundSize: 'cover',
          backgroundPosition: { xs: '80% center', md: 'center' },
          backgroundRepeat: 'no-repeat',
          height: { xs: '60vh', md: '75vh' },
          display: 'flex',
          alignItems: { xs: 'flex-end', md: 'center' },
          position: 'relative',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <Box sx={{
            position: { xs: 'absolute', md: 'absolute' },
            bottom: { xs: '25%', md: '50%' },
            left: { xs: 2, md: 'auto' },
            right: { xs: 2, md: 'auto' },
            bgcolor: 'rgba(255,255,255,0.5)',
            p: 3,
            borderRadius: 2,
            maxWidth: { md: 'sm' },
          }}>
          <motion.div variants={fadeInUp} initial="hidden" animate="visible">
            <Typography
              variant="h1"
              sx={{
                fontSize: { xs: '1.75rem', sm: '3rem', md: '3.75rem', lg: '4.25rem' },
                fontWeight: 800,
                color: '#013D1D',
                // 0 = horizontal offset, 2px = vertical offset, 12px = blur radius, rgba(1,0.8,0.2,0.3) = color with alpha channel
                textShadow: '0 2px 200px rgba(255,255,255,1)',
                
                fontFamily: 'var(--font-heading)',
                lineHeight: 1.1,
                maxWidth: '600px',
                textAlign: 'left',
              }}
            >
              Take Back Control of Your Gut Health
            </Typography>
          </motion.div>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ HERO SUBCONTENT ═══════════ */}
      <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center', bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <motion.div variants={fadeInUp}>
              <Box
                sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 1,
                  px: 3,
                  py: 1,
                  borderRadius: '50px',
                  bgcolor: 'rgba(1, 61, 29, 0.06)',
                  border: '1px solid rgba(1, 61, 29, 0.12)',
                  mb: 3,
                }}
              >
                <Star size={14} strokeWidth={3} color="#013D1D" />
                <Typography sx={{ color: '#013D1D', fontWeight: 600, fontSize: '0.85rem', fontFamily: 'var(--font-body)' }}>
                  20+ Years of Lived Experience
                </Typography>
              </Box>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Typography
                variant="h5"
                sx={{
                  color: '#444',
                  maxWidth: '700px',
                  mx: 'auto',
                  mb: 2,
                  lineHeight: 1.6,
                  fontSize: { xs: '1.1rem', md: '1.3rem' },
                }}
              >
                1-on-1 coaching for IBD, Crohn&apos;s, and Ulcerative Colitis using the 5R Framework for Gut Health.
                Plus a companion app to track meals, scan ingredients, and stay on plan.
              </Typography>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Typography sx={{ color: '#666', maxWidth: '650px', mx: 'auto', mb: 5, fontSize: '1rem' }}>
                Diagnosed at 17. Changed my diet. Changed my life. Let&apos;s change yours.
              </Typography>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Typography sx={{ color: '#888', fontSize: '0.85rem', mb: 5 }}>
                ✓ No subscriptions ✓ Free app included ✓ Instant scheduling
              </Typography>
            </motion.div>

            {/* Lead Magnet — Free 5R Checklist */}
            <motion.div variants={fadeInUp}>
              <LeadMagnetForm />
            </motion.div>
          </motion.div>
        </Container>
      </Box>

      {/* ═══════════ PROBLEM ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            You&apos;re Fighting More Than Symptoms
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: '#555',
              maxWidth: '700px',
              mx: 'auto',
              mb: 6,
              fontSize: '1.1rem',
              lineHeight: 1.7,
            }}
          >
            When I was diagnosed at 17, nobody talked to me about <strong>food as medicine</strong>.
            It took me years to find what worked. Here&apos;s what you&apos;re really up against:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
            {[
              { icon: <Shield size={28} />, label: 'External', title: 'Overwhelmed by Conflicting Advice', desc: "Google gives you 100 answers. Your doctor gives you none. You're lost in a sea of elimination diets and supplements." },
              { icon: <Heart size={28} />, label: 'Internal', title: 'Unpredictable Flare-Ups', desc: 'Your symptoms rule your schedule. Every meal feels like a gamble. You never know what tomorrow will bring.' },
              { icon: <Target size={28} />, label: 'Philosophical', title: 'You Deserve a Guide', desc: "It shouldn't take years of trial and error to find what works. Nobody should have to figure this out alone at 2 AM." },
            ].map((item, i) => (
              <Card
                key={i}
                sx={{
                  p: 4,
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                  transition: 'all 0.3s ease',
                  textAlign: 'center',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)', borderColor: '#013D1D' },
                }}
              >
                <Box sx={{ width: 64, height: 64, mx: 'auto', mb: 2, borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#FFF8E5', color: '#013D1D' }}>
                  {item.icon}
                </Box>
                <Typography sx={{ color: '#FFBF00', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', mb: 1 }}>{item.label}</Typography>
                <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#013D1D', mb: 2 }}>{item.title}</Typography>
                <Typography sx={{ color: '#555', lineHeight: 1.6 }}>{item.desc}</Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ GUIDE — ABOUT REID ═══════════ */}
      <Box
        sx={{
          backgroundImage: 'url(https://storage.googleapis.com/meadow_mentor_public_media/images/reid_guiding_farmers_market_v01.webp)',
          backgroundSize: 'cover',
          backgroundPosition: { xs: 'center', md: '20% center' },
          backgroundRepeat: 'no-repeat',
          height: { xs: '70vh', md: '80vh' },
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, height: '100%' }}>
          <Box sx={{
            position: { xs: 'absolute', md: 'absolute' },
            top: { xs: '10%', md: '50%' },
            right: { xs: 2, md: 0 },
            left: { xs: 2, md: 'auto' },
            transform: { md: 'translateY(-50%)' },
            maxWidth: { md: '480px' },
            bgcolor: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(12px)',
            p: { xs: 3, md: 4 },
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: '1px solid rgba(255, 255, 255, 0.6)',
          }}>
            <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.div variants={fadeInUp}>
                <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#013D1D', mb: 2, fontSize: { xs: '1.75rem', md: '2.25rem' } }}>
                  I&apos;ve Been Where You Are
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Typography sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 2 }}>
                  I was diagnosed with Crohn&apos;s Disease at 17. It derailed my competitive ice hockey career
                  and changed my life forever.
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Typography sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 2 }}>
                  For years, I went from doctor to doctor looking for answers. Conventional medicine helped
                  manage symptoms, but nothing addressed the root cause.
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Typography sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 2 }}>
                  Then I discovered the Specific Carbohydrate Diet (SCD), later expanded into the GAPS protocol.
                  Within months, my symptoms were in remission. For the first time in years, I felt alive.
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Typography sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 4 }}>
                  I spent the next 6 years making a documentary about people like me — folks using alternative
                  treatments for IBD. I&apos;ve talked to hundreds of people, read the research, and lived this
                  journey every single day.
                </Typography>
              </motion.div>
              <motion.div variants={fadeInUp}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
                  {[
                    { icon: <Award size={16} />, text: "20+ years managing Crohn's" },
                    { icon: <BookHeart size={16} />, text: 'SCD & GAPS expert' },
                    { icon: <Smartphone size={16} />, text: 'Built the Meadow Mentor app' },
                  ].map((badge, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1.5, borderRadius: '50px', bgcolor: '#FFF8E5', color: '#013D1D', fontSize: '0.9rem', fontWeight: 600 }}>
                      {badge.icon}{badge.text}
                    </Box>
                  ))}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 3, py: 1.5, borderRadius: '50px', bgcolor: '#FFF8E5', color: '#013D1D', fontSize: '0.9rem', fontWeight: 600 }}>
                      <Clock size={16} />6 years IBD documentary
                    </Box>
                    <Box
                      component="a"
                      href="https://youtu.be/MSmmIWelpp0"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                        color: '#013D1D',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        textDecoration: 'underline',
                        textUnderlineOffset: '3px',
                        '&:hover': { color: '#047857' },
                      }}
                    >
                      <Play size={14} fill="#013D1D" />
                      watch online
                    </Box>
                  </Box>
                </Box>
              </motion.div>
            </motion.div>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ 5R FRAMEWORK ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            Your Plan: The 5R Framework for Gut Health
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: '#666',
              maxWidth: '600px',
              mx: 'auto',
              mb: 8,
              fontSize: '1.1rem',
            }}
          >
            A proven, step-by-step approach to gut healing. This is the system I use with every client — and the same one I used myself.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {fiveRs.map((r, i) => (
              <Card
                key={i}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 4,
                  border: '1px solid #f0f0f0',
                  display: 'flex',
                  alignItems: { xs: 'flex-start', md: 'center' },
                  gap: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': { borderColor: '#013D1D', boxShadow: '0 8px 24px rgba(0,0,0,0.06)' },
                }}
              >
                <Box sx={{ minWidth: { md: '80px' }, textAlign: 'center' }}>
                  <Box sx={{ width: 64, height: 64, mx: 'auto', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#013D1D', color: '#FFBF00' }}>
                    {r.icon}
                  </Box>
                  <Typography sx={{ fontWeight: 800, fontSize: '0.8rem', color: '#FFBF00', textTransform: 'uppercase', letterSpacing: '0.1em', mt: 1, fontFamily: 'var(--font-heading)' }}>{r.letter}</Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: 'var(--font-heading)', color: '#013D1D', mb: 1 }}>{r.name}</Typography>
                  <Typography sx={{ color: '#555', lineHeight: 1.6 }}>{r.desc}</Typography>
                </Box>
              </Card>
            ))}
          </Box>
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <CTAButton href="#pricing" variant="primary" size="large">
              Get Personalized 5R Guidance
            </CTAButton>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      {/* <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            What People Are Saying
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: '#666',
              maxWidth: '600px',
              mx: 'auto',
              mb: 8,
              fontSize: '1.1rem',
            }}
          >
            Real stories from real people navigating IBD with guidance and support.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
            {testimonials.map((t, i) => (
              <Card key={i} sx={{ p: 4, borderRadius: 4, border: '1px solid #f0f0f0', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' } }}>
                <Box sx={{ display: 'flex', gap: 0.5, mb: 2, color: '#FFBF00' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={18} fill="#FFBF00" color="#FFBF00" />
                  ))}
                </Box>
                <Typography sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 3, fontStyle: 'italic' }}>
                  &ldquo;{t.quote}&rdquo;
                </Typography>
                <Typography sx={{ fontWeight: 700, color: '#013D1D', fontFamily: 'var(--font-heading)' }}>{t.name}</Typography>
                <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>{t.detail}</Typography>
              </Card>
            ))}
          </Box>
        </Container>
      </Box> */}

      {/* ═══════════ STAKES ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="sm">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            What Happens If Nothing Changes?
          </Typography>
          <Box sx={{ mt: 4 }}>
            {[
              'Another year of guessing what to eat',
              'More flare-ups, more medications, more frustration',
              'Watching life pass by while you feel trapped in your own body',
            ].map((text, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#FFF5F5',
                  border: '1px solid #FED7D7',
                }}
              >
                <Box sx={{ color: '#C53030', flexShrink: 0 }}>
                  <XCircle size={20} />
                </Box>
                <Typography sx={{ color: '#555', fontSize: '1.05rem', lineHeight: 1.5 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ SUCCESS ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="sm">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            Imagine This Instead
          </Typography>
          <Box sx={{ mt: 4 }}>
            {[
              'Knowing exactly what to eat — and what to avoid',
              'Having energy, confidence, and a plan you trust',
              'Your gut finally feeling calm',
            ].map((text, i) => (
              <Box
                key={i}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  mb: 3,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: '#F0FFF4',
                  border: '1px solid #C6F6D5',
                }}
              >
                <Box sx={{ color: '#047857', flexShrink: 0 }}>
                  <Check size={20} strokeWidth={3} />
                </Box>
                <Typography sx={{ color: '#444', fontSize: '1.05rem', fontWeight: 500, lineHeight: 1.5 }}>{text}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ PRICING ═══════════ */}
      <Box id="pricing" sx={{ py: { xs: 8, md: 14 }, background: 'linear-gradient(180deg, #FFF8E5 0%, #FFFFFF 100%)' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#013D1D',
              mb: 2,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
            }}
          >
            Invest in Your Health
          </Typography>
          <Typography
            sx={{
              textAlign: 'center',
              color: '#666',
              maxWidth: '600px',
              mx: 'auto',
              mb: 8,
              fontSize: '1.1rem',
            }}
          >
            Simple, transparent pricing. No subscriptions. No pressure. Optional companion app included.
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr' }, gap: 4, alignItems: 'stretch' }}>
            <Card sx={{ borderRadius: 4, border: '1px solid #eee', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 30px rgba(0,0,0,0.1)' } }}>
              <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', fontFamily: 'var(--font-heading)', color: '#013D1D', mb: 1 }}>Single Session</Typography>
                <Box sx={{ textAlign: 'center', mb: 4 }}>
                  <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#013D1D', lineHeight: 1 }}>$75</Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 0.5 }}>60-minute session</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                <List sx={{ mb: 4, flexGrow: 1 }}>
                  {[
                    '60-minute 1-on-1 video call',
                    'Diet assessment',
                    'Personalized 5R progression plan',
                    'SCD/GAPS food recommendations',
                    'Custom meal plan guidance',
                    'Post-session summary via email',
                    'Optional: Meadow Mentor companion app',
                  ].map((f, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: '36px', color: '#047857' }}><Check size={18} strokeWidth={3} /></ListItemIcon>
                      <ListItemText primary={f} sx={{ '& .MuiTypography-root': { fontSize: '0.95rem', color: '#444' } }} />
                    </ListItem>
                  ))}
                </List>
                {/* <CTAButton href="#calcom" variant="primary" fullWidth>
                  Book a Session
                </CTAButton> */}
              </CardContent>
            </Card>

            {/* <Card sx={{ borderRadius: 4, border: '3px solid #FFBF00', boxShadow: '0 20px 40px rgba(255,191,0,0.2)', position: 'relative', transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 30px 60px rgba(255,191,0,0.3)' } }}>
              <Box sx={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', bgcolor: '#FFBF00', color: '#013D1D', px: 3, py: 0.5, borderRadius: '50px', fontSize: '0.75rem', fontWeight: 800, fontFamily: 'var(--font-heading)', zIndex: 10, letterSpacing: '0.05em' }}>
                BEST VALUE
              </Box>
              <CardContent sx={{ p: { xs: 4, md: 6 }, display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center', fontFamily: 'var(--font-heading)', color: '#013D1D', mb: 1 }}>3-Session Bundle</Typography>
                <Box sx={{ textAlign: 'center', mb: 1 }}>
                  <Typography variant="h2" sx={{ fontWeight: 800, fontFamily: 'var(--font-heading)', color: '#013D1D', lineHeight: 1 }}>$200</Typography>
                  <Typography variant="body2" sx={{ color: '#666', fontWeight: 500, mt: 0.5 }}>3 sessions + ongoing check-ins</Typography>
                  <Typography variant="body2" sx={{ color: '#047857', fontWeight: 700, mt: 1, fontSize: '0.85rem' }}>Save $25 — only $67/session</Typography>
                </Box>
                <Divider sx={{ mb: 4 }} />
                <List sx={{ mb: 4, flexGrow: 1 }}>
                  {[
                    'Everything in Single Session',
                    '3 x 60-minute video calls',
                    'Personalized 5R progression plan',
                    'Weekly email check-ins between sessions',
                    'Ongoing support & accountability',
                    'Priority scheduling',
                    'Meadow Mentor companion app access',
                  ].map((f, i) => (
                    <ListItem key={i} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: '36px', color: '#047857' }}><Check size={18} strokeWidth={3} /></ListItemIcon>
                      <ListItemText primary={f} sx={{ '& .MuiTypography-root': { fontSize: '0.95rem', color: '#444' } }} />
                    </ListItem>
                  ))}
                </List>
                <CTAButton href="#calcom" variant="primary" fullWidth>
                  Get the Bundle
                </CTAButton>
              </CardContent>
            </Card> */}
          </Box>
        </Container>
      </Box>

      {/* ═══════════ APP COMPANION SECTION ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontFamily: 'var(--font-heading)',
                  color: '#013D1D',
                  mb: 2,
                  fontSize: { xs: '1.75rem', md: '2.25rem' },
                }}
              >
                Your Coaching, Supercharged by AI
              </Typography>
              <Typography sx={{ color: '#444', lineHeight: 1.7, fontSize: '1.05rem', mb: 3 }}>
                Every coaching client gets optional access to the Meadow Mentor app — a companion tool
                that reinforces what we discuss in sessions. Generate recipes, scan ingredient labels,
                and build meal plans tailored to your therapeutic diet.
              </Typography>
              <List sx={{ mb: 3 }}>
                {[
                  'AI Recipe Generator for SCD, GAPS, AIP, Mediterranean',
                  'Ingredient Label Scanner for diet compliance',
                  '1-14 Day Meal Plan Builder',
                  'Food Safety Database with 1,000+ entries',
                ].map((feature, i) => (
                  <ListItem key={i} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: '36px', color: '#047857' }}>
                      <Check size={18} strokeWidth={3} />
                    </ListItemIcon>
                    <ListItemText primary={feature} sx={{ '& .MuiTypography-root': { fontSize: '0.95rem', color: '#444' } }} />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <CTAButton href="/app" variant="secondary" size="large">
                  Explore the App
                </CTAButton>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ maxWidth: 400, mx: 'auto' }}>
                <RecipeSummaryCard recipe={teaserRecipe} />
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ═══════════ CAL.COM / CALENDLY ═══════════ */}
      <Box id="calendly" sx={{ py: { xs: 8, md: 12 }, bgcolor: '#FFFFFF' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
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
          <Box
            id="cal-inline-embed"
            sx={{
              width: '100%',
              minHeight: { xs: 900, md: 650 },
              borderRadius: 4,
              overflow: 'hidden',
              bgcolor: '#FFFFFF',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            }}
          />
        </Container>
      </Box>

      {/* ═══════════ FAQ ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#F9FAFB' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              textAlign: 'center',
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
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
                '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.04)' },
              }}
              disableGutters
            >
              <AccordionSummary
                expandIcon={<ChevronDown />}
                sx={{
                  px: 4,
                  '& .MuiAccordionSummary-content': { margin: '16px 0' },
                }}
              >
                <Typography sx={{ fontWeight: 600, fontFamily: 'var(--font-heading)', color: '#013D1D' }}>
                  {faq.question}
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ px: 4, pb: 4 }}>
                <Typography sx={{ color: '#555', lineHeight: 1.7 }}>{faq.answer}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Container>
      </Box>

      {/* ═══════════ FINAL CTA ═══════════ */}
      <Box sx={{ py: { xs: 8, md: 14 }, background: 'linear-gradient(135deg, #013D1D 0%, #047857 100%)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontFamily: 'var(--font-heading)',
              color: '#FFFFFF',
              mb: 3,
              fontSize: { xs: '1.75rem', md: '2.5rem' },
            }}
          >
            Your Path to Gut Healing Starts Here
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.85)', maxWidth: '600px', mx: 'auto', mb: 5, fontSize: '1.15rem', lineHeight: 1.7 }}>
            I spent 6 years figuring this out the hard way. You don&apos;t need to.
            Book a session today, or grab the free 5R checklist and start now.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* <CTAButton href="#calcom" variant="secondary" size="large">
              Book Your Coaching Session
            </CTAButton> */}
            <CTAButton
              href=""
              variant="secondary"
              size="large"
              onClick={() => {
                document.querySelector('[data-lead-magnet]')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Get the Free Checklist
            </CTAButton>
          </Box>
        </Container>
      </Box>

      {/* ═══════════ DISCLAIMER ═══════════ */}
      <Box sx={{ py: 6, bgcolor: '#F0F0F0', textAlign: 'center' }}>
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
