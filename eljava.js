let isTicking = false;
let carouselRevealed = false; // Tracks if the carousel has appeared yet

window.addEventListener('scroll', () => {
  if (!isTicking) {
    window.requestAnimationFrame(() => {
      updateTitlePosition();
      isTicking = false;
    });
    isTicking = true;
  }
});

function easeInOutCubic(x) {
  return 1 - Math.pow(1 - x, 1.05);
}

function updateTitlePosition() {
  const title = document.querySelector('.megatitle2');
  if (!title) return;

  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;

  const titleRect = title.getBoundingClientRect();
  const elementPageTop = titleRect.top + scrollTop;

  const startScroll = elementPageTop - windowHeight + 150;
  const endScroll = elementPageTop - 125;

  let progress = (scrollTop - startScroll) / (endScroll - startScroll);
  progress = Math.max(0, Math.min(1, progress));

  const easedProgress = easeInOutCubic(progress);

  const style = window.getComputedStyle(title);
  const matrix = new DOMMatrixReadOnly(style.transform);
  const currentTranslateX = matrix.m41; 
  
  const naturalLeft = titleRect.left - currentTranslateX;
  const elementWidth = titleRect.width;

  const targetX = (window.innerWidth / 2) - (naturalLeft + elementWidth / 2);

  const moveX = easedProgress * targetX;
  title.style.transform = `translateX(${moveX}px)`;

  // --- NEW: Trigger Carousel Reveal ---
  // If the title has finished centering and the carousel is still hidden
  if (progress >= 1 && !carouselRevealed) {
      carouselRevealed = true;
      
      // Wait 0.5 seconds (500ms), then apply the reveal classes
      setTimeout(() => {
          document.getElementById('carousel').classList.add('revealed');
          document.getElementById('review-box').classList.add('revealed');
          
          // Now that it's visible, try to play the active video
          manageVideos(); 
      }, 500);
  }
}

const videoDatabase = [
    { id: 1, title: "Bloxfeed 1", videoId: "M7lc1UVf-VE", reviewerName: "Admin Playz", subs: "5.4k", reviewText: "NameRacketeer is a professional video editor who knows how long for but excellent quality. During my recent short, 0:00 to 0:28 he finishes it for 28 minutes, I asked him what to do and he bring it to life, what I asked for, and more. I would recommend editing this guy.", thumbnailPath: "assets/teset.png", avatar: "https://placehold.co/100x100/1e40af/ffffff?text=AP" },
    { id: 2, title: "Obby Run", videoId: "aqz-KE-bpKQ", reviewerName: "Speedy Gamer", subs: "12k", reviewText: "Incredible edits! The pacing is perfect and the visual effects added so much retention to my video. Definitely my go-to editor from now on.", thumbnailPath: "assets/teset.png", avatar: "https://placehold.co/100x100/991b1b/ffffff?text=SG" },
    { id: 3, title: "Tycoon Max", videoId: "dQw4w9WgXcQ", reviewerName: "Creator Pro", subs: "89k", reviewText: "Delivered exactly what was promised and ahead of schedule. The transitions are super clean. Highly recommend if you want to level up your content.", thumbnailPath: "assets/teset.png", avatar: "https://placehold.co/100x100/065f46/ffffff?text=CP" },
];

let carouselData = [];
let currentIndex = 0;
let domCards = [];
let isCarouselVisible = false;
let ytPlayers = {}; 
let ytApiReady = false;

const carouselContainer = document.getElementById('carousel');
const reviewBox = document.getElementById('review-box');
const reviewElements = {
    avatar: document.getElementById('review-avatar'),
    name: document.getElementById('review-name'),
    subs: document.getElementById('review-subs'),
    text: document.getElementById('review-text')
};

function shuffleArray(array) {
    let currentIndex = array.length, randomIndex;
    while (currentIndex !== 0) {
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;
        [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
    }
    return array;
}

function initApp() {
    carouselData = shuffleArray([...videoDatabase]);
    currentIndex = Math.floor(carouselData.length / 2);
    
    buildDOM();
    renderCarousel();
    setupEventListeners();
    loadYouTubeAPI();
}

function buildDOM() {
    carouselContainer.innerHTML = '';
    domCards = [];

    carouselData.forEach((item, index) => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.dataset.index = index;

        const iframeId = `yt-iframe-${index}`;

        // OPTIMIZATION: We output a blank <div> instead of a heavy <iframe>
        // The YouTube API will replace this div with an iframe ONLY when needed
        card.innerHTML = `
            <div id="${iframeId}" class="yt-iframe"></div>
            <img class="thumbnail" src="${item.thumbnailPath}" alt="${item.title}">
            <div class="video-title">${item.title}</div>
        `;

        card.addEventListener('click', () => {
            if(currentIndex !== index) {
                currentIndex = index;
                renderCarousel();
            }
        });

        carouselContainer.appendChild(card);
        domCards.push(card);
    });
}

