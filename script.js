/* ===========================================================================
   ORI KOPITZ — PORTFOLIO SCRIPT
   GSAP + ScrollTrigger + ScrollToPlugin
   =========================================================================== */

gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

/* ---------------------------------------------------------------------------
   0. CONSTANTS / HELPERS
   --------------------------------------------------------------------------- */
const MAIN_SHOWREEL_VIMEO_ID = '1206192471';

const reduceMotion  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/* Detect touch / mobile — used to choose between GSAP and native scroll APIs */
const isTouchDevice = () => ('ontouchstart' in window || navigator.maxTouchPoints > 0);

function vimeoBackgroundUrl(id){
  // muted / no-controls / looping — used for all background & hover loops
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&app_id=122963`;
}
function vimeoPlaybackUrl(id){
  // standard player with controls + sound — used for Project View & Lightbox
  return `https://player.vimeo.com/video/${id}?autoplay=1&app_id=122963`;
}
function buildIframe({ src, title }){
  const iframe = document.createElement('iframe');
  iframe.src = src;
  iframe.title = title || 'Vimeo video player';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
  iframe.setAttribute('loading', 'lazy');
  return iframe;
}
function getHeaderHeight(){
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 92;
}

const heroVideoIframe = document.querySelector('.hero-video');
let heroPlayer = null;
try {
  if (window.Vimeo && heroVideoIframe){
    heroPlayer = new Vimeo.Player(heroVideoIframe);
  }
} catch (err) {
  heroPlayer = null;
}
function resumeHeroVideo(){
  if (heroPlayer && typeof heroPlayer.play === 'function'){
    heroPlayer.play().catch(() => {}); // muted background loop — safe to resume any time
  }
}

/* ---------------------------------------------------------------------------
   1. DOM REFERENCES
   --------------------------------------------------------------------------- */
const loaderEl            = document.getElementById('loader');
const siteHeader          = document.getElementById('siteHeader');
const brandLink           = document.getElementById('brandLink');
const showreelNavBtn      = document.getElementById('showreelNavBtn');
const infoNavBtn          = document.getElementById('infoNavBtn');
const workNavLink         = document.querySelector('[data-scroll-link="features"]');
const scrollCueBtn        = document.getElementById('scrollCueBtn');

const featuresGrid        = document.getElementById('featuresGrid');
const axisColumn          = document.getElementById('axisColumn');
const axisFill            = document.getElementById('axisFill');
const axisTicks           = document.getElementById('axisTicks');
const projectCards        = Array.from(document.querySelectorAll('.project-card'));

const viewWipe            = document.getElementById('viewWipe');

const projectView         = document.getElementById('projectView');
const projectBackBtn      = document.getElementById('projectBackBtn');
const projectViewIndex    = document.getElementById('projectViewIndex');
const projectViewTitle    = document.getElementById('projectViewTitle');
const projectViewVideo    = document.getElementById('projectViewVideo');
const projectViewDesc     = document.getElementById('projectViewDesc');

const showreelView            = document.getElementById('showreelView');
const showreelBg              = document.getElementById('showreelBg');
const showreelCloseBtn        = document.getElementById('showreelCloseBtn');
const showreelPlayBtn         = document.getElementById('showreelPlayBtn');
const showreelScrollCueBtn    = document.getElementById('showreelScrollCueBtn');
const showreelDetails         = document.getElementById('showreelDetails');
const showreelLightbox        = document.getElementById('showreelLightbox');
const showreelLightboxVideo   = document.getElementById('showreelLightboxVideo');
const showreelLightboxCloseBtn = document.getElementById('showreelLightboxCloseBtn');

const infoOverlay         = document.getElementById('infoOverlay');
const infoCloseBtn        = document.getElementById('infoCloseBtn');
const infoRevealEls       = document.querySelectorAll('.info-reveal');

const backToTopBtn        = document.getElementById('backToTopBtn');

