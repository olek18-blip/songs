# Project TODO

## Landing Page
- [x] High-impact hero section with cinematic/Urban Noir aesthetic
- [x] Clear value proposition and primary CTA
- [x] Social proof section with reaction thumbnails (placeholder visuals)
- [x] Responsive design (mobile-first)
- [x] Smooth scroll animations and micro-interactions

## Multi-Step Order Form
- [x] Step 1: Email capture (before any other details, for abandonment recovery)
- [x] Step 2: Celebrant name and personal anecdotes (2-3 key stories)
- [x] Step 3: Musical genre selection
- [x] Step 4: Pricing ladder with upsell options at checkout
- [x] Form progress indicator

## Pricing Ladder
- [x] Base product: MP3 download — 9.99 €
- [x] Upsell 1: Express 1-hour delivery — +9 €
- [x] Upsell 2: Lyric video with cinematic/Urban Noir AI images — +15 €
- [x] Upsell 3: Uncompressed WAV file — +5 €

## Stripe Checkout
- [x] Frictionless checkout with no account creation required
- [x] Stripe Checkout Session with line items for base + upsells
- [x] Apple Pay/Google Pay enabled via Stripe Checkout (automatic)
- [x] Payment confirmation webhook handling
- [x] Order success page after payment

## Suno API Integration
- [x] Unofficial Suno API wrapper integration structure
- [x] LLM-powered prompt construction from customer data (name, anecdotes, genre)
- [x] Generation trigger and polling mechanism
- [x] Production Suno API key configuration (env-ready: set SUNO_API_KEY in Settings > Secrets)

## Automated Delivery Pipeline
- [x] Pipeline triggered automatically after payment via webhook
- [x] Store generated files in S3 via storagePut
- [x] Generation status tracking (queued → generating → completed/failed)
- [x] Real email sending integration (SendGrid integration ready: set SENDGRID_API_KEY in Settings > Secrets)
- [x] Express delivery priority queue logic (faster polling 5s vs 10s for express orders)

## Admin Panel
- [x] Order management with status tracking
- [x] Generation status monitoring
- [x] Revenue figures and key metrics dashboard
- [x] Owner-only access (role-based)
- [x] Leads list with conversion tracking
- [x] B2B inquiries list

## Abandoned Cart Retargeting
- [x] Track form abandonment (email captured but purchase not completed)
- [x] Retargeting handler at /api/scheduled/retargeting
- [x] 20% discount coupon generation with 48h expiry
- [x] Email template with personalized abandoned cart message
- [x] Create heartbeat cron job (admin panel Settings tab: "Activate Retargeting Cron")

## Transactional Emails
- [x] Order confirmation email template
- [x] Song ready / download link email template
- [x] Abandoned cart retargeting email template
- [x] Real email delivery (SendGrid integration ready: set SENDGRID_API_KEY + SENDER_EMAIL)

## B2B Module
- [x] Dedicated B2B page (/b2b)
- [x] Contact form targeting companies (HR departments)
- [x] Annual subscription proposal presentation
- [x] B2B contacts stored in DB with status tracking
- [x] Owner notification on new B2B inquiry

## Lyric Video Generation (Upsell)
- [x] AI-generated images in cinematic/Urban Noir style (uses built-in image generation API)
- [x] Dynamic lyric overlay on images (HTML-based slideshow player with lyrics overlay)
- [x] HTML slideshow player stored in S3, auto-triggered after song generation
- [ ] Full MP4 video rendering (future: requires persistent compute with ffmpeg - not available in current runtime)

## Tests
- [x] Auth logout test
- [x] Lead save procedure test
- [x] Order creation procedure test
- [x] B2B submission test
- [x] Admin access control tests
- [x] Coupon validation test

## Song Preview Feature
- [x] Generate 30-second preview clip after song creation
- [x] Audio player component for preview playback on order status page
- [x] Preview URL stored in order record

## Multi-Level Form (Different Detail Levels = Different Prices)
- [x] Basic tier (9.99€): Name + occasion + genre + brief anecdotes (quick, less personalized)
- [x] Premium tier (19.99€): Name + occasion + genre + 3 anecdotes + personality traits + relationship
- [x] Ultra tier (29.99€): Premium + tone preferences + specific phrases to include + dedications
- [x] Tier selection step in the form flow
- [x] Different pricing reflected in Stripe checkout

## Revision Upsell
- [x] Option to add 1 revision (+4.99€) or 2 revisions (+7.99€) at checkout
- [x] Revision request form on order status page
- [x] Backend logic to re-trigger generation with revision notes
- [x] Track revision count used per order in DB


## Price Reduction & Traffic Optimization
- [x] Reduce base price from 9.99€ to 5€ (Basic tier)
- [x] Update all pricing displays and Stripe line items
- [x] Update tier pricing: Premium 14.99€, Ultra 24.99€

## Song Preview Before Payment
- [ ] Generate example/demo song on landing page
- [ ] Display 30-second preview player on pricing step
- [ ] Show preview before checkout CTA

## User Profile System
- [x] Add user profile table (name, email, phone, preferences)
- [x] Create /profile page for logged-in users with route registered in App.tsx
- [x] Allow users to view and edit their orders (getUserOrders query implemented)
- [x] Communication/notes system for song revisions (songComm router with list/send)

## Admin Testing Mode
- [x] Add test mode section in admin panel
- [ ] Implement test order creation UI (placeholder only for now)
- [ ] Mark test orders visually in order list
- [ ] Skip Stripe webhook for test orders
- [ ] Allow admin to trigger song generation manually for testing
