// Smooth scroll for nav / footer links
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', function (e) {
    const targetId = this.getAttribute('href');
    const target = document.querySelector(targetId);
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// Simple hero image swap on arrow click (cycles through real foundation photos)
const heroImg = document.querySelector('.hero-image img');
const heroPhotos = [
  'images/gallery/education-books-group.jpeg',
  'images/gallery/food-distribution-1.jpeg',
  'images/gallery/night-relief.jpeg',
  'images/gallery/emergency-relief-elderly.jpeg'
];
let heroIndex = 0;

function updateHeroImage(direction) {
  heroIndex = (heroIndex + direction + heroPhotos.length) % heroPhotos.length;
  heroImg.src = heroPhotos[heroIndex];
}

if (heroImg) {
  document.querySelector('.hero-arrow-right')?.addEventListener('click', () => updateHeroImage(1));
  document.querySelector('.hero-arrow-left')?.addEventListener('click', () => updateHeroImage(-1));

  setInterval(() => {
    updateHeroImage(1);
  }, 5000);
}

// Rotate About section photos every five seconds.
const aboutImg = document.getElementById('aboutImage');
const aboutPhotos = [
  {
    src: 'images/gallery/education-books-girls.jpeg',
    alt: 'Two girls holding donated English grammar books'
  },
  {
    src: 'images/gallery/education-books-boy.jpeg',
    alt: 'A boy holding a donated English grammar book'
  },
  {
    src: 'images/gallery/food-distribution-2.jpeg',
    alt: 'A mother and child receiving essential supplies'
  },
  {
    src: 'images/gallery/healthcare-support.jpeg',
    alt: 'Healthcare outreach and support'
  }
];
let aboutIndex = 0;

if (aboutImg) {
  setInterval(() => {
    aboutIndex = (aboutIndex + 1) % aboutPhotos.length;
    aboutImg.classList.add('is-changing');
    setTimeout(() => {
      aboutImg.src = aboutPhotos[aboutIndex].src;
      aboutImg.alt = aboutPhotos[aboutIndex].alt;
      aboutImg.classList.remove('is-changing');
    }, 250);
  }, 5000);
}

// Highlight active nav link on scroll
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.main-nav a');

