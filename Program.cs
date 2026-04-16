using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;
using ContactManagement.API.Data;

var builder = WebApplication.CreateBuilder(args);

// =============================================
// SERVICES CONFIGURATION
// =============================================

// Add Controllers
builder.Services.AddControllers();

// Configure Entity Framework with SQL Server
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Contact Management API",
        Version = "v1",
        Description = "A production-ready API for managing contacts and email templates",
        Contact = new OpenApiContact
        {
            Name = "API Support",
            Email = "support@example.com"
        }
    });
});

// Configure CORS for Next.js frontend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

// =============================================
// MIDDLEWARE PIPELINE
// =============================================

// Enable Swagger in all environments (for demo purposes)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Contact Management API v1");
    c.RoutePrefix = "swagger";
});

// Enable CORS
app.UseCors("AllowFrontend");

// Map Controllers
app.MapControllers();

// =============================================
// RUN APPLICATION
// =============================================

app.Run();