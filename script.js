/**
 * Movify - Premium Movie Discovery
 */


const BASE_URL = '/api/tmdb';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// Global State
let state = {
    view: 'home',
    currentMovies: [],
    movieCache: {},
    myList: localStorage.getItem('user') ? (JSON.parse(localStorage.getItem('myList_' + localStorage.getItem('user'))) || []) : [],
    isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
    user: localStorage.getItem('user') || 'User',
    currentOpenMovieId: null,
    currentRating: 5
};

// DOM Elements
const elements = {
    grid: document.getElementById('moviesGrid'),
    searchInput: document.getElementById('searchInput'),
    searchBtn: document.getElementById('searchBtn'),
    loader: document.getElementById('loader'),
    noResults: document.getElementById('noResults'),
    noResultsTitle: document.getElementById('noResultsTitle'),
    noResultsDesc: document.getElementById('noResultsDesc'),
    filterBtns: document.querySelectorAll('.filter-btn'),
    resetBtn: document.getElementById('resetBtn'),
    sectionTitle: document.getElementById('sectionTitle'),
    categoryFilters: document.getElementById('categoryFilters'),
    heroSection: document.getElementById('heroSection'),
    
    // Nav 
    navBrand: document.getElementById('navBrand'),
    navHome: document.getElementById('navHome'),
    navTrending: document.getElementById('navTrending'),
    navGenres: document.getElementById('navGenres'),
    navMyList: document.getElementById('navMyList'),
    navMyReviews: document.getElementById('navMyReviews'),
    myListBadge: document.getElementById('myListBadge'),
    
    // Auth elements
    loginBtn: document.getElementById('loginBtn'),
    userProfile: document.getElementById('userProfile'),
    userNameDisplay: document.getElementById('userNameDisplay'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Modals
    loginModal: document.getElementById('loginModal'),
    closeLoginModal: document.getElementById('closeLoginModal'),
    loginForm: document.getElementById('loginForm'),
    usernameInput: document.getElementById('usernameInput'),
    toast: document.getElementById('toast'),
    toastMsg: document.getElementById('toastMsg'),

    // Movie Details Modal
    detailsModal: document.getElementById('movieDetailsModal'),
    closeDetailsModal: document.getElementById('closeDetailsModal'),
    modalPoster: document.getElementById('modalMoviePoster'),
    modalTitle: document.getElementById('modalMovieTitle'),
    modalRating: document.getElementById('modalMovieRating'),
    modalYear: document.getElementById('modalMovieYear'),
    modalGenres: document.getElementById('modalMovieGenres'),
    modalOverview: document.getElementById('modalMovieOverview'),
    modalSaveBtn: document.getElementById('modalSaveBtn'),
    modalSaveText: document.getElementById('modalSaveText'),
    reviewsList: document.getElementById('reviewsList'),
    reviewForm: document.getElementById('reviewForm'),
    reviewAuthPrompt: document.getElementById('reviewAuthPrompt'),
    reviewText: document.getElementById('reviewText'),
    stars: document.querySelectorAll('.star'),
    
    // Chat UI
    toggleChatBtn: document.getElementById('toggleChatBtn'),
    chatWindow: document.getElementById('chatWindow'),
    closeChatBtn: document.getElementById('closeChatBtn'),
    chatMessages: document.getElementById('chatMessages'),
    chatForm: document.getElementById('chatForm'),
    chatInput: document.getElementById('chatInput')
};

// Genre Mapping
const genreMap = {
    28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
    99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
    27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
    10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};
const genreToId = {
    'Action': 28, 'Sci-Fi': 878, 'Drama': 18, 'Thriller': 53,
    'Comedy': 35, 'Horror': 27, 'Romance': 10749
};

// Init
document.addEventListener('DOMContentLoaded', () => {
    injectKeyframes();
    updateAuthUI();
    updateMyListBadge();
    navigate('home');
    setupEventListeners();
});

function setupEventListeners() {
    // Navigation
    elements.navBrand.addEventListener('click', () => navigate('home'));
    elements.navHome.addEventListener('click', () => navigate('home'));
    elements.navTrending.addEventListener('click', () => navigate('trending'));
    elements.navGenres.addEventListener('click', () => navigate('genres'));
    elements.navMyList.addEventListener('click', () => {
        if (!state.isLoggedIn) { showToast('Please sign in to view My List'); setTimeout(openModal, 800); return; }
        navigate('mylist');
    });
    if(elements.navMyReviews) {
        elements.navMyReviews.addEventListener('click', () => {
            if (!state.isLoggedIn) { showToast('Please sign in to view My Reviews'); setTimeout(openModal, 800); return; }
            navigate('myreviews');
        });
    }

    // Search
    elements.searchBtn.addEventListener('click', executeSearch);
    elements.searchInput.addEventListener('keyup', (e) => { if (e.key === 'Enter') executeSearch(); });
    elements.searchInput.addEventListener('input', (e) => { if (e.target.value.trim() === '') navigate('home'); });

    // Filters
    elements.filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const filterValue = btn.getAttribute('data-filter');
            updateActiveFilter(filterValue);
            elements.searchInput.value = '';
            if (filterValue === 'all') navigate('home');
            else fetchMoviesByGenre(genreToId[filterValue], filterValue);
        });
    });

    if(elements.resetBtn) {
        elements.resetBtn.addEventListener('click', () => navigate('home'));
    }

    // Login Modal
    elements.loginBtn.addEventListener('click', openModal);
    elements.closeLoginModal.addEventListener('click', closeModal);
    elements.loginModal.addEventListener('click', (e) => { if (e.target === elements.loginModal) closeModal(); });
    elements.loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        login(elements.usernameInput.value);
    });
    elements.logoutBtn.addEventListener('click', logout);

    // Details Modal
    elements.closeDetailsModal.addEventListener('click', closeDetailsModal);
    elements.detailsModal.addEventListener('click', (e) => { if (e.target === elements.detailsModal) closeDetailsModal(); });

    // Chat
    elements.toggleChatBtn.addEventListener('click', toggleChat);
    elements.closeChatBtn.addEventListener('click', () => elements.chatWindow.classList.remove('chat-window-active'));
    elements.chatForm.addEventListener('submit', handleUserChatMessage);

    // Stars Rating
    elements.stars.forEach(star => {
        star.addEventListener('click', () => {
            state.currentRating = parseInt(star.getAttribute('data-val'));
            updateStarsUI(state.currentRating);
        });
    });
    
    // Review Submit
    elements.reviewForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitReview(state.currentRating || 5);
    });
}

