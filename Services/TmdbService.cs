using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;
using System.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using BebuMovies.Models;
using Microsoft.Extensions.Configuration; // To read API keys from configuration

namespace BebuMovies.Services
{
    public class TmdbService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly string _readAccessToken;
        private const string TmdbBaseUrl = "https://api.themoviedb.org/3";

        // Mapping from month number to genre name.
        private static readonly Dictionary<int, string> MonthGenreMap = new Dictionary<int, string>
        {
            { 1, "Adventure" }, { 2, "Romance" }, { 3, "Drama" }, { 4, "Comedy" },
            { 5, "War" }, { 6, "Crime" }, { 7, "Fantasy" }, { 8, "History" },
            { 9, "Action" }, { 10, "Science Fiction" }, { 11, "Horror" }, { 12, "Animation" }
        };

        public TmdbService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            // It's best practice to store secrets in appsettings.json or user secrets, not hardcoded.
            _apiKey = configuration["Tmdb:ApiKey"];
            _readAccessToken = configuration["Tmdb:ReadAccessToken"];

            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _readAccessToken);
            _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
        }

        // Helper method to deserialize JSON responses.
        private async Task<T> GetAsync<T>(string url)
        {
            var response = await _httpClient.GetAsync(url);
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            return JsonSerializer.Deserialize<T>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }

        // Fetches the list of all available genres from TMDB.
        public async Task<List<GenreViewModel>> GetGenresAsync()
        {
            var response = await GetAsync<TmdbGenreResponse>($"{TmdbBaseUrl}/genre/movie/list?api_key={_apiKey}");
            return response?.Genres ?? new List<GenreViewModel>();
        }

        // *** NEW PUBLIC METHOD ***
        // Gets the genre name corresponding to the current month.
        public string GetMonthlyGenreName()
        {
            var currentMonth = DateTime.Now.Month;
            return MonthGenreMap[currentMonth];
        }

        // The main method to build the view model for the initial page load.
        public async Task<ViewModel> GetMoviesViewModelAsync(string movieType, int? genreId, int? year)
        {
            var allGenres = await GetGenresAsync();
            var monthlyGenreName = GetMonthlyGenreName(); // Use the new method
            var monthlyGenre = allGenres.FirstOrDefault(g => g.Name == monthlyGenreName);

            var movies = new List<MovieViewModel>();

            // Determine which movies to fetch based on the movieType parameter.
            if (movieType == "upcoming")
            {
                movies = await GetUpcomingMoviesAsync();
            }
            else
            {
                int targetGenreId = (movieType == "monthly" && monthlyGenre != null)
                    ? monthlyGenre.Id
                    : genreId ?? monthlyGenre?.Id ?? 0;

                if (targetGenreId > 0)
                {
                    movies = await GetMoviesByGenreAsync(targetGenreId, year);
                }
            }

            return new ViewModel
            {
                Movies = movies,
                Genres = allGenres,
                Years = GetYearList(),
                SelectedMovieType = movieType,
                SelectedGenreId = genreId,
                SelectedYear = year,
                CurrentMonthName = DateTime.Now.ToString("MMMM"),
                CurrentMonthGenreName = monthlyGenreName
            };
        }

        // Fetches a randomized list of movies for a specific genre and optional year.
        public async Task<List<MovieViewModel>> GetMoviesByGenreAsync(int genreId, int? year)
        {
            var yearQuery = year.HasValue ? $"&primary_release_year={year.Value}" : "";

            // Fetch from multiple pages to get a better random selection
            var popularUrl = $"{TmdbBaseUrl}/discover/movie?api_key={_apiKey}&with_genres={genreId}&sort_by=popularity.desc{yearQuery}&page=1";
            var topRatedUrl = $"{TmdbBaseUrl}/discover/movie?api_key={_apiKey}&with_genres={genreId}&sort_by=vote_average.desc&vote_count.gte=100{yearQuery}&page=1";

            var popularTask = GetAsync<TmdbMovieResponse>(popularUrl);
            var topRatedTask = GetAsync<TmdbMovieResponse>(topRatedUrl);

            await Task.WhenAll(popularTask, topRatedTask);

            var combinedMovies = (popularTask.Result?.Results ?? new List<MovieViewModel>())
                .Concat(topRatedTask.Result?.Results ?? new List<MovieViewModel>())
                .GroupBy(m => m.Id) // Remove duplicates
                .Select(g => g.First())
                .ToList();

            var random = new Random();
            return combinedMovies.OrderBy(m => random.Next()).Take(3).ToList(); // Shuffle and take 3
        }

        // Fetches upcoming movies.
        public async Task<List<MovieViewModel>> GetUpcomingMoviesAsync(int page = 1)
        {
            var today = DateTime.Now.ToString("yyyy-MM-dd");
            var url = $"{TmdbBaseUrl}/discover/movie?api_key={_apiKey}&sort_by=popularity.desc&primary_release_date.gte={today}&page={page}";
            var response = await GetAsync<TmdbMovieResponse>(url);
            return response?.Results ?? new List<MovieViewModel>();
        }

        // Generates a list of years for the dropdown.
        public List<int> GetYearList()
        {
            return Enumerable.Range(1920, DateTime.Now.Year - 1920 + 1).Reverse().ToList();
        }
    }
}
