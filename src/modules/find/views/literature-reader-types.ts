import type {
  PointList,
  ReferencePoint,
  ReferencePointInput,
  SourceRecord,
} from "@/shared/model/entities";

export interface LiteratureReaderProps {
  source: SourceRecord;
  onBack: () => void;
  onSave: (content: string) => Promise<void>;
  onConvert: () => Promise<{ content: string; warning?: string }>;
  onUpdate: (change: Partial<SourceRecord>) => void;
  points: ReferencePoint[];
  pointLists: PointList[];
  onCreatePoint: (point: ReferencePointInput) => void;
  onUpdatePoint: (id: string, change: ReferencePointInput) => void;
  onDeletePoint: (id: string) => void;
}
