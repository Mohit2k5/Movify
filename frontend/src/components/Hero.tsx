import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';

export default function Hero({ onSearch }: { onSearch: (query: string) => void }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <header className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden animated-gradient">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-10"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-primary/20 blur-[120px] z-10 animate-float"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-orange-600/20 blur-[120px] z-10 animate-float-delayed"></div>
        <img 
          src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=2025&auto=format&fit=crop" 
          alt="Vintage film background" 
          className="w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
      </div>
      
      <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center mt-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-tight text-white drop-shadow-2xl"
        >
          Find Your Next <br/>
          <span className="text-primary">Cinematic</span> Journey
        </motion.h2>
        
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl"
        >
          Discover hand-picked movies tailored to your unique taste. Enter a mood, genre, or a favorite movie to get started.
        </motion.p>
        
        <motion.form 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          onSubmit={handleSubmit}
          className="w-full max-w-2xl relative flex items-center group"
        >
          <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for action, sci-fi, drama..." 
            className="w-full bg-white/10 border border-white/20 text-white pl-14 pr-32 py-4 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all backdrop-blur-md text-lg shadow-2xl group-hover:bg-white/15 placeholder-gray-400"
          />
          <button type="submit" className="absolute right-2 bg-primary hover:bg-red-700 text-white px-6 py-2.5 rounded-full transition-transform hover:scale-105 active:scale-95 font-semibold shadow-lg shadow-primary/30">
            Search
          </button>
        </motion.form>
      </div>
    </header>
  );
}
