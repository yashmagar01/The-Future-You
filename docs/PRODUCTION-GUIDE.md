# 🚀 Production Data Replacement Guide

**Complete Guide to Replace All Demo/Mock Data on Homepage**

Last Updated: November 16, 2025  
Status: Pre-Production → Production Ready

---

## 📋 Table of Contents

1. [Overview - All Mock Data Identified](#overview)
2. [Video Content - NotebookLM MP4](#1-video-content)
3. [Testimonials - User Reviews](#2-testimonials)
4. [Social Media & Links](#3-social-media--links)
5. [Open Graph Images](#4-open-graph-images)
6. [Footer Links & Pages](#5-footer-links--pages)
7. [Assets & Favicons](#6-assets--favicons)
8. [Environment Variables](#7-environment-variables)
9. [Production Checklist](#production-checklist)

---

## Overview

### Current Mock Data Locations

| Component | File | Mock Data Type | Priority |
|-----------|------|---------------|----------|
| VideoEmbed | `src/pages/Home.tsx` line 32 | YouTube demo link | 🔴 HIGH |
| Testimonials | `src/components/home/TestimonialGrid.tsx` | 6 fictional testimonials | 🟡 MEDIUM |
| Footer Social | `src/components/home/Footer.tsx` lines 34-37 | Placeholder social links | 🟡 MEDIUM |
| Footer Links | `src/components/home/Footer.tsx` lines 6-29 | Unlinked pages | 🟢 LOW |
| OG Image | `index.html` line 38 | Placeholder image URL | 🟡 MEDIUM |
| Email | `src/components/home/Footer.tsx` line 37 | hello@thefutureyou.com | 🟡 MEDIUM |

---

## 1. Video Content - NotebookLM MP4

### Current State
```tsx
// File: src/pages/Home.tsx (line 32)
<VideoEmbed 
  src="https://www.youtube.com/watch?v=pVO6QOt-8QE"  // ✅ ACTUAL VIDEO
  title="NotebookLM Overview - See How The Future You Works"
  caption="Watch this AI-generated overview powered by NotebookLM to understand our approach"
  poster="/assets/video-poster.svg"
/>
```

### ✅ Solution: Upload and Host Your MP4 Video

#### Option A: Host on Supabase Storage (Recommended)

**Step 1: Upload Video to Supabase**

```bash
# 1. Login to your Supabase Dashboard
# https://app.supabase.com/project/YOUR_PROJECT_ID/storage

# 2. Create a new Storage Bucket
# Bucket Name: videos
# Public: Yes (for public access)
# File Size Limit: 50MB - 100MB

# 3. Upload your NotebookLM MP4
# File: notebooklm-overview.mp4
# Path: /videos/notebooklm-overview.mp4
```

**Step 2: Get Public URL**

After upload, Supabase provides a public URL:
```
https://your-project.supabase.co/storage/v1/object/public/videos/notebooklm-overview.mp4
```

**Step 3: Update Home.tsx**

```tsx
// File: src/pages/Home.tsx (line 32)
<VideoEmbed 
  src="https://your-project.supabase.co/storage/v1/object/public/videos/notebooklm-overview.mp4"
  title="NotebookLM Overview - See How The Future You Works"
  caption="Watch this AI-generated overview powered by NotebookLM to understand our approach"
  poster="/assets/video-poster.png"  // Update poster too (see below)
/>
```

#### Option B: Host on Cloudflare R2 (Free Tier)

**Benefits:**
- 10GB free storage
- No egress fees
- Fast CDN delivery

**Steps:**
```bash
# 1. Create Cloudflare R2 account
# https://dash.cloudflare.com/

# 2. Create bucket: "the-future-you-videos"

# 3. Upload MP4 via dashboard or API

# 4. Enable public access and get URL:
https://your-bucket.r2.dev/notebooklm-overview.mp4
```

#### Option C: Host on Vercel Blob Storage

**Steps:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login and link project
vercel login
vercel link

# 3. Upload video
vercel blob put notebooklm-overview.mp4 --token YOUR_TOKEN

# Returns URL:
https://blob.vercel-storage.com/notebooklm-overview-abc123.mp4
```

#### Option D: YouTube Embed (Alternative)

If you upload to YouTube instead:

```tsx
<VideoEmbed 
  src="https://www.youtube.com/watch?v=pVO6QOt-8QE"  // ✅ Your actual YouTube video
  title="NotebookLM Overview - See How The Future You Works"
  caption="Watch this AI-generated overview powered by NotebookLM to understand our approach"
  poster="/assets/video-poster.png"
/>
```

### Create Video Poster Image

**Step 1: Generate Thumbnail**

```bash
# Option 1: Extract from MP4 using ffmpeg
ffmpeg -i notebooklm-overview.mp4 -ss 00:00:05 -vframes 1 video-poster.png

# Option 2: Take screenshot at interesting moment
# Option 3: Create custom poster in Figma/Canva
# Recommended size: 1280x720 (16:9 aspect ratio)
```

**Step 2: Optimize Image**

```bash
# Use TinyPNG or ImageOptim
# Target size: < 200KB
# Format: PNG or WebP
```

**Step 3: Upload to Public Folder**

```bash
# Save to: public/assets/video-poster.png
# Or upload to Supabase Storage: /images/video-poster.png
```

**Step 4: Update Poster Path**

```tsx
poster="/assets/video-poster.png"
// or
poster="https://your-project.supabase.co/storage/v1/object/public/images/video-poster.png"
```

---

## 2. Testimonials - User Reviews

### Current State
```tsx
// File: src/components/home/TestimonialGrid.tsx (lines 6-58)
const testimonials = [
  {
    name: "Sarah Johnson",        // ❌ FICTIONAL
    role: "Marketing Manager",
    initials: "SJ",
    rating: 5,
    quote: "This platform transformed...",
    highlight: "Transformed presentation skills"
  },
  // ... 5 more fictional testimonials
];
```

### ✅ Solution: Replace with Real User Testimonials

#### Step 1: Collect Real Testimonials

**Methods:**
1. **Email Survey** - Send to beta users
2. **In-App Feedback** - Add testimonial request after 7 days
3. **Social Media** - Collect from Twitter/LinkedIn mentions
4. **Interviews** - Schedule 15-min calls with power users

**Email Template:**
```
Subject: Share Your Success Story - Get Featured! 🎉

Hi [Name],

We'd love to feature your experience with The Future You on our homepage!

Please answer these quick questions:
1. What's your name and role?
2. What was your biggest communication challenge before?
3. How has The Future You helped you?
4. What specific results have you achieved?
5. Would you recommend us? (1-5 stars)

Your testimonial will be featured on our homepage and you'll get:
- Free 3-month Pro subscription
- LinkedIn shoutout from our account

Reply to this email or schedule a quick call: [calendly link]

Thanks!
The Future You Team
```

#### Step 2: Update testimonials Array

```tsx
// File: src/components/home/TestimonialGrid.tsx

const testimonials = [
  {
    name: "Alex Rivera",              // ✅ REAL NAME (with permission)
    role: "Product Manager at Google",
    initials: "AR",
    rating: 5,
    quote: "After using The Future You for 3 weeks, my presentation confidence skyrocketed. I went from nervous sweating to enjoying the spotlight during our quarterly business reviews.",
    highlight: "3x more confident in presentations"
  },
  {
    name: "Maria Santos",
    role: "UX Designer",
    initials: "MS",
    rating: 5,
    quote: "The AI feedback is uncanny - it caught my 'um' habit and posture slouch that I never noticed. Fixed both in 2 weeks!",
    highlight: "Eliminated filler words in 2 weeks"
  },
  // ... add 4-6 more real testimonials
];
```

#### Step 3: Get Legal Consent

**Testimonial Release Form:**
```
I, [Full Name], grant The Future You permission to:
- Use my testimonial and name on the website
- Use my job title and company name
- Use my initials/avatar representation

I confirm this testimonial is truthful and accurate.

Signature: ________________  Date: ________
```

#### Step 4: (Optional) Add Photos

If users provide photos:

```tsx
// Add photo property
const testimonials = [
  {
    name: "Alex Rivera",
    role: "Product Manager",
    photo: "/assets/testimonials/alex-rivera.jpg",  // Add this
    initials: "AR",  // Fallback if photo fails
    // ... rest
  }
];

// Update component to use photo
<Avatar>
  {testimonial.photo && (
    <AvatarImage src={testimonial.photo} alt={testimonial.name} />
  )}
  <AvatarFallback>{testimonial.initials}</AvatarFallback>
</Avatar>
```

#### Alternative: No Testimonials Yet?

**Option 1: Remove Section Temporarily**
```tsx
// File: src/pages/Home.tsx
// Comment out or remove:
// <TestimonialGrid />
```

**Option 2: Use Launch Waitlist Stats**
```tsx
<section className="py-20 px-4 bg-muted/30">
  <div className="container mx-auto max-w-7xl text-center">
    <h2 className="text-4xl font-bold mb-8">Loved by Early Adopters</h2>
    <div className="grid md:grid-cols-3 gap-8">
      <div>
        <p className="text-5xl font-bold text-brand-green">500+</p>
        <p className="text-muted-foreground">Beta Users</p>
      </div>
      <div>
        <p className="text-5xl font-bold text-brand-green">10k+</p>
        <p className="text-muted-foreground">Videos Analyzed</p>
      </div>
      <div>
        <p className="text-5xl font-bold text-brand-green">4.8★</p>
        <p className="text-muted-foreground">Average Rating</p>
      </div>
    </div>
  </div>
</section>
```

---

## 3. Social Media & Links

### Current State
```tsx
// File: src/components/home/Footer.tsx (lines 34-37)
const socialLinks = [
  { icon: Github, href: "https://github.com", label: "GitHub" },           // ❌
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },        // ❌
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },     // ❌
  { icon: Mail, href: "mailto:hello@thefutureyou.com", label: "Email" }   // ❌
];
```

### ✅ Solution: Update with Real Social Media Links

#### Step 1: Create Social Media Accounts (if not done)

**Twitter/X:**
```
Username: @thefutureyou or @thefutureyouapp
Bio: Build confidence through daily video reflections and AI-powered feedback. 
     Your personal communication coach. 🎙️✨
Link: https://thefutureyou.app
```

**LinkedIn:**
```
Company Page: The Future You
Industry: E-Learning / Professional Development
Website: https://thefutureyou.app
Description: AI-powered communication coaching platform helping professionals 
             build confidence through daily video practice and personalized feedback.
```

**GitHub:**
```
Organization: thefutureyou-app
Bio: Open-source communication coaching tools
```

**Email:**
```
Setup: hello@thefutureyou.app (or support@, team@)
Provider: Google Workspace, Zoho, or custom domain
```

#### Step 2: Update Footer.tsx

```tsx
// File: src/components/home/Footer.tsx (lines 34-37)

const socialLinks = [
  { 
    icon: Github, 
    href: "https://github.com/yashmagar01/The-Future-You",  // ✅ YOUR REPO
    label: "GitHub" 
  },
  { 
    icon: Twitter, 
    href: "https://twitter.com/thefutureyouapp",  // ✅ YOUR ACCOUNT
    label: "Twitter" 
  },
  { 
    icon: Linkedin, 
    href: "https://www.linkedin.com/company/the-future-you",  // ✅ YOUR PAGE
    label: "LinkedIn" 
  },
  { 
    icon: Mail, 
    href: "mailto:hello@thefutureyou.app",  // ✅ YOUR EMAIL
    label: "Email" 
  }
];
```

#### Step 3: Add More Social Platforms (Optional)

```tsx
import { Instagram, Youtube, MessageCircle } from "lucide-react";

const socialLinks = [
  // ... existing links
  { 
    icon: Instagram, 
    href: "https://instagram.com/thefutureyouapp",
    label: "Instagram" 
  },
  { 
    icon: Youtube, 
    href: "https://youtube.com/@thefutureyou",
    label: "YouTube" 
  },
  { 
    icon: MessageCircle,  // Discord
    href: "https://discord.gg/your-invite",
    label: "Discord Community" 
  }
];
```

---

## 4. Open Graph Images

### Current State
```html
<!-- File: index.html (line 38) -->
<meta property="og:image" content="https://thefutureyou.app/og-image.png" />  <!-- ❌ -->
<meta name="twitter:image" content="https://thefutureyou.app/og-image.png" />  <!-- ❌ -->
```

### ✅ Solution: Create and Upload OG Image

#### Step 1: Design OG Image

**Specifications:**
- Size: 1200x630px (Facebook/Twitter standard)
- Format: PNG or JPG
- Max size: 5MB (recommended < 300KB)
- Text: Large, readable even when thumbnail

**Design Tools:**
- Figma: Use OG Image template
- Canva: Search "Open Graph Image"
- OG Image Generator: https://og-playground.vercel.app/

**Content to Include:**
```
[Logo] The Future You

Build Confidence Through
Daily Video Reflections

✓ AI-Powered Feedback
✓ Speech & Posture Analysis
✓ Progress Tracking

[Screenshot or Illustration]
```

#### Step 2: Create OG Image

**Option A: Design in Figma**
```
1. Open Figma
2. Create frame: 1200x630px
3. Add:
   - Brand colors (green #10b981, blue #3b82f6)
   - Logo
   - Headline: "Build Confidence Through Daily Reflections"
   - Subtext: "AI-Powered Communication Coach"
   - Visual: Screenshot or hero illustration
4. Export as PNG (2x quality)
5. Optimize with TinyPNG
```

**Option B: Use Automated Tool**
```bash
# Install vercel/og
npm install @vercel/og

# Create API route: /api/og-image.tsx
# Generates dynamic OG images
```

#### Step 3: Upload OG Image

**Upload to Supabase Storage:**
```bash
# 1. Go to Supabase Dashboard > Storage
# 2. Create bucket: "images" (public)
# 3. Upload: og-image.png
# 4. Copy public URL:
https://your-project.supabase.co/storage/v1/object/public/images/og-image.png
```

**Or upload to `/public` folder:**
```bash
# Save to: public/og-image.png
# URL will be: https://yourdomain.com/og-image.png
```

#### Step 4: Update index.html

```html
<!-- File: index.html -->

<!-- Open Graph / Facebook -->
<meta property="og:image" content="https://yourdomain.com/og-image.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="The Future You - AI-Powered Communication Coach" />

<!-- Twitter Card -->
<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />
<meta name="twitter:card" content="summary_large_image" />
```

#### Step 5: Test OG Image

**Testing Tools:**
```
Facebook: https://developers.facebook.com/tools/debug/
Twitter: https://cards-dev.twitter.com/validator
LinkedIn: https://www.linkedin.com/post-inspector/
```

---

## 5. Footer Links & Pages

### Current State
```tsx
// File: src/components/home/Footer.tsx (lines 6-29)
const footerLinks = {
  product: [
    { label: "Features", href: "#features" },        // ✅ OK (hash link)
    { label: "Pricing", href: "/pricing" }          // ❌ Page doesn't exist
  ],
  company: [
    { label: "About", href: "/about" },             // ❌ Page doesn't exist
    { label: "Blog", href: "/blog" },               // ❌ Page doesn't exist
    { label: "Careers", href: "/careers" },         // ❌ Page doesn't exist
    { label: "Contact", href: "/contact" }          // ❌ Page doesn't exist
  ],
  resources: [
    { label: "Documentation", href: "/docs" },      // ❌ Page doesn't exist
    { label: "Help Center", href: "/help" },        // ❌ Page doesn't exist
    { label: "Community", href: "/community" },     // ❌ Page doesn't exist
    { label: "Status", href: "/status" }            // ❌ Page doesn't exist
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },  // ❌ Page doesn't exist
    { label: "Terms of Service", href: "/terms" },  // ❌ Page doesn't exist
    { label: "Cookie Policy", href: "/cookies" },   // ❌ Page doesn't exist
    { label: "GDPR", href: "/gdpr" }               // ❌ Page doesn't exist
  ]
};
```

### ✅ Solution: Choose Your Approach

#### Option 1: Remove Unready Links (MVP Approach)

```tsx
// File: src/components/home/Footer.tsx

const footerLinks = {
  product: [
    { label: "Features", href: "#features" },
    { label: "How it Works", href: "#how-it-works" },
    { label: "Roadmap", href: "#roadmap" },
    // Remove Pricing for now
  ],
  company: [
    { label: "About", href: "/about" },  // Keep if you create this page
    { label: "Contact", href: "mailto:hello@thefutureyou.app" },  // Change to email
    // Remove Blog, Careers for MVP
  ],
  resources: [
    { label: "Documentation", href: "https://docs.thefutureyou.app" },  // External link
    { label: "FAQ", href: "#faq" },  // Add FAQ section to homepage
    // Remove others for MVP
  ],
  legal: [
    { label: "Privacy Policy", href: "/privacy" },  // REQUIRED by law
    { label: "Terms of Service", href: "/terms" },  // REQUIRED by law
    // Remove Cookie Policy, GDPR for MVP (add later)
  ]
};
```

#### Option 2: Create Essential Pages

**Priority Pages to Create:**

**1. Privacy Policy (REQUIRED)**
```tsx
// File: src/pages/Privacy.tsx
// Use generator: https://www.termsfeed.com/privacy-policy-generator/

import Layout from "@/components/Layout";

const Privacy = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl prose prose-slate">
        <h1>Privacy Policy</h1>
        <p>Last updated: November 16, 2025</p>
        
        <h2>1. Information We Collect</h2>
        <p>We collect information you provide directly to us, including:</p>
        <ul>
          <li>Name and email address</li>
          <li>Video recordings (stored encrypted)</li>
          <li>Usage data and analytics</li>
        </ul>
        
        {/* Add full privacy policy content */}
      </div>
    </Layout>
  );
};

export default Privacy;

// Add route in App.tsx:
<Route path="/privacy" element={<Privacy />} />
```

**2. Terms of Service (REQUIRED)**
```tsx
// File: src/pages/Terms.tsx
// Use generator: https://www.termsfeed.com/terms-conditions-generator/

import Layout from "@/components/Layout";

const Terms = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl prose prose-slate">
        <h1>Terms of Service</h1>
        <p>Last updated: November 16, 2025</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By accessing The Future You, you agree to these terms...</p>
        
        {/* Add full terms content */}
      </div>
    </Layout>
  );
};

export default Terms;

// Add route in App.tsx:
<Route path="/terms" element={<Terms />} />
```

**3. About Page (Recommended)**
```tsx
// File: src/pages/About.tsx

import Layout from "@/components/Layout";
import { Card } from "@/components/ui/card";

const About = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-5xl font-bold mb-6">About The Future You</h1>
        
        <Card className="p-8 mb-8">
          <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
          <p className="text-lg text-muted-foreground">
            We're building the world's most effective communication coaching platform,
            making professional feedback accessible to everyone through AI-powered analysis.
          </p>
        </Card>
        
        <h2 className="text-3xl font-bold mb-6">Our Story</h2>
        <p className="text-muted-foreground mb-4">
          The Future You was born from a simple observation: most people never get 
          honest feedback on their communication skills. We're changing that.
        </p>
        
        {/* Add founder story, team, values */}
      </div>
    </Layout>
  );
};

export default About;

// Add route in App.tsx:
<Route path="/about" element={<About />} />
```

#### Option 3: External Links (Temporary)

```tsx
// Use external services for now
const footerLinks = {
  resources: [
    { label: "Documentation", href: "https://notion.so/your-docs", external: true },
    { label: "Help Center", href: "https://your-help-center.freshdesk.com", external: true },
    { label: "Community", href: "https://discord.gg/your-invite", external: true },
  ]
};

// Update component to handle external links
<a
  href={link.href}
  target={link.external ? "_blank" : "_self"}
  rel={link.external ? "noopener noreferrer" : undefined}
>
  {link.label}
</a>
```

---

## 6. Assets & Favicons

### Current Assets Status

```
public/
├── favicon.svg          ❌ Replace with your logo
├── favicon.ico          ❌ Replace with your logo
├── apple-touch-icon.png ❌ Missing - create this
├── og-image.png         ❌ Missing - create this
└── assets/
    └── video-poster.svg ❌ Replace with actual poster
```

### ✅ Solution: Create Complete Asset Set

#### Step 1: Design Favicon

**Requirements:**
- 32x32px (favicon.ico)
- 16x16px (favicon small)
- 180x180px (Apple touch icon)
- SVG (modern browsers)

**Tools:**
- Favicon Generator: https://realfavicongenerator.net/
- Figma: Export at multiple sizes
- Online tool: https://favicon.io/

**Process:**
```bash
# 1. Create logo in Figma (512x512px)
# 2. Export as PNG (512x512px)
# 3. Go to https://realfavicongenerator.net/
# 4. Upload logo
# 5. Customize colors (iOS, Android)
# 6. Generate and download package
# 7. Extract to /public folder
```

#### Step 2: Replace Favicons

```bash
# Copy generated files to public folder:
public/
├── favicon.ico           # ✅ 32x32 ICO
├── favicon-16x16.png     # ✅ 16x16 PNG
├── favicon-32x32.png     # ✅ 32x32 PNG
├── apple-touch-icon.png  # ✅ 180x180 PNG
├── android-chrome-192x192.png  # ✅ Android
├── android-chrome-512x512.png  # ✅ Android
└── site.webmanifest      # ✅ PWA manifest
```

#### Step 3: Update index.html

```html
<!-- File: index.html -->
<head>
  <!-- Favicons -->
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="manifest" href="/site.webmanifest" />
  <meta name="theme-color" content="#10b981" />
</head>
```

#### Step 4: Create site.webmanifest

```json
// File: public/site.webmanifest
{
  "name": "The Future You",
  "short_name": "FutureYou",
  "description": "AI-Powered Communication Coach",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#10b981",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/"
}
```

---

## 7. Environment Variables

### Current .env File

Check if you have actual values or placeholders:

```bash
# File: .env

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co       # ✅ Check this
VITE_SUPABASE_ANON_KEY=your-anon-key                     # ✅ Check this

# Analytics
VITE_GA_MEASUREMENT_ID=                                  # ❌ Empty
VITE_CTA_VARIANT=A                                       # ✅ OK for AB testing

# App
VITE_APP_URL=http://localhost:5173                       # ❌ Update for production
```

### ✅ Solution: Production Environment Variables

#### Step 1: Create .env.production

```bash
# File: .env.production

# Supabase (Production)
VITE_SUPABASE_URL=https://your-prod-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-prod-anon-key

# Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
VITE_MIXPANEL_TOKEN=your-mixpanel-token
VITE_POSTHOG_KEY=your-posthog-key

# App URLs
VITE_APP_URL=https://thefutureyou.app
VITE_API_URL=https://api.thefutureyou.app

# Feature Flags
VITE_CTA_VARIANT=A
VITE_ENABLE_ANALYTICS=true
```

#### Step 2: Setup Google Analytics

```bash
# 1. Go to https://analytics.google.com/
# 2. Create new property: "The Future You"
# 3. Create data stream: Web
# 4. Copy Measurement ID: G-XXXXXXXXXX
# 5. Add to .env.production
```

#### Step 3: Update Analytics Utility

```tsx
// File: src/utils/analytics.ts

export const logEvent = (eventName: string, properties?: Record<string, any>): void => {
  const event: AnalyticsEvent = {
    name: eventName,
    properties: properties || {},
    timestamp: new Date().toISOString(),
  };

  // Development: Console log
  if (import.meta.env.DEV) {
    console.log('📊 Analytics Event:', event.name, event.properties);
  }

  // Production: Send to analytics
  if (import.meta.env.PROD && import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
    // Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', eventName, properties);
    }
    
    // Vercel Analytics
    if (typeof window !== 'undefined') {
      import('@vercel/analytics').then(({ track }) => {
        track(eventName, properties);
      });
    }
  }
};
```

#### Step 4: Add GA4 Script to index.html

```html
<!-- File: index.html -->
<head>
  <!-- Google Analytics 4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');
  </script>