let savedHomeScrollY = 0;

/* ---------------------------------------------------------------------------
   2. SMOOTH SCROLL (ScrollToPlugin) — header "Work" link + hero arrow
   --------------------------------------------------------------------------- */
function smoothScrollTo(target, offset = 0){
  /*
   * GSAP's gsap.to(window, { scrollTo }) is unreliable on iOS Safari —
   * fall back to the native scrollTo API on all touch devices.
   */
  if (isTouchDevice()) {
    let y = 0;
    if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el) y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
    } else {
      y = Number(target) || 0;
    }
    /*
     * Smooth scroll for all targets including back-to-top (y === 0).
     * The "Features bleed" issue that previously required behavior:'instant'
     * is now prevented in CSS via .hero { min-height: 100lvh }, which
     * guarantees Features never appear at scrollTop 0 regardless of browser-bar
     * state — so a graceful smooth animation is safe here.
     */
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
    return;
  }
  gsap.to(window, {
    duration: reduceMotion ? 0.01 : 1.15,
    ease: 'power3.inOut',
    scrollTo: { y: target, offsetY: offset, autoKill: true }
  });
}

if (workNavLink){
  workNavLink.addEventListener('click', (e) => {
    e.preventDefault();
    smoothScrollTo('#features', 0);
  });
}
scrollCueBtn.addEventListener('click', () => smoothScrollTo('#features', 0));

brandLink.addEventListener('click', (e) => {
  e.preventDefault();
  smoothScrollTo(0, 0);
});

/* ---------------------------------------------------------------------------
   3. HERO INTRO REVEAL
   --------------------------------------------------------------------------- */
function playHeroIntro(){
  gsap.to('.scroll-cue', { opacity: 1, duration: reduceMotion ? 0.01 : 0.8, delay: 0.4, ease: 'power2.out' });
}

/* ---------------------------------------------------------------------------
   4. CENTRAL AXIS — fine fill-line is permanently static/solid (no scrub);
      horizontal ticks connect the wide cream column to each card's center
   --------------------------------------------------------------------------- */
function layoutAxisTicks(){
  axisTicks.innerHTML = '';
  if (window.innerWidth < 600) return; // column/ticks are hidden at this breakpoint (CSS)

  const gridRect = featuresGrid.getBoundingClientRect();
  const colRect  = axisColumn.getBoundingClientRect();

  projectCards.forEach((card) => {
    const cardRect = card.getBoundingClientRect();
    // offsetTop/offsetHeight are layout-based and unaffected by the card's
    // reveal transform (translateY), unlike getBoundingClientRect().top —
    // this keeps ticks accurate even before a card has scrolled into view.
    const centerY = card.offsetTop + (card.offsetHeight / 2);

    const tick = document.createElement('div');
    tick.className = 'axis-tick';
    tick.style.top = `${centerY}px`;

    if (cardRect.left >= colRect.right){
      // card sits to the right of the column
      tick.style.left  = `${colRect.right - gridRect.left}px`;
      tick.style.width = `${cardRect.left - colRect.right}px`;
    } else {
      // card sits to the left of the column
      tick.style.left  = `${cardRect.right - gridRect.left}px`;
      tick.style.width = `${colRect.left - cardRect.right}px`;
    }
    axisTicks.appendChild(tick);
  });
}

/* ---------------------------------------------------------------------------
   5. PROJECT CARD REVEALS — premium stagger the moment each enters view
   --------------------------------------------------------------------------- */
if (reduceMotion){
  gsap.set(projectCards, { opacity: 1, y: 0 });
} else {
  ScrollTrigger.batch('.project-card', {
    start: 'top 87%',
    onEnter: (batch) => gsap.to(batch, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.15, overwrite: true
    }),
    onLeaveBack: (batch) => gsap.to(batch, {
      opacity: 0, y: 50, duration: 0.4, ease: 'power2.in', overwrite: true
    })
  });
}

