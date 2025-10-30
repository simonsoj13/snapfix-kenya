# Design Guidelines: Repair Service Marketplace App

## Design Approach

**Selected Approach:** Reference-Based (Service Marketplace Pattern)

Drawing inspiration from successful service marketplaces like Uber, TaskRabbit, and Thumbtack, combined with Airbnb's trust-building elements and profile design. This approach prioritizes clarity, trust, and mobile-first interaction patterns essential for on-demand service apps.

**Key Design Principles:**
- Mobile-first design with touch-optimized interactions
- Trust and transparency through prominent ratings and reviews
- Clear pricing and availability information
- Streamlined photo upload and AI analysis flow
- Professional yet approachable aesthetic

---

## Core Design Elements

### A. Typography

**Font Family:** Inter (via Google Fonts CDN)
- Primary font for entire application
- Excellent readability at small sizes
- Modern, neutral, and professional

**Type Scale:**
- Hero/Page Titles: text-4xl font-bold (36px)
- Section Headers: text-2xl font-semibold (24px)
- Card Titles/Names: text-lg font-semibold (18px)
- Body Text: text-base font-normal (16px)
- Metadata/Secondary: text-sm font-medium (14px)
- Captions/Timestamps: text-xs font-normal (12px)

**Special Typography Elements:**
- Rating numbers: font-semibold
- Price displays: text-xl font-bold
- Category tags: text-xs font-medium uppercase tracking-wide

---

### B. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 6, and 8 as core spacing values
- Micro spacing (icons, inline elements): space-2, gap-2
- Component padding: p-4, p-6
- Section spacing: py-8, py-12
- Major section breaks: py-16

**Container Widths:**
- Mobile: Full width with px-4 padding
- Desktop: max-w-7xl mx-auto with px-6

**Grid Systems:**
- Worker cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 with gap-6
- Service categories: grid-cols-2 md:grid-cols-4 with gap-4
- Review cards: grid-cols-1 md:grid-cols-2 with gap-6

---

## Component Library

### Navigation

**Top Navigation Bar:**
- Fixed position with backdrop blur effect
- Height: h-16
- Contains: Logo (left), search icon, user profile avatar (right)
- Mobile: Hamburger menu icon replacing desktop items
- Shadow: shadow-sm for subtle depth

**Bottom Tab Navigation (Mobile):**
- Fixed bottom position
- Height: h-16
- Four tabs: Home, Search, Requests, Profile
- Icons from Heroicons (outline style)
- Active state: filled icon variant

### Hero Section (Home Page)

**Photo Upload Card:**
- Central focus with rounded-2xl border
- Padding: p-8
- Dashed border indicating upload zone
- Camera icon (size-16) centered
- Heading: "What needs fixing?" 
- Supporting text explaining photo upload
- Two CTA buttons: "Take Photo" and "Upload Image" stacked vertically on mobile, horizontal on desktop
- Buttons with backdrop blur when over gradient background
- Spacing: space-y-6 for vertical flow

**Background Treatment:**
- Subtle gradient overlay (no specific colors mentioned, handled in styling phase)
- Hero image showing diverse skilled workers in action (optional background)

### Service Provider Cards

**Worker Profile Card:**
- Border radius: rounded-xl
- Padding: p-6
- Shadow: shadow-md hover:shadow-lg transition
- Layout structure:
  - Profile photo: w-16 h-16 rounded-full (top left)
  - Name and specialty (top right of photo)
  - Star rating with count: inline-flex items-center gap-1
  - Hourly rate: prominent display with text-xl
  - Distance indicator with location pin icon
  - "View Profile" button: full width at bottom

**Compact List View:**
- Horizontal layout for mobile scrolling
- Profile photo: w-12 h-12
- Condensed information display
- Quick action button: "Request" aligned right

### Category Selection

**Service Category Tiles:**
- Grid layout: 2 columns mobile, 4 columns desktop
- Square aspect ratio with rounded-lg
- Icon (size-12) centered top
- Category name below icon
- Padding: p-4
- Hover: scale-105 transform transition

**Categories Include:**
- Plumbing, Electrical, Welding, Carpentry, Painting, HVAC, Appliance Repair, General Handyman

### Job Request Interface

**AI Analysis Results Card:**
- Uploaded image preview: rounded-lg with max height
- AI-generated description in editable textarea
- Detected category chips (pill-shaped badges)
- Confidence indicator
- "Edit Description" affordance
- Spacing: space-y-4

**Request Details Form:**
- Input fields with floating labels
- Date/time picker for preferred service window
- Address autocomplete field
- Additional notes textarea
- Budget range slider
- "Find Workers" CTA button: large, full-width

