namespace BugBox.Api.Models;

public enum TicketType { Bug, Feature, Task, Improvement, Incident, Refactor, Documentation }
public enum TicketStatus { New, Triaged, InProgress, InReview, ReadyForQA, Done, Rejected, Duplicate }
public enum TicketPriority { Low, Medium, High, Urgent }
public enum TicketSeverity { Minor, Major, Critical, Blocker }
public enum ProjectStatus { Active, Paused, Archived }
public enum UserRole { Developer, QA, ProductOwner, TechLead, Admin }
