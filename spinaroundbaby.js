        let carouselData = [];
        let currentIndex = 0;
        let domCards = [];
        let isCarouselVisible = false;

        const carouselContainer = document.getElementById('carousel');
        const reviewBox = document.getElementById('review-box');
        const reviewAvatar = document.getElementById('review-avatar');
        const reviewName = document.getElementById('review-name');
        const reviewSubs = document.getElementById('review-subs');
        const reviewText = document.getElementById('review-text');

        // Fisher-Yates Shuffle to randomize cards on load
        function shuffleArray(array) {
            let currentIndex = array.length, randomIndex;
            while (currentIndex !== 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        }

        // Initialize Application
        function init() {
            // Clone and shuffle data
            carouselData = shuffleArray([...videoDatabase]);
            
            // Start somewhere in the middle so there are cards on both sides
            currentIndex = Math.floor(carouselData.length / 2);

            buildDOM();
            renderCarousel();
            setupEventListeners();
        }

        function buildDOM() {
            carouselContainer.innerHTML = '';
            domCards = [];

            carouselData.forEach((item, index) => {
                const card = document.createElement('div');
                card.className = 'video-card';
                card.dataset.index = index;

                card.innerHTML = `
                    <iframe class="yt-iframe" src="https://www.youtube.com/embed/${item.videoId}?enablejsapi=1&mute=1&controls=0&loop=1&playlist=${item.videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
                    <img class="thumbnail" src="${item.thumbnailPath}" alt="${item.title}">
                    <div class="video-title">${item.title}</div>
                `;

                // Handle click navigation
                card.addEventListener('click', () => {
                    currentIndex = index;
                    renderCarousel();
                });

                carouselContainer.appendChild(card);
                domCards.push(card);
            });
        }

        function renderCarousel() {
            // Determine total cards
            const total = carouselData.length;
            
            // Temporarily hide review box to smoothly transition data
            reviewBox.classList.remove('active');

            domCards.forEach((card, index) => {
                // Calculate distance from the center active card
                let offset = index - currentIndex;

                // Absolute distance determines scaling, opacity, and z-index
                let absOffset = Math.abs(offset);

                // Handle active state class for thumbnail hiding
                if (absOffset === 0) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }

                // Max 10 cards actively visible (5 on each side)
                if (absOffset > 5) {
                    card.style.display = 'none';
                    return;
                }
                
                card.style.display = 'flex';

                // Base transformation calculations
                // Spacing increases the further away the card is
                let translateX = offset * 220; // Base horizontal spacing
                
                // Adjust stacking effect (smaller and pushed back)
                let scale = 1;
                let zIndex = 100;
                let opacity = 1;
                let filter = 'grayscale(0%) brightness(100%)';

                if (absOffset > 0) {
                    // Shrink flanking cards
                    scale = 1 - (absOffset * 0.25);
                    if (scale < 0) scale = 0;
                    
                    // Condense them slightly towards the center
                    const direction = offset > 0 ? 1 : -1;
                    translateX = translateX - (direction * absOffset * 60);

                    // Push them behind
                    zIndex = 100 - absOffset;
                    
                    // Dim and grayscale side cards to match reference
                    filter = `grayscale(60%) brightness(50%)`;
                }

                // Apply CSS transforms
                card.style.transform = `translateX(${translateX}px) scale(${scale})`;
                card.style.zIndex = zIndex;
                card.style.filter = filter;
            });

            // Update Review Box Data after a short delay for animation smoothness
            setTimeout(() => {
                const activeData = carouselData[currentIndex];
                reviewAvatar.src = activeData.avatar;
                reviewName.textContent = activeData.reviewerName;
                reviewSubs.textContent = activeData.subs + " subscribers";
                reviewText.textContent = activeData.reviewText;
                
                reviewBox.classList.add('active');
            }, 150); // Small delay to let the cards slide first
            
            // Video Play/Pause Management
            pauseAllVideos();
            playActiveVideo();
        }

        // Helper to send messages to YouTube iframe API
        function controlVideo(iframe, action) {
            if (iframe && iframe.contentWindow) {
                iframe.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: action,
                    args: []
                }), '*');
            }
        }

        function playActiveVideo() {
            if (!isCarouselVisible) return;
            const activeCard = domCards[currentIndex];
            if (activeCard) {
                const iframe = activeCard.querySelector('.yt-iframe');
                controlVideo(iframe, 'playVideo');
            }
        }

        function pauseAllVideos() {
            domCards.forEach(card => {
                const iframe = card.querySelector('.yt-iframe');
                controlVideo(iframe, 'pauseVideo');
            });
        }

        function setupEventListeners() {
            // Intersection Observer to detect when the carousel is in view
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    isCarouselVisible = entry.isIntersecting;
                    if (isCarouselVisible) {
                        playActiveVideo();
                    } else {
                        pauseAllVideos();
                    }
                });
            }, { threshold: 0.5 });
            
            observer.observe(carouselContainer);

            window.addEventListener('keydown', (e) => {
                if (e.key === 'ArrowLeft') {
                    if (currentIndex > 0) {
                        currentIndex--;
                        renderCarousel();
                    }
                } else if (e.key === 'ArrowRight') {
                    if (currentIndex < carouselData.length - 1) {
                        currentIndex++;
                        renderCarousel();
                    }
                }
            });

            // Handle touch swipe for mobile responsiveness
            let touchStartX = 0;
            let touchEndX = 0;

            carouselContainer.addEventListener('touchstart', e => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            carouselContainer.addEventListener('touchend', e => {
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
            }, { passive: true });

            function handleSwipe() {
                const swipeThreshold = 50;
                if (touchEndX < touchStartX - swipeThreshold) {
                    // Swipe left -> next card
                    if (currentIndex < carouselData.length - 1) {
                        currentIndex++;
                        renderCarousel();
                    }
                }
                if (touchEndX > touchStartX + swipeThreshold) {
                    // Swipe right -> previous card
                    if (currentIndex > 0) {
                        currentIndex--;
                        renderCarousel();
                    }
                }
            }
        }

        // Run application
        window.addEventListener('DOMContentLoaded', init);