function navigate(view) {
    state.view = view;
    updateNavUI();
    
    if (view === 'home') {
        elements.heroSection.classList.remove('hidden');
        elements.categoryFilters.classList.remove('hidden');
        elements.sectionTitle.textContent = 'Top Recommendations For You';
        elements.searchInput.value = '';
        updateActiveFilter('all');
        fetchTrendingMovies();
    } else if (view === 'trending') {
        elements.heroSection.classList.add('hidden');
        elements.categoryFilters.classList.add('hidden');
        elements.sectionTitle.textContent = 'Trending Movies This Week';
        fetchTrendingMovies();
    } else if (view === 'genres') {
        elements.heroSection.classList.add('hidden');
        elements.categoryFilters.classList.remove('hidden');
        elements.sectionTitle.textContent = 'Explore by Genres';
        fetchTrendingMovies();
    } else if (view === 'mylist') {
        elements.heroSection.classList.add('hidden');
        elements.categoryFilters.classList.add('hidden');
        elements.sectionTitle.textContent = 'My List';
        renderMyList();
    } else if (view === 'myreviews') {
        elements.heroSection.classList.add('hidden');
        elements.categoryFilters.classList.add('hidden');
        elements.sectionTitle.textContent = 'My Reviews';
        renderMyReviews();
    }
}

