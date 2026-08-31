import type { BaseEntity } from "./entities";

export interface PointList extends BaseEntity {
  name: string;
  note: string;
  color: string;
  system: "default" | "recent" | null;
}

export interface ReferencePoint extends BaseEntity {
  sourceId: string;
  type: "text" | "image";
  content: string;
  contentPath: string;
  date: string;
  author: string;
  note: string;
  page: number;
  location: { x: number; y: number; width: number; height: number };
  listIds: string[];
}

export type ReferencePointInput = Omit<
  ReferencePoint,
  "id" | "createdAt" | "updatedAt"
>;
