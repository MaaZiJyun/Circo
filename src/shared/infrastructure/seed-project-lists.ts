import type {
  Idea,
  IdeaList,
  PointList,
  ProjectList,
  TaskList,
} from "@/shared/model/entities";

export function seedProjects(stamp: string): ProjectList[] {
  return [
    {
      id: "project_list_default",
      name: "All Projects",
      note: "All projects",
      color: "#18181b",
      system: "default",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "project_list_recent",
      name: "Recently Added",
      note: "Projects added in the last seven days",
      color: "#2563eb",
      system: "recent",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

export function seedTaskLists(stamp: string): TaskList[] {
  return [
    {
      id: "task_list_default",
      name: "All Tasks",
      note: "All tasks",
      color: "#18181b",
      system: "default",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "task_list_formal",
      name: "Formal",
      note: "Tasks that belong to a project",
      color: "#2563eb",
      system: "formal",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "task_list_casual",
      name: "Casual",
      note: "Tasks that do not belong to any project",
      color: "#f59e0b",
      system: "casual",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

export function seedIdeas(stamp: string): IdeaList[] {
  return [
    {
      id: "idea_list_default",
      name: "All Ideas",
      note: "All ideas",
      color: "#18181b",
      system: "default",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "idea_list_recent",
      name: "Recently Added",
      note: "Ideas added in the last seven days",
      color: "#2563eb",
      system: "recent",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

export function seedPointLists(stamp: string): PointList[] {
  return [
    {
      id: "point_list_default",
      name: "All Points",
      note: "All extracted points",
      color: "#f59e0b",
      system: "default",
      createdAt: stamp,
      updatedAt: stamp,
    },
    {
      id: "point_list_recent",
      name: "Recently Added",
      note: "Points added in the last seven days",
      color: "#2563eb",
      system: "recent",
      createdAt: stamp,
      updatedAt: stamp,
    },
  ];
}

export function seedIdea(stamp: string): Idea {
  return {
    id: "idea_decentral",
    title: "去中心化多模态架构",
    content: "将中心化融合节点改成可协商的分布式表示交换。",
    definition: "将中心化融合节点改成可协商的分布式表示交换。",
    reason: "阅读多模态架构材料后，对中心节点依赖进行后续推演。",
    date: "2026-08-11",
    status: "candidate",
    method: "followUp",
    sourceIds: ["source_multi"],
    listIds: [],
    tags: ["架构", "去中心化"],
    scores: { value: 4, feasibility: 3, novelty: 4, cost: 3, risk: 3 },
    createdAt: stamp,
    updatedAt: stamp,
  };
}
