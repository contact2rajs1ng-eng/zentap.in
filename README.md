# zentap.in — website source

Plain HTML/CSS/JS. No build tools, no npm, no server needed to run it —
just files that GitHub Pages hosts for free.

## Folder map

```
zentap.in/
├── index.html          ← Home page
├── products.html        ← Shop / products page
├── how-it-works.html    ← How It Works page
├── contact.html          ← Contact page
├── CNAME                 ← tells GitHub Pages your custom domain is zentap.in
├── partials/
│   ├── header.html       ← the nav bar — edit ONCE, updates on every page
│   └── footer.html       ← the footer — edit ONCE, updates on every page
└── assets/
    ├── css/style.css     ← all colors, fonts, spacing — the whole look
    └── js/common.js      ← loads the header/footer, mobile menu
```

## Your real brand info is already wired in

Your WhatsApp number (+91 88537 97074), email (Zentap.office@gmail.com),
Instagram (@zentap.in) and logo are already in every page. If any of
these change later:

1. **WhatsApp number:** search the whole project (Ctrl+Shift+F in VS
   Code) for `918853797074` and replace every occurrence.
2. **Email/phone shown in the footer and Contact page:** open
   `partials/footer.html` and `contact.html`.
3. **Logo:** replace `assets/img/logo-icon.png` and `assets/img/favicon.png`
   with a new export — same filenames, same folder — and it updates on
   every page automatically.
4. **Prices** in `products.html` — currently removed since pricing isn't
   finalized. Search for `product-card` to see where to add a price
   line back in later.

## Previewing it on your own computer

Because the header/footer are loaded with JavaScript (`fetch`), double-
clicking `index.html` won't show the nav or footer — browsers block
`fetch` on `file://` pages. Use a tiny local server instead:

**Easiest: VS Code "Live Server" extension**
1. In VS Code, go to the Extensions icon (left sidebar) → search **Live
   Server** by Ritwick Dey → Install.
2. Right-click `index.html` in the file explorer → **Open with Live
   Server**. Your browser opens the site at `http://127.0.0.1:5500`.
3. Any file you save updates the browser automatically.

## How to customize things later

- **Change the logo / brand name:** your logo image is
  `assets/img/logo-icon.png`, used in `partials/header.html` and
  `partials/footer.html`. Drop in a new file with the same name to
  replace it everywhere at once, or edit the `<img>` tag to point to a
  different filename. The "ZEN" / "TAP" text next to it is plain text in
  those same two files.
- **Change colors:** open `assets/css/style.css`, edit the values at the
  very top inside `:root { ... }` — e.g. change `--copper: #2E5FE0;` (the
  Zentap brand blue) to any other hex color and every button, accent and
  highlight updates across all four pages at once.
- **Change fonts:** the `<link>` tag near the top of each HTML file pulls
  fonts from Google Fonts (free). Swap `Space+Grotesk`, `Inter` or
  `IBM+Plex+Mono` for any other font family listed at fonts.google.com,
  and update the matching `font-family` in `style.css`.
- **Add or edit a product card:** open `products.html`, copy one
  `<div class="card product-card">…</div>` block, paste it, and edit the
  text, price and WhatsApp link inside.
- **Add a new page:** copy `contact.html`, rename it, change the content
  in the `<section>` tags, and add a link to it inside
  `partials/header.html` and `partials/footer.html`.
- **Change the WhatsApp pre-filled messages:** every "Order on WhatsApp"
  button is a plain link — the text after `?text=` (URL-encoded) is the
  message that appears already typed in WhatsApp. Edit it directly in
  the `href`.

## Publishing (GitHub Pages + your zentap.in domain)

See the step-by-step instructions given in chat. Short version:
1. Push this folder to a GitHub repository.
2. In the repo → Settings → Pages → set the source branch to `main`.
3. In your domain registrar's DNS settings, point zentap.in at GitHub
   Pages (A records + a CNAME for `www`).
4. Add `zentap.in` as the custom domain in the same Pages settings screen
   (the `CNAME` file in this folder already has it pre-filled).
5. Wait for DNS to propagate and tick "Enforce HTTPS".

## Zero-cost stack this site uses

- **Hosting:** GitHub Pages — free forever for static sites.
- **Domain:** the one you already bought (zentap.in).
- **Fonts:** Google Fonts — free, loaded via CDN.
- **"Contact form":** no backend — it builds a WhatsApp message and opens
  a chat, so there's no email service or database to pay for.
- **Ordering:** WhatsApp links (`wa.me`) — free, no API needed at this
  stage.
- **Accounts:** Firebase Authentication (Email/Password) + Firestore —
  both free at this scale. EmailJS sends you a notification email on
  every new signup, also free up to 200 emails/month.

## Finishing the account system (Sign In / Create Account)

The code is already wired up in `assets/js/firebase-init.js` and
`assets/js/common.js`. Two things still need doing in the Firebase and
EmailJS dashboards before it actually works end to end:

**1. Firestore security rules (required — signups will fail without this)**

By default, a new Firestore database blocks all reads and writes, even
from your own signed-in users. Go to Firebase Console → your project →
Firestore Database → **Rules** tab, replace everything there with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Click **Publish**. This lets a signed-in person read and write only
their own account document — nobody else's.

**2. Add your live domain to Firebase's allowed list (required)**

Firebase Authentication only accepts sign-ins from domains you've
explicitly approved. Go to Authentication → **Settings** tab →
**Authorized domains** → **Add domain**, and add:
- `zentap.in` (your real domain)
- your `*.github.io` address too, if you want sign-in to also work on
  the temporary GitHub Pages preview link before your DNS is fully live

Without this step, every sign-in attempt fails with an
"unauthorized domain" error.

**3. EmailJS Template ID — still pending**

`assets/js/common.js` has your EmailJS Public Key and Service ID
already filled in, but the `EMAILJS_TEMPLATE_ID` is still a placeholder.
Once you've created your email template (EmailJS dashboard → Email
Templates) and have its ID, send it over and it'll be the last piece.