/* ---------------------------------------------------------------------------
   6. HOVER PREVIEW + CLICK — whole-card hover swaps each iframe's src to
      play muted from the start; whole-card click opens the project view
   --------------------------------------------------------------------------- */
function vimeoCleanUrl(id){
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=0&controls=0&title=0&byline=0`;
}
function vimeoHoverPreviewUrl(id){
  return `https://player.vimeo.com/video/${id}?background=1&autoplay=1&loop=1&muted=1&controls=0&title=0&byline=0`;
}

projectCards.forEach((card) => {
  const iframe = card.querySelector('.project-iframe');
  const vimeoId = card.dataset.vimeo;
  const cleanSrc = vimeoCleanUrl(vimeoId);
  const hoverSrc = vimeoHoverPreviewUrl(vimeoId);

  card.addEventListener('mouseenter', () => {
    iframe.src = hoverSrc;
  });

  card.addEventListener('mouseleave', () => {
    iframe.src = cleanSrc; // stops playback + restores Vimeo's native thumbnail
  });

  card.addEventListener('click', () => openProjectView(card));
});

/* ---------------------------------------------------------------------------
   7. PROJECT VIEW — page-wipe transition into a dedicated project state
   --------------------------------------------------------------------------- */
function openProjectView(card){
  savedHomeScrollY = window.scrollY;

  const title   = card.dataset.title;
  const vimeoId = card.dataset.vimeo;
  const index   = card.dataset.index;
  const descTpl = card.querySelector('.project-description');

  const wipeDur = reduceMotion ? 0.01 : 0.4;
  const revealDur = reduceMotion ? 0.01 : 0.6;

  gsap.timeline()
    .set(viewWipe, { pointerEvents: 'auto' })
    .to(viewWipe, { opacity: 1, duration: wipeDur, ease: 'power2.in' })
    .add(() => {
      projectViewTitle.textContent = title;
      projectViewIndex.textContent = `${index} / 18`;
      projectViewDesc.innerHTML = descTpl ? descTpl.innerHTML : '';

      projectViewVideo.innerHTML = '';
      projectViewVideo.appendChild(buildIframe({
        src: vimeoPlaybackUrl(vimeoId),
        title: `${title} — full project video`
      }));

      window.scrollTo(0, 0);
      projectView.scrollTop = 0;
      projectView.classList.add('is-open');
      gsap.set(projectView, { opacity: 1 });
      document.body.classList.add('lock-scroll');
    })
    .to(viewWipe, { opacity: 0, duration: revealDur, ease: 'power2.out', delay: 0.05 })
    .set(viewWipe, { pointerEvents: 'none' });
}

function closeProjectView(){
  const wipeDur = reduceMotion ? 0.01 : 0.4;
  const revealDur = reduceMotion ? 0.01 : 0.55;

  gsap.timeline()
    .set(viewWipe, { pointerEvents: 'auto' })
    .to(viewWipe, { opacity: 1, duration: wipeDur, ease: 'power2.in' })
    .add(() => {
      projectViewVideo.innerHTML = ''; // stop playback + audio
      projectView.classList.remove('is-open');
      gsap.set(projectView, { opacity: 0 });
      document.body.classList.remove('lock-scroll');
      window.scrollTo(0, savedHomeScrollY); // return to exact homepage position
      resumeHeroVideo();
    })
    .to(viewWipe, { opacity: 0, duration: revealDur, ease: 'power2.out', delay: 0.05 })
    .set(viewWipe, { pointerEvents: 'none' });
}

projectBackBtn.addEventListener('click', closeProjectView);

/* ---------------------------------------------------------------------------
   8. SHOWREEL VIEW + LIGHTBOX
   --------------------------------------------------------------------------- */
