// src/components/MovieCard.jsx

import React from 'react';
import { TMDB_IMAGE_BASE_URL, TMDB_MOVIE_DETAIL_BASE_URL } from '../config';

const MovieCard = ({ movie }) => {
  const handleTellMeMore = (movieId) => {
    window.open(`${TMDB_MOVIE_DETAIL_BASE_URL}${movieId}`, '_blank');
  };

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
          onClick={() => handleTellMeMore(movie.id)}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-lg shadow-lg transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-75"
        >
          Tell Me More!
        </button>
      </div>
    </div>
  );
};

export default MovieCard;
