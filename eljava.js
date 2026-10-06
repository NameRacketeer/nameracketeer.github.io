let carouselRevealed = false;

window.addEventListener('scroll', () => {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;

  // Trigger once scrolled 500px down
  if (scrollTop >= 500 && !carouselRevealed) {
    carouselRevealed = true;

    setTimeout(() => {
      document.getElementById('carousel')?.classList.add('revealed');
      document.getElementById('review-box')?.classList.add('revealed');

      if (typeof manageVideos === 'function') {
        manageVideos();
      }
    }, 500);
  }
});

const videoDatabase = [
    { id: 1, title: "Bloxfeed 1", videoId: "uQe8S3UA4kw", reviewerName: "Admin Playz", subs: "4.37k", reviewText: "NameRacketeer is a professional video editor who knows how long for but excellent quality. During my recent short, 0:00 to 0:28 he finishes it for 28 minutes, I asked him what to do and he bring it to life, what I asked for, and more. I would recommend editing this guy.", thumbnailPath: "assets/snapshot1.jpg", avatar: "https://yt3.googleusercontent.com/xrXGiiA4SJL5hFzF3o09b0GZ5_yKYZ0yEDgEHQ12tUOc7kB7YvzNTnvlraLUz80dG3CwTdeDbg=s160-c-k-c0x00ffffff-no-rj" },
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


function playWithRandomPitch() {
    const audio = new Audio('assets/barco.wav');
    
	audio.preservesPitch = false;
    audio.webkitPreservesPitch = false;
    const minRate = 0.7;
    const maxRate = 1.4;
    const randomRate = Math.random() * (maxRate - minRate) + minRate;
    
    audio.playbackRate = randomRate;
    audio.currentTime = 0; 
    audio.play();
  }