</head>
```

---

## Production Checklist

### Pre-Launch Verification

Copy this checklist and check off each item:

#### 🎥 Video & Media
- [x] NotebookLM video uploaded to YouTube (https://youtu.be/pVO6QOt-8QE)
- [x] Video URL updated in `src/pages/Home.tsx`
- [ ] Video poster image created (1280x720px)
- [ ] Video poster uploaded and URL updated
- [ ] Test video plays on mobile and desktop

#### 👥 Testimonials
- [ ] Collected at least 3 real testimonials
- [ ] Got written permission from users
- [ ] Updated `TestimonialGrid.tsx` with real data
- [ ] Removed fictional testimonials
- [ ] OR removed testimonial section if no data yet

#### 🔗 Links & Social
- [ ] Created Twitter/X account
- [ ] Created LinkedIn company page
- [ ] Created GitHub organization (optional)
- [ ] Setup business email (hello@yourdomain.com)
- [ ] Updated all social links in `Footer.tsx`
- [ ] Verified all footer links work
- [ ] Created Privacy Policy page
- [ ] Created Terms of Service page
- [ ] Created About page (optional but recommended)

#### 🖼️ Assets & Images
- [ ] Created OG image (1200x630px)
- [ ] Uploaded OG image to hosting
- [ ] Updated OG image URL in `index.html`
- [ ] Tested OG image on Facebook debugger
- [ ] Tested OG image on Twitter validator
- [ ] Created favicon package (all sizes)
- [ ] Replaced favicon files in `/public`
- [ ] Updated favicon links in `index.html`
- [ ] Created `site.webmanifest` for PWA

#### ⚙️ Configuration
- [ ] Updated `.env.production` with real values
- [ ] Setup Google Analytics account
- [ ] Added GA4 tracking code to `index.html`
- [ ] Updated analytics utility to send events
- [ ] Updated `VITE_APP_URL` to production domain
- [ ] Tested analytics events in production

#### 🔍 SEO & Meta
- [ ] Updated page title in `index.html`
- [ ] Updated meta description
- [ ] Added canonical URL
- [ ] Added robots meta tag
- [ ] Updated Twitter card tags
- [ ] Added structured data (optional)

#### 🧪 Testing
- [ ] Test on mobile devices (iPhone, Android)
- [ ] Test on different browsers (Chrome, Safari, Firefox)
- [ ] Test all CTAs and links
- [ ] Test video playback
- [ ] Test form submissions
- [ ] Check console for errors
- [ ] Test with slow 3G connection

#### 🚀 Deployment
- [ ] Build production bundle: `npm run build`
- [ ] Check bundle size (< 500KB recommended)
- [ ] Test production build locally: `npm run preview`
- [ ] Deploy to Vercel/Netlify
- [ ] Setup custom domain
- [ ] Setup SSL certificate
- [ ] Test production URL
- [ ] Setup error tracking (Sentry)
- [ ] Setup uptime monitoring

---

## Quick Commands

```bash
# Development
npm run dev                  # Start dev server
npm run test                 # Run unit tests