function openShowreel(){
  showreelBg.innerHTML = '';
  showreelBg.appendChild(buildIframe({
    src: vimeoBackgroundUrl(MAIN_SHOWREEL_VIMEO_ID),
    title: 'Showreel background loop'
  }));

  showreelView.classList.add('is-open');
  document.body.classList.add('lock-scroll');
  gsap.fromTo(showreelView, { opacity: 0 }, { opacity: 1, duration: reduceMotion ? 0.01 : 0.6, ease: 'power2.out' });
}

function closeShowreel(){
  if (showreelLightbox.classList.contains('is-open')) closeLightbox();

  gsap.to(showreelView, {
    opacity: 0,
    duration: reduceMotion ? 0.01 : 0.5,
    ease: 'power2.in',
    onComplete: () => {
      showreelView.classList.remove('is-open');
      showreelBg.innerHTML = '';
      showreelView.scrollTop = 0; // reset so it reopens on the first screen next time
      document.body.classList.remove('lock-scroll');
      resumeHeroVideo();
    }
  });
}

const showreelScreenEl = document.querySelector('.showreel-screen');
const showreelBackToTopBtn = document.getElementById('showreelBackToTopBtn');

function scrollToShowreelDetails(){
  /* Fix 4 — landscape: scroll to the START of the description text block
     (showreelDetails.offsetTop) so the first line is immediately visible,
     instead of jumping to the absolute bottom which skips the beginning. */
  const isLandscape = window.matchMedia('(max-width: 950px) and (orientation: landscape)').matches;
  if (isLandscape && showreelDetails) {
    showreelView.scrollTo({
      top: showreelDetails.offsetTop,
      behavior: reduceMotion ? 'auto' : 'smooth'
    });
    return;
  }

  const maxScroll = showreelView.scrollHeight - showreelView.clientHeight;
  /*
   * Mobile: GSAP's scrollTo on a position:fixed overflow container is
   * unreliable on iOS. element.scrollTo() with behavior:'smooth' is rock-solid.
   * CSS ensures details+footer together fit in one viewport so scrolling to
   * maxScroll makes the entire text block AND the back-to-top arrow visible.
   */
  if (isTouchDevice()) {
    showreelView.scrollTo({ top: maxScroll, behavior: reduceMotion ? 'auto' : 'smooth' });
    return;
  }
  gsap.to(showreelView, {
    duration: reduceMotion ? 0.01 : 1.1,
    ease: 'power3.inOut',
    scrollTo: { y: maxScroll, offsetY: 0 } // absolute bottom — fully frames the text + back-to-top arrow
  });
}

function scrollToShowreelTop(){
  /* Mobile: native element.scrollTo for reliable cross-browser behaviour */
  if (isTouchDevice()) {
    showreelView.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    return;
  }
  gsap.to(showreelView, {
    duration: reduceMotion ? 0.01 : 1.1,
    ease: 'power3.inOut',
    scrollTo: { y: 0, offsetY: 0 }
  });
}

function openLightbox(){
  showreelLightboxVideo.innerHTML = '';
  showreelLightboxVideo.appendChild(buildIframe({
    src: vimeoPlaybackUrl(MAIN_SHOWREEL_VIMEO_ID),
    title: 'Showreel — full video with sound'
  }));
  showreelLightbox.classList.add('is-open');
  gsap.fromTo(showreelLightbox, { opacity: 0 }, { opacity: 1, duration: reduceMotion ? 0.01 : 0.45, ease: 'power2.out' });
}

function closeLightbox(){
  gsap.to(showreelLightbox, {
    opacity: 0,
    duration: reduceMotion ? 0.01 : 0.35,
    ease: 'power2.in',
    onComplete: () => {
      showreelLightbox.classList.remove('is-open');
      showreelLightboxVideo.innerHTML = ''; // stop playback + audio
    }
  });
}

showreelNavBtn.addEventListener('click', openShowreel);
showreelCloseBtn.addEventListener('click', closeShowreel);
showreelPlayBtn.addEventListener('click', openLightbox);
showreelScrollCueBtn.addEventListener('click', scrollToShowreelDetails);
showreelBackToTopBtn.addEventListener('click', scrollToShowreelTop);
showreelLightboxCloseBtn.addEventListener('click', closeLightbox);

