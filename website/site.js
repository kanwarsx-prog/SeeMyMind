const menuButton = document.querySelector('.menu');
const siteNav = document.querySelector('.site-nav');

if (menuButton && siteNav) {
  menuButton.setAttribute('aria-expanded', 'false');

  menuButton.addEventListener('click', () => {
    const isOpen = siteNav.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
    menuButton.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu');
    menuButton.textContent = isOpen ? '\u00D7' : '\u2630';
  });

  siteNav.addEventListener('click', (event) => {
    if (event.target.closest('a')) {
      siteNav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Open menu');
      menuButton.textContent = '\u2630';
    }
  });
}

const footerLinks = document.querySelector('.footer-links');
if (footerLinks && !footerLinks.querySelector('a[href="privacy.html"]')) {
  footerLinks.insertAdjacentHTML('beforeend', '<a href="privacy.html">Privacy statement</a>');
}

const cookieChoiceKey = 'seemymind-cookie-notice';
if (!localStorage.getItem(cookieChoiceKey)) {
  const cookieBanner = document.createElement('aside');
  cookieBanner.className = 'cookie-banner';
  cookieBanner.setAttribute('aria-label', 'Cookie notice');
  cookieBanner.innerHTML = '<div><strong>Privacy and cookies</strong><p>We use essential browser storage to remember that you have seen this notice. We do not currently use analytics or advertising cookies. <a href="privacy.html">Read our privacy statement</a>.</p></div><button type="button" class="button">Got it</button>';
  document.body.appendChild(cookieBanner);
  cookieBanner.querySelector('button').addEventListener('click', () => {
    localStorage.setItem(cookieChoiceKey, 'acknowledged');
    cookieBanner.remove();
  });
}

const isHomepage = location.pathname.split('/').pop() === 'index.html' || location.pathname.endsWith('/');
if (isHomepage) {
  const main = document.querySelector('main');
  if (main) {
    main.insertAdjacentHTML('afterbegin', '<section class="home-video" aria-labelledby="home-video-title"><div class="wrap"><div class="home-video-card"><div class="home-video-intro"><p class="eyebrow">See My Mind in practice</p><h2 id="home-video-title">A clearer picture starts with listening.</h2></div><video controls playsinline preload="metadata" poster="assets/luca-whole-picture.png"><source src="assets/See%20My%20Mind.mp4" type="video/mp4">Your browser does not support embedded video. <a href="assets/See%20My%20Mind.mp4">Watch the video</a>.</video></div></div></section>');
  }
}

const pageVisuals = {
  'product.html': {
    eyebrow: 'One living picture',
    title: 'The pieces become useful when they connect.',
    image: 'assets/illustrations/product-picture.png',
    alt: 'Watercolour collage of Luca surrounded by connected moments from home, school and daily life.'
  },
  'for-schools.html': {
    eyebrow: 'Context in the classroom',
    title: 'Support can arrive before the hard moment.',
    image: 'assets/illustrations/schools-context.png',
    alt: 'Watercolour collage of Luca arriving at school with adults and classroom support ready around him.'
  },
  'for-parents.html': {
    eyebrow: 'Home context matters',
    title: 'What happens before school belongs in the picture.',
    image: 'assets/illustrations/parents-handover.png',
    alt: 'Watercolour collage of Luca sharing a quiet morning handover with his parent before school.'
  },
  'our-mission.html': {
    eyebrow: 'Every child is a beginning',
    title: 'A child’s story is bigger than any single moment.',
    image: 'assets/illustrations/mission-story.png',
    alt: 'Watercolour collage of Luca and his parent beneath a tree made from connected scenes of his life.'
  }
};

const currentPage = location.pathname.split('/').pop() || 'index.html';
const visual = pageVisuals[currentPage];
const hero = document.querySelector('main > .hero');
if (visual && hero) {
  const heroWrap = hero.querySelector('.wrap');
  const heroCopy = document.createElement('div');
  heroCopy.className = 'hero-copy';
  while (heroWrap.firstChild) {
    heroCopy.appendChild(heroWrap.firstChild);
  }
  heroWrap.classList.add('hero-grid');
  heroWrap.appendChild(heroCopy);
  heroWrap.insertAdjacentHTML('beforeend', `<div class="hero-art"><img src="${visual.image}" alt="${visual.alt}"></div>`);
}