function updateNavUI() {
    const navItems = [
        { id: elements.navHome, name: 'home' },
        { id: elements.navTrending, name: 'trending' },
        { id: elements.navGenres, name: 'genres' },
        { id: elements.navMyList, name: 'mylist' },
        { id: elements.navMyReviews, name: 'myreviews' }
    ];
    navItems.forEach(item => {
        if(!item.id) return;
        if (state.view === item.name) {
            item.id.classList.remove('text-gray-400', 'hover:text-white');
            item.id.classList.add('text-primary');
        } else {
            item.id.classList.remove('text-primary');
            item.id.classList.add('text-gray-400', 'hover:text-white');
        }
    });
}

function updateActiveFilter(filterValue) {
    elements.filterBtns.forEach(b => {
        if (b.getAttribute('data-filter') === filterValue) {
            b.classList.remove('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
            b.classList.add('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
        } else {
            b.classList.remove('bg-primary', 'text-white', 'shadow-md', 'shadow-primary/20');
            b.classList.add('bg-gray-800', 'text-gray-300', 'hover:bg-gray-700');
        }
    });
}

// API Based Auth
async function login(username) {
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({username})
        });
        if(res.ok) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', username);
            state.isLoggedIn = true;
            state.user = username;
            
            // Load user-specific list
            state.myList = JSON.parse(localStorage.getItem('myList_' + username)) || [];
            
            updateAuthUI();
            closeModal();
            updateMyListBadge();
            showToast(`Welcome back, ${username}!`);
            
            if(state.currentOpenMovieId) updateReviewAuthUI();
            if(state.view === 'mylist') renderMyList();
        }
    } catch(e) {
        // Fallback if python server is not running
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('user', username);
        state.isLoggedIn = true;
        state.user = username;
        updateAuthUI();
        closeModal();
        showToast(`Offline mode: Welcome, ${username}!`);
    }
}

function logout() {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('user');
    state.isLoggedIn = false;
    state.user = 'User';
    state.myList = [];
    updateMyListBadge();
    updateAuthUI();
    showToast('Successfully signed out');
    if(state.view === 'mylist' || state.view === 'myreviews') navigate('home');
}

function updateAuthUI() {
    if (state.isLoggedIn) {
        elements.loginBtn.classList.add('hidden');
        elements.userProfile.classList.remove('hidden');
        elements.userProfile.classList.add('flex');
        elements.userNameDisplay.textContent = state.user;
    } else {
        elements.loginBtn.classList.remove('hidden');
        elements.userProfile.classList.add('hidden');
        elements.userProfile.classList.remove('flex');
    }
}

function openModal() {
    elements.loginModal.classList.remove('hidden');
    setTimeout(() => {
        elements.loginModal.classList.add('modal-active');
        if(elements.loginModal.querySelector('div')) elements.loginModal.querySelector('div').classList.add('modal-content-active');
    }, 10);
}

function closeModal() {
    elements.loginModal.classList.remove('modal-active');
    if(elements.loginModal.querySelector('div')) elements.loginModal.querySelector('div').classList.remove('modal-content-active');
    setTimeout(() => elements.loginModal.classList.add('hidden'), 300);
}

function showToast(message) {
    elements.toastMsg.textContent = message;
    elements.toast.classList.add('toast-active');
    elements.toast.classList.remove('translate-x-full', 'opacity-0');
    setTimeout(() => {
        elements.toast.classList.remove('toast-active');
        elements.toast.classList.add('translate-x-full', 'opacity-0');
    }, 3000);
}

// My List
window.toggleMyList = function(movieId, event) {
    if(event) event.stopPropagation(); 
    if (!state.isLoggedIn) { showToast('Please sign in to save movies'); setTimeout(openModal, 1000); return; }

    const movie = state.movieCache[movieId];
    if(!movie) return;

    const index = state.myList.findIndex(m => String(m.id) === String(movie.id));
    if (index === -1) {
        state.myList.push(movie);
        showToast(`Added to My List`);
    } else {
        state.myList.splice(index, 1);
        showToast(`Removed from My List`);
    }
    
    // Save to user-specific local storage key
    localStorage.setItem('myList_' + state.user, JSON.stringify(state.myList));
    updateMyListBadge();

    if(state.view === 'mylist') renderMyList();
    else if (state.view !== 'myreviews') renderMovies(state.currentMovies); 
    
    if (state.currentOpenMovieId === movie.id) updateModalSaveBtn();
};