# Production Build
npm run build                # Build for production
npm run preview              # Preview production build

# Testing
npm run lint                 # Check code quality

# Deployment (Vercel)
vercel                       # Deploy to preview
vercel --prod                # Deploy to production
```

---

## Need Help?

### Common Issues

**Issue: Video won't play on iOS**
- Solution: Ensure `playsInline` attribute is set
- Check file format (MP4 with H.264 codec)

**Issue: OG image not showing**
- Solution: Use Facebook Debugger to scrape fresh
- Check image is accessible (public URL)
- Verify image size < 5MB

**Issue: Links return 404**
- Solution: Create missing pages or remove links
- Check route configuration in `App.tsx`

### Resources

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [OG Image Best Practices](https://www.opengraph.xyz/)
- [Favicon Generator](https://realfavicongenerator.net/)
- [Google Analytics Setup](https://support.google.com/analytics/answer/9304153)
- [Vercel Deployment](https://vercel.com/docs)

---

## Summary

### Files to Modify

1. `src/pages/Home.tsx` - Video URL
2. `src/components/home/TestimonialGrid.tsx` - Real testimonials
3. `src/components/home/Footer.tsx` - Social links
4. `index.html` - OG images, favicons, GA4
5. `.env.production` - Production config
6. `public/` - Assets (favicons, og-image, video-poster)

### New Files to Create

1. `src/pages/Privacy.tsx` - Privacy policy
2. `src/pages/Terms.tsx` - Terms of service
3. `src/pages/About.tsx` - About page (optional)
4. `public/site.webmanifest` - PWA manifest
5. `public/og-image.png` - Social preview image
6. `public/assets/video-poster.png` - Video thumbnail

### Priority Order

1. **🔴 Critical (Do First)**
   - Upload NotebookLM video
   - Create Privacy & Terms pages
   - Update social media links
   - Create OG image

2. **🟡 Important (Do Soon)**
   - Replace testimonials (or remove section)
   - Create favicon package
   - Setup analytics
   - Test on mobile

3. **🟢 Nice to Have (Do Later)**
   - Create About page
   - Setup Discord community
   - Add blog
   - Create documentation

---

**Last Updated:** November 16, 2025  
**Version:** 1.0  
**Status:** Ready for Production Migration

Good luck with your launch! 🚀
