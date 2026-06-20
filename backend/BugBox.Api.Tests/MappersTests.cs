using BugBox.Api.Endpoints;
using BugBox.Api.Models;

namespace BugBox.Api.Tests;

public class MappersTests
{
    [Fact]
    public void TicketToDto_MapsRelatedEntitiesAndSortsTags()
    {
        var project = new Project { Name = "BugBox" };
        var reporter = new User { FullName = "Ada Reporter" };
        var assignee = new User { FullName = "Grace Assignee" };
        var ticket = new Ticket
        {
            TicketNumber = "BUG-42",
            Title = "Login fails",
            ProjectId = project.Id,
            Project = project,
            ReporterId = reporter.Id,
            Reporter = reporter,
            AssigneeId = assignee.Id,
            Assignee = assignee,
            TicketTags =
            [
                new TicketTag { Tag = new Tag { Name = "security" } },
                new TicketTag { Tag = new Tag { Name = "backend" } },
            ],
        };

        var dto = ticket.ToDto();

        Assert.Equal(ticket.Id, dto.Id);
        Assert.Equal("BUG-42", dto.TicketNumber);
        Assert.Equal("BugBox", dto.ProjectName);
        Assert.Equal("Ada Reporter", dto.ReporterName);
        Assert.Equal("Grace Assignee", dto.AssigneeName);
        Assert.Equal(["backend", "security"], dto.Tags);
    }

    [Fact]
    public void TicketToDto_WithoutLoadedReporter_UsesUnknownFallback()
    {
        var dto = new Ticket().ToDto();

        Assert.Equal("Unknown", dto.ReporterName);
        Assert.Null(dto.ProjectName);
        Assert.Null(dto.AssigneeName);
        Assert.Empty(dto.Tags);
    }

    [Fact]
    public void UserToDto_MapsRoleAsApiString()
    {
        var user = new User
        {
            FullName = "Lin Tester",
            Email = "lin@example.test",
            Role = UserRole.TechLead,
            AvatarUrl = "https://example.test/avatar.png",
            IsActive = false,
        };

        var dto = user.ToDto();

        Assert.Equal(user.Id, dto.Id);
        Assert.Equal("TechLead", dto.Role);
        Assert.Equal(user.Email, dto.Email);
        Assert.False(dto.IsActive);
    }
}
