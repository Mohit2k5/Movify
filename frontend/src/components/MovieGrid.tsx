import MovieCard from './MovieCard';

export default function MovieGrid({ movies, loading, myList, onToggleMyList, onMovieClick }: { movies: any[], loading: boolean, myList: any[], onToggleMyList: (m:any) => void, onMovieClick: (id:number) => void }) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!movies || movies.length === 0) {
    return <div className="text-center py-20 text-gray-400">No movies found. Try another search or add items to your list!</div>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {movies.map((movie, idx) => (
        <MovieCard 
          key={movie.id} 
          movie={movie} 
          index={idx} 
          isSaved={!!myList.find(m => m.id === movie.id)} 
          onToggle={() => onToggleMyList(movie)} 
          onCardClick={() => onMovieClick(movie.id)}
        />
      ))}
    </div>
  );
}
