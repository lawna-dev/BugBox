using BugBox.Api.Models;
using BugBox.Api.Services;

namespace BugBox.Api.Tests;

public class TicketRulesTests
{
    [Fact]
    public void Validate_WithValidTicket_ReturnsValidResult()
    {
        var ticket = CreateValidTicket();

        var result = TicketRules.Validate(ticket, isNew: true);

        Assert.True(result.Ok);
        Assert.Null(result.Error);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Validate_BugWithoutSteps_ReturnsExpectedError(string? steps)
    {
        var ticket = CreateValidTicket();
        ticket.Type = TicketType.Bug;
        ticket.StepsToReproduce = steps;

        var result = TicketRules.Validate(ticket, isNew: true);

        Assert.False(result.Ok);
        Assert.Equal("Bug tickets require steps to reproduce.", result.Error);
    }

    [Fact]
    public void Validate_UrgentTicketWithoutDueDate_ReturnsExpectedError()
    {
        var ticket = CreateValidTicket();
        ticket.Priority = TicketPriority.Urgent;
        ticket.DueDate = null;

        var result = TicketRules.Validate(ticket, isNew: true);

        Assert.False(result.Ok);
        Assert.Equal("Urgent tickets require a due date.", result.Error);
    }

    [Theory]
    [InlineData(-0.01, 1)]
    [InlineData(1, -0.01)]
    public void Validate_NegativeHours_ReturnsExpectedError(double estimated, double spent)
    {
        var ticket = CreateValidTicket();
        ticket.EstimatedHours = (decimal)estimated;
        ticket.SpentHours = (decimal)spent;

        var result = TicketRules.Validate(ticket, isNew: true);

        Assert.False(result.Ok);
        Assert.Equal("Hours cannot be negative.", result.Error);
    }

    [Fact]
    public void Validate_NewUrgentTicketWithPastDueDate_ReturnsExpectedError()
    {
        var ticket = CreateValidTicket();
        ticket.Priority = TicketPriority.Urgent;
        ticket.DueDate = DateTime.UtcNow.Date.AddDays(-1);

        var result = TicketRules.Validate(ticket, isNew: true);

        Assert.False(result.Ok);
        Assert.Equal("Due date cannot be in the past for a new urgent ticket.", result.Error);
    }

    [Fact]
    public void Validate_ExistingUrgentTicketWithPastDueDate_RemainsValid()
    {
        var ticket = CreateValidTicket();
        ticket.Priority = TicketPriority.Urgent;
        ticket.DueDate = DateTime.UtcNow.Date.AddDays(-1);

        var result = TicketRules.Validate(ticket, isNew: false);

        Assert.True(result.Ok);
    }

    [Fact]
    public void ApplyStatusSideEffects_MovingToDone_ResolvesAndUpdatesTicket()
    {
        var before = DateTime.UtcNow;
        var ticket = CreateValidTicket();
        ticket.Status = TicketStatus.InProgress;
        ticket.UpdatedAt = before.AddDays(-1);

        TicketRules.ApplyStatusSideEffects(ticket, TicketStatus.Done);

        var after = DateTime.UtcNow;
        Assert.Equal(TicketStatus.Done, ticket.Status);
        Assert.InRange(ticket.ResolvedAt!.Value, before, after);
        Assert.InRange(ticket.UpdatedAt, before, after);
    }

    [Fact]
    public void ApplyStatusSideEffects_WhenAlreadyResolved_PreservesResolutionDate()
    {
        var resolvedAt = DateTime.UtcNow.AddDays(-2);
        var ticket = CreateValidTicket();
        ticket.Status = TicketStatus.Done;
        ticket.ResolvedAt = resolvedAt;

        TicketRules.ApplyStatusSideEffects(ticket, TicketStatus.Done);

        Assert.Equal(resolvedAt, ticket.ResolvedAt);
    }

    [Fact]
    public void ApplyStatusSideEffects_ReopeningDoneTicket_ClearsResolutionDate()
    {
        var ticket = CreateValidTicket();
        ticket.Status = TicketStatus.Done;
        ticket.ResolvedAt = DateTime.UtcNow.AddDays(-1);

        TicketRules.ApplyStatusSideEffects(ticket, TicketStatus.InProgress);

        Assert.Equal(TicketStatus.InProgress, ticket.Status);
        Assert.Null(ticket.ResolvedAt);
    }

    private static Ticket CreateValidTicket() => new()
    {
        Type = TicketType.Task,
        Priority = TicketPriority.Medium,
        EstimatedHours = 1,
        SpentHours = 0,
    };
}
