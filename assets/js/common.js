/* ==========================================================================
   ZENTAP.IN — common.js
   Loads the shared header/footer (so you only edit them in ONE place:
   partials/header.html and partials/footer.html) and wires up the
   mobile menu + active nav link.

   IMPORTANT: because this uses fetch() to load the partial files, it must
   be viewed over http(s) — e.g. on GitHub Pages, or via a local dev
   server — NOT by double-clicking the .html file on your computer.
   See README.md "Previewing locally" for a one-command local server.
   ========================================================================== */

async function includeHTML(elementId, filePath) {
  const el = document.getElementById(elementId);
  if (!el) return;
  try {
    const res = await fetch(filePath);
    el.innerHTML = await res.text();
  } catch (err) {
    console.error('Could not load', filePath, err);
  }
}

function setActiveNavLink() {
  const current = (location.pathname.split('/').pop() || 'index.html');
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === current || (current === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
}

function wireMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (!toggle || !links) return;
  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => links.classList.remove('open'))
  );
}

function wireBackButton() {
  const doBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = 'index.html';
  };
  const backBtn = document.getElementById('nav-back-btn');
  const backBtnMobile = document.getElementById('nav-back-btn-mobile');
  if (backBtn) backBtn.addEventListener('click', doBack);
  if (backBtnMobile) backBtnMobile.addEventListener('click', doBack);
}

// ---------------------------------------------------------------------------
// Sign In / Create Account panel — now backed by real Firebase Authentication
// (Email/Password) + Firestore (to store each account) + EmailJS (to notify
// you by email whenever someone creates an account).
//
// Phone sign-in isn't turned on in Firebase yet (it needs Firebase's paid
// plan) — tapping it still falls back to WhatsApp for now, so no interest
// is lost while that's pending. Facebook sign-in has been removed.
//
// EMAILJS SETUP: fill in your three EmailJS values below. You already have
// your Public Key — paste your Service ID and Template ID in too once
// you've created the email template (EmailJS dashboard → Email Templates).
// ---------------------------------------------------------------------------
const AUTH_WHATSAPP_NUMBER = '918853797074';

const EMAILJS_PUBLIC_KEY  = 'hBN6L1AQ-Ey6mq-UbMNb8';
const EMAILJS_SERVICE_ID  = '2NgrsHHgUzTqSWSd2';   // ⚠️ confirm this is your Service ID, not Template ID
const EMAILJS_TEMPLATE_ID = 'REPLACE_WITH_YOUR_TEMPLATE_ID'; // ⚠️ paste your EmailJS Template ID here

if (window.emailjs && EMAILJS_PUBLIC_KEY) {
  emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
}

function notifyNewAccountByEmail(name, email) {
  if (!window.emailjs || EMAILJS_TEMPLATE_ID.startsWith('REPLACE_WITH')) {
    console.warn('EmailJS not fully configured yet — skipping signup notification email.');
    return;
  }
  emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
    name: name || '(not provided)',
    email: email
  }).catch(err => console.error('EmailJS notification failed:', err));
}

