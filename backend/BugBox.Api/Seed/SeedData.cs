using BugBox.Api.Data;
using BugBox.Api.Models;
using BugBox.Api.Services;
using Microsoft.EntityFrameworkCore;

namespace BugBox.Api.Seed;

public static class SeedData
{
    public static async Task RunAsync(AppDbContext db, IPasswordHasher hasher)
    {
        await db.Database.MigrateAsync().ContinueWith(_ => Task.CompletedTask);
        if (!await db.Database.CanConnectAsync() || !db.Users.Any() == false) { /* fallthrough */ }
        await db.Database.EnsureCreatedAsync();
        if (db.Users.Any()) return;

        var pwd = hasher.Hash("Password123!");
        var users = new[]
        {
            new User { FullName = "Emma Johnson", Email = "emma.johnson@northwind.dev", Role = UserRole.Developer, PasswordHash = pwd },
            new User { FullName = "Noah Martin", Email = "noah.martin@northwind.dev", Role = UserRole.Developer, PasswordHash = pwd },
            new User { FullName = "Sophia Lee", Email = "sophia.lee@northwind.dev", Role = UserRole.QA, PasswordHash = pwd },
            new User { FullName = "Lucas Brown", Email = "lucas.brown@northwind.dev", Role = UserRole.ProductOwner, PasswordHash = pwd },
            new User { FullName = "Mia Garcia", Email = "mia.garcia@northwind.dev", Role = UserRole.TechLead, PasswordHash = pwd },
            new User { FullName = "Admin User", Email = "admin@northwind.dev", Role = UserRole.Admin, PasswordHash = pwd },
        };
        db.Users.AddRange(users);

        var projects = new[]
        {
            new Project { Name = "Client Portal", ClientName = "Acme Corp", Description = "External portal for clients." },
            new Project { Name = "E-commerce Checkout", ClientName = "ShopWave", Description = "Checkout flow rewrite." },
            new Project { Name = "Analytics Dashboard", ClientName = "Northwind Internal", Description = "Internal KPI dashboard." },
            new Project { Name = "Internal HR Tool", ClientName = "Northwind Internal", Description = "Employees & permissions." },
            new Project { Name = "Mobile Banking App", ClientName = "BlueBank", Description = "iOS/Android banking app." },
        };
        db.Projects.AddRange(projects);

        var tagNames = new[] { "authentication","frontend","regression","checkout","production","export","analytics","client-request","backend","security","refactor","performance","api","database" };
        var tags = tagNames.Select(n => new Tag { Name = n }).ToList();
        db.Tags.AddRange(tags);
        await db.SaveChangesAsync();

        Tag T(string n) => tags.First(x => x.Name == n);
        User U(string e) => users.First(x => x.Email == e);
        Project P(string n) => projects.First(x => x.Name == n);

        int counter = 1001;
        string Num() => $"BUG-{counter++}";

        var tickets = new List<Ticket>
        {
            new Ticket {
                TicketNumber = Num(),
                Title = "Login page crashes when password contains special characters",
                Description = "Users report a blank screen when submitting passwords containing # or %.",
                Type = TicketType.Bug, Status = TicketStatus.InProgress,
                Priority = TicketPriority.High, Severity = TicketSeverity.Major,
                ProjectId = P("Client Portal").Id,
                AssigneeId = U("emma.johnson@northwind.dev").Id,
                ReporterId = U("sophia.lee@northwind.dev").Id,
                Environment = "Production",
                StepsToReproduce = "1. Open the login page\n2. Enter a valid email\n3. Enter a password containing # or %\n4. Submit the form",
                ExpectedResult = "The user should be logged in successfully.",
                ActualResult = "The page crashes and displays a blank screen.",
                CreatedAt = DateTime.UtcNow.AddDays(-6),
            },
            new Ticket {
                TicketNumber = Num(),
                Title = "Checkout button remains disabled after changing delivery address",
                Description = "After updating the delivery address, the checkout button never re-enables.",
                Type = TicketType.Bug, Status = TicketStatus.Triaged,
                Priority = TicketPriority.Urgent, Severity = TicketSeverity.Blocker,
                ProjectId = P("E-commerce Checkout").Id,
                AssigneeId = U("noah.martin@northwind.dev").Id,
                ReporterId = U("lucas.brown@northwind.dev").Id,
                Environment = "Production",
                StepsToReproduce = "1. Add item to cart\n2. Change delivery address\n3. Observe checkout button",
                ExpectedResult = "Checkout button is enabled.", ActualResult = "Button stays disabled.",
                DueDate = DateTime.UtcNow.AddDays(1),
                CreatedAt = DateTime.UtcNow.AddDays(-1),
            },
            new Ticket {
                TicketNumber = Num(),
                Title = "Add CSV export for monthly analytics report",
                Description = "Stakeholders want to download monthly reports as CSV.",
                Type = TicketType.Feature, Status = TicketStatus.New,
                Priority = TicketPriority.Medium, Severity = TicketSeverity.Minor,
                ProjectId = P("Analytics Dashboard").Id,
                ReporterId = U("lucas.brown@northwind.dev").Id,
                CreatedAt = DateTime.UtcNow.AddDays(-3),
            },
            new Ticket {
                TicketNumber = Num(),
                Title = "Refactor user permission validation service",
                Description = "Permission checks are duplicated across services.",
                Type = TicketType.Refactor, Status = TicketStatus.InReview,
                Priority = TicketPriority.Medium, Severity = TicketSeverity.Major,
                ProjectId = P("Internal HR Tool").Id,
                AssigneeId = U("mia.garcia@northwind.dev").Id,
                ReporterId = U("noah.martin@northwind.dev").Id,
                CreatedAt = DateTime.UtcNow.AddDays(-9),
            },
            new Ticket {
                TicketNumber = Num(),
                Title = "API response time exceeds 3 seconds on dashboard load",
                Description = "Dashboard endpoint takes >3s on staging.",
                Type = TicketType.Bug, Status = TicketStatus.ReadyForQA,
                Priority = TicketPriority.High, Severity = TicketSeverity.Critical,
                ProjectId = P("Analytics Dashboard").Id,
                AssigneeId = U("noah.martin@northwind.dev").Id,
                ReporterId = U("sophia.lee@northwind.dev").Id,
                Environment = "Staging",
                StepsToReproduce = "1. Login as analyst\n2. Open dashboard\n3. Observe response time",
                ExpectedResult = "Response < 1s.", ActualResult = "Response > 3s.",
                CreatedAt = DateTime.UtcNow.AddDays(-4),
            },
            new Ticket {
                TicketNumber = Num(), Title = "Improve mobile banking login error messaging",
                Description = "Errors are too generic.", Type = TicketType.Improvement,
                Status = TicketStatus.New, Priority = TicketPriority.Low, Severity = TicketSeverity.Minor,
                ProjectId = P("Mobile Banking App").Id,
                ReporterId = U("sophia.lee@northwind.dev").Id,
                CreatedAt = DateTime.UtcNow.AddDays(-2),
            },
            new Ticket {
                TicketNumber = Num(), Title = "Document API rate limits",
                Description = "Add docs for /api/* rate limits.",
                Type = TicketType.Documentation, Status = TicketStatus.Done,
                Priority = TicketPriority.Low, Severity = TicketSeverity.Minor,
                ProjectId = P("Client Portal").Id,
                AssigneeId = U("mia.garcia@northwind.dev").Id,
                ReporterId = U("lucas.brown@northwind.dev").Id,
                CreatedAt = DateTime.UtcNow.AddDays(-12), ResolvedAt = DateTime.UtcNow.AddDays(-2),
            },
        };

        db.Tickets.AddRange(tickets);
        await db.SaveChangesAsync();

        void Tagit(Ticket t, params string[] names)
        {
            foreach (var n in names) db.TicketTags.Add(new TicketTag { TicketId = t.Id, TagId = T(n).Id });
        }
        Tagit(tickets[0], "authentication","frontend","regression");
        Tagit(tickets[1], "checkout","frontend","production");
        Tagit(tickets[2], "export","analytics","client-request");
        Tagit(tickets[3], "backend","security","refactor");
        Tagit(tickets[4], "performance","api","database");

        db.Comments.Add(new Comment {
            TicketId = tickets[0].Id, AuthorId = U("sophia.lee@northwind.dev").Id,
            Content = "Reproduced on Chrome 124 and Firefox 126.", CreatedAt = DateTime.UtcNow.AddDays(-5)
        });
        db.Comments.Add(new Comment {
            TicketId = tickets[1].Id, AuthorId = U("mia.garcia@northwind.dev").Id,
            Content = "Blocker for the release tomorrow. Prioritising.", CreatedAt = DateTime.UtcNow.AddHours(-12)
        });

        await db.SaveChangesAsync();
    }
}
