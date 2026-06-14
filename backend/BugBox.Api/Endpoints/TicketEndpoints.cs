using System.Security.Claims;
using BugBox.Api.Data;
using BugBox.Api.DTOs;
using BugBox.Api.Models;
using BugBox.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace BugBox.Api.Endpoints;

public static class TicketEndpoints
{
    public static void MapTicketEndpoints(this IEndpointRouteBuilder app)
    {
        var g = app.MapGroup("/api/tickets").RequireAuthorization();

        g.MapGet("/", async (AppDbContext db) =>
        {
            var list = await db.Tickets
                .Include(t => t.Project).Include(t => t.Assignee).Include(t => t.Reporter)
                .Include(t => t.TicketTags).ThenInclude(tt => tt.Tag)
                .OrderByDescending(t => t.CreatedAt).ToListAsync();
            return Results.Ok(list.Select(t => t.ToDto()));
        });

        g.MapGet("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var t = await db.Tickets
                .Include(x => x.Project).Include(x => x.Assignee).Include(x => x.Reporter)
                .Include(x => x.TicketTags).ThenInclude(tt => tt.Tag)
                .FirstOrDefaultAsync(x => x.Id == id);
            return t is null ? Results.NotFound() : Results.Ok(t.ToDto());
        });

        g.MapPost("/", async (TicketUpsertDto dto, ClaimsPrincipal me, AppDbContext db) =>
        {
            if (!Enum.TryParse<TicketType>(dto.Type, true, out var type)) return Results.BadRequest(new { error = "Invalid type" });
            if (!Enum.TryParse<TicketPriority>(dto.Priority, true, out var pri)) return Results.BadRequest(new { error = "Invalid priority" });
            if (!Enum.TryParse<TicketSeverity>(dto.Severity, true, out var sev)) return Results.BadRequest(new { error = "Invalid severity" });

            var reporterId = dto.ReporterId ?? Guid.Parse(me.FindFirstValue(ClaimTypes.NameIdentifier) ?? me.FindFirstValue("sub")!);

            if (dto.AssigneeId is Guid aid)
            {
                var assignee = await db.Users.FindAsync(aid);
                if (assignee is null || !assignee.IsActive)
                    return Results.BadRequest(new { error = "Assignee not found or inactive." });
            }

            var count = await db.Tickets.CountAsync();
            var t = new Ticket {
                TicketNumber = $"BUG-{1000 + count + 1}",
                Title = dto.Title, Description = dto.Description ?? "",
                Type = type, Priority = pri, Severity = sev,
                ProjectId = dto.ProjectId, AssigneeId = dto.AssigneeId, ReporterId = reporterId,
                DueDate = dto.DueDate,
                Environment = dto.Environment, StepsToReproduce = dto.StepsToReproduce,
                ExpectedResult = dto.ExpectedResult, ActualResult = dto.ActualResult,
                TechnicalNotes = dto.TechnicalNotes,
                EstimatedHours = dto.EstimatedHours, SpentHours = dto.SpentHours,
                DuplicateOfTicketId = dto.DuplicateOfTicketId,
            };

            var v = TicketRules.Validate(t, true);
            if (!v.Ok) return Results.BadRequest(new { error = v.Error });

            db.Tickets.Add(t);
            await ApplyTagsAsync(db, t, dto.Tags);
            await db.SaveChangesAsync();

            var loaded = await db.Tickets.Include(x => x.Project).Include(x => x.Assignee).Include(x => x.Reporter)
                .Include(x => x.TicketTags).ThenInclude(tt => tt.Tag).FirstAsync(x => x.Id == t.Id);
            return Results.Created($"/api/tickets/{t.Id}", loaded.ToDto());
        });

