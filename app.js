// IMPORTANT: React, useState, useEffect are now globally available
// because of the CDN scripts in index.html. No 'import' statements needed here.

const TMDB_API_KEY = '34d1a1bd431dc14e9243d534340f360b'; // Your TMDB API Key
const TMDB_READ_ACCESS_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzNGQxYTFiZDQzMWRjMTRlOTI0M2Q1MzQzNDBmMzYwYiIsIm5iZiI6MTY5Njk5ODg5Mi4wNzksInN1YiI6IjY1MjYyNjExMDcyMTY2NDViNmRhZmU2NyIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.dMDHJ8cb6eWhumAkM88nt_cArUkaLkZZbHJi7R4eI0i8'; // Your TMDB API Read Access Token

const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_MOVIE_DETAIL_BASE_URL = 'https://www.themoviedb.org/movie/'; // Base URL for movie details on TMDB website

// Month to Genre Name mapping - UPDATED
const MONTH_GENRE_MAP = {
  1: "Science Fiction",   // January
  2: "Romance",     // February
  3: "Drama",       // March
  4: "Fantasy",      // April
  5: "Adventure",         // May
  6: "Action",       // June
  7: "Comedy",     // July
  8: "Thriller",     // August
  9: "Mystery",      // September
  10: "Crime", // October
  11: "Horror",     // November
  12: "Family"    // December (TMDB uses "Family" or "Animation" for Christmas-like)
};

// Month to Genre Reason mapping - NEW
const MONTH_GENRE_REASON_MAP = {
  1: "New year, new tech, new mind-bending realities.",
  2: "Valentine’s season. Cupid’s on payroll.",
  3: "Life’s warming up, emotions defrosting.",
  4: "Spring = bloom, magic, and mythical energy.",
  5: "Outdoorsy feels, let’s go on a wild ride.",
  6: "Global summer movie season = boom, bang, blockbusters.",
  7: "Midyear stress? Nah. Let’s laugh it off.",
  8: "Summer heat + global tension = perfect suspense.",
  9: "Fall kicks in, detective energy activated.",
  10: "Gritty, moody, pre-Halloween edge. Mafia, heists, corruption—yum.",
  11: "Post-Halloween, dark days, perfect for screams.",
  12: "Holidays. All the wholesome chaos + nostalgia."
};


// Helper function to shuffle an array
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

// --- API Calls ---
const tmdbHeaders = {
  'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

const fetchGenresApi = async () => {
  const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`, {
    headers: tmdbHeaders,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.genres;
};

// Modified fetchMoviesApi to correctly handle startYear/endYear for 'upcoming'
// Now always returns data.results for consistency
const fetchMoviesApi = async (type, genreId, startYear, endYear, page = 1) => {
  let apiUrl = '';
  let yearQueryParam = '';

  // Only apply year range if not 'upcoming' type
  if (type !== 'upcoming' && startYear && endYear) {
      yearQueryParam = `&primary_release_date.gte=${startYear}-01-01&primary_release_date.lte=${endYear}-12-31`;
  } else if (type !== 'upcoming' && startYear) {
      yearQueryParam = `&primary_release_date.gte=${startYear}-01-01`;
  } else if (type !== 'upcoming' && endYear) {
      yearQueryParam = `&primary_release_date.lte=${endYear}-12-31`;
  }

  if (type === 'upcoming') {
    const today = new Date();
    const yearToday = today.getFullYear();
    const monthToday = String(today.getMonth() + 1).padStart(2, '0');
    const dayToday = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yearToday}-${monthToday}-${dayToday}`;

    // For upcoming, we only care about release date from today onwards.
    // yearQueryParam is intentionally NOT included here for 'upcoming'
    apiUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&primary_release_date.gte=${formattedToday}&page=${page}`;
  } else if (type === 'genre' || type === 'monthly') {
    if (!genreId) {
        throw new Error('Genre ID is required for genre or monthly movie types.');
    }
    const popularResponse = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=popularity.desc&page=1&page=2${yearQueryParam}`, {
      headers: tmdbHeaders,
    });
    const topRatedResponse = await fetch(`${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${genreId}&sort_by=vote_average.desc&vote_count.gte=100${yearQueryParam}&page=1&page=2`, {
      headers: tmdbHeaders,
    });


    if (!popularResponse.ok || !topRatedResponse.ok) {
      throw new Error(`HTTP error! One or both fetches failed.`);
    }

    const popularData = await popularResponse.json();
    const topRatedData = await topRatedResponse.json();

    const combinedMovies = [...popularData.results, ...topRatedData.results];
    return Array.from(new Map(combinedMovies.map(movie => [movie.id, movie])).values());

  } else {
    throw new Error('Invalid movie type specified.');
  }

  const response = await fetch(apiUrl, { headers: tmdbHeaders });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data; // Return full data object to get total_pages
};

