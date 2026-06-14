using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using BugBox.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace BugBox.Api.Services;

public class JwtSettings
{
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public string Key { get; set; } = "";
    public int ExpiryMinutes { get; set; } = 480;
}

public interface IJwtTokenService { string Create(User user); }

public class JwtTokenService : IJwtTokenService
{
    private readonly JwtSettings _s;
    public JwtTokenService(JwtSettings s) { _s = s; }

    public string Create(User user)
    {
        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_s.Key)),
            SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("fullName", user.FullName),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: _s.Issuer, audience: _s.Audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(_s.ExpiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