window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 120;
    if (window.scrollY >= sectionTop) {
      current = section.getAttribute('id');
    }
  });
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${current}`) {
      link.classList.add('active');
    }
  });
});

// Mobile nav toggle
const navToggle = document.querySelector('.nav-toggle');
const mainNav = document.getElementById('main-navigation');
if (navToggle && mainNav) {
  navToggle.addEventListener('click', () => {
    const expanded = navToggle.getAttribute('aria-expanded') === 'true';
    navToggle.setAttribute('aria-expanded', String(!expanded));
    mainNav.classList.toggle('active');
  });

  // Close menu when a nav link is clicked (mobile)
  mainNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    if (mainNav.classList.contains('active')) {
      mainNav.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  }));
}

// Donation modal behavior
const donateButtons = document.querySelectorAll('.btn-donate');
const donationModal = document.getElementById('donationModal');
const modalBackdrop = donationModal?.querySelector('.modal-backdrop');
const modalClose = donationModal?.querySelector('.modal-close');
const donateForm = document.getElementById('donate-form');
const amountOther = document.getElementById('donor-amount-other');

function openDonationModal() {
  if (!donationModal) return;
  donationModal.setAttribute('aria-hidden', 'false');
  donationModal.classList.add('active');
  // focus first input
  setTimeout(() => document.getElementById('donor-name')?.focus(), 50);
}
function closeDonationModal() {
  if (!donationModal) return;
  donationModal.setAttribute('aria-hidden', 'true');
  donationModal.classList.remove('active');
}

donateButtons.forEach(btn => btn.addEventListener('click', (e) => {
  e.preventDefault();
  openDonationModal();
}));

// Open the donation form when arriving from an external page header button.
if (window.location.hash === '#donate') {
  openDonationModal();
}

modalBackdrop?.addEventListener('click', closeDonationModal);
modalClose?.addEventListener('click', closeDonationModal);
document.querySelectorAll('[data-dismiss="modal"]').forEach(el => el.addEventListener('click', closeDonationModal));

// Show 'other' amount input when chosen
document.querySelectorAll('.amount-options input[name="amount"]').forEach(r => r.addEventListener('change', (e) => {
  if (e.target.value === 'other') {
    amountOther.style.display = 'block';
    amountOther.focus();
  } else {
    amountOther.style.display = 'none';
    amountOther.value = '';
  }
}));

const donationStatus = donationModal?.querySelector('#donation-status');
const donationApiBase = (window.DONATION_API_BASE || 'http://localhost:3000').replace(/\/$/, '');
let donationStatusTimer;

function escapeDonationText(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function showDonationStatus(title, message, type = '') {
  if (!donationStatus) return;
  donationStatus.hidden = false;
  donationStatus.className = `donation-status${type ? ` status-${type}` : ''}`;
  donationStatus.innerHTML = `<h4>${escapeDonationText(title)}</h4><p>${escapeDonationText(message)}</p>`;
}

function showDonationResult(result) {
  if (!donationStatus) return;
  const status = result.status;
  if (status === 'SUCCESS') {
    donationStatus.hidden = false;
    donationStatus.className = 'donation-status status-success';
    donationStatus.innerHTML = `<h4>Donation Successful</h4><p><strong>Donation ID:</strong> ${escapeDonationText(result.donationId)}</p><p><strong>Amount:</strong> ₹${Number(result.amount).toLocaleString('en-IN')}</p><p><strong>Email:</strong> ${escapeDonationText(result.email)}</p>${result.receiptUrl ? `<a class="btn btn-primary" href="${donationApiBase}${result.receiptUrl}" target="_blank" rel="noopener">Download Receipt</a>` : '<p>Your receipt is being prepared and will also be emailed to you.</p>'}`;
    return;
  }
  const labels = { FAILED: ['Payment Failed', 'The payment was not completed. You can close this message and try again.'], CANCELLED: ['Payment Cancelled', 'The payment was cancelled. You can try again whenever you are ready.'], PENDING: ['Payment Pending', 'We are confirming your payment. This page will update automatically.'] };
  const [title, message] = labels[status] || labels.PENDING;
  showDonationStatus(title, message, status === 'FAILED' || status === 'CANCELLED' ? 'error' : '');
}

async function checkDonationStatus(orderId, attempts = 0) {
  try {
    const response = await fetch(`${donationApiBase}/api/donations/orders/${encodeURIComponent(orderId)}/status`);
    if (!response.ok) throw new Error('Unable to retrieve payment status.');
    const result = await response.json();
    showDonationResult(result);
    if (result.status === 'PENDING' && attempts < 20) {
      donationStatusTimer = window.setTimeout(() => checkDonationStatus(orderId, attempts + 1), 3000);
    }
  } catch (error) {
    showDonationStatus('Payment Status Unavailable', error.message, 'error');
  }
}

donateForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitButton = donateForm.querySelector('button[type="submit"]');
  const formData = new FormData(donateForm);
  const selectedAmount = formData.get('amount');
  const amount = selectedAmount === 'other' ? formData.get('amount_other') : selectedAmount;
  const mobile = String(formData.get('mobile') || '').trim();
  if (!formData.get('name') || !donateForm.querySelector('[name="email"]')?.checkValidity() || !/^\+?[0-9][0-9\s-]{9,18}$/.test(mobile) || !Number.isInteger(Number(amount)) || Number(amount) < 1 || Number(amount) > 1000000) {
    showDonationStatus('Check your details', 'Enter a valid name, email, mobile number and donation amount between ₹1 and ₹10,00,000.', 'error');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Starting secure checkout...';
  showDonationStatus('Processing Payment', 'Connecting securely to Cashfree. Please do not close this window.');
  try {
    const response = await fetch(`${donationApiBase}/api/donations/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.get('name'), email: formData.get('email'), mobile, amount: Number(amount) })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Unable to start payment.');
    if (!window.Cashfree) throw new Error('Cashfree Checkout could not be loaded. Please try again.');
    const cashfree = window.Cashfree({ mode: 'production' });
    await cashfree.checkout({ paymentSessionId: result.paymentSessionId, redirectTarget: '_self' });
  } catch (error) {
    showDonationStatus('Payment Could Not Start', error.message, 'error');
    submitButton.disabled = false;
    submitButton.textContent = 'Proceed to Pay';
  }
});

const returnOrderId = new URLSearchParams(window.location.search).get('order_id');
if (returnOrderId && new URLSearchParams(window.location.search).get('donation_status') === 'return') {
  openDonationModal();
  showDonationStatus('Checking Payment', 'Confirming your payment with Cashfree.');
  checkDonationStatus(returnOrderId);
}