function updateMyListBadge() {
    if (state.myList.length > 0 && state.isLoggedIn) {
        elements.myListBadge.classList.remove('hidden');
        elements.myListBadge.textContent = state.myList.length;
    } else {
        elements.myListBadge.classList.add('hidden');
    }
}

function renderMyList() {
    if (state.myList.length === 0) {
        elements.noResultsTitle.textContent = "Your List is Empty";
        elements.noResultsDesc.textContent = "Browse trending movies or use search to find movies you'll love.";
        showNoResults();
    } else {
        renderMovies([...state.myList]); 
    }
}

// MOVIE DETAILS & REVIEWS (Connecting to DB)
window.openMovieDetails = async function(movieId) {
    state.currentOpenMovieId = movieId;
    let movie = state.movieCache[movieId];
    if(!movie) return;
    
    try {
        const res = await fetch(`${BASE_URL}/movie/${movieId}`);
        if(res.ok) {
            movie = await res.json();
            state.movieCache[movieId] = movie;
        }
    } catch(e) { console.error(e); }

    const imgUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=500&auto=format&fit=crop';
    elements.modalPoster.src = imgUrl;
    elements.modalTitle.textContent = movie.title || movie.name;
    elements.modalRating.textContent = movie.vote_average ? movie.vote_average.toFixed(1) + ' ★' : 'NR';
    elements.modalYear.textContent = movie.release_date ? movie.release_date.split('-')[0] : '';
    
    let genresText = '';
    if (movie.genres) genresText = movie.genres.map(g => g.name).join(', ');
    else if (movie.genre_ids) genresText = movie.genre_ids.map(id => genreMap[id]).filter(Boolean).join(', ');
    
    elements.modalGenres.textContent = genresText;
    elements.modalOverview.textContent = movie.overview || "No overview available.";
    
    updateModalSaveBtn();
    state.currentRating = 5;
    updateStarsUI(5);
    elements.reviewText.value = '';
    updateReviewAuthUI();
    
    // Fetch real reviews from Python SQLite API
    await fetchAndRenderReviews(movieId);

    elements.detailsModal.classList.remove('hidden');
    setTimeout(() => {
        elements.detailsModal.classList.add('modal-active');
        if(elements.detailsModal.querySelector('div')) elements.detailsModal.querySelector('div').classList.add('modal-content-active');
    }, 10);
}

function closeDetailsModal() {
    elements.detailsModal.classList.remove('modal-active');
    if(elements.detailsModal.querySelector('div')) elements.detailsModal.querySelector('div').classList.remove('modal-content-active');
    setTimeout(() => elements.detailsModal.classList.add('hidden'), 300);
    state.currentOpenMovieId = null;
}

function updateModalSaveBtn() {
    if(!state.currentOpenMovieId) return;
    const movieIdStr = String(state.currentOpenMovieId);
    const isSaved = state.myList.some(m => String(m.id) === movieIdStr);
    
    elements.modalSaveBtn.onclick = () => window.toggleMyList(state.currentOpenMovieId);
    
    if (isSaved) {
        elements.modalSaveBtn.classList.add('bg-primary', 'border-primary');
        elements.modalSaveBtn.classList.remove('bg-white/10', 'border-white/30');
        elements.modalSaveText.textContent = "Saved to List";
    } else {
        elements.modalSaveBtn.classList.remove('bg-primary', 'border-primary');
        elements.modalSaveBtn.classList.add('bg-white/10', 'border-white/30');
        elements.modalSaveText.textContent = "Add to My List";
    }
}

