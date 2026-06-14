using System.ComponentModel.DataAnnotations;

namespace BugBox.Api.Models;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required, MaxLength(120)] public string FullName { get; set; } = "";
    [Required, MaxLength(200)] public string Email { get; set; } = "";
    [Required] public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
    public string? AvatarUrl { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Project
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required, MaxLength(120)] public string Name { get; set; } = "";
    [Required, MaxLength(120)] public string ClientName { get; set; } = "";
    public string Description { get; set; } = "";
    public ProjectStatus Status { get; set; } = ProjectStatus.Active;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public List<Ticket> Tickets { get; set; } = new();
}

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required, MaxLength(20)] public string TicketNumber { get; set; } = "";
    [Required, MaxLength(200)] public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public TicketType Type { get; set; }
    public TicketStatus Status { get; set; } = TicketStatus.New;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketSeverity Severity { get; set; } = TicketSeverity.Minor;

    public Guid ProjectId { get; set; }
    public Project? Project { get; set; }
    public Guid? AssigneeId { get; set; }
    public User? Assignee { get; set; }
    public Guid ReporterId { get; set; }
    public User? Reporter { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DueDate { get; set; }
    public DateTime? ResolvedAt { get; set; }

    public string? Environment { get; set; }
    public string? StepsToReproduce { get; set; }
    public string? ExpectedResult { get; set; }
    public string? ActualResult { get; set; }
    public string? TechnicalNotes { get; set; }
    public decimal? EstimatedHours { get; set; }
    public decimal? SpentHours { get; set; }
    public Guid? DuplicateOfTicketId { get; set; }

    public List<Comment> Comments { get; set; } = new();
    public List<ActivityLog> Activity { get; set; } = new();
    public List<TicketTag> TicketTags { get; set; } = new();
}

public class Comment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public Ticket? Ticket { get; set; }
    public Guid AuthorId { get; set; }
    public User? Author { get; set; }
    [Required] public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ActivityLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public Guid UserId { get; set; }
    public User? User { get; set; }
    public string ActionType { get; set; } = "";
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Tag
{
    public Guid Id { get; set; } = Guid.NewGuid();
    [Required, MaxLength(50)] public string Name { get; set; } = "";
    public List<TicketTag> TicketTags { get; set; } = new();
}

public class TicketTag
{
    public Guid TicketId { get; set; }
    public Ticket? Ticket { get; set; }
    public Guid TagId { get; set; }
    public Tag? Tag { get; set; }
}