// Volunteer modal behavior
const volunteerButtons = document.querySelectorAll('.btn-volunteer');
const volunteerModal = document.getElementById('volunteerModal');
const volunteerBackdrop = volunteerModal?.querySelector('.modal-backdrop');
const volunteerClose = volunteerModal?.querySelector('.modal-close');
const volunteerForm = document.getElementById('volunteer-form');

function openVolunteerModal() {
  if (!volunteerModal) return;
  volunteerModal.setAttribute('aria-hidden', 'false');
  volunteerModal.classList.add('active');
  setTimeout(() => document.getElementById('vol-name')?.focus(), 50);
}
function closeVolunteerModal() {
  if (!volunteerModal) return;
  volunteerModal.setAttribute('aria-hidden', 'true');
  volunteerModal.classList.remove('active');
}



volunteerBackdrop?.addEventListener('click', closeVolunteerModal);
volunteerClose?.addEventListener('click', closeVolunteerModal);
document.querySelectorAll('[data-dismiss="modal"]').forEach(el => el.addEventListener('click', () => { closeDonationModal(); closeVolunteerModal(); }));

volunteerForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(volunteerForm);
  if (!fd.get('name') || !fd.get('email') || !fd.get('mobile') || !fd.get('interest')) {
    alert('Please fill in your name, email, mobile and area of interest.');
    return;
  }
  closeVolunteerModal();
  alert('Thanks ' + fd.get('name') + '!\nWe have received your volunteer request. We will contact you soon.');
  volunteerForm.reset();
});

// ===== Gallery slider (auto-playing, with dots + arrows) =====
(function () {
  const track = document.getElementById('sliderTrack');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.slide'));
  const dotsWrap = document.getElementById('sliderDots');
  let current = 0;
  let timer = null;

  // Build dots
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Go to photo ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('.dot'));

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAutoplay() {
    stopAutoplay();
    timer = setInterval(next, 4000);
  }
  function stopAutoplay() {
    if (timer) clearInterval(timer);
  }

  document.querySelector('.slider-arrow-right')?.addEventListener('click', () => { next(); startAutoplay(); });
  document.querySelector('.slider-arrow-left')?.addEventListener('click', () => { prev(); startAutoplay(); });

  const sliderEl = document.getElementById('gallerySlider');
  sliderEl?.addEventListener('mouseenter', stopAutoplay);
  sliderEl?.addEventListener('mouseleave', startAutoplay);

  startAutoplay();
})();

// ===== Full gallery hero slider =====
(function () {
  const track = document.getElementById('galleryHeroTrack');
  if (!track) return;

  const slides = Array.from(track.querySelectorAll('.gallery-hero-slide'));
  const dotsWrap = document.getElementById('galleryHeroDots');
  let current = 0;
  let timer = null;

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = index === 0 ? 'active' : '';
    dot.setAttribute('aria-label', 'Show featured photo ' + (index + 1));
    dot.addEventListener('click', () => goTo(index));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.querySelectorAll('button'));

  function goTo(index) {
    slides[current].classList.remove('active');
    dots[current].classList.remove('active');
    current = (index + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
  }
  function restart() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 5000);
  }

  document.querySelector('.gallery-hero-arrow-right')?.addEventListener('click', () => { goTo(current + 1); restart(); });
  document.querySelector('.gallery-hero-arrow-left')?.addEventListener('click', () => { goTo(current - 1); restart(); });
  restart();
})();

// ===== Impact counters and independent measurement bars =====
(function () {
  const impact = document.querySelector('.impact-section');
  if (!impact) return;

  const cards = Array.from(impact.querySelectorAll('.impact-card'));
  const numbers = Array.from(impact.querySelectorAll('.impact-number'));
  const bars = Array.from(impact.querySelectorAll('.impact-bar-row'));
  let started = false;

  function countNumber(number) {
    const target = Number(number.dataset.target);
    const value = number.querySelector('span');
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      value.textContent = Math.floor(target * eased);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function startImpact() {
    if (started) return;
    started = true;
    cards.forEach((card, index) => {
      card.style.animationDelay = `${index * 100}ms`;
      card.classList.add('is-visible');
    });
    numbers.forEach(countNumber);
    bars.forEach((bar, index) => {
      bar.style.setProperty('--bar-scale', bar.dataset.barScale);
      bar.style.animationDelay = `${index * 100}ms`;
      bar.classList.add('is-visible');
    });
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some(entry => entry.isIntersecting)) {
      startImpact();
      observer.disconnect();
    }
  }, { threshold: .2 });
  observer.observe(impact);
})();
