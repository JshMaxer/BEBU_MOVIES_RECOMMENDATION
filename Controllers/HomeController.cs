using Microsoft.AspNetCore.Mvc;
using System.Diagnostics;
using System.Threading.Tasks;
using BebuMovies.Models;
using BebuMovies.Services;

namespace BebuMovies.Controllers
{
    public class HomeController : Controller
    {
        private readonly ILogger<HomeController> _logger;
        private readonly TmdbService _tmdbService;

        public HomeController(ILogger<HomeController> logger, TmdbService tmdbService)
        {
            _logger = logger;
            _tmdbService = tmdbService;
        }

        // This action loads the main page shell ONE TIME.
        public async Task<IActionResult> Index()
        {
            try
            {
                // We still need to get the full view model for the initial page load.
                // It includes genres for the dropdowns, etc.
                var viewModel = await _tmdbService.GetMoviesViewModelAsync("monthly", null, null);
                return View(viewModel);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred during initial page load.");
                var errorViewModel = new ViewModel
                {
                    Error = "Oops! We couldn't load the page. Please try refreshing.",
                    Genres = new List<GenreViewModel>(),
                    Movies = new List<MovieViewModel>(),
                    Years = _tmdbService.GetYearList()
                };
                return View(errorViewModel);
            }
        }

        // *** NEW ACTION METHOD ***
        // This action is called by our JavaScript (AJAX). It returns ONLY the movie grid.
        // It's a PartialView, which is just a chunk of HTML.
        [HttpGet]
        public async Task<IActionResult> GetMovies(string movieType = "monthly", int? genreId = null, int? year = null)
        {
            try
            {
                var movies = new List<MovieViewModel>();

                if (movieType == "upcoming")
                {
                    movies = await _tmdbService.GetUpcomingMoviesAsync();
                }
                else
                {
                    var allGenres = await _tmdbService.GetGenresAsync();
                    var monthlyGenre = allGenres.FirstOrDefault(g => g.Name == _tmdbService.GetMonthlyGenreName());

                    int targetGenreId = (movieType == "monthly" && monthlyGenre != null)
                        ? monthlyGenre.Id
                        : genreId ?? monthlyGenre?.Id ?? 0;

                    if (targetGenreId > 0)
                    {
                        movies = await _tmdbService.GetMoviesByGenreAsync(targetGenreId, year);
                    }
                }
                // We return the Partial View, passing only the list of movies to it.
                return PartialView("_MovieGrid", movies);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An error occurred while fetching movies via AJAX.");
                // Return an error message that can be displayed by the javascript.
                return Content("<p class='text-xl text-red-500 text-center'>Failed to load movies. Please try again.</p>");
            }
        }


        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