function renderCarousel() {
    reviewBox.classList.remove('active');

    domCards.forEach((card, index) => {
        let offset = index - currentIndex;
        let absOffset = Math.abs(offset);

        if (absOffset === 0) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }

        if (absOffset > 5) {
            card.style.opacity = '0';
            card.style.pointerEvents = 'none';
            return;
        }
        
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';

        let translateX = offset * 220; 
        let scale = 1;
        let zIndex = 100;
        let filter = 'grayscale(0%) brightness(100%)';

        if (absOffset > 0) {
            scale = 1 - (absOffset * 0.25);
            if (scale < 0) scale = 0;
            
            const direction = offset > 0 ? 1 : -1;
            translateX = translateX - (direction * absOffset * 60);

            zIndex = 100 - absOffset;
            filter = `grayscale(60%) brightness(50%)`;
        }

        card.style.transform = `translateX(${translateX}px) scale(${scale})`;
        card.style.zIndex = zIndex;
        card.style.filter = filter;
    });

    setTimeout(() => {
        const activeData = carouselData[currentIndex];
        reviewElements.avatar.src = activeData.avatar;
        reviewElements.name.textContent = activeData.reviewerName;
        reviewElements.subs.textContent = activeData.subs + " subscribers";
        reviewElements.text.textContent = activeData.reviewText;
        
        reviewBox.classList.add('active');
    }, 200);
    
    manageVideos();
}

function loadYouTubeAPI() {
    const tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
}

// Global callback required by YouTube API
window.onYouTubeIframeAPIReady = function() {
    ytApiReady = true;
    manageVideos(); // Try to play video if carousel is already visible
};

function manageVideos() {
    // Stop if API isn't ready or if the carousel hasn't faded in yet
    if (!ytApiReady || !carouselRevealed) return;
    
    // 1. Pause ALL currently loaded players that are NOT the active index
    Object.keys(ytPlayers).forEach(indexStr => {
        const idx = parseInt(indexStr);
        const player = ytPlayers[idx];
        
        if (idx !== currentIndex && player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
        }
    });

    // 2. Play (or create) the active player
    if (isCarouselVisible) {
        const activeIndex = currentIndex; // Create a closure lock for the async load

        // If the player doesn't exist yet, we create it dynamically here (Lazy Loading)
        if (!ytPlayers[activeIndex]) {
            const item = carouselData[activeIndex];
            const iframeId = `yt-iframe-${activeIndex}`;
            
            ytPlayers[activeIndex] = new YT.Player(iframeId, {
                videoId: item.videoId,
                playerVars: {
                    'autoplay': 1, 'mute': 0, 'controls': 1, 
                    'loop': 1, 'playlist': item.videoId, 'showinfo': 0, 'rel': 0
                },
                events: {
                    'onReady': (event) => {
                        // Confirm this is still the active card when the iframe finishes loading
                        if (currentIndex === activeIndex && isCarouselVisible) {
                            event.target.playVideo();
                        }
                    }
                }
            });
        } else {
            // Player already exists, just tell it to play
            const player = ytPlayers[activeIndex];
            if (typeof player.playVideo === 'function') {
                player.playVideo();
            }
        }
    }
}

function setupEventListeners() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            isCarouselVisible = entry.isIntersecting;
            manageVideos(); 
        });
    }, { threshold: 0.5 });
    
    observer.observe(carouselContainer);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' && currentIndex > 0) {
            currentIndex--;
            renderCarousel();
        } else if (e.key === 'ArrowRight' && currentIndex < carouselData.length - 1) {
            currentIndex++;
            renderCarousel();
        }
    });

    let touchStartX = 0;
    carouselContainer.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', e => {
        let touchEndX = e.changedTouches[0].screenX;
        if (touchEndX < touchStartX - 50 && currentIndex < carouselData.length - 1) {
            currentIndex++;
            renderCarousel();
        }
        if (touchEndX > touchStartX + 50 && currentIndex > 0) {
            currentIndex--;
            renderCarousel();
        }
    }, { passive: true });
}

window.addEventListener('DOMContentLoaded', initApp);