function updateReviewAuthUI() {
    if (state.isLoggedIn) {
        elements.reviewAuthPrompt.classList.add('hidden');
        elements.reviewForm.classList.remove('hidden');
        elements.reviewForm.classList.add('flex');
    } else {
        elements.reviewAuthPrompt.classList.remove('hidden');
        elements.reviewForm.classList.add('hidden');
        elements.reviewForm.classList.remove('flex');
    }
}

function updateStarsUI(rating) {
    elements.stars.forEach(star => {
        const val = parseInt(star.getAttribute('data-val'));
        if(val <= rating) {
            star.classList.remove('text-gray-500');
            star.classList.add('text-yellow-400');
        } else {
            star.classList.add('text-gray-500');
            star.classList.remove('text-yellow-400');
        }
    });
}

async function submitReview(rating) {
    if(!state.currentOpenMovieId) return;
    const movieId = String(state.currentOpenMovieId);
    const text = elements.reviewText.value.trim();
    if(!text) return;

    const payload = {
        movie_id: movieId,
        username: state.user,
        rating: rating,
        text: text,
        date: new Date().toLocaleDateString()
    };

    try {
        await fetch('/api/reviews', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(payload)
        });
    } catch(e) {
        // Fallback to local storage if API is missing
        if(!state.reviews[movieId]) state.reviews[movieId] = [];
        state.reviews[movieId].unshift({user: payload.username, rating: payload.rating, text: payload.text, date: payload.date});
        localStorage.setItem('movieReviews', JSON.stringify(state.reviews));
    }
    
    elements.reviewText.value = '';
    showToast('Review posted successfully!');
    await fetchAndRenderReviews(movieId);
}

async function fetchAndRenderReviews(movieId) {
    let movieReviews = [];
    try {
        const res = await fetch(`/api/reviews/${movieId}`);
        if(res.ok) movieReviews = await res.json();
    } catch(e) {
        movieReviews = state.reviews[movieId] || [];
    }
    
    elements.reviewsList.innerHTML = '';
    
    if (movieReviews.length === 0) {
        elements.reviewsList.innerHTML = `<p class="text-gray-500 italic text-sm text-center py-4">No reviews yet. Be the first to share your thoughts!</p>`;
        return;
    }

    movieReviews.forEach(rev => {
        let starsHtml = '';
        for(let i=1; i<=5; i++) {
            starsHtml += `<span class="${i <= rev.rating ? 'text-yellow-400' : 'text-gray-700'}">★</span>`;
        }
        const usernameFirst = (rev.user && typeof rev.user === 'string') ? rev.user.charAt(0).toUpperCase() : 'U';

        const div = document.createElement('div');
        div.className = "bg-gray-800/80 p-4 rounded-lg flex flex-col";
        div.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <span class="font-bold text-sm text-white flex items-center">
                    <div class="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-[10px] mr-2 text-white">${usernameFirst}</div>
                    ${rev.user || 'Unknown'}
                </span>
                <span class="text-xs text-gray-400">${rev.date}</span>
            </div>
            <div class="text-sm mb-2">${starsHtml}</div>
            <p class="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">${rev.text}</p>
        `;
        elements.reviewsList.appendChild(div);
    });
}

// My Reviews Section
async function renderMyReviews() {
    await withLoading(async () => {
        let userReviews = [];
        try {
            const res = await fetch(`/api/my_reviews/${state.user}`);
            if(res.ok) userReviews = await res.json();
        } catch(e) {
            // Fallback mock
            for (let mId in state.reviews) {
                state.reviews[mId].forEach(r => {
                    if(r.user === state.user) userReviews.push({...r, movie_id: mId});
                });
            }
        }
        
        elements.grid.innerHTML = '';
        if (userReviews.length === 0) {
            elements.noResultsTitle.textContent = "You haven't reviewed any movies yet.";
            elements.noResultsDesc.textContent = "Go explore and leave some community ratings!";
            showNoResults();
            return;
        }
        elements.noResults.classList.add('hidden');
        elements.grid.classList.remove('hidden');

        // To display reviews beautifully in a grid
        elements.grid.className = "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full";

        userReviews.forEach(rev => {
            const m = state.movieCache[rev.movie_id];
            const title = m ? m.title : `Movie #${rev.movie_id}`;
            const img = m && m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=500&auto=format&fit=crop';
            
            let starsHtml = '';
            for(let i=1; i<=5; i++) starsHtml += `<span class="${i <= rev.rating ? 'text-yellow-400' : 'text-gray-700'}">★</span>`;

            const card = document.createElement('div');
            card.className = "review-card bg-gray-900 rounded-xl overflow-hidden border border-gray-800 shadow-lg flex";
            card.innerHTML = `
                <div class="w-1/3 cursor-pointer relative" onclick="window.openMovieDetails('${rev.movie_id}')">
                    <img src="${img}" class="w-full h-full object-cover">
                </div>
                <div class="w-2/3 p-5 flex flex-col">
                    <h4 class="text-white font-bold mb-2 truncate">${title}</h4>
                    <div class="text-sm mb-3">${starsHtml}</div>
                    <p class="text-gray-400 text-sm italic line-clamp-4">"${rev.text}"</p>
                    <span class="text-xs text-gray-500 mt-auto pt-2">${rev.date}</span>
                </div>
            `;
            elements.grid.appendChild(card);
        });

        // Initialize Premium 3D Vanilla Tilt effect for review cards
        if (window.VanillaTilt) {
            VanillaTilt.init(document.querySelectorAll(".review-card"), {
                max: 10,
                speed: 400,
                glare: true,
                "max-glare": 0.2,
                scale: 1.02,
                easing: "cubic-bezier(.175,.885,.32,1.275)"
            });
        }
    });
}

