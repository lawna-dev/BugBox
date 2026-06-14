using BugBox.Api.Models;

namespace BugBox.Api.Services;

public static class TicketRules
{
    public record ValidationResult(bool Ok, string? Error)
    {
        public static ValidationResult Valid() => new(true, null);
        public static ValidationResult Invalid(string e) => new(false, e);
    }

    public static ValidationResult Validate(Ticket t, bool isNew)
    {
        if (t.Priority == TicketPriority.Urgent && t.DueDate is null)
            return ValidationResult.Invalid("Urgent tickets require a due date.");
        if (t.Type == TicketType.Bug && string.IsNullOrWhiteSpace(t.StepsToReproduce))
            return ValidationResult.Invalid("Bug tickets require steps to reproduce.");
        if (t.EstimatedHours is < 0 || t.SpentHours is < 0)
            return ValidationResult.Invalid("Hours cannot be negative.");
        if (isNew && t.Priority == TicketPriority.Urgent && t.DueDate is not null && t.DueDate < DateTime.UtcNow.Date)
            return ValidationResult.Invalid("Due date cannot be in the past for a new urgent ticket.");
        return ValidationResult.Valid();
    }

    public static void ApplyStatusSideEffects(Ticket t, TicketStatus newStatus)
    {
        var old = t.Status;
        t.Status = newStatus;
        if (newStatus == TicketStatus.Done && t.ResolvedAt is null)
            t.ResolvedAt = DateTime.UtcNow;
        if (old == TicketStatus.Done && newStatus != TicketStatus.Done)
            t.ResolvedAt = null;
        t.UpdatedAt = DateTime.UtcNow;
    }
}
