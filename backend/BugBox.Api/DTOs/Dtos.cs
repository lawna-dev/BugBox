using BugBox.Api.Models;

namespace BugBox.Api.DTOs;

public record RegisterRequest(string FullName, string Email, string Password, string Role);
public record LoginRequest(string Email, string Password);
public record AuthUserDto(Guid Id, string FullName, string Email, string Role, string? AvatarUrl, bool IsActive);
public record LoginResponse(string Token, AuthUserDto User);

public record ProjectDto(Guid Id, string Name, string ClientName, string Description, string Status, DateTime CreatedAt);
public record ProjectUpsertDto(string Name, string ClientName, string Description, string Status);

public record UserDto(Guid Id, string FullName, string Email, string Role, string? AvatarUrl, bool IsActive);

public record TagDto(Guid Id, string Name);

public record TicketDto(
    Guid Id, string TicketNumber, string Title, string Description,
    string Type, string Status, string Priority, string Severity,
    Guid ProjectId, string? ProjectName,
    Guid? AssigneeId, string? AssigneeName,
    Guid ReporterId, string ReporterName,
    DateTime CreatedAt, DateTime UpdatedAt,
    DateTime? DueDate, DateTime? ResolvedAt,
    string? Environment, string? StepsToReproduce, string? ExpectedResult, string? ActualResult,
    string? TechnicalNotes, decimal? EstimatedHours, decimal? SpentHours,
    Guid? DuplicateOfTicketId, List<string> Tags);

public record TicketUpsertDto(
    string Title, string Description, string Type, string Priority, string Severity,
    Guid ProjectId, Guid? AssigneeId, Guid? ReporterId, DateTime? DueDate,
    string? Environment, string? StepsToReproduce, string? ExpectedResult, string? ActualResult,
    string? TechnicalNotes, decimal? EstimatedHours, decimal? SpentHours,
    Guid? DuplicateOfTicketId, List<string>? Tags);

public record StatusUpdateDto(string Status);

public record CommentDto(Guid Id, Guid TicketId, Guid AuthorId, string AuthorName, string Content, DateTime CreatedAt);
public record CommentCreateDto(string Content);