// AI CHATBOT LOGIC (Hits Python API)
function toggleChat() {
    elements.chatWindow.classList.toggle('chat-window-active');
}

async function handleUserChatMessage(e) {
    e.preventDefault();
    const text = elements.chatInput.value.trim();
    if(!text) return;
    
    addChatMessage(text, 'user');
    elements.chatInput.value = '';
    const typingId = addTypingIndicator();
    
    try {
        const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({message: text})
        });
        
        let aiData = null;
        if(chatRes.ok) {
            aiData = await chatRes.json();
        } else {
            // Frontend Fallback if Python is not running
            throw new Error("API not active");
        }
        
        if(document.getElementById(typingId)) document.getElementById(typingId).remove();

        addChatMessage(aiData.response_phrase, 'bot');
        
        if (aiData.target_genre || aiData.search_query) {
            const url = aiData.target_genre 
                ? `${BASE_URL}/discover/movie?with_genres=${aiData.target_genre}&sort_by=popularity.desc`
                : `${BASE_URL}/search/movie?query=${encodeURIComponent(aiData.search_query)}`;
                
            const res = await fetch(url);
            const data = await res.json();
            
            if(data.results && data.results.length > 0) {
                const moviesWithPosters = data.results.filter(m => m.poster_path);
                const listToUse = moviesWithPosters.length > 0 ? moviesWithPosters : data.results;
                const randomIndex = Math.floor(Math.random() * Math.min(10, listToUse.length));
                const recMovie = listToUse[randomIndex];
                
                if(recMovie) addMovieMessageOptions(recMovie);
            } else {
                addChatMessage("Wait, I couldn't find any movies exactly like that. Let's try something else!", 'bot');
            }
        }
        
    } catch(err) {
        // Safe Fallback Frontend algorithm
        if(document.getElementById(typingId)) document.getElementById(typingId).remove();
        const lowered = text.toLowerCase();
        let targetGenreId = null; let responsePhrase = "Here is a recommendation just for you:";
        if(lowered.match(/\b(sad|cry)\b/)){ targetGenreId=18; responsePhrase="Here is a powerful drama:"; }
        else if(lowered.match(/\b(action|fight)\b/)){ targetGenreId=28; responsePhrase="Check out this action movie:"; }
        else { targetGenreId=35; responsePhrase="Let's try a comedy!"; }
        
        const res = await fetch(`${BASE_URL}/discover/movie?with_genres=${targetGenreId}`);
        const data = await res.json();
        addChatMessage(responsePhrase, 'bot');
        addMovieMessageOptions(data.results[0]);
    }
}

