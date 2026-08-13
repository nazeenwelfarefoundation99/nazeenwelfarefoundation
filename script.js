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

document.querySelector('.hero-arrow-right')?.addEventListener('click', () => updateHeroImage(1));
document.querySelector('.hero-arrow-left')?.addEventListener('click', () => updateHeroImage(-1));

setInterval(() => {
  updateHeroImage(1);
}, 5000);

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

// Simple form submit handler (placeholder for real payment integration)
donateForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  let amount = formData.get('amount');
  if (amount === 'other') amount = formData.get('amount_other');
  // Basic validation
  if (!formData.get('name') || !formData.get('email') || !formData.get('mobile') || !amount || Number(amount) <= 0 || !formData.get('method')) {
    alert('Please complete all required fields and select an amount and payment method.');
    return;
  }

  // Simulate submission
  closeDonationModal();
  alert('Thank you, ' + formData.get('name') + '!\nYou chose to donate ₹' + amount + ' via ' + formData.get('method') + '.\nWe will redirect you to the payment gateway.');
  // TODO: integrate with a real payment gateway / redirect here.
});

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