showreelLightbox.addEventListener('click', (e) => {
  if (e.target === showreelLightbox) closeLightbox(); // backdrop only — not the video box
});

/* ---------------------------------------------------------------------------
   9. INFO OVERLAY — clean slide-open panel with staggered text reveal
   --------------------------------------------------------------------------- */
function openInfo(){
  infoOverlay.classList.add('is-open');
  infoOverlay.scrollTop = 0; /* reset to top every time so content is never pre-scrolled */
  document.body.classList.add('lock-scroll');
  gsap.set(infoOverlay, { opacity: 1 });

  gsap.fromTo(infoOverlay,
    { clipPath: 'inset(0% 0% 100% 0%)' },
    { clipPath: 'inset(0% 0% 0% 0%)', duration: reduceMotion ? 0.01 : 0.85, ease: 'power3.inOut' }
  );

  gsap.to(infoRevealEls, {
    opacity: 1, y: 0,
    duration: reduceMotion ? 0.01 : 0.7,
    ease: 'power3.out',
    stagger: reduceMotion ? 0 : 0.08,
    delay: reduceMotion ? 0 : 0.35
  });
}

function closeInfo(){
  gsap.to(infoRevealEls, {
    opacity: 0, y: 22,
    duration: reduceMotion ? 0.01 : 0.3,
    ease: 'power2.in',
    stagger: reduceMotion ? 0 : 0.03
  });

  gsap.to(infoOverlay, {
    clipPath: 'inset(0% 0% 100% 0%)',
    duration: reduceMotion ? 0.01 : 0.6,
    ease: 'power3.inOut',
    delay: reduceMotion ? 0 : 0.15,
    onComplete: () => {
      infoOverlay.classList.remove('is-open');
      gsap.set(infoOverlay, { opacity: 0 });
      document.body.classList.remove('lock-scroll');
      resumeHeroVideo();
    }
  });
}

infoNavBtn.addEventListener('click', openInfo);
infoCloseBtn.addEventListener('click', closeInfo);

/* ---------------------------------------------------------------------------
   10. BACK TO TOP — fades in once the Hero has scrolled past
   --------------------------------------------------------------------------- */
ScrollTrigger.create({
  trigger: '#hero',
  start: 'bottom top',
  onEnter:     () => backToTopBtn.classList.add('is-visible'),
  onLeaveBack: () => backToTopBtn.classList.remove('is-visible')
});

backToTopBtn.addEventListener('click', () => {
  if (isTouchDevice()) {
    /* FIX: native smooth scroll to absolute top origin on mobile */
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
    resumeHeroVideo();
    return;
  }
  smoothScrollTo(0, 0);
  resumeHeroVideo();
});

/* ---------------------------------------------------------------------------
   11. ESCAPE KEY — closes whichever overlay is currently open
   --------------------------------------------------------------------------- */
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (projectView.classList.contains('is-open'))      closeProjectView();
  else if (showreelLightbox.classList.contains('is-open')) closeLightbox();
  else if (showreelView.classList.contains('is-open'))     closeShowreel();
  else if (infoOverlay.classList.contains('is-open'))      closeInfo();
});

/* ---------------------------------------------------------------------------
   12. LOAD / RESIZE HOUSEKEEPING
   --------------------------------------------------------------------------- */
window.addEventListener('load', () => {
  playHeroIntro();

  gsap.to(loaderEl, {
    opacity: 0,
    duration: reduceMotion ? 0.01 : 0.6,
    delay: 0.15,
    onComplete: () => loaderEl.remove()
  });

  ScrollTrigger.refresh();
  layoutAxisTicks();
});

let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    ScrollTrigger.refresh();
    layoutAxisTicks();
  }, 200);
});
