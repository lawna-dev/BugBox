using BugBox.Api.Data;
using BugBox.Api.DTOs;
using BugBox.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BugBox.Api.Endpoints;

public static class OtherEndpoints
{
    public static void MapProjectEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/projects").RequireAuthorization();
        g.MapGet("/", async (AppDbContext db) =>
            Results.Ok((await db.Projects.OrderBy(p => p.Name).ToListAsync()).Select(p => p.ToDto())));
        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) => {
            var p = await db.Projects.FindAsync(id); return p is null ? Results.NotFound() : Results.Ok(p.ToDto());
        });
        g.MapPost("/", async (ProjectUpsertDto dto, AppDbContext db) =>
        {
            if (!Enum.TryParse<ProjectStatus>(dto.Status, true, out var s)) return Results.BadRequest(new { error = "Invalid status" });
            var p = new Project { Name = dto.Name, ClientName = dto.ClientName, Description = dto.Description, Status = s };
            db.Projects.Add(p); await db.SaveChangesAsync();
            return Results.Created($"/api/projects/{p.Id}", p.ToDto());
        }).RequireAuthorization(p => p.RequireRole("TechLead", "Admin", "ProductOwner"));
        g.MapPut("/{id:guid}", async (Guid id, ProjectUpsertDto dto, AppDbContext db) =>
        {
            var p = await db.Projects.FindAsync(id);
            if (p is null) return Results.NotFound();
            if (!Enum.TryParse<ProjectStatus>(dto.Status, true, out var s)) return Results.BadRequest(new { error = "Invalid status" });
            p.Name = dto.Name; p.ClientName = dto.ClientName; p.Description = dto.Description; p.Status = s;
            await db.SaveChangesAsync();
            return Results.Ok(p.ToDto());
        }).RequireAuthorization(p => p.RequireRole("TechLead", "Admin", "ProductOwner"));
    }

    public static void MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/users").RequireAuthorization();
        g.MapGet("/", async (AppDbContext db) =>
            Results.Ok((await db.Users.OrderBy(u => u.FullName).ToListAsync()).Select(u => u.ToDto())));
        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var u = await db.Users.FindAsync(id); return u is null ? Results.NotFound() : Results.Ok(u.ToDto());
        });
    }

    public static void MapDashboardEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/dashboard").RequireAuthorization();
        g.MapGet("/summary", async (AppDbContext db) =>
        {
            var all = await db.Tickets.Include(t => t.Project).Include(t => t.Assignee).ToListAsync();
            var now = DateTime.UtcNow;
            int open = all.Count(t => t.Status != TicketStatus.Done && t.Status != TicketStatus.Rejected && t.Status != TicketStatus.Duplicate);
            int critical = all.Count(t => t.Severity >= TicketSeverity.Critical && t.Status != TicketStatus.Done);
            int overdue = all.Count(t => t.DueDate is not null && t.DueDate < now && t.Status != TicketStatus.Done);
            int recentResolved = all.Count(t => t.ResolvedAt is not null && t.ResolvedAt >= now.AddDays(-7));
            var resolved = all.Where(t => t.ResolvedAt is not null).ToList();
            double avgHrs = resolved.Count == 0 ? 0 : resolved.Average(t => (t.ResolvedAt!.Value - t.CreatedAt).TotalHours);
            double resRate = all.Count == 0 ? 0 : (double)all.Count(t => t.Status == TicketStatus.Done) / all.Count * 100;

            var byStatus = Enum.GetValues<TicketStatus>().Select(s => new { status = s.ToString(), count = all.Count(t => t.Status == s) });
            var byPriority = Enum.GetValues<TicketPriority>().Select(p => new { priority = p.ToString(), count = all.Count(t => t.Priority == p) });
            var byProject = all.GroupBy(t => t.Project!.Name)
                .Select(g => new { project = g.Key, open = g.Count(t => t.Status != TicketStatus.Done) }).ToList();

            return Results.Ok(new {
                openTickets = open, criticalIssues = critical, overdueTickets = overdue,
                recentResolved, avgResolutionHours = Math.Round(avgHrs, 1),
                resolutionRate = Math.Round(resRate, 1),
                byStatus, byPriority, byProject
            });
        });

        g.MapGet("/critical-issues", async (AppDbContext db) =>
        {
            var list = await db.Tickets.Include(t => t.Project).Include(t => t.Assignee)
                .Where(t => (t.Severity == TicketSeverity.Critical || t.Severity == TicketSeverity.Blocker) && t.Status != TicketStatus.Done)
                .OrderByDescending(t => t.Severity).ThenByDescending(t => t.Priority).ToListAsync();
            return Results.Ok(list.Select(t => new {
                t.Id, t.TicketNumber, t.Title, project = t.Project!.Name,
                assignee = t.Assignee?.FullName, severity = t.Severity.ToString(),
                priority = t.Priority.ToString(), status = t.Status.ToString(), t.DueDate
            }));
        });
    }

    public static void MapReportsEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/reports").RequireAuthorization();
        g.MapGet("/project-health", async (AppDbContext db) =>
        {
            var projects = await db.Projects.Include(p => p.Tickets).ToListAsync();
            var now = DateTime.UtcNow;
            var data = projects.Select(p =>
            {
                var open = p.Tickets.Where(t => t.Status != TicketStatus.Done).ToList();
                int overdue = open.Count(t => t.DueDate is not null && t.DueDate < now);
                bool blocker = open.Any(t => t.Severity == TicketSeverity.Blocker);
                bool urgent = open.Any(t => t.Priority == TicketPriority.Urgent || t.Severity == TicketSeverity.Critical);
                string health = blocker || overdue > 5 ? "Critical" : urgent ? "AtRisk" : "Healthy";
                return new {
                    p.Id, p.Name, p.ClientName, status = p.Status.ToString(),
                    openTickets = open.Count,
                    criticalTickets = open.Count(t => t.Severity >= TicketSeverity.Critical),
                    overdueTickets = overdue, health
                };
            });
            return Results.Ok(data);
        });

        g.MapGet("/workload", async (AppDbContext db) =>
        {
            var users = await db.Users.Where(u => u.IsActive).ToListAsync();
            var tickets = await db.Tickets.ToListAsync();
            var weekAgo = DateTime.UtcNow.AddDays(-7);
            var data = users.Select(u => new {
                u.Id, u.FullName, role = u.Role.ToString(),
                openAssigned = tickets.Count(t => t.AssigneeId == u.Id && t.Status != TicketStatus.Done),
                resolvedThisWeek = tickets.Count(t => t.AssigneeId == u.Id && t.ResolvedAt >= weekAgo)
            });
            return Results.Ok(data);
        });
    }
}