function wireAuthPanel() {
  const profileBtn = document.getElementById('nav-profile-btn');
  const profileBtnMobile = document.getElementById('nav-profile-btn-mobile');
  const overlay = document.getElementById('auth-overlay');
  const closeBtn = document.getElementById('auth-close-btn');
  const tabs = document.querySelectorAll('.auth-tab');
  const signupFields = document.querySelectorAll('[data-signup-only]');
  const submitBtn = document.getElementById('auth-submit-btn');
  const form = document.getElementById('auth-form');
  const note = document.getElementById('auth-note');
  if (!overlay || !form) return;

  let mode = 'signin';

  function openPanel() { overlay.hidden = false; }
  function closePanel() { overlay.hidden = true; }

  if (profileBtn) profileBtn.addEventListener('click', openPanel);
  if (profileBtnMobile) profileBtnMobile.addEventListener('click', () => {
    document.querySelector('.nav-links').classList.remove('open');
    openPanel();
  });
  closeBtn.addEventListener('click', closePanel);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closePanel(); });

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      mode = tab.dataset.tab;
      const isSignup = mode === 'signup';
      signupFields.forEach(f => f.style.display = isSignup ? 'block' : 'none');
      submitBtn.textContent = isSignup ? 'Create Account' : 'Sign In';
      note.textContent = "Accounts are powered by Zentap's own login system.";
    });
  });

  function sendToWhatsApp(text) {
    window.open(`https://wa.me/${AUTH_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank');
  }

  // Friendlier text for Firebase's error codes.
  function friendlyAuthError(err) {
    const code = err && err.code;
    const map = {
      'auth/email-already-in-use': 'That email already has an account — try Sign In instead.',
      'auth/invalid-email': 'That email address doesn\'t look right.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with that email — try Create Account instead.',
      'auth/wrong-password': 'That password doesn\'t match this email.',
      'auth/invalid-credential': 'Email or password is incorrect.',
      'auth/too-many-requests': 'Too many attempts — please wait a bit and try again.'
    };
    return map[code] || 'Something went wrong — please try again.';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('auth-name').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;

    // If Firebase hasn't finished loading (or isn't configured), fall back
    // to the WhatsApp handoff rather than leaving the person stuck.
    if (!window.zentapFirebase || !window.zentapFirebase.ready) {
      const text = mode === 'signup'
        ? `Hi Zentap, I'd like to create an account.\nName: ${name}\nEmail: ${email}`
        : `Hi Zentap, I'd like to sign in to my account.\nEmail: ${email}`;
      sendToWhatsApp(text);
      note.textContent = "Thanks! We've opened WhatsApp with your details — send the message and we'll get you set up.";
      return;
    }

    const fb = window.zentapFirebase;
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = mode === 'signup' ? 'Creating account…' : 'Signing in…';
    note.textContent = '';

    try {
      if (mode === 'signup') {
        const cred = await fb.createUserWithEmailAndPassword(fb.auth, email, password);
        if (name) await fb.updateProfile(cred.user, { displayName: name });
        await fb.setDoc(fb.doc(fb.db, 'users', cred.user.uid), {
          name: name || '',
          email: email,
          createdAt: fb.serverTimestamp()
        });
        notifyNewAccountByEmail(name, email);
        note.textContent = `Account created! Welcome, ${name || email}.`;
        form.reset();
      } else {
        const cred = await fb.signInWithEmailAndPassword(fb.auth, email, password);
        note.textContent = `Signed in as ${cred.user.displayName || cred.user.email}.`;
      }
      setTimeout(closePanel, 1400);
    } catch (err) {
      console.error(err);
      note.textContent = friendlyAuthError(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }
  });

  document.querySelectorAll('.auth-social-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const provider = btn.dataset.provider;
      sendToWhatsApp(`Hi Zentap, I'd like to sign up using ${provider}.`);
      note.textContent = `${provider} sign-in is being connected — we've opened WhatsApp so we can set you up personally in the meantime.`;
    });
  });

  // -------------------------------------------------------------------------
  // Logged-in state: swap the profile icon for the person's initial, and
  // swap the panel's content from the Sign In/Create Account form to a
  // simple "who am I, sign out" view whenever someone is actually signed in.
  // -------------------------------------------------------------------------
  const accountView = document.getElementById('account-view');
  const accountAvatar = document.getElementById('account-avatar');
  const accountName = document.getElementById('account-name');
  const accountEmail = document.getElementById('account-email');
  const signOutBtn = document.getElementById('sign-out-btn');
  const authTabs = document.querySelector('.auth-tabs');
  const profileInitial = document.getElementById('nav-profile-initial');

  function applySignedInUI(user) {
    const label = user.displayName || user.email || '?';
    const initial = label.trim().charAt(0).toUpperCase();

    [profileBtn].forEach(btn => {
      if (!btn) return;
      btn.classList.add('is-signed-in');
    });
    if (profileInitial) profileInitial.textContent = initial;

    if (accountAvatar) accountAvatar.textContent = initial;
    if (accountName) accountName.textContent = user.displayName || 'Your Account';
    if (accountEmail) accountEmail.textContent = user.email || '';

    form.hidden = true;
    if (authTabs) authTabs.hidden = true;
    accountView.hidden = false;
  }

  function applySignedOutUI() {
    [profileBtn].forEach(btn => {
      if (!btn) return;
      btn.classList.remove('is-signed-in');
    });

    form.hidden = false;
    if (authTabs) authTabs.hidden = false;
    accountView.hidden = true;
  }

  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      if (!window.zentapFirebase || !window.zentapFirebase.ready) return;
      signOutBtn.disabled = true;
      try {
        await window.zentapFirebase.signOut(window.zentapFirebase.auth);
        closePanel();
      } catch (err) {
        console.error(err);
      } finally {
        signOutBtn.disabled = false;
      }
    });
  }

  function watchAuthState() {
    if (!window.zentapFirebase || !window.zentapFirebase.ready) {
      // Firebase hasn't finished loading yet — try again shortly rather
      // than silently never showing the logged-in state.
      window.addEventListener('zentap-firebase-ready', watchAuthState, { once: true });
      return;
    }
    const fb = window.zentapFirebase;
    fb.onAuthStateChanged(fb.auth, (user) => {
      if (user) applySignedInUI(user);
      else applySignedOutUI();
    });
  }
  watchAuthState();
}

// ---------------------------------------------------------------------------
// Scroll reveal: fades and lifts key elements into place as they enter the
// viewport, staggered slightly within each group. Tagged automatically here,
// so no markup changes are needed. Once an element has finished its entrance
// the reveal classes are removed again, so normal hover effects are untouched.
// ---------------------------------------------------------------------------
function initScrollReveal() {
  const selectors = ['.section-head', '.card', '.theme-card', '.step', '.layer', '.plan',
    '.compare-col', '.mf-item', '.contact-info .item', '.founder-card', '.founder-bio'];
  selectors.forEach(sel => {
    document.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
    });
  });

  const targets = document.querySelectorAll('.reveal');
  if (!targets.length) return;
  if (!('IntersectionObserver' in window)) {
    targets.forEach(el => { el.classList.remove('reveal'); el.style.transitionDelay = ''; });
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('in-view');
      observer.unobserve(el);
      setTimeout(() => {
        el.classList.remove('reveal', 'in-view');
        el.style.transitionDelay = '';
      }, 1200);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  targets.forEach(el => observer.observe(el));
}

document.addEventListener('DOMContentLoaded', async () => {
  await includeHTML('site-header', 'partials/header.html');
  await includeHTML('site-footer', 'partials/footer.html');

  // The header uses backdrop-filter for its sticky blur effect, which
  // (per spec) makes it a containing block for any position:fixed
  // descendant — that would trap the full-screen auth overlay inside the
  // header's own small box instead of covering the viewport. Moving it
  // to be a direct child of <body> avoids that.
  const authOverlay = document.getElementById('auth-overlay');
  if (authOverlay) document.body.appendChild(authOverlay);

  setActiveNavLink();
  wireMobileNav();
  wireBackButton();
  wireAuthPanel();
  initScrollReveal();
});
