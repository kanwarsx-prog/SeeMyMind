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

const ecosystem = document.getElementById('product-ecosystem');
if (ecosystem) {
  const icons = {
    voice: '<path d="M5 6h14v9H10l-4 3v-3H5z"/><path d="M9 10.5h.01M12 10.5h.01M15 10.5h.01"/>',
    home: '<path d="M4 11l8-6 8 6"/><path d="M6 10v9h12v-9"/><path d="M10 19v-5h4v5"/>',
    teacher: '<path d="M4 6h7a2 2 0 0 1 2 2v11a2 2 0 0 0-2-2H4z"/><path d="M20 6h-5a2 2 0 0 0-2 2v11a2 2 0 0 1 2-2h5z"/>',
    support: '<path d="M12 20s-7-4.3-7-9.5A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.5C19 15.7 12 20 12 20z"/>',
    history: '<path d="M4 19V5"/><path d="M4 19h16"/><path d="M8 15l3-4 3 2 5-6"/>',
    specialist: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>'
  };
  const perspectives = [
    {id:'voice', label:'The child', name:'The child', color:'#e8745e', where:'In class · tablet', tag:'their own voice', shares:['How they feel today','What helps and what does not','Their own words, in their own way'], sees:['Their support toolkit','Calm-down and self-advocacy tools']},
    {id:'home', label:'Parent', name:'Parent or guardian', color:'#d99c35', where:'At home · phone', tag:'home context', shares:['Morning check-in: sleep, breakfast, mood','Worries before the school day','What works at home'], sees:['End-of-day summaries','What helped at school today']},
    {id:'teacher', label:'Teacher', name:'Class teacher', color:'#1d625d', where:'Classroom · laptop', tag:'school observations', shares:['Classroom observations','What happened before and after','Transitions and changes'], sees:['What matters for this child today','Strategies that are working']},
    {id:'support', label:'Support', name:'Teaching assistant', color:'#82a87f', where:'Alongside the child · tablet', tag:'support in the moment', shares:['Support actions as they happen','Early signs and triggers'], sees:['The support plan','Triggers and adjustments']},
    {id:'history', label:'SENCO', name:'SENCO', color:'#596aa4', where:'School office · laptop', tag:'support history', shares:['Reviews and decisions','Next steps for the plan'], sees:['Patterns over time','Evidence for plans and meetings']},
    {id:'specialist', label:'Specialist', name:'Specialist practitioner', color:'#1d625d', where:'Visiting · laptop', tag:'expert insight', shares:['Assessments','Recommendations'], sees:['Everyday context between visits','Whether strategies are working']}
  ];
  const center = 300;
  const radius = 215;
  const positions = perspectives.map((item, index) => {
    const angle = -Math.PI / 2 + index * (2 * Math.PI / perspectives.length);
    return {x:center + radius * Math.cos(angle), y:center + radius * Math.sin(angle)};
  });
  const svg = ecosystem.querySelector('svg');
  const chords = document.getElementById('ecosystem-chords');
  const spokes = document.getElementById('ecosystem-spokes');
  const links = [[1,2],[2,3],[3,4],[4,5],[1,4],[0,3],[2,4],[0,1],[1,5]];
  const svgElement = (tag, attributes) => { const element = document.createElementNS('http://www.w3.org/2000/svg', tag); Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value)); return element; };
  links.forEach(([from, to]) => {
    const a = positions[from];
    const b = positions[to];
    const midpointX = (a.x + b.x) / 2;
    const midpointY = (a.y + b.y) / 2;
    const controlX = midpointX + (center - midpointX) * .35;
    const controlY = midpointY + (center - midpointY) * .35;
    const path = svgElement('path', {class:'ecosystem-chord', d:`M${a.x} ${a.y}Q${controlX} ${controlY} ${b.x} ${b.y}`});
    path.dataset.from = from;
    path.dataset.to = to;
    chords.appendChild(path);
  });
  positions.forEach((point, index) => {
    const path = svgElement('path', {class:'ecosystem-spoke', d:`M${point.x} ${point.y}Q${(point.x + center) / 2} ${(point.y + center) / 2} ${center} ${center}`, id:`ecosystem-spoke-${index}`});
    spokes.appendChild(path);
  });
  const detail = document.getElementById('ecosystem-detail');
  const buttons = perspectives.map((perspective, index) => {
    const button = document.createElement('button');
    button.className = 'ecosystem-node';
    button.style.left = `${positions[index].x / 6}%`;
    button.style.top = `${positions[index].y / 6}%`;
    button.style.setProperty('--node-color', perspective.color);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = `<span class="node-dot"><svg viewBox="0 0 24 24" aria-hidden="true">${icons[perspective.id]}</svg></span><span class="node-label">${perspective.label}</span>`;
    button.addEventListener('click', () => selectPerspective(index));
    ecosystem.appendChild(button);
    return button;
  });
  function selectPerspective(index) {
    const perspective = perspectives[index];
    buttons.forEach((button, buttonIndex) => button.setAttribute('aria-pressed', String(buttonIndex === index)));
    ecosystem.querySelectorAll('.ecosystem-spoke').forEach((spoke, spokeIndex) => spoke.classList.toggle('on', spokeIndex === index));
    ecosystem.querySelectorAll('.ecosystem-chord').forEach((chord) => chord.classList.toggle('on', Number(chord.dataset.from) === index || Number(chord.dataset.to) === index));
    detail.style.setProperty('--detail-color', perspective.color);
    detail.innerHTML = `<span class="detail-where"><i></i>${perspective.where}</span><h3>${perspective.name}</h3><p class="detail-tag">brings ${perspective.tag}</p><div class="ecosystem-cols"><div><h4>Shares</h4><ul>${perspective.shares.map(item => `<li>${item}</li>`).join('')}</ul></div><div><h4>Sees</h4><ul>${perspective.sees.map(item => `<li>${item}</li>`).join('')}</ul></div></div><p class="detail-hint">Each person sees what their role needs. Every piece joins the same picture of the child.</p>`;
  }
  selectPerspective(0);
}
