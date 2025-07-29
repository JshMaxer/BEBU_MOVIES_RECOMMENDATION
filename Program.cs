var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

// Register HttpClient and the TmdbService for dependency injection.
// This allows us to inject the TmdbService into our controllers.
builder.Services.AddHttpClient<BebuMovies.Services.TmdbService>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles(); // This enables serving files from wwwroot (like CSS and JS)

app.UseRouting();

app.UseAuthorization();

// This sets up the default route. A URL like "/" or "/Home/Index" will be handled by the Index action in HomeController.
app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");

app.Run();
