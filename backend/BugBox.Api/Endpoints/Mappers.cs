using BugBox.Api.DTOs;
using BugBox.Api.Models;

namespace BugBox.Api.Endpoints;

public static class Mappers
{
    public static TicketDto ToDto(this Ticket t) => new(
        t.Id, t.TicketNumber, t.Title, t.Description,
        t.Type.ToString(), t.Status.ToString(), t.Priority.ToString(), t.Severity.ToString(),
        t.ProjectId, t.Project?.Name,
        t.AssigneeId, t.Assignee?.FullName,
        t.ReporterId, t.Reporter?.FullName ?? "Unknown",
        t.CreatedAt, t.UpdatedAt, t.DueDate, t.ResolvedAt,
        t.Environment, t.StepsToReproduce, t.ExpectedResult, t.ActualResult,
        t.TechnicalNotes, t.EstimatedHours, t.SpentHours,
        t.DuplicateOfTicketId,
        t.TicketTags.Select(tt => tt.Tag!.Name).OrderBy(x => x).ToList());

    public static ProjectDto ToDto(this Project p) =>
        new(p.Id, p.Name, p.ClientName, p.Description, p.Status.ToString(), p.CreatedAt);

    public static UserDto ToDto(this User u) =>
        new(u.Id, u.FullName, u.Email, u.Role.ToString(), u.AvatarUrl, u.IsActive);
}
