using System.Security.Claims;
using BugBox.Api.Data;
using BugBox.Api.DTOs;
using BugBox.Api.Models;
using BugBox.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BugBox.Api.Endpoints;

public static class AuthEndpoints
{
    public static void MapAuthEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/auth");

        g.MapPost("/register", async ([FromBody] RegisterRequest req, AppDbContext db, IPasswordHasher hasher, IJwtTokenService jwt) =>
        {
            if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password) || req.Password.Length < 8)
                return Results.BadRequest(new { error = "Email and a password of at least 8 characters are required." });
            if (!Enum.TryParse<UserRole>(req.Role, true, out var role))
                return Results.BadRequest(new { error = "Invalid role." });
            if (await db.Users.AnyAsync(u => u.Email == req.Email))
                return Results.Conflict(new { error = "Email already registered." });

            var user = new User {
                FullName = req.FullName.Trim(), Email = req.Email.Trim().ToLowerInvariant(),
                Role = role, PasswordHash = hasher.Hash(req.Password), IsActive = true
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            var token = jwt.Create(user);
            return Results.Ok(new LoginResponse(token, ToDto(user)));
        });

        g.MapPost("/login", async ([FromBody] LoginRequest req, AppDbContext db, IPasswordHasher hasher, IJwtTokenService jwt) =>
        {
            var user = await db.Users.FirstOrDefaultAsync(u => u.Email == req.Email.ToLower());
            if (user is null || !hasher.Verify(req.Password, user.PasswordHash))
                return Results.Json(new { error = "Invalid email or password." }, statusCode: 401);
            if (!user.IsActive)
                return Results.Json(new { error = "Account disabled." }, statusCode: 403);

            var token = jwt.Create(user);
            return Results.Ok(new LoginResponse(token, ToDto(user)));
        });

        g.MapGet("/me", async (ClaimsPrincipal me, AppDbContext db) =>
        {
            var id = me.FindFirstValue(ClaimTypes.NameIdentifier) ?? me.FindFirstValue("sub");
            if (!Guid.TryParse(id, out var uid)) return Results.Unauthorized();
            var user = await db.Users.FindAsync(uid);
            return user is null ? Results.Unauthorized() : Results.Ok(ToDto(user));
        }).RequireAuthorization();
    }

    static AuthUserDto ToDto(User u) => new(u.Id, u.FullName, u.Email, u.Role.ToString(), u.AvatarUrl, u.IsActive);
}
