// src/components/GenreSelector.jsx

import React from 'react';

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

export default GenreSelector;
