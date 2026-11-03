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
