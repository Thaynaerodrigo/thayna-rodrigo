const book = document.getElementById('book');
const bookScene = document.querySelector('.book-scene');
const coverImage = document.querySelector('#page-cover .front img');
const pages = Array.from(document.querySelectorAll('.page'));
const seal = document.getElementById('openCover');
const musica = document.getElementById('musica');
const btnMusica = document.getElementById('btnMusica');

let activeIndex = 0;
let isAnimating = false;
let flippingPage = null;
let hiddenPage = null;

function resizeBook() {
  if (!coverImage.naturalWidth || !coverImage.naturalHeight) return;

  const imageRatio = coverImage.naturalWidth / coverImage.naturalHeight;
  const isMobile = window.innerWidth <= 700;
  const maxHeight = window.innerHeight * (isMobile ? 0.84 : 0.9);
  const maxWidth = window.innerWidth * (isMobile ? 0.92 : 0.95);
  let width = maxWidth;
  let height = width / imageRatio;

  if (height > maxHeight) {
    height = maxHeight;
    width = height * imageRatio;
  }

  bookScene.style.width = `${Math.round(width)}px`;
  bookScene.style.height = `${Math.round(height)}px`;
}

if (musica) {
  musica.src = 'musica/razao.mp3';
  musica.preload = 'auto';
}

function updatePageStates() {
  pages.forEach((page, index) => {
    const isActive = index === activeIndex;
    const shouldFlip = index === 0 ? false : index < activeIndex;
    const shouldShow = isActive || shouldFlip || page.classList.contains('flipping');

    page.classList.toggle('active', isActive);
    page.classList.toggle('flipped', shouldFlip);
    page.style.visibility = shouldShow ? '' : 'hidden';

    if (page.classList.contains('flipping')) {
      page.style.zIndex = 3000;
    } else if (isActive) {
      page.style.zIndex = 2000;
    } else if (shouldFlip) {
      page.style.zIndex = 1000 + index;
    } else {
      page.style.zIndex = 0;
    }
  });
}

function playAudio() {
  if (!musica) return;
  musica.play().then(() => {
    btnMusica.textContent = '⏸';
  }).catch(() => {
    btnMusica.textContent = '🔊';
  });
}

function openCover() {
  if (activeIndex !== 0 || isAnimating) return;

  isAnimating = true;
  pages[0].classList.add('faded');
  playAudio();

  setTimeout(() => {
    activeIndex = 1;
    updatePageStates();
    isAnimating = false;
  }, 450);
}

function goToPage(index) {
  if (isAnimating) return;

  const safeIndex = Math.max(0, Math.min(index, pages.length - 1));
  if (safeIndex === activeIndex) return;
  if (activeIndex === 0 && safeIndex !== 1) return;

  isAnimating = true;

  const hidePage = (page) => {
    if (page) {
      page.style.visibility = 'hidden';
      hiddenPage = page;
    }
  };

  if (safeIndex > activeIndex) {
    flippingPage = pages[activeIndex];
    flippingPage.classList.add('flipping');
    flippingPage.style.zIndex = 3000;
    pages[activeIndex].classList.add('flipped');

    hidePage(pages[safeIndex]);
  } else if (safeIndex === 0) {
    pages[0].classList.remove('faded');
  } else {
    flippingPage = pages[safeIndex];
    flippingPage.classList.add('flipping');
    flippingPage.style.zIndex = 3000;
    pages[safeIndex].classList.remove('flipped');

    hidePage(pages[activeIndex]);
  }

  setTimeout(() => {
    activeIndex = safeIndex;
    if (flippingPage) {
      flippingPage.classList.remove('flipping');
      flippingPage = null;
    }
    if (hiddenPage) {
      hiddenPage.style.visibility = '';
      hiddenPage = null;
    }
    updatePageStates();
    isAnimating = false;
  }, 450);
}

function navigateFromClientX(clientX) {
  const rect = book.getBoundingClientRect();
  const x = clientX - rect.left;

  if (x < rect.width / 2) {
    goToPage(activeIndex - 1);
  } else {
    goToPage(activeIndex + 1);
  }
}

seal.addEventListener('click', (event) => {
  event.stopPropagation();
  openCover();
});

book.addEventListener('click', (event) => {
  if (activeIndex === 0) {
    openCover();
    return;
  }
  navigateFromClientX(event.clientX);
});

book.addEventListener('touchend', (event) => {
  if (activeIndex === 0) {
    openCover();
    return;
  }

  const touch = event.changedTouches[0];
  navigateFromClientX(touch.clientX);
}, { passive: true });

btnMusica.addEventListener('click', () => {
  if (!musica) return;
  if (musica.paused) {
    playAudio();
  } else {
    musica.pause();
    btnMusica.textContent = '🔊';
  }
});

if (musica) {
  musica.volume = 0.8;
}
btnMusica.textContent = '🔊';

updatePageStates();

if (coverImage.complete) {
  resizeBook();
}

coverImage.addEventListener('load', resizeBook);
window.addEventListener('resize', resizeBook);
