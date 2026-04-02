import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot } from 'lucide-react';

export default function Chatbot({ BASE_URL }: { BASE_URL: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([{ text: "Hi! I'm your Movify Assistant. Tell me what you're in the mood for!", sender: 'bot' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { text: userText, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText })
      });
      const data = await res.json();
      setMessages(prev => [...prev, { text: data.response_phrase, sender: 'bot' }]);
      
      if (data.target_genre || data.search_query) {
        const url = data.target_genre 
            ? `${BASE_URL}/discover/movie?with_genres=${data.target_genre}&sort_by=popularity.desc`
            : `${BASE_URL}/search/movie?query=${encodeURIComponent(data.search_query)}`;
            
        const tmdbRes = await fetch(url);
        const tmdbData = await tmdbRes.json();
        
        if (tmdbData.results && tmdbData.results.length > 0) {
            const moviesWithPosters = tmdbData.results.filter((m:any) => m.poster_path);
            const listToUse = moviesWithPosters.length > 0 ? moviesWithPosters : tmdbData.results;
            const randomIndex = Math.floor(Math.random() * Math.min(10, listToUse.length));
            const recMovie = listToUse[randomIndex];
            
            if (recMovie) {
                setMessages(prev => [...prev, { type: 'movie', movie: recMovie, sender: 'bot' }]);
            }
        }
      }
    } catch (err) {
      setMessages(prev => [...prev, { text: "Connection error. Ensure the Python backend is running on port 5000.", sender: 'bot' }]);
    }
    setIsTyping(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-4 w-[90vw] sm:w-[400px] h-[550px] glass rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/10"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-orange-600 p-5 flex justify-between items-center shadow-md z-10">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-white tracking-wide">Movify Assistant</h3>
                  <p className="text-xs text-white/80">AI Matchmaker</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-grow p-5 overflow-y-auto flex flex-col space-y-4 bg-black/60 custom-scrollbar relative z-0">
              {messages.map((msg, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.type === 'movie' ? (
                    <div className="mt-2 w-48 rounded-xl overflow-hidden glass border border-white/10 shadow-xl self-start">
                      <img src={`https://image.tmdb.org/t/p/w200${msg.movie.poster_path}`} className="w-full h-auto aspect-[2/3] object-cover" />
                      <div className="p-3 bg-gray-900 border-t border-white/10">
                        <p className="text-sm font-bold text-white truncate">{msg.movie.title || msg.movie.name}</p>
                        <button onClick={() => window.open(`https://www.themoviedb.org/movie/${msg.movie.id}`, '_blank')} className="mt-2 w-full bg-primary/80 hover:bg-primary text-white text-xs py-1.5 rounded transition-colors font-medium">Details</button>
                      </div>
                    </div>
                  ) : (
                    <div className={`max-w-[85%] p-3.5 rounded-2xl text-[15px] leading-relaxed shadow-md ${
                      msg.sender === 'user' 
                        ? 'bg-primary text-white rounded-br-sm' 
                        : 'glass bg-gray-800/80 text-gray-200 rounded-tl-sm border-white/5'
                    }`}>
                      {msg.text}
                    </div>
                  )}
                </motion.div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="glass bg-gray-800/80 p-4 rounded-2xl rounded-tl-sm flex space-x-2 border-white/5">
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ y: [0,-5,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-2" />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/80 border-t border-white/5 z-10">
              <form onSubmit={handleSubmit} className="flex items-center space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Tell me your movie mood..."
                  className="flex-grow bg-white/5 border border-white/10 text-white px-5 py-3 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all placeholder-gray-500"
                />
                <button type="submit" disabled={!input.trim() || isTyping} className="bg-primary hover:bg-red-700 disabled:opacity-50 text-white p-3 rounded-full transition-transform active:scale-95 shadow-lg shadow-primary/20">
                  <Send className="w-5 h-5 ml-1" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gradient-to-r from-primary to-orange-600 text-white p-4 rounded-full shadow-2xl flex items-center justify-center relative cursor-pointer"
      >
        <MessageSquare className="w-7 h-7" />
        {!isOpen && <span className="absolute -top-1 -right-1 bg-white w-3 h-3 rounded-full animate-pulse shadow-md"></span>}
      </motion.button>
    </div>
  );
}
