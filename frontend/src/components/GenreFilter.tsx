const GENRES = [
  { id: 28, name: "Action" }, { id: 12, name: "Adventure" }, { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" }, { id: 80, name: "Crime" }, { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" }, { id: 10751, name: "Family" }, { id: 14, name: "Fantasy" },
  { id: 36, name: "History" }, { id: 27, name: "Horror" }, { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" }, { id: 10749, name: "Romance" }, { id: 878, name: "Sci-Fi" },
  { id: 10770, name: "TV Movie" }, { id: 53, name: "Thriller" }, { id: 10752, name: "War" },
  { id: 37, name: "Western" }
];

export default function GenreFilter({ activeGenre, onSelect }: { activeGenre: number | null, onSelect: (id: number) => void }) {
  return (
    <div className="flex overflow-x-auto space-x-3 pb-4 mb-4 custom-scrollbar">
      {GENRES.map(g => (
        <button
          key={g.id}
          onClick={() => onSelect(g.id)}
          className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${activeGenre === g.id ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-white/5 text-gray-300 hover:bg-white/15 border border-white/10'}`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
