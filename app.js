// IMPORTANT: React, useState, useEffect are now globally available
// because of the CDN scripts in index.html. No 'import' statements needed here.

const TMDB_API_KEY = '34d1a1bd431dc14e9243d534340f360b'; // Your TMDB API Key
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNGQxYTFiZDQzMWRjMTRlOTI0M2Q1MzQzNDBmMzYwYiIsIm5iZiI6MTY5Njk5ODg5Mi4wNzksInN1YiI6IjY1MjYyNjExMDcyMTY2NDViNmRhZmU2NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dMDHJ8cb6eWhumAkM8nt_cArUkaLkZZbHJi7R4eI0i8'; // Your TMDB API Read Access Token

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_MOVIE_DETAIL_BASE_URL = 'https://www.themoviedb.org/movie/'; // Base URL for movie details on TMDB website

// Month to Genre Name mapping
const MONTH_GENRE_MAP = {
  1: "Adventure",   // January
  2: "Romance",     // February
  3: "Drama",       // March
  4: "Comedy",      // April
  5: "War",         // May
  6: "Crime",       // June
  7: "Fantasy",     // July
  8: "History",     // August
  9: "Action",      // September
  10: "Science Fiction", // October (TMDB uses "Science Fiction")
  11: "Horror",     // November
  12: "Animation"    // December
};

