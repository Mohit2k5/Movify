import { useState, useEffect } from 'react';

export default function MyReviews({ user, onMovieClick }: { user: string, onMovieClick: (id: number) => void }) {
  const [reviews, setReviews] = useState<any[]>([]);

  useEffect(() => {
    fetchReviews();
  }, [user]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/my_reviews/${encodeURIComponent(user)}`);
      const data = await res.json();
      setReviews(data);
    } catch(e) {}
  };

  const deleteReview = async (id: number) => {
    try {
      const res = await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
      if(res.ok) fetchReviews();
    } catch(e) {}
  };

  if (reviews.length === 0) return <div className="text-center py-20 text-gray-400">You haven't reviewed any movies yet.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((r, idx) => (
        <div key={idx} className="glass p-5 rounded-2xl border border-white/5 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-bold text-lg text-white hover:text-primary cursor-pointer transition-colors" onClick={() => onMovieClick(parseInt(r.movie_id))}>Movie #{r.movie_id}</h3>
              <p className="text-xs text-gray-400">{r.date}</p>
            </div>
            <button onClick={() => deleteReview(r.id)} className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 bg-red-500/10 rounded">Delete</button>
          </div>
          <div className="flex mb-3">
            {[1,2,3,4,5].map(n => <span key={n} className={`text-sm ${n <= r.rating ? 'text-yellow-500' : 'text-gray-600'}`}>★</span>)}
          </div>
          <p className="text-sm text-gray-300 italic">"{r.text}"</p>
        </div>
      ))}
    </div>
  );
}