function addChatMessage(text, sender) {
    const isBot = sender === 'bot';
    const div = document.createElement('div');
    div.className = `flex items-end ${isBot ? 'space-x-2' : 'justify-end'} mt-2`;
    
    if(isBot) {
        div.innerHTML = `<div class="bg-gradient-to-br from-primary to-orange-500 rounded-full p-1.5 shrink-0 mb-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div><div class="bg-gray-800 text-gray-200 text-sm py-2 px-3 rounded-2xl rounded-bl-sm border border-gray-700 max-w-[85%] whitespace-pre-wrap">${text}</div>`;
    } else {
        div.innerHTML = `<div class="bg-primary text-white text-sm py-2 px-3 rounded-2xl rounded-br-sm max-w-[85%] whitespace-pre-wrap">${text}</div>`;
    }
    elements.chatMessages.appendChild(div);
    scrollToChatBottom();
}

function addTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.id = id;
    div.className = `flex items-center space-x-2 mt-2`;
    div.innerHTML = `<div class="bg-gradient-to-br from-primary to-orange-500 rounded-full p-1.5 shrink-0"><svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></div><div class="bg-gray-800 py-2 px-3 rounded-2xl rounded-bl-sm border border-gray-700 typing-dots flex space-x-1"><span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span><span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span><span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span></div>`;
    elements.chatMessages.appendChild(div);
    scrollToChatBottom();
    return id;
}

function addMovieMessageOptions(movie) {
    if(!movie) return;
    state.movieCache[movie.id] = movie;
    
    const imgUrl = movie.poster_path ? `${IMAGE_BASE_URL}${movie.poster_path}` : 'https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=500&auto=format&fit=crop';
    
    const div = document.createElement('div');
    div.className = `flex items-center space-x-2 mt-2 ml-8`;
    div.innerHTML = `
        <div class="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden w-48 shadow-lg">
            <img src="${imgUrl}" class="w-full h-32 object-cover">
            <div class="p-2">
                <h4 class="text-white font-bold text-sm truncate">${movie.title}</h4>
                <div class="flex justify-between items-center mt-2">
                    <button onclick="window.openMovieDetails('${movie.id}')" class="text-xs bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded transition-colors cursor-pointer">Details</button>
                </div>
            </div>
        </div>
    `;
    elements.chatMessages.appendChild(div);
    scrollToChatBottom();
}

function scrollToChatBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// Global API
async function fetchTrendingMovies() {
    elements.grid.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full min-h-[400px]"; // Restore normal grid
    await withLoading(async () => {
        try {
            const res = await fetch(`${BASE_URL}/trending/movie/week`);
            const data = await res.json();
            renderMovies(data.results);
        } catch (error) { showNoResults(); }
    });
}

function executeSearch() {
    const query = elements.searchInput.value.trim();
    updateActiveFilter('all');
    if (query === '') navigate('home');
    else {
        elements.categoryFilters.classList.add('hidden');
        fetchSearchMovies(query);
    }
}

async function fetchSearchMovies(query) {
    elements.grid.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full min-h-[400px]";
    await withLoading(async () => {
        try {
            const res = await fetch(`${BASE_URL}/search/movie?query=${encodeURIComponent(query)}`);
            const data = await res.json();
            elements.sectionTitle.textContent = `Search Results for "${query}"`;
            elements.heroSection.classList.add('hidden');
            renderMovies(data.results);
        } catch (error) { showNoResults(); }
    });
}

