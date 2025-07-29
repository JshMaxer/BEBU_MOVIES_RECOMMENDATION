// src/api/tmdb.js

import { TMDB_API_KEY, TMDB_READ_ACCESS_TOKEN, TMDB_BASE_URL } from '../config';

const tmdbHeaders = {
  'Authorization': `Bearer ${TMDB_READ_ACCESS_TOKEN}`,
  'Content-Type': 'application/json',
};

/**
 * Fetches movie genres from TMDB.
 * @returns {Promise<Array>} A promise that resolves to an array of genre objects.
 */
export const fetchGenres = async () => {
  const response = await fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`, {
    headers: tmdbHeaders,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data.genres;
};

/**
 * Fetches movies based on type, genre, and year.
 * @param {string} type - 'genre', 'monthly', or 'upcoming'.
 * @param {string} genreId - The ID of the selected genre (optional for 'upcoming').
 * @param {string} year - The selected year (optional).
 * @param {number} page - The page number for pagination (primarily for 'upcoming').
 * @returns {Promise<Array>} A promise that resolves to an array of movie objects.
 */
export const fetchMovies = async (type, genreId, year, page = 1) => {
  let apiUrl = '';
  const yearQueryParam = year ? `&primary_release_year=${year}` : '';

  if (type === 'upcoming') {
    const today = new Date();
    const yearToday = today.getFullYear();
    const monthToday = String(today.getMonth() + 1).padStart(2, '0');
    const dayToday = String(today.getDate()).padStart(2, '0');
    const formattedToday = `${yearToday}-${monthToday}-${dayToday}`;

    apiUrl = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&sort_by=popularity.desc&primary_release_date.gte=${formattedToday}&page=${page}`;
  } else if (type === 'genre' || type === 'monthly') {
    // For genre/monthly, we fetch a pool and then handle randomization/slicing in App.jsx
    // Fetch popular and top-rated from first two pages for a larger pool
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

    // Combine results and remove duplicates (by ID)
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
  return data.results;
};
