using System.Collections.Generic;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Mvc.Rendering; // For SelectListItem

namespace BebuMovies.Models
{
    // The main model for the Index.cshtml view. It contains all the data the view needs to render.
    public class ViewModel
    {
        public List<MovieViewModel> Movies { get; set; } = new List<MovieViewModel>();
        public List<GenreViewModel> Genres { get; set; } = new List<GenreViewModel>();
        public List<int> Years { get; set; } = new List<int>();

        public string? SelectedMovieType { get; set; }
        public int? SelectedGenreId { get; set; }
        public int? SelectedYear { get; set; }

        public string? CurrentMonthName { get; set; }
        public string? CurrentMonthGenreName { get; set; }
        public string? Error { get; set; }
    }

    // A simplified model representing a movie for display purposes.
    public class MovieViewModel
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("title")]
        public string Title { get; set; } = "";

        [JsonPropertyName("overview")]
        public string Overview { get; set; } = "";

        [JsonPropertyName("poster_path")]
        public string? PosterPath { get; set; }

        public string FullPosterUrl => !string.IsNullOrEmpty(PosterPath)
            ? $"https://image.tmdb.org/t/p/w500{PosterPath}"
            : "https://placehold.co/500x750/333333/FFFFFF?text=No+Image";

        [JsonPropertyName("vote_average")]
        public double VoteAverage { get; set; }

        [JsonPropertyName("release_date")]
        public string ReleaseDate { get; set; } = "";
    }

    // Represents a single genre.
    public class GenreViewModel
    {
        [JsonPropertyName("id")]
        public int Id { get; set; }

        [JsonPropertyName("name")]
        public string Name { get; set; } = "";
    }

    // These classes are used to deserialize the JSON response from the TMDB API.
    public class TmdbMovieResponse
    {
        [JsonPropertyName("results")]
        public List<MovieViewModel> Results { get; set; } = new List<MovieViewModel>();
    }

    public class TmdbGenreResponse
    {
        [JsonPropertyName("genres")]
        public List<GenreViewModel> Genres { get; set; } = new List<GenreViewModel>();
    }
}