### Worker Profile Page

**Header Section:**
- Large profile photo: w-32 h-32 rounded-full
- Name: text-3xl font-bold
- Specialty tags: inline pills with gap-2
- Rating stars with total reviews count
- Response time badge
- Verified checkmark icon if applicable

**Statistics Row:**
- Jobs completed, Years experience, Response rate
- Grid: grid-cols-3 with dividers
- Centered text with icons above numbers

**Portfolio Gallery:**
- Masonry grid of completed work photos
- 2 columns mobile, 3-4 columns desktop
- Lightbox interaction on click
- Each with brief description overlay on hover

**Reviews Section:**
- List of review cards with space-y-6
- Each review: reviewer name, star rating, date, text, helpful count
- "Load More" button at bottom

**Pricing & Availability:**
- Clear hourly rate display
- Service area map/list
- Calendar showing availability
- "Request Quote" and "Book Now" CTAs side by side

### Rating & Review Components

**Star Rating Display:**
- Icon size: w-5 h-5 
- Inline with numerical rating
- Color handled in styling phase
- Review count in parentheses

**Review Card:**
- Reviewer avatar: w-10 h-10
- Name and verification badge
- Star rating and date
- Review text with "Read more" expansion
- Helpful counter with thumb icon
- Padding: p-4, rounded-lg

### Status Indicators

**Job Status Badges:**
- Pill-shaped with px-3 py-1
- Text: text-xs font-semibold uppercase
- Rounded: rounded-full
- States: Pending, In Progress, Completed, Cancelled

**Availability Indicators:**
- Small dot icon with inline text
- "Available now", "Busy", "Next available: [time]"

### Forms & Inputs

**Input Fields:**
- Height: h-12
- Padding: px-4
- Border radius: rounded-lg
- Focus state with ring-2 offset
- Label: text-sm font-medium mb-2

**Buttons:**
- Primary CTA: px-6 py-3 rounded-lg text-base font-semibold
- Secondary: px-6 py-3 rounded-lg border-2
- Icon buttons: w-10 h-10 rounded-full
- Full-width mobile, auto desktop where appropriate

### Search & Filters

**Search Bar:**
- Prominent placement below hero
- Height: h-12
- Rounded: rounded-full
- Search icon left, filter icon right
- Placeholder: "Search by service or location"

**Filter Panel:**
- Slide-in drawer on mobile
- Sidebar on desktop: w-64
- Filter groups with space-y-6
- Checkboxes for categories
- Range sliders for price
- Distance radius selector
- "Apply Filters" button sticky at bottom

### Lists & Cards

**Request History List:**
- Timeline-style layout with connecting lines
- Each item: service type icon, worker info, status, date
- Tap to view full details
- Padding: p-4 with space-y-4 between items

**Notification Cards:**
- Left icon indicating type
- Title and message text
- Timestamp
- Action button if applicable
- Dismissable with swipe gesture hint

---

## Images

**Hero Section Background:**
Description: Diverse group of skilled workers (plumber, electrician, carpenter) in professional attire with tools, showcasing confidence and expertise. Modern, bright, approachable photography style. Should include both male and female workers of various ethnicities.
Placement: Full-width background behind the photo upload card with gradient overlay for text readability.

**Worker Profile Photos:**
Description: Professional headshots of service providers in work attire or with tools. Natural lighting, friendly expressions, authentic representation.
Placement: Circular avatars in profile cards, list views, and detail pages.

**Portfolio/Work Examples:**
Description: Before/after shots of completed repairs, close-ups of quality workmanship, finished projects in residential/commercial settings.
Placement: Worker profile galleries, review sections, category illustration tiles.

**Category Icons:**
Description: Simple, recognizable tool/service icons (wrench, lightning bolt, welding mask, paint brush, etc.)
Placement: Service category tiles, navigation, filter selections.

**Empty States:**
Description: Friendly illustrations of service scenarios (house repair, tools, searching)
Placement: No results found, empty requests list, onboarding screens.

---

## Animations

**Minimal, purposeful animations only:**
- Card hover: subtle scale (scale-105) and shadow increase
- Button press: scale-95 feedback
- Drawer/modal: slide-in transitions (300ms)
- Loading states: simple spinner for AI analysis
- Success: checkmark animation on request submission

**No continuous animations, parallax, or scroll-triggered effects**

---

## Mobile-First Considerations

- Touch targets minimum 44x44px
- Sticky headers during scroll
- Swipe gestures for cards and drawers
- Bottom sheet modals for actions
- Large, thumb-friendly CTAs
- Stacked layouts on mobile, side-by-side on desktop
- Hamburger menu collapses to bottom tabs on mobile