// --- Components ---
// MovieCard now accepts handleTellMeMore as a prop
const MovieCard = ({ movie, handleTellMeMore }) => {
  return (
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
          onClick={() => handleTellMeMore(movie.id)} // Call the prop function
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
        >
          Tell Me More!
        </button>
      </div>
    </div>
  );
};

const GenreSelector = ({ genres, selectedMovieType, selectedGenreId, onGenreChange, loading, error }) => {
  return (
    <div>
      <label htmlFor="genre-select" className="block text-lg font-medium text-gray-300 mb-2 text-center">
        Choose Your Vibe:
      </label>
      <select
        id="genre-select"
        className="block w-full p-3 border border-gray-600 rounded-lg shadow-md bg-gray-700 text-white focus:ring-purple-500 focus:border-purple-500 transition-all duration-300 ease-in-out"
        value={selectedMovieType === 'monthly' ? 'monthly-genre-selection' : (selectedMovieType === 'upcoming' ? 'upcoming-movies' : selectedGenreId)}
        onChange={onGenreChange}
        disabled={loading || error}
      >
        <option value="">Select a Genre</option>
        <option value="monthly-genre-selection">Based on Month</option>
        <option value="upcoming-movies">Upcoming</option>
        {genres.map((genre) => (
          <option key={genre.id} value={genre.id}>
            {genre.name}
          </option>
        ))}
      </select>
    </div>
  );
};

const YearRangeSelector = ({ startYear, endYear, onStartYearChange, onEndYearChange, onYearRangeRelease, loading, error, minYear, maxYear }) => {
    return (
        <div className="space-y-4">
            <div>
                <label htmlFor="start-year-range" className="block text-lg font-medium text-gray-300 mb-2 text-center">
                    Start Year: <span className="font-semibold text-purple-300">{startYear}</span>
                </label>
                <input
                    type="range"
                    id="start-year-range"
                    min={minYear}
                    max={maxYear}
                    value={startYear}
                    onChange={onStartYearChange}
                    onMouseUp={onYearRangeRelease}    // Trigger search on mouse up
                    onTouchEnd={onYearRangeRelease}  // Trigger search on touch end
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-purple-500"
                    disabled={loading || error}
                />
            </div>
            <div>
                <label htmlFor="end-year-range" className="block text-lg font-medium text-gray-300 mb-2 text-center">
                    End Year: <span className="font-semibold text-pink-300">{endYear}</span>
                </label>
                <input
                    type="range"
                    id="end-year-range"
                    min={minYear}
                    max={maxYear}
                    value={endYear}
                    onChange={onEndYearChange}
                    onMouseUp={onYearRangeRelease}    // Trigger search on mouse up
                    onTouchEnd={onYearRangeRelease}  // Trigger search on touch end
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer range-lg accent-pink-500"
                    disabled={loading || error}
                />
            </div>
        </div>
    );
};

const Loader = () => {
  return (
    <p className="text-xl text-purple-300 animate-pulse text-center">
      Loading movies, hold your horses...
    </p>
  );
};

