using BugBox.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace BugBox.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Project> Projects => Set<Project>();
    public DbSet<Ticket> Tickets => Set<Ticket>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<ActivityLog> ActivityLogs => Set<ActivityLog>();
    public DbSet<Tag> Tags => Set<Tag>();
    public DbSet<TicketTag> TicketTags => Set<TicketTag>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Tag>().HasIndex(t => t.Name).IsUnique();
        b.Entity<Ticket>().HasIndex(t => t.TicketNumber).IsUnique();

        b.Entity<Ticket>()
            .HasOne(t => t.Project).WithMany(p => p.Tickets)
            .HasForeignKey(t => t.ProjectId).OnDelete(DeleteBehavior.Restrict);
        b.Entity<Ticket>()
            .HasOne(t => t.Assignee).WithMany()
            .HasForeignKey(t => t.AssigneeId).OnDelete(DeleteBehavior.SetNull);
        b.Entity<Ticket>()
            .HasOne(t => t.Reporter).WithMany()
            .HasForeignKey(t => t.ReporterId).OnDelete(DeleteBehavior.Restrict);

        b.Entity<TicketTag>().HasKey(tt => new { tt.TicketId, tt.TagId });
        b.Entity<TicketTag>().HasOne(tt => tt.Ticket).WithMany(t => t.TicketTags).HasForeignKey(tt => tt.TicketId);
        b.Entity<TicketTag>().HasOne(tt => tt.Tag).WithMany(t => t.TicketTags).HasForeignKey(tt => tt.TagId);

        b.Entity<Comment>()
            .HasOne(c => c.Ticket).WithMany(t => t.Comments)
            .HasForeignKey(c => c.TicketId).OnDelete(DeleteBehavior.Cascade);

        b.Entity<ActivityLog>()
            .HasOne<Ticket>().WithMany(t => t.Activity)
            .HasForeignKey(a => a.TicketId).OnDelete(DeleteBehavior.Cascade);
    }
}
