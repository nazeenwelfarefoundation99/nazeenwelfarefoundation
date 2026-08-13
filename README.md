# Nazeen Welfare Foundation — Website

A responsive, single-page NGO/charity website built with plain HTML5, CSS3, and vanilla JavaScript — no frameworks, no build tools, no dependencies. Just unzip and open in a browser.

---

## 📁 Project Structure

nazeen-welfare-foundation/
│
├── index.html          # Main (and only) HTML page — all sections live here
├── README.md            # This file
│
├── css/
│   └── style.css        # All styling: layout, colors, typography, responsive rules
│
└── js/
    └── script.js         # Smooth scrolling, hero image cycling, active nav highlighting

No images/ folder is included — all photos are loaded live from an external
placeholder photo service (see Images section below), so the zip stays
lightweight. You can swap in your own local images at any time.

---

## 🚀 Getting Started

### Option 1 — Just open it
1. Unzip the folder.
2. Double-click index.html.
3. It opens directly in your default browser. No server required.

### Option 2 — Run a local server (recommended for development)
Some browsers restrict certain features (like JS modules) when opening files
directly via file://. To avoid any issues:

cd nazeen-welfare-foundation
python3 -m http.server 8000

Then visit http://localhost:8000 in your browser.

Or with Node.js:
npx serve .

### Option 3 — Deploy it live
Because it's static HTML/CSS/JS, you can drag-and-drop the folder into any of:
- Netlify (drag the folder onto app.netlify.com/drop)
- Vercel
- GitHub Pages (push to a repo, enable Pages in settings)
- Any shared hosting / cPanel — just upload the files via FTP

---

## 🧩 Page Sections (in order)

Section                     | HTML id     | Description
---------------------------|-------------|------------------------------------------------------------
Header / Navbar            | —           | Logo, nav links (Home, About us, Our Programs, Get Involved, Contact us), Donate button
Hero Banner                | #home       | Teal/orange diagonal split banner, headline, intro paragraph, rounded blob photo, prev/next arrows
Who We Are                 | #about      | Foundation description + founder names + blob-shaped photo
Our Key Programs           | #programs   | 3 program cards: Local Self Governance, Education Programmes, Health/Hygiene/Nutrition
Our Mission & Vision       | —           | 3 cards: Mission, Vision, Key Objectives (bulleted list)
Be a Part of the Change    | #involved   | Call-to-action section with photo + "Become a Volunteer" / "Support Our Cause" buttons
Footer                      | #contact    | Org description, quick links, contact info (phone/WhatsApp/address), copyright bar

---

## 🎨 Design / Theme

Element                          | Value
----------------------------------|-----------
Primary color (teal)             | #0d8b9a
Primary color hover (teal dark)  | #0a6e7a
Accent color (orange)            | #f5a623
Accent hover (orange dark)       | #e2941a
Heading / navy color             | #1e3a5f
Section background (cream)       | #fdf3e7
Body font                        | Segoe UI (system sans-serif)
Heading font                     | Georgia (serif)

All colors are defined as CSS custom properties at the top of css/style.css:

:root {
  --teal: #0d8b9a;
  --teal-dark: #0a6e7a;
  --orange: #f5a623;
  --orange-dark: #e2941a;
  --navy: #1e3a5f;
  --cream: #fdf3e7;
  --text-dark: #2b2b2b;
}

To re-theme the whole site, just edit these variables — every section
references them.

The organic "blob" photo frames (hero, Who We Are, Get Involved) are done
with CSS border-radius shorthand tricks (no images or masks needed), e.g.:

border-radius: 45% 55% 60% 40% / 50% 40% 60% 50%;

---

## 🖼️ Images

All photos in this build are pulled live from LoremFlickr
(https://loremflickr.com), a free keyword-based placeholder image service —
this keeps the zip small and avoids bundling copyrighted photos.

Example from the code:
<img src="https://loremflickr.com/700/700/india,children,school?lock=11" alt="Children studying together">

### To replace with your own photos:
1. Add your image files to a local images/ folder (create it if needed).
2. In index.html, replace the src="https://loremflickr.com/..." URL with
   your local path, e.g. src="images/hero.jpg".
3. Repeat for each <img> tag. There are 5 photo spots total:
   - Hero banner photo
   - "Who We Are" photo
   - 3 program card photos (governance, education, health)
   - "Be a Part of the Change" photo

⚠️ Note: loremflickr.com requires an internet connection to load images.
If you need the site to work fully offline, swap in local images.

---

## ⚙️ JavaScript Features (js/script.js)

1. Smooth scrolling — all internal links (href="#...") scroll smoothly
   to their target section instead of jumping instantly.
2. Hero image cycling — clicking the left/right arrows on the hero banner
   cycles through a small rotation of themed placeholder photos.
3. Active nav highlighting — as you scroll, the nav link matching the
   section currently in view gets a highlighted underline automatically.

No external libraries are used — everything is plain document.querySelector
/ addEventListener JavaScript.

---

## 📱 Responsive Behavior

The layout is fully responsive via a single breakpoint at 900px
(@media (max-width: 900px) in style.css):

- Two-column sections (hero, Who We Are, Get Involved, program/mission grids)
  collapse to a single column.
- Images move above their accompanying text (order: -1).
- Nav links wrap to a second row under the logo/donate button.
- Hero/section images shrink to a fixed 380px height for better mobile fit.

---

## ✏️ How to Customize Content

What to change                                  | Where
------------------------------------------------|--------------------------------------------------------------
Organization name / branding                    | Search "Nazeen Welfare Foundation" in index.html — appears in <title>, header logo, About section, footer
Founder names                                    | "Who We Are" section (<h2> block) in index.html
Phone / WhatsApp / Address                       | Footer section ("Get in Touch" column) in index.html
Nav menu items                                   | <nav class="main-nav"> block in index.html
Program cards (titles/text/photos)               | <section class="programs"> block in index.html
Mission / Vision / Objectives                    | <section class="mission-vision"> block in index.html
Colors / fonts                                   | :root variables at the top of css/style.css
Button link destinations (e.g. real Donate page) | Update href="#donate" etc. to your actual URLs

---

## 🔧 Browser Support

Works in all modern browsers (Chrome, Firefox, Safari, Edge). Uses standard
CSS Grid, Flexbox, and CSS custom properties — no polyfills needed for any
browser released in the last several years.

---

## 📄 License / Credits

This is a custom-built template created for Nazeen Welfare Foundation.
Placeholder photography is sourced live from LoremFlickr (Flickr-based free
images) purely as stand-ins — replace with your own licensed/owned photos
before going live.

---

## ✅ Quick Checklist Before Going Live

[ ] Replace all placeholder LoremFlickr images with real, owned photos
[ ] Update phone numbers, WhatsApp number, and address in the footer
[ ] Point "Donate" and "Support Our Cause" buttons to a real payment/donation page
[ ] Point "Become a Volunteer" button to a real signup form
[ ] Update the footer copyright line and "Design and Development by" credit
[ ] Add a real favicon (<link rel="icon" ...> in <head>)
[ ] Test on mobile, tablet, and desktop widths
[ ] Add real social media links if needed