        g.MapPut("/{id:guid}", async (Guid id, TicketUpsertDto dto, ClaimsPrincipal me, AppDbContext db) =>
        {
            var t = await db.Tickets.Include(x => x.TicketTags).FirstOrDefaultAsync(x => x.Id == id);
            if (t is null) return Results.NotFound();

            var role = me.FindFirstValue(ClaimTypes.Role);
            bool canChangePriSev = role is "ProductOwner" or "TechLead" or "Admin";
            bool canAssign = role is "TechLead" or "Admin";

            if (!Enum.TryParse<TicketType>(dto.Type, true, out var type)) return Results.BadRequest(new { error = "Invalid type" });
            if (!Enum.TryParse<TicketPriority>(dto.Priority, true, out var pri)) return Results.BadRequest(new { error = "Invalid priority" });
            if (!Enum.TryParse<TicketSeverity>(dto.Severity, true, out var sev)) return Results.BadRequest(new { error = "Invalid severity" });

            t.Title = dto.Title; t.Description = dto.Description ?? "";
            t.Type = type;
            if (canChangePriSev) { t.Priority = pri; t.Severity = sev; }
            t.ProjectId = dto.ProjectId;
            if (canAssign)
            {
                if (dto.AssigneeId is Guid aid)
                {
                    var u = await db.Users.FindAsync(aid);
                    if (u is null || !u.IsActive) return Results.BadRequest(new { error = "Assignee inactive." });
                }
                t.AssigneeId = dto.AssigneeId;
            }
            t.DueDate = dto.DueDate;
            t.Environment = dto.Environment; t.StepsToReproduce = dto.StepsToReproduce;
            t.ExpectedResult = dto.ExpectedResult; t.ActualResult = dto.ActualResult;
            t.TechnicalNotes = dto.TechnicalNotes;
            t.EstimatedHours = dto.EstimatedHours; t.SpentHours = dto.SpentHours;
            t.DuplicateOfTicketId = dto.DuplicateOfTicketId;
            t.UpdatedAt = DateTime.UtcNow;

            var v = TicketRules.Validate(t, false);
            if (!v.Ok) return Results.BadRequest(new { error = v.Error });

            db.TicketTags.RemoveRange(t.TicketTags);
            await ApplyTagsAsync(db, t, dto.Tags);
            await db.SaveChangesAsync();

            var loaded = await db.Tickets.Include(x => x.Project).Include(x => x.Assignee).Include(x => x.Reporter)
                .Include(x => x.TicketTags).ThenInclude(tt => tt.Tag).FirstAsync(x => x.Id == t.Id);
            return Results.Ok(loaded.ToDto());
        });

        g.MapPatch("/{id:guid}/status", async (Guid id, StatusUpdateDto dto, ClaimsPrincipal me, AppDbContext db) =>
        {
            var role = me.FindFirstValue(ClaimTypes.Role);
            if (role is not ("Developer" or "QA" or "TechLead" or "Admin" or "ProductOwner"))
                return Results.Forbid();
            if (!Enum.TryParse<TicketStatus>(dto.Status.Replace(" ", ""), true, out var status))
                return Results.BadRequest(new { error = "Invalid status" });
            var t = await db.Tickets.FindAsync(id);
            if (t is null) return Results.NotFound();
            TicketRules.ApplyStatusSideEffects(t, status);
            await db.SaveChangesAsync();
            return Results.NoContent();
        });

        g.MapDelete("/{id:guid}", async (Guid id, AppDbContext db) =>
        {
            var t = await db.Tickets.FindAsync(id);
            if (t is null) return Results.NotFound();
            db.Tickets.Remove(t);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization(p => p.RequireRole("Admin"));

        // Comments
        var c = app.MapGroup("/api/tickets/{ticketId:guid}/comments").RequireAuthorization();
        c.MapGet("/", async (Guid ticketId, AppDbContext db) =>
        {
            var list = await db.Comments.Include(x => x.Author).Where(x => x.TicketId == ticketId)
                .OrderBy(x => x.CreatedAt).ToListAsync();
            return Results.Ok(list.Select(x => new CommentDto(x.Id, x.TicketId, x.AuthorId, x.Author!.FullName, x.Content, x.CreatedAt)));
        });
        c.MapPost("/", async (Guid ticketId, CommentCreateDto dto, ClaimsPrincipal me, AppDbContext db) =>
        {
            var uid = Guid.Parse(me.FindFirstValue(ClaimTypes.NameIdentifier) ?? me.FindFirstValue("sub")!);
            if (string.IsNullOrWhiteSpace(dto.Content)) return Results.BadRequest(new { error = "Content required" });
            var cm = new Comment { TicketId = ticketId, AuthorId = uid, Content = dto.Content.Trim() };
            db.Comments.Add(cm);
            await db.SaveChangesAsync();
            var author = await db.Users.FindAsync(uid);
            return Results.Created($"/api/tickets/{ticketId}/comments/{cm.Id}",
                new CommentDto(cm.Id, cm.TicketId, cm.AuthorId, author!.FullName, cm.Content, cm.CreatedAt));
        });
    }

    static async Task ApplyTagsAsync(AppDbContext db, Ticket t, List<string>? tagNames)
    {
        if (tagNames is null) return;
        foreach (var raw in tagNames.Distinct(StringComparer.OrdinalIgnoreCase))
        {
            var name = raw.Trim().ToLowerInvariant();
            if (string.IsNullOrEmpty(name)) continue;
            var tag = await db.Tags.FirstOrDefaultAsync(x => x.Name == name);
            if (tag is null) { tag = new Tag { Name = name }; db.Tags.Add(tag); await db.SaveChangesAsync(); }
            db.TicketTags.Add(new TicketTag { TicketId = t.Id, TagId = tag.Id });
        }
    }
}
