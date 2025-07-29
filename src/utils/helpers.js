// src/utils/helpers.js

// Month to Genre Name mapping
export const MONTH_GENRE_MAP = {
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

/**
 * Shuffles an array in place.
 * @param {Array} array The array to shuffle.
 * @returns {Array} The shuffled array.
 */
export const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};
