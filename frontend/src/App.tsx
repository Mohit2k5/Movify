import { useState, useEffect } from 'react';
import Hero from './components/Hero';
import MovieGrid from './components/MovieGrid';
import Chatbot from './components/Chatbot';
import AuthModal from './components/AuthModal';
import MovieDetailsModal from './components/MovieDetailsModal';
import MyReviews from './components/MyReviews';
import GenreFilter from './components/GenreFilter';
import { Film, Heart, User, LogOut, Star } from 'lucide-react';

export default function App() {
  const [movies, setMovies] = useState<any[]>([]);
  const [user, setUser] = useState<string | null>(localStorage.getItem('user'));
  const [myList, setMyList] = useState<any[]>(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) return [];
    const saved = localStorage.getItem(`myList_${savedUser}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'mylist' | 'myreviews'>('home');
  const [searchTitle, setSearchTitle] = useState('Trending Masterpieces');
  const [activeGenre, setActiveGenre] = useState<number | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeMovieId, setActiveMovieId] = useState<number | null>(null);

  const API_KEY = 'befbc863acfa2253c9db30792dfc57f7';
  const BASE_URL = 'https://api.themoviedb.org/3';

  useEffect(() => {
    if (user) {
      localStorage.setItem(`myList_${user}`, JSON.stringify(myList));
    }
  }, [myList, user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', user);
      const saved = localStorage.getItem(`myList_${user}`);
      setMyList(saved ? JSON.parse(saved) : []);
    } else {
      localStorage.removeItem('user');
      setMyList([]);
      if (activeTab !== 'home') setActiveTab('home');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'home') {
      if (activeGenre) fetchByGenre(activeGenre);
      else fetchTrending();
    } else if (activeTab === 'mylist') {
      setMovies(myList);
      setSearchTitle('My List');
      setActiveGenre(null);
      setLoading(false);
    } else if (activeTab === 'myreviews') {
      setSearchTitle('My Reviews');
      setLoading(false);
    }
  }, [activeTab, myList, activeGenre]);

  const fetchTrending = async () => {
    setLoading(true);
    setSearchTitle('Trending Masterpieces');
    try {
      const res = await fetch(`${BASE_URL}/trending/movie/week?api_key=${API_KEY}`);
      const data = await res.json();
      setMovies(data.results.filter((m: any) => m.poster_path).slice(0, 15));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const fetchByGenre = async (genreId: number) => {
    setLoading(true);
    setActiveTab('home');
    setSearchTitle('Genre Highlights');
    try {
      const res = await fetch(`${BASE_URL}/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&sort_by=popularity.desc`);
      const data = await res.json();
      setMovies(data.results.filter((m: any) => m.poster_path).slice(0, 15));
    } catch(e) {}
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    setActiveTab('home');
    setActiveGenre(null);
    setLoading(true);
    setSearchTitle(`Search Results: ${query}`);
    try {
      const res = await fetch(`${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMovies(data.results.filter((m: any) => m.poster_path));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const toggleMyList = (movie: any) => {
    if (!user) return alert("Please sign in to save movies to your list!");
    if (myList.find(m => m.id === movie.id)) {
      setMyList(myList.filter(m => m.id !== movie.id));
    } else {
      setMyList([...myList, movie]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative w-full overflow-x-hidden bg-black text-white selection:bg-primary/30">
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 group cursor-pointer mb-4 sm:mb-0" onClick={() => { setActiveTab('home'); setActiveGenre(null); }}>
            <Film className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">Movify</h1>
          </div>
          <div className="flex flex-wrap items-center space-x-2 sm:space-x-4">
            <button onClick={() => setActiveTab('mylist')} className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors text-sm font-medium ${activeTab === 'mylist' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/10 hover:bg-white/20'}`}>
              <Heart className={`w-4 h-4 ${activeTab === 'mylist' ? 'fill-white' : ''}`} />
              <span className="hidden sm:inline">My List ({myList.length})</span>
            </button>
            {user && (
              <button onClick={() => setActiveTab('myreviews')} className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors text-sm font-medium ${activeTab === 'myreviews' ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/10 hover:bg-white/20'}`}>
                <Star className={`w-4 h-4 ${activeTab === 'myreviews' ? 'fill-white' : ''}`} />
                <span className="hidden sm:inline">My Reviews</span>
              </button>
            )}
            {user ? (
              <div className="flex items-center space-x-3 ml-2 border-l border-white/20 pl-4">
                <span className="text-sm text-gray-300 font-medium">Hi, {user}</span>
                <button onClick={() => setUser(null)} className="text-red-400 hover:text-red-300 p-2"><LogOut className="w-4 h-4" /></button>
              </div>
            ) : (
              <button onClick={() => setShowAuthModal(true)} className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-full transition-colors text-sm font-medium ml-2 border-l border-white/20 pl-4">
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </nav>
      
      {activeTab === 'home' && <Hero onSearch={handleSearch} />}
      
      <main className={`flex-grow px-6 max-w-7xl mx-auto w-full z-10 relative ${activeTab === 'home' ? 'py-10' : 'py-32'}`}>
        {activeTab === 'home' && (
          <GenreFilter activeGenre={activeGenre} onSelect={(id) => { setActiveGenre(id); setActiveTab('home'); }} />
        )}

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold border-l-4 border-primary pl-4">{searchTitle}</h2>
        </div>
        
        {activeTab === 'myreviews' && user ? (
          <MyReviews user={user} onMovieClick={(id) => setActiveMovieId(id)} />
        ) : (
          <MovieGrid movies={movies} loading={loading} myList={myList} onToggleMyList={toggleMyList} onMovieClick={(id) => setActiveMovieId(id)} />
        )}
      </main>

      <Chatbot API_KEY={API_KEY} BASE_URL={BASE_URL} />

      {/* Modals */}
      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} onLogin={(u) => setUser(u)} />}
      {activeMovieId && <MovieDetailsModal movieId={activeMovieId} onClose={() => setActiveMovieId(null)} user={user} />}
    </div>
  );
}
