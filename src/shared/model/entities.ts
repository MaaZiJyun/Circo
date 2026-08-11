export type EntityKind = "goal" | "source" | "idea" | "project" | "artifact";

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
  fileName: string;
  fileToken: string;
  fileType: "pdf" | "markdown" | "manual";
  content: string;
  summary: string;
  guide: string;
  tags: string[];
  readingStatus: "unread" | "reading" | "read";
  conversionStatus: "ready" | "processing" | "failed";
  conversionMessage: string;
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
  status:
    "inbox" | "exploring" | "candidate" | "converted" | "paused" | "archived";
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
  tags: string[];
  scores: {
    value: number;
    feasibility: number;
    novelty: number;
    cost: number;
    risk: number;
  };
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
  tags: string[];
}

export interface TaskRecord extends BaseEntity {
  projectId: string;
  parentId?: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  status: "todo" | "doing" | "done";
  estimatedMinutes: number;
  actualMinutes: number;
  milestone: boolean;
}

export interface ProjectLog extends BaseEntity {
  projectId: string;
  taskId?: string;
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
  fileToken: string;
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
