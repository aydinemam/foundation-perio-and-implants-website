// Mobile nav toggle
const navToggle = document.getElementById('nav-toggle');
const mainNav = document.getElementById('main-nav');

if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  mainNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mainNav.classList.remove('open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Highlight the current page in the nav
const currentPage = (location.pathname.split('/').pop() || 'index.html');
document.querySelectorAll('nav.main-nav a[href]').forEach((link) => {
  const href = link.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// Header shadow after scrolling past the top
const siteHeader = document.querySelector('header.site-header');
if (siteHeader) {
  const updateHeaderShadow = () => {
    siteHeader.classList.toggle('scrolled', window.scrollY > 12);
  };
  updateHeaderShadow();
  window.addEventListener('scroll', updateHeaderShadow, { passive: true });
}

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) {
  yearEl.textContent = new Date().getFullYear();
}

// Shared form-submit helper: inserts a row into Supabase, with a graceful
// fallback if the backend hasn't been configured yet (see js/supabase-config.js).
async function handleFormSubmit({ form, table, buildRow, successMessage }) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalLabel = submitBtn ? submitBtn.textContent : '';

    if (!window.supabaseClient) {
      alert('Thanks for reaching out! This form is not yet connected to our office system — please call (425) 588-8119 to book directly for now.');
      form.reset();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    const { error } = await window.supabaseClient.from(table).insert([buildRow(new FormData(form))]);

    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
    }

    if (error) {
      console.error(`Supabase insert into "${table}" failed:`, error);
      alert("Sorry, something went wrong sending your message. Please call (425) 588-8119 and we'll help directly.");
      return;
    }

    alert(successMessage);
    form.reset();
  });
}

// General contact form → "leads" table
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  handleFormSubmit({
    form: contactForm,
    table: 'leads',
    successMessage: "Thanks for reaching out! Our team will follow up with you shortly.",
    buildRow: (data) => ({
      name: data.get('name'),
      phone: data.get('phone'),
      email: data.get('email'),
      message: data.get('message'),
    }),
  });
}

// Appointment request form → "appointment_requests" table
const appointmentForm = document.getElementById('appointment-form');
if (appointmentForm) {
  handleFormSubmit({
    form: appointmentForm,
    table: 'appointment_requests',
    successMessage: "Thanks! Your appointment request has been sent — our team will call or email to confirm a time.",
    buildRow: (data) => ({
      name: data.get('name'),
      phone: data.get('phone'),
      email: data.get('email'),
      requested_service: data.get('service'),
      preferred_date: data.get('date') || null,
      preferred_time: data.get('time') || null,
      notes: data.get('notes'),
    }),
  });
}

// Lightweight, privacy-friendly pageview logging (no cookies, no third party)
if (window.supabaseClient) {
  window.supabaseClient.from('page_views').insert([
    { page: location.pathname.split('/').pop() || 'index.html', referrer: document.referrer || null },
  ]).then(({ error }) => {
    if (error) console.warn('Pageview logging failed:', error.message);
  });
}

// Scroll-triggered reveal animations
const revealTargets = document.querySelectorAll('.reveal, .reveal-group');
if (revealTargets.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );
  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add('in-view'));
}
