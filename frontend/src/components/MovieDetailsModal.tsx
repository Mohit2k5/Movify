import { useState, useEffect } from 'react';
import { X, Star, Send } from 'lucide-react';

export default function MovieDetailsModal({ movieId, onClose, user }: { movieId: number, onClose: () => void, user: string | null }) {
  const [movie, setMovie] = useState<any>(null);
  const [cast, setCast] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const API_KEY = 'befbc863acfa2253c9db30792dfc57f7';

  useEffect(() => {
    fetchMovieData();
    fetchReviews();
  }, [movieId]);

  const fetchMovieData = async () => {
    try {
      const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}`);
      setMovie(await res.json());
      const castRes = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/credits?api_key=${API_KEY}`);
      const castData = await castRes.json();
      setCast(castData.cast.slice(0, 10));
    } catch (e) {}
  };

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews/${movieId}`);
      const data = await res.json();
      setReviews(data);
    } catch(e) {}
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Please log in first");
    if (!reviewText.trim()) return;
    
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movie_id: movieId.toString(), username: user, rating, text: reviewText, date: new Date().toISOString().split('T')[0] })
      });
      const data = await res.json();
      if(data.success) {
        setReviewText('');
        fetchReviews(); // Refresh component
      }
    } catch(e) {}
  };

  if (!movie) return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="glass w-full max-w-4xl max-h-[90vh] rounded-2xl overflow-y-auto relative border border-white/10 shadow-2xl flex flex-col md:flex-row custom-scrollbar">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10 bg-black/50 p-2 rounded-full"><X /></button>
        
        <div className="md:w-1/3 p-6 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/10">
          <img src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`} className="w-full rounded-xl shadow-xl mb-4" />
          <h2 className="text-2xl font-bold text-white text-center">{movie.title}</h2>
          <div className="flex items-center space-x-2 mt-2">
            <Star className="text-yellow-500 w-5 h-5 fill-yellow-500" />
            <span className="font-bold">{movie.vote_average?.toFixed(1)}</span>
            <span className="text-gray-400">({movie.vote_count} votes)</span>
          </div>
        </div>

        <div className="md:w-2/3 p-6 flex flex-col space-y-6">
          <div>
            <h3 className="text-lg font-bold text-primary mb-2">Overview</h3>
            <p className="text-gray-300 text-sm leading-relaxed">{movie.overview}</p>
          </div>
          
          <div>
            <h3 className="text-lg font-bold text-primary mb-2">Cast</h3>
            <div className="flex overflow-x-auto space-x-4 pb-2 custom-scrollbar">
              {cast.map(c => (
                <div key={c.id} className="flex-shrink-0 w-24 text-center">
                  <img src={c.profile_path ? `https://image.tmdb.org/t/p/w200${c.profile_path}` : 'https://via.placeholder.com/200x300'} className="w-20 h-20 object-cover rounded-full mx-auto mb-2 border border-white/10" />
                  <p className="text-xs text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{c.character}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-white/10 pt-6">
            <h3 className="text-lg font-bold text-primary mb-4">Reviews</h3>
            
            {user ? (
              <form onSubmit={submitReview} className="mb-6 bg-black/30 p-4 rounded-xl border border-white/5">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-sm text-gray-300">Rating:</span>
                  <select value={rating} onChange={e => setRating(Number(e.target.value))} className="bg-black/50 border border-white/10 rounded px-2 py-1 text-sm text-white focus:outline-none">
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Stars</option>)}
                  </select>
                </div>
                <div className="flex space-x-2">
                  <input type="text" value={reviewText} onChange={e => setReviewText(e.target.value)} placeholder="Write a review..." className="flex-grow bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary" />
                  <button type="submit" disabled={!reviewText.trim()} className="bg-primary hover:bg-red-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center"><Send className="w-4 h-4" /></button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-400 mb-6 italic">You must be logged in to leave a review.</p>
            )}

            <div className="space-y-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
              {reviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet. Be the first!</p>
              ) : reviews.map(r => (
                <div key={r.id} className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-primary text-sm">{r.username}</span>
                    <span className="text-xs text-gray-400">{r.date}</span>
                  </div>
                  <div className="flex mb-2">
                    {[1,2,3,4,5].map(n => <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />)}
                  </div>
                  <p className="text-sm text-gray-300">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
