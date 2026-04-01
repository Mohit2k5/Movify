import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Heart } from 'lucide-react';
import React from 'react';

export default function MovieCard({ movie, index, isSaved, onToggle, onCardClick }: { movie: any, index: number, isSaved: boolean, onToggle: () => void, onCardClick: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [10, -10]);
  const rotateY = useTransform(x, [-100, 100], [-10, 10]);

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX - width / 2);
    y.set(mouseY - height / 2);
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const imgUrl = `https://image.tmdb.org/t/p/w500${movie.poster_path}`;
  const year = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onCardClick}
      className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden cursor-pointer group shadow-2xl bg-gray-900 border border-white/5"
    >
      <img src={imgUrl} alt={movie.title} className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <button 
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        className={`absolute top-4 left-4 p-2.5 rounded-full backdrop-blur-md border transition-all z-20 hover:scale-110 active:scale-95 ${isSaved ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30' : 'bg-black/40 border-white/10 text-white/70 hover:text-white hover:bg-black/60'}`}
      >
        <Heart className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
      </button>

      <div className="absolute bottom-0 left-0 right-0 p-5 z-20 pointer-events-none">
        <h4 className="text-xl font-bold text-white mb-2 leading-tight drop-shadow-md line-clamp-2">{movie.title || movie.name}</h4>
        <div className="flex items-center space-x-3 text-sm">
          <span className="bg-white/10 backdrop-blur-sm px-2 py-1 rounded text-gray-300 font-medium">{year}</span>
          <span className="text-yellow-500 font-bold flex items-center shadow-sm">
            {movie.vote_average ? movie.vote_average.toFixed(1) : 'NR'} <span className="text-xs ml-1">★</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
