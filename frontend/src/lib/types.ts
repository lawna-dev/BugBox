export type Role = "Developer" | "QA" | "ProductOwner" | "TechLead" | "Admin";

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export type TicketType = "Bug" | "Feature" | "Task" | "Improvement" | "Incident" | "Refactor" | "Documentation";
export type TicketStatus = "New" | "Triaged" | "InProgress" | "InReview" | "ReadyForQA" | "Done" | "Rejected" | "Duplicate";
export type TicketPriority = "Low" | "Medium" | "High" | "Urgent";
export type TicketSeverity = "Minor" | "Major" | "Critical" | "Blocker";

export interface Ticket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  severity: TicketSeverity;
  projectId: string;
  projectName?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  reporterId: string;
  reporterName: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string | null;
  resolvedAt?: string | null;
  environment?: string | null;
  stepsToReproduce?: string | null;
  expectedResult?: string | null;
  actualResult?: string | null;
  technicalNotes?: string | null;
  estimatedHours?: number | null;
  spentHours?: number | null;
  duplicateOfTicketId?: string | null;
  tags: string[];
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  description: string;
  status: "Active" | "Paused" | "Archived";
  createdAt: string;
}

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: Role;
  avatarUrl?: string | null;
  isActive: boolean;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export const STATUS_LABEL: Record<TicketStatus, string> = {
  New: "New", Triaged: "Triaged", InProgress: "In Progress", InReview: "In Review",
  ReadyForQA: "Ready for QA", Done: "Done", Rejected: "Rejected", Duplicate: "Duplicate",
};

export const KANBAN_COLUMNS: TicketStatus[] = ["New", "Triaged", "InProgress", "InReview", "ReadyForQA", "Done"];
