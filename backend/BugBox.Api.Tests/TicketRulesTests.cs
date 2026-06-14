using BugBox.Api.Models;
using BugBox.Api.Services;
using Xunit;

namespace BugBox.Api.Tests;

public class TicketRulesTests
{
    [Fact] public void Done_SetsResolvedAt()
    {
        var t = new Ticket { Status = TicketStatus.InProgress };
        TicketRules.ApplyStatusSideEffects(t, TicketStatus.Done);
        Assert.NotNull(t.ResolvedAt);
    }

    [Fact] public void DoneToInProgress_ClearsResolvedAt()
    {
        var t = new Ticket { Status = TicketStatus.Done, ResolvedAt = DateTime.UtcNow };
        TicketRules.ApplyStatusSideEffects(t, TicketStatus.InProgress);
        Assert.Null(t.ResolvedAt);
    }

    [Fact] public void UrgentWithoutDueDate_IsInvalid()
    {
        var t = new Ticket { Priority = TicketPriority.Urgent, Type = TicketType.Task, StepsToReproduce = "n/a" };
        var v = TicketRules.Validate(t, true);
        Assert.False(v.Ok);
    }

    [Fact] public void BugWithoutSteps_IsInvalid()
    {
        var t = new Ticket { Type = TicketType.Bug, Priority = TicketPriority.Low };
        var v = TicketRules.Validate(t, true);
        Assert.False(v.Ok);
    }

    [Fact] public void NegativeHours_Invalid()
    {
        var t = new Ticket { Type = TicketType.Task, EstimatedHours = -1 };
        var v = TicketRules.Validate(t, true);
        Assert.False(v.Ok);
    }
}