const App = () => {
  // React hooks are accessed directly from the global React object
  const [genres, setGenres] = React.useState([]);
  const [selectedGenreId, setSelectedGenreId] = React.useState('');
  const [movies, setMovies] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [selectedYear, setSelectedYear] = React.useState(''); // State for year filter (empty string for "All Years")
  const [isMonthlySelection, setIsMonthlySelection] = React.useState(true); // Default to true for "Based on Month"

  // Get current month and its corresponding genre name for display
  const currentMonthNum = new Date().getMonth() + 1; // getMonth is 0-indexed
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  const currentMonthGenreName = MONTH_GENRE_MAP[currentMonthNum];

  // Generate years for the dropdown: Current year back to 1920
  const currentYear = new Date().getFullYear();
  const years = [''].concat(Array.from({ length: currentYear - 1919 }, (_, i) => currentYear - i)); // Add empty string for "All Years"

  // Common headers for TMDB API requests
  const tmdbHeaders = {
    'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  };

  // Function to fetch genres from TMDB API
  const fetchGenres = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`, {
        headers: tmdbHeaders,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setGenres(data.genres);

      // Set default to "Based on Month" on initial load
      const monthlyGenreName = MONTH_GENRE_MAP[currentMonthNum];
      const monthlyGenre = data.genres.find(g => g.name === monthlyGenreName);

      if (monthlyGenre) {
        setSelectedGenreId(monthlyGenre.id); // Set the actual genre ID
        fetchRandomMovies(monthlyGenre.id, selectedYear);
      } else {
        // Fallback if monthly genre not found (shouldn't happen with correct mapping)
        setError(`Could not find genre ID for month ${currentMonthNum} (${monthlyGenreName}). Defaulting to first genre.`);
        if (data.genres.length > 0) {
            setSelectedGenreId(data.genres[0].id);
            fetchRandomMovies(data.genres[0].id, selectedYear);
        } else {
            setError("No genres available from TMDB.");
        }
      }
      setIsMonthlySelection(true); // Ensure this is set to true as it's the default

    } catch (err) {
      console.error("Failed to fetch genres:", err);
      setError("Failed to load genres. Please check your API key/token and network connection.");
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch and randomize popular and top-rated movies for a given genre and year
  const fetchRandomMovies = async (genreId, year) => {
    if (!genreId) {
        setMovies([]);
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);

    // Only add primary_release_year if a year is actually selected
    const yearQueryParam = year ? `&primary_release_year=${year}` : '';

    try {
      // Fetch popular movies for the genre (first few pages for more variety)
      const popularResponse = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1&page=2${yearQueryParam}`, {
        headers: tmdbHeaders,
      });
      // Fetch top-rated movies for the genre (first few pages)
      const topRatedResponse = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100${yearQueryParam}&page=1&page=2`, {
        headers: tmdbHeaders,
      });


      if (!popularResponse.ok || !topRatedResponse.ok) {
        throw new Error(`HTTP error! One or both fetches failed.`);
      }

      const popularData = await popularResponse.json();
      const topRatedData = await topRatedResponse.json();

      // Combine results, remove duplicates (by ID), and shuffle
      const combinedMovies = [...popularData.results, ...topRatedData.results];
      const uniqueMovies = Array.from(new Map(combinedMovies.map(movie => [movie.id, movie])).values());

      // Simple shuffle function
      for (let i = uniqueMovies.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueMovies[i], uniqueMovies[j]] = [uniqueMovies[j], uniqueMovies[i]];
      }

      // Take the first 3 random movies
      setMovies(uniqueMovies.slice(0, 3));

    } catch (err) {
      console.error("Failed to fetch random movies:", err);
      setError("Failed to fetch random movies. Try again or check your connection.");
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch genres on component mount
  React.useEffect(() => {
    if (!TMDB_API_KEY || !TMDB_READ_ACCESS_TOKEN) {
      setError("Please add your TMDB API Key and Read Access Token to the code.");
      setLoading(false);
      return;
    }
    fetchGenres();
  }, []);

  // Handle genre change: now calls fetchRandomMovies
  const handleGenreChange = (e) => {
    const newGenreValue = e.target.value;

    if (newGenreValue === 'monthly-genre-selection') {
      setIsMonthlySelection(true);
      const monthlyGenreName = MONTH_GENRE_MAP[currentMonthNum];
      const monthlyGenre = genres.find(g => g.name === monthlyGenreName);

      if (monthlyGenre) {
        setSelectedGenreId(monthlyGenre.id); // Set the actual genre ID
        fetchRandomMovies(monthlyGenre.id, selectedYear);
      } else {
        setError(`Could not find genre ID for month ${currentMonthNum} (${monthlyGenreName}).`);
        setMovies([]);
        setSelectedGenreId(''); // Clear selection if not found
      }
    } else {
      setIsMonthlySelection(false);
      setSelectedGenreId(newGenreValue);
      if (newGenreValue) { // Only randomize if a genre is actually selected (not the "Select a Genre" option)
        fetchRandomMovies(newGenreValue, selectedYear); // Pass selectedYear
      } else {
        setMovies([]); // Clear movies if "Select a Genre" is chosen
      }
    }
  };

  // Handle year change
  const handleYearChange = (e) => {
    const year = e.target.value;
    setSelectedYear(year);
    // If a genre is already selected, re-randomize with the new year
    // If "Based on Month" is active, re-evaluate the genre for the current month with the new year
    if (isMonthlySelection) {
        const monthlyGenreName = MONTH_GENRE_MAP[currentMonthNum];
        const monthlyGenre = genres.find(g => g.name === monthlyGenreName);
        if (monthlyGenre) {
            fetchRandomMovies(monthlyGenre.id, year);
        }
    } else if (selectedGenreId) {
      fetchRandomMovies(selectedGenreId, year);
    }
  };

  // Handle "Tell Me More!" button click - redirects to TMDB movie page
  const handleTellMeMore = (movieId) => {
    window.open(`${TMDB_MOVIE_DETAIL_BASE_URL}${movieId}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white font-inter p-4 sm:p-8 flex flex-col items-center">
      {/* The style tag with @import is now in style.css */}
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 text-center drop_shadow-lg">
        BEBU’S MOVIES RECOMMENDATION
      </h1>

      {/* New text display for current month and genre */}
      <p className="text-lg text-gray-300 mb-8 text-center">
        Today's month is: <span className="font-semibold text-purple-300">{currentMonthName}</span> and the genre is: <span className="font-semibold text-pink-300">{currentMonthGenreName}</span>
      </p>

      <div className="mb-8 w-full max-w-sm mx-auto space-y-4">
        <div>
          <label htmlFor="genre-select" className="block text-lg font-medium text-gray-300 mb-2 text-center">
            Choose Your Vibe:
          </label>
          <select
            id="genre-select"
            className="block w-full p-3 border border-gray-600 rounded-lg shadow-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-in-out"
            value={isMonthlySelection ? 'monthly-genre-selection' : selectedGenreId} // Reflect monthly selection
            onChange={handleGenreChange}
            disabled={loading || error}
          >
            <option value="">Select a Genre</option>
            <option value="monthly-genre-selection">Based on Month</option> {/* New option */}
            {genres.map((genre) => (
              <option key={genre.id} value={genre.id}>
                {genre.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="year-select" className="block text-lg font-medium text-gray-300 mb-2 text-center">
            Filter by Year:
          </label>
          <select
            id="year-select"
            className="block w-full p-3 border border-gray-600 rounded-lg shadow-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-in-out"
            value={selectedYear}
            onChange={handleYearChange}
            disabled={loading || error}
          >
            <option value="">All Years</option> {/* Option to show all years */}
            {years.filter(year => year !== '').map((year) => ( // Filter out the empty string for the loop
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading && (
        <p className="text-xl text-purple-300 animate-pulse text-center">Loading movies, hold your horses...</p>
      )}

      {error && (
        <p className="text-xl text-red-500 text-center p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-700 mx-auto max-w-md">
          Error: {error}
        </p>
      )}

      {!loading && !error && movies.length === 0 && selectedGenreId && (
        <p className="text-center text-gray-400 text-xl col-span-full">
          No movies found for this genre and year. Try another selection or click "Randomize Movies"!
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {!loading && !error && movies.length > 0 && (
          movies.map((movie) => (
            <div
              key={movie.id}
              className="bg-gray-800 rounded-xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-purple-500/40 border border-gray-700"
            >
              <img
                src={movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : `https://placehold.co/500x750/333333/FFFFFF?text=No+Image`}
                alt={movie.title}
                className="w-full h-64 object-cover object-center rounded-t-xl"
                onError={(e) => { e.target.onerror = null; e.target.src = `https://placehold.co/500x750/333333/FFFFFF?text=No+Image`; }}
              />
              <div className="p-6">
                <h2 className="text-2xl font-bold text-purple-300 mb-2">
                  {movie.title}
                </h2>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                  {movie.overview}
                </p>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-yellow-400 font-semibold text-lg flex items-center">
                    <svg className="w-5 h-5 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.538 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.783.57-1.838-.197-1.538-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.929 8.72c-.783-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z"></path>
                    </svg>
                    {movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A'} / 10
                  </span>
                  <span className="text-gray-400 text-sm">
                    Released: {movie.release_date || 'N/A'}
                  </span>
                </div>
                <button
                  onClick={() => handleTellMeMore(movie.id)}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
                >
                  Tell Me More!
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && !error && selectedGenreId && ( // Only show randomize button if a genre is selected
        <button
          onClick={() => fetchRandomMovies(selectedGenreId, selectedYear)} // Pass selectedYear
          className="mt-8 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
        >
          Randomize Movies
        </button>
      )}

      <footer className="mt-12 text-gray-500 text-sm text-center">
        <p>
          Powered by The Movie Database (TMDB) API.
        </p>
        <p>
          Created by JshMaxer. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

// Render the App component into the 'root' div
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
