export type EntityKind = "goal" | "source" | "point" | "idea" | "project" | "artifact";
import type { TaskRecurrence } from "./task-recurrence-types";
import type { TaskImportanceDimensions } from "./task-importance-types";
import type { TaskUrgencyInputs } from "./task-urgency-types";
import type { TaskEffortInputs } from "./task-effort-types";
export type { TaskRecurrence } from "./task-recurrence-types";
export type { TaskImportanceDimensions } from "./task-importance-types";
export type { PointList, ReferencePoint, ReferencePointInput } from "./reference-point";
export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}
export interface Cycle extends BaseEntity {
  name: string;
  startDate: string;
  endDate: string;
  cadence: "day" | "week" | "month" | "year";
  status: "active" | "archived";
  review: string;
}

export interface Goal extends BaseEntity {
  cycleId: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "notStarted" | "active" | "completed";
}

export interface WorkSession extends BaseEntity {
  cycleId: string;
  goalId?: string;
  projectId?: string;
  taskId?: string;
  title: string;
  startedAt: string;
  endedAt: string;
  minutes: number;
  effective: boolean;
  focus: number;
  output: string;
  note: string;
}

export interface EventReason extends BaseEntity {
  cycleId: string;
  projectId?: string;
  type: "success" | "error" | "general";
  phenomenon: string;
  reason: string;
  impact: string;
  evidence: string;
  action: string;
  category:
    "method" | "knowledge" | "plan" | "communication" | "resource" | "external";
  confirmed: boolean;
}

export interface SourceRecord extends BaseEntity {
  title: string;
  authors: string;
  year: string;
  origin: string;
  citation: string;
  category: string;
  fileName: string;
  fileToken: string;
  filePath: string;
  markdownToken: string;
  markdownPath: string;
  fileType: "pdf" | "markdown" | "manual";
  content: string;
  summary: string;
  guide: string;
  tags: string[];
  listIds: string[];
  favorite: boolean;
  rating: number;
  publicationDate: string;
  readingStatus: "unread" | "reading" | "read";
  readingStartedAt?: string;
  readingCompletedAt?: string;
  studyDurationMinutes: number;
  readingReview: LiteratureReview;
  conversionStatus: "ready" | "processing" | "failed";
  conversionMessage: string;
}

export type LiteratureReviewType =
  "review" | "discovery" | "method" | "application" | "validation" | "";

export interface LiteratureReview {
  type: LiteratureReviewType;
  problem: string;
  approach: string;
  result: string;
  limitation: string;
  inspiration: string;
  structure: string;
}

export interface LibraryList extends BaseEntity {
  name: string;
  note: string;
  tags: string[];
  color: string;
  system: "default" | "recent" | "marked" | null;
}

export interface ProjectList extends BaseEntity {
  name: string;
  note: string;
  color: string;
  system: "default" | "recent" | null;
}

export interface TaskList extends BaseEntity {
  name: string;
  note: string;
  color: string;
  system: "default" | "formal" | "casual" | null;
}

export interface IdeaList extends BaseEntity {
  name: string;
  note: string;
  color: string;
  system: "default" | "recent" | null;
}

export interface Annotation extends BaseEntity {
  sourceId: string;
  location: string;
  quote: string;
  kind: "positive" | "negative" | "neutral";
  reason: string;
}
export interface Idea extends BaseEntity {
  title: string;
  content: string;
  definition: string;
  reason: string;
  date: string;
  status:
    | "inbox"
    | "spark"
    | "exploring"
    | "explore"
    | "validate"
    | "candidate"
    | "converted"
    | "promoted"
    | "park"
    | "rejected"
    | "paused"
    | "archived";
  method:
    | "capture"
    | "combine"
    | "transfer"
    | "alternative"
    | "premise"
    | "followUp"
    | "macro"
    | "micro";
  sourceIds: string[];
  listIds: string[];
  tags: string[];
  chatMessages?: IdeaChatMessage[];
  scores: {
    value: number;
    feasibility: number;
    novelty: number;
    cost: number;
    risk: number;
  };
  evaluation?: IdeaEvaluation;
}
export type IdeaChatMessage = { id: string; role: "user" | "assistant"; content: string; createdAt: string };
export type IdeaDimension =
  "value" | "relevance" | "feasibility" | "testability" | "opportunity";