// --- Main App Component ---
const App = () => {
  const { useState, useEffect } = React;

  const [genres, setGenres] = useState([]);
  const [selectedGenreId, setSelectedGenreId] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startYear, setStartYear] = useState(1920);
  const [endYear, setEndYear] = useState(new Date().getFullYear());
  const [selectedMovieType, setSelectedMovieType] = useState('monthly');
  const [upcomingPage, setUpcomingPage] = useState(1); // Current page for upcoming movies
  const [totalPages, setTotalPages] = useState(1); // Total pages for upcoming movies

  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthName = new Date().toLocaleString('en-US', { month: 'long' });
  const currentMonthGenreName = MONTH_GENRE_MAP[currentMonthNum];
  const currentMonthGenreReason = MONTH_GENRE_REASON_MAP[currentMonthNum]; // Get the reason

  const minPossibleYear = 1920;
  const maxPossibleYear = new Date().getFullYear();

  const getMovies = async (type, genreId, currentStartYear, currentEndYear, page = 1) => {
    setLoading(true);
    setError(null);
    setMovies([]); // Always clear movies before new fetch

    try {
      if (type === 'upcoming') {
        const data = await fetchMoviesApi(type, genreId, null, null, page); // fetchMoviesApi returns full data object
        setMovies(data.results.slice(0, 6)); // Display only 6 cards
        setTotalPages(data.total_pages); // Update total pages for pagination
      } else {
        const fetchedResults = await fetchMoviesApi(type, genreId, currentStartYear, currentEndYear);
        setMovies(shuffleArray(fetchedResults).slice(0, 3)); // Still 3 for genre/monthly
      }
    } catch (err) {
      console.error("Failed to fetch movies:", err);
      setError("Failed to fetch movies. Try again or check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!TMDB_API_KEY || !TMDB_READ_ACCESS_TOKEN) {
      setError("Please add your TMDB API Key and Read Access Token to the code.");
      setLoading(false);
      return;
    }

    const initializeApp = async () => {
      try {
        const fetchedGenres = await fetchGenresApi();
        setGenres(fetchedGenres);

        const monthlyGenreName = MONTH_GENRE_MAP[currentMonthNum];
        const monthlyGenre = fetchedGenres.find(g => g.name === monthlyGenreName);

        if (monthlyGenre) {
          setSelectedGenreId(monthlyGenre.id);
          setSelectedMovieType('monthly');
          getMovies('monthly', monthlyGenre.id, startYear, endYear);
        } else {
          setError(`Could not find genre ID for month ${currentMonthNum} (${monthlyGenreName}). Defaulting to first genre.`);
          if (fetchedGenres.length > 0) {
            setSelectedGenreId(fetchedGenres[0].id);
            setSelectedMovieType('genre');
            getMovies('genre', fetchedGenres[0].id, startYear, endYear);
          } else {
            setError("No genres available from TMDB.");
          }
        }
      } catch (err) {
        console.error("Failed to fetch genres:", err);
        setError("Failed to load genres. Please check your API key/token and network connection.");
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const handleGenreChange = (e) => {
    const newGenreValue = e.target.value;
    setUpcomingPage(1); // Reset page to 1 when changing genre type

    if (newGenreValue === 'monthly-genre-selection') {
      setSelectedMovieType('monthly');
      const monthlyGenre = genres.find(g => g.name === MONTH_GENRE_MAP[currentMonthNum]);
      if (monthlyGenre) {
        setSelectedGenreId(monthlyGenre.id);
        getMovies('monthly', monthlyGenre.id, startYear, endYear);
      } else {
        setError(`Could not find genre ID for month ${currentMonthNum}.`);
        setMovies([]);
        setSelectedGenreId('');
      }
    } else if (newGenreValue === 'upcoming-movies') {
      setSelectedMovieType('upcoming');
      setSelectedGenreId('');
      setStartYear(maxPossibleYear); // Reset slider visuals for upcoming
      setEndYear(maxPossibleYear); // Reset slider visuals for upcoming
      getMovies('upcoming', '', null, null, 1); // Fetch first page of upcoming
    } else {
      setSelectedMovieType('genre');
      setSelectedGenreId(newGenreValue);
      if (newGenreValue) {
        getMovies('genre', newGenreValue, startYear, endYear);
      } else {
        setMovies([]);
      }
    }
  };

  const handleStartYearChange = (e) => {
    const newStartYear = parseInt(e.target.value);
    if (newStartYear > endYear) {
        setEndYear(newStartYear);
    }
    setStartYear(newStartYear);
  };

  const handleEndYearChange = (e) => {
    const newEndYear = parseInt(e.target.value);
    if (newEndYear < startYear) {
        setStartYear(newEndYear);
    }
    setEndYear(newEndYear);
  };

  const handleYearRangeRelease = () => {
    if (selectedMovieType !== 'upcoming' && selectedGenreId) {
        getMovies(selectedMovieType, selectedGenreId, startYear, endYear);
    }
  };

  const handleRandomizeMovies = () => {
    if (selectedMovieType === 'genre' && selectedGenreId) {
      getMovies('genre', selectedGenreId, startYear, endYear);
    } else if (selectedMovieType === 'monthly') {
      const monthlyGenre = genres.find(g => g.name === MONTH_GENRE_MAP[currentMonthNum]);
      if (monthlyGenre) {
        getMovies('monthly', monthlyGenre.id, startYear, endYear);
      }
    }
  };

  // New handler for page number clicks
  const handlePageChange = (pageNumber) => {
    setUpcomingPage(pageNumber);
    getMovies('upcoming', '', null, null, pageNumber);
  };

  // Moved handleTellMeMore to App component and added console.log for debugging
  const handleTellMeMore = (movieId) => {
    console.log("Attempting to open movie details for ID:", movieId);
    window.open(`${TMDB_MOVIE_DETAIL_BASE_URL}${movieId}`, '_blank');
  };

  // Helper to render pagination buttons
  const renderPaginationButtons = () => {
    const pages = [];
    // Limit to showing a reasonable number of pages around the current page
    const maxButtons = 5;
    let start = Math.max(1, upcomingPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);

    // Adjust start if end is limited by totalPages
    if (end - start + 1 < maxButtons) {
        start = Math.max(1, end - maxButtons + 1);
    }

    // Ensure page numbers are always positive
    start = Math.max(1, start);

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-lg font-bold transition-all duration-200
            ${upcomingPage === i
              ? 'bg-purple-600 text-white shadow-lg'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
            }
            focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75`}
          disabled={loading}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {upcomingPage > 1 && (
          <button
            onClick={() => handlePageChange(upcomingPage - 1)}
            className="px-4 py-2 rounded-lg font-bold bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
            disabled={loading}
          >
            Previous
          </button>
        )}
        {pages}
        {upcomingPage < totalPages && (
          <button
            onClick={() => handlePageChange(upcomingPage + 1)}
            className="px-4 py-2 rounded-lg font-bold bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
            disabled={loading}
          >
            Next
          </button>
        )}
      </div>
    );
  };

  return (
    // Max-w-7xl for the main content area for breathability
    <div className="p-4 sm:p-8 flex flex-col items-center max-w-7xl mx-auto">
      <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 mb-4 text-center drop_shadow-lg">
        BEBU’S MOVIES RECOMMENDATION
      </h1>

      <p className="text-lg text-gray-300 mb-2 text-center">
        Today's month is: <span className="font-semibold text-purple-300">{currentMonthName}</span> and the genre is: <span className="font-semibold text-pink-300">{currentMonthGenreName}</span>
      </p>
      {/* New line for the reason */}
      <p className="text-md text-gray-400 mb-8 text-center italic">
        "{currentMonthGenreReason}"
      </p>

      <div className="mb-8 w-full max-w-sm mx-auto space-y-4">
        <GenreSelector
          genres={genres}
          selectedMovieType={selectedMovieType}
          selectedGenreId={selectedGenreId}
          onGenreChange={handleGenreChange}
          loading={loading}
          error={error}
        />
        {selectedMovieType !== 'upcoming' && (
            <YearRangeSelector
                startYear={startYear}
                endYear={endYear}
                onStartYearChange={handleStartYearChange}
                onEndYearChange={handleEndYearChange}
                onYearRangeRelease={handleYearRangeRelease}
                loading={loading}
                error={error}
                minYear={minPossibleYear}
                maxYear={maxPossibleYear}
            />
        )}
      </div>

      {loading && <Loader />}

      {error && (
        <p className="text-xl text-red-500 text-center p-4 bg-red-900 bg-opacity-30 rounded-lg border border-red-700 mx-auto max-w-md">
          Error: {error}
        </p>
      )}

      {!loading && !error && movies.length === 0 && (selectedGenreId || selectedMovieType === 'upcoming' || selectedMovieType === 'monthly') && (
        <p className="text-center text-gray-400 text-xl col-span-full">
          No movies found for this selection. Try another!
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
        {!loading && !error && movies.length > 0 && (
          movies.map((movie) => (
            <MovieCard key={movie.id} movie={movie} handleTellMeMore={handleTellMeMore} />
          ))
        )}
      </div>

      {!loading && !error && (selectedGenreId || selectedMovieType === 'monthly') && selectedMovieType !== 'upcoming' && (
        <button
          onClick={handleRandomizeMovies}
          className="mt-8 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-75"
        >
          Randomize Movies
        </button>
      )}

      {/* Render pagination buttons only for 'upcoming' movies and if there's more than one page */}
      {!loading && !error && selectedMovieType === 'upcoming' && totalPages > 1 && renderPaginationButtons()}

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