async function fetchMoviesByGenre(genreId, genreName) {
    elements.grid.className = "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full min-h-[400px]";
    await withLoading(async () => {
        try {
            const res = await fetch(`${BASE_URL}/discover/movie?with_genres=${genreId}`);
            const data = await res.json();
            elements.sectionTitle.textContent = `${genreName} Movies`;
            renderMovies(data.results);
        } catch (error) { showNoResults(); }
    });
}

function renderMovies(movies) {
    if(state.view !== 'mylist' && state.view !== 'myreviews') {
        state.currentMovies = movies;
    }
    elements.grid.innerHTML = '';
    if (!movies || movies.length === 0) { showNoResults(); return; }
    elements.noResults.classList.add('hidden');
    elements.grid.classList.remove('hidden');

    movies.forEach((movie, index) => {
        if (!movie.poster_path) return;
        state.movieCache[movie.id] = movie;
        const isSaved = state.myList.some(m => String(m.id) === String(movie.id));
        const delay = index * 30; 
        const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'NR';
        const genres = movie.genre_ids ? movie.genre_ids.map(id => genreMap[id]).filter(Boolean).slice(0, 2).join(', ') : '';
        const imgUrl = `${IMAGE_BASE_URL}${movie.poster_path}`;
        
        const card = document.createElement('div');
        card.className = "movie-card bg-gray-900 rounded-xl overflow-hidden border border-gray-800 relative group animate-fade-in flex flex-col w-full mx-auto";
        card.style.animationDelay = `${delay}ms`;
        card.innerHTML = `
            <div onclick="window.openMovieDetails('${movie.id}')" class="relative aspect-[2/3] overflow-hidden w-full bg-gray-800 cursor-pointer">
                <img src="${imgUrl}" alt="poster" loading="lazy" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out">
                <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-100 scale-50 z-20 pointer-events-none flex-col">
                    <div class="bg-primary/90 rounded-full p-4 shadow-lg shadow-primary/40 backdrop-blur-sm mb-2"><svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-white ml-1" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" /></svg></div>
                </div>
                <button onclick="window.toggleMyList('${movie.id}', event)" class="heart-btn absolute top-3 left-3 bg-black/70 hover:bg-black/90 p-2.5 rounded-full backdrop-blur-md z-30 transition-all border border-gray-700/50 ${isSaved ? 'heart-active' : ''}">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" fill="${isSaved ? '#E50914' : 'none'}" viewBox="0 0 24 24" stroke="${isSaved ? '#E50914' : 'currentColor'}" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
            </div>
            <div class="p-4 absolute bottom-0 left-0 right-0 pointer-events-none">
                <h4 class="text-lg font-bold text-white mb-1 truncate text-shadow">${movie.title}</h4>
                <div class="flex items-center text-xs text-gray-300 space-x-2"><span class="font-medium bg-black/50 px-1.5 py-0.5 rounded">${year}</span><span class="text-yellow-500 font-bold">${rating}★</span></div>
            </div>
        `;
        elements.grid.appendChild(card);
    });

    // Initialize Premium 3D Vanilla Tilt effect
    if (window.VanillaTilt) {
        VanillaTilt.init(document.querySelectorAll(".movie-card"), {
            max: 10,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
            scale: 1.02,
            easing: "cubic-bezier(.175,.885,.32,1.275)"
        });
    }
}

function showNoResults() {
    elements.noResults.classList.remove('hidden');
    elements.grid.classList.add('hidden');
}

async function withLoading(callback) {
    elements.grid.classList.add('hidden');
    elements.noResults.classList.add('hidden');
    elements.loader.classList.remove('hidden');
    await callback();
    elements.loader.classList.add('hidden');
}

function injectKeyframes() {
    if (!document.getElementById('dynamic-styles')) {
        const style = document.createElement('style');
        style.id = 'dynamic-styles';
        style.textContent = `@keyframes fadeInScale { from { opacity: 0; transform: translateY(20px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } } .animate-fade-in { animation: fadeInScale 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; opacity: 0; }`;
        document.head.appendChild(style);
    }
}
