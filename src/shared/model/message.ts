import type { BaseEntity } from "./entities";

export type MessageReferenceKind =
  "source" | "point" | "idea" | "project" | "task";
export interface FutureMessage extends BaseEntity {
  subject: string;
  body: string;
  recipient: "futureSelf";
  deliveryMode: "scheduled" | "random";
  deliverAt: string;
  references: { kind: MessageReferenceKind; id: string; label: string }[];
  attachments: {
    name: string;
    fileToken: string;
    mimeType: string;
    size: number;
  }[];
  readAt?: string;
  favorite?: boolean;
  systemGenerated?: boolean;
}