export interface IdeaEvaluation {
  answers: number[];
  killCondition: string;
  totalScore: number;
  dimensionScores: Record<IdeaDimension, number>;
  level: "strong" | "promising" | "uncertain" | "weak" | "poor";
  gateFailures: IdeaDimension[];
  strength: string;
  weakness: string;
  nextStep: string;
  evaluatedAt: string;
}

export interface ProjectRecord extends BaseEntity {
  name: string;
  purpose: string;
  expected: string;
  startDate: string;
  endDate: string;
  status:
    "concept" | "planning" | "active" | "paused" | "completed" | "archived";
  goalId?: string;
  ideaIds: string[];
  listIds: string[];
  tags: string[];
  score: number;
}

export type ActivityType = "task" | "event" | "routine";

export interface ActivityRecord extends BaseEntity, TaskImportanceDimensions, TaskUrgencyInputs, TaskEffortInputs {
  projectId?: string;
  listIds?: string[];
  parentId?: string;
  /** Activity classification; omitted on legacy records and treated as task. */
  activityType?: ActivityType;
  title: string;
  description: string;
  startDate: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done" | "overdue";
  estimatedMinutes: number;
  actualMinutes: number;
  milestone: boolean;
  expectedOutput: string;
  importance: number;
  recurrence: TaskRecurrence | null;
  recurrenceSourceId?: string;
  actualStartedAt?: string;
  completedAt?: string;
  /** An archived activity is immutable and remains in the task collection. */
  archivedAt?: string;
}

export interface DailyTask extends BaseEntity, TaskImportanceDimensions, TaskUrgencyInputs, TaskEffortInputs {
  date: string;
  title: string;
  description: string;
  completed: boolean;
  dueAt: string;
  completedAt?: string;
  estimatedMinutes: number;
  actualMinutes: number;
  expectedOutput: string;
  importance: number;
  sourceTaskId?: string;
  projectId?: string;
}

export interface ProjectLog extends BaseEntity {
  projectId: string;
  taskId?: string;
  period: "day" | "week" | "month" | "year";
  filePath: string;
  type: "progress" | "decision" | "problem" | "conclusion";
  content: string;
  nextStep: string;
  sourceIds: string[];
  ideaIds: string[];
  tags: string[];
}

export interface Attachment extends BaseEntity {
  projectId: string;
  logId?: string;
  name: string;
  filePath: string;
  fileToken?: string;
  mimeType: string;
  size: number;
  description: string;
  status: "available" | "missing";
}

export interface Artifact extends BaseEntity {
  title: string;
  type: "paper" | "poster" | "slides" | "social" | "blog" | "custom";
  status: "draft" | "review" | "final" | "published" | "archived";
  content: string;
  projectIds: string[];
  sourceIds: string[];
  ideaIds: string[];
  materials: string[];
  tags: string[];
  channel: string;
  externalUrl: string;
  feedback: string;
  completedAt?: string;
}

export interface Relation extends BaseEntity {
  fromKind: EntityKind;
  fromId: string;
  toKind: EntityKind;
  toId: string;
  relation: "source" | "derived" | "supports" | "produces";
  createdBy: "user" | "system";
}

export interface AIJob extends BaseEntity {
  taskType: "guide" | "summary" | "idea" | "artifact";
  inputLabel: string;
  output: string;
  status: "queued" | "processing" | "success" | "failed" | "cancelled";
  provider: "local-demo";
  entityId: string;
  error?: string;
}
