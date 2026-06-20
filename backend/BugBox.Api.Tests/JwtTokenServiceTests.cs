using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using BugBox.Api.Models;
using BugBox.Api.Services;

namespace BugBox.Api.Tests;

public class JwtTokenServiceTests
{
    [Fact]
    public void Create_ProducesTokenWithConfiguredIdentityAndLifetime()
    {
        var settings = new JwtSettings
        {
            Issuer = "BugBox.Tests",
            Audience = "BugBox.Tests.Client",
            Key = "a-test-signing-key-that-is-at-least-32-bytes-long",
            ExpiryMinutes = 30,
        };
        var user = new User
        {
            FullName = "Marie Curie",
            Email = "marie@example.test",
            Role = UserRole.Admin,
        };
        var before = DateTime.UtcNow.AddMinutes(settings.ExpiryMinutes);

        var encoded = new JwtTokenService(settings).Create(user);
        var token = new JwtSecurityTokenHandler().ReadJwtToken(encoded);

        var after = DateTime.UtcNow.AddMinutes(settings.ExpiryMinutes);
        Assert.Equal(settings.Issuer, token.Issuer);
        Assert.Contains(settings.Audience, token.Audiences);
        Assert.Equal(user.Id.ToString(), token.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal(user.Email, token.Claims.Single(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Equal(user.FullName, token.Claims.Single(c => c.Type == "fullName").Value);
        Assert.Equal("Admin", token.Claims.Single(c => c.Type == ClaimTypes.Role).Value);
        Assert.InRange(token.ValidTo, before.AddSeconds(-1), after);
    }
}
