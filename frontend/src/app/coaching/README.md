# Coaching Landing Page Setup

This directory contains the coaching landing page at `/coaching`.

## What's Built

- **`page.tsx`** — Server component with SEO metadata
- **`CoachingClient.tsx`** — Full landing page with:
  - Hero section with CTA
  - Problem/empathy section
  - How It Works steps
  - About Reid section
  - Pricing tiers ($75 single, $200 bundle)
  - Testimonials (placeholder, needs real ones)
  - Calendly embed zone (needs your embed code)
  - FAQ accordion
  - Final CTA section
  - Legal disclaimer

## What You Need to Finish

### 1. Stripe Payment Links

Create two Payment Links in Stripe ($75 single, $200 bundle):

1. Go to https://dashboard.stripe.com/products
2. Create a product called "IBD Diet Coaching — Single Session" · $75
3. Create a Payment Link from it — copy the URL
4. Create another product called "IBD Diet Coaching — 3-Session Bundle" · $200
5. Create a Payment Link from it — copy the URL

In `CoachingClient.tsx`, find `#calendly-single` and `#calendly-bundle` and decide how to wire these buttons. Options:
- Replace the `href` with the Stripe Payment Link URL (pay first, then book)
- Go to Calendly booking first, with Stripe link sent in the confirmation email

### 2. Calendly Integration

1. In Calendly, create two event types:
   - "IBD Coaching Session" — 60 min — $75
   - "IBD Coaching Bundle (3 Sessions)" — 60 min × 3 — $200

2. Get the inline embed code from Calendly for each event type:
   - Go to your event type in Calendly
   - Click "Share" → "Add to website" → "Inline Embed"
   - Copy the code snippet

3. Install the Calendly widget script in `<head>`:
   - Add this to `frontend/src/app/layout.tsx` inside the `<head>` (or as a next/script):
   ```
   <script src="https://assets.calendly.com/assets/external/widget.js" async />
   ```

4. In `CoachingClient.tsx`, replace the placeholder Card at `id="calendly"` with the actual embed code. You can do this with a `useEffect` + `Calendly.initInlineWidget()` call, or paste the inline HTML directly.

### 3. Calendly Redirect After Booking

Set up Calendly's redirect URL to point back to `/coaching?booked=true` after booking. Add optional UTM params.

### 4. Testimonials

Replace the placeholder testimonials in the `testimonials` array with real ones as you get them.

### 5. Photo

The bio section uses the Chef Kay image as a placeholder. Replace the `src` in the photo `img` tag with your actual headshot:

```
src="YOUR_PHOTO_URL_HERE"
```

You can upload one to your Google Cloud Storage bucket at:
https://storage.googleapis.com/meadow_mentor_public_media/images/

### 6. Add to Header

The Header navigation already includes a "Coaching" link pointing to `/coaching`. If Header.tsx was already modified, skip.

---

## Quick Test

```bash
cd frontend
npm run dev
```

Then visit http://localhost:3000/coaching
