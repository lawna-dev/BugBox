using BugBox.Api.Services;

namespace BugBox.Api.Tests;

public class PasswordHasherTests
{
    private readonly BcryptPasswordHasher _hasher = new();

    [Fact]
    public void Hash_ThenVerify_AcceptsOriginalPassword()
    {
        const string password = "Correct Horse Battery Staple!";

        var hash = _hasher.Hash(password);

        Assert.NotEqual(password, hash);
        Assert.True(_hasher.Verify(password, hash));
    }

    [Fact]
    public void Verify_WithWrongPassword_ReturnsFalse()
    {
        var hash = _hasher.Hash("correct-password");

        Assert.False(_hasher.Verify("wrong-password", hash));
    }

    [Fact]
    public void Hash_SamePasswordTwice_UsesDifferentSalts()
    {
        var first = _hasher.Hash("same-password");
        var second = _hasher.Hash("same-password");

        Assert.NotEqual(first, second);
    }
}
