## Plan

### 1. Database Migration
- Add `brand_name` and `brand_logo_url` columns to `profiles` table

### 2. Default Light Mode
- Change `use-theme.ts` to default to light mode

### 3. Redesign Landing Page (RedLeads-inspired, light mode)
- **Navbar**: Clean pill-style nav with logo left, links center, CTA right
- **HeroSection**: Bold headline, subtitle, input-style CTA or button CTA with social proof avatars, feature badges below
- **TrustMarquee**: Keep as-is, works well
- **FeaturesSection**: Clean icon cards in grid, keep interactive widgets
- **HowItWorksSection**: Numbered steps with visual cards (similar to RedLeads 3-step)
- **PricingSection**: Clean 3-column pricing with highlighted card
- **CTASection**: Bold CTA with gradient background
- **Footer**: Clean footer

### 4. Free Users Cannot Delete Proposals
- In Dashboard, hide/disable delete button when `plan === "free"`
- Show tooltip explaining why

### 5. Fix Proposal JSON Rendering
- Parse the generated JSON content and render structured, readable sections
- Different rendering for sales_pitch vs traditional modes
- Handle both JSON and raw text gracefully

### 6. Brand Settings in Profile
- Add brand name and logo upload fields in Settings > Profile tab
- Store brand_logo_url in storage bucket + profiles table
