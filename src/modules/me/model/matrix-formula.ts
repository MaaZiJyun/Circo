import type { MatrixFormulaSettings } from "@/shared/model/app-state";
import type { DailyTask } from "@/shared/model/entities";
import type { TaskCoordinates } from "./task-quadrant";

export const defaultMatrixFormulas: MatrixFormulaSettings = {
  urgency: "(deadline + delayLoss + blocking - 2) / 13 * 100",
  importance: "(impact + goal + risk + value - 4) / 16 * 100",
  x: "urgency",
  y: "importance",
  size: "48 + effort / 125 * 80",
  dispersion: 1,
};

const replacedDefaultMatrixFormulas: MatrixFormulaSettings[] = [
  {
    x: "urgency + createdX",
    y: "importance + createdY",
    size: "48 + estimatedMinutes / maxEstimatedMinutes * 80",
  },
  {
    x: "urgency + (((createdTimestamp * 37) % 97) / 96 - 0.5) * 16",
    y: "importance + (((createdTimestamp * 53) % 89) / 88 - 0.5) * 16",
    size: "48 + estimatedMinutes / maxEstimatedMinutes * 80",
  },
  {
    x: "urgency * 0.35 + (quadrantXMin + ((createdTimestamp * 37) % 97) / 96 * 46) * 0.65",
    y: "importance * 0.35 + (quadrantYMin + ((createdTimestamp * 53) % 89) / 88 * 46) * 0.65",
    size: "48 + estimatedMinutes / maxEstimatedMinutes * 80",
  },
];

export const matrixFormulaVariables = [
  "urgency",
  "importance",
  "estimatedMinutes",
  "maxEstimatedMinutes",
  "effort",
  "maxEffort",
  "priority",
  "remainingMinutes",
  "ageDays",
  "createdTimestamp",
  "createdHour",
  "createdMinute",
  "createdSecond",
  "quadrantXMin",
  "quadrantYMin",
  "createdX",
  "createdY",
] as const;

type Variables = Record<(typeof matrixFormulaVariables)[number], number>;
type Token = { kind: "number" | "name" | "symbol"; value: string };

function tokenize(expression: string) {
  const tokens: Token[] = [];
  let rest = expression;
  while (rest.trim()) {
    const match = rest.match(
      /^\s*(?:(\d+(?:\.\d+)?)|([A-Za-z_]\w*)|([()+\-*/%]))/,
    );
    if (!match) throw new Error("Unsupported character");
    tokens.push({
      kind: match[1] ? "number" : match[2] ? "name" : "symbol",
      value: match[1] ?? match[2] ?? match[3],
    });
    rest = rest.slice(match[0].length);
  }
  return tokens;
}

export function evaluateMatrixFormula(
  expression: string,
  variables: Record<string, number>,
) {
  const tokens = tokenize(expression);
  let index = 0;
  const primary = (): number => {
    const token = tokens[index++];
    if (!token) throw new Error("Incomplete formula");
    if (token.kind === "number") return Number(token.value);
    if (token.kind === "name") {
      if (!(token.value in variables))
        throw new Error(`Unknown variable: ${token.value}`);
      return variables[token.value];
    }
    if (token.value === "(") {
      const value = addition();
      if (tokens[index++]?.value !== ")")
        throw new Error("Missing closing parenthesis");
      return value;
    }
    if (token.value === "+") return primary();
    if (token.value === "-") return -primary();
    throw new Error("Expected a number or variable");
  };
  const multiplication = (): number => {
    let value = primary();
    while (["*", "/", "%"].includes(tokens[index]?.value)) {
      const operator = tokens[index++].value;
      const operand = primary();
      value =
        operator === "*"
          ? value * operand
          : operator === "/"
            ? value / operand
            : value % operand;
    }
    return value;
  };
  const addition = (): number => {
    let value = multiplication();
    while (tokens[index]?.value === "+" || tokens[index]?.value === "-") {
      const operator = tokens[index++].value;
      const operand = multiplication();
      value = operator === "+" ? value + operand : value - operand;
    }
    return value;
  };
  const result = addition();
  if (index !== tokens.length) throw new Error("Unexpected token");
  if (!Number.isFinite(result))
    throw new Error("Result must be a finite number");
  return result;
}

function creationOffsets(createdAt: string) {
  let hash = 2_166_136_261;
  for (const character of createdAt) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16_777_619);
  }
  const unsigned = hash >>> 0;
  const angle = ((unsigned % 360) * Math.PI) / 180;
  const radius = 4 + ((unsigned >>> 9) % 7);
  return {
    createdX: Math.cos(angle) * radius,
    createdY: Math.sin(angle) * radius,
  };
}

export function resolveMatrixFormulas(value?: MatrixFormulaSettings) {
  if (
    replacedDefaultMatrixFormulas.some(
      (item) =>
        value?.x === item.x && value.y === item.y && value.size === item.size,
    )
  )
    return defaultMatrixFormulas;
  return value
    ? {
        ...defaultMatrixFormulas,
        ...value,
        urgency:
          value.urgency === "(dueRange + delayLoss + dependency) / 15 * 100" ||
          value.urgency === "(deadline + delayLoss + blocking) / 15 * 100"
            ? defaultMatrixFormulas.urgency
            : (value.urgency ?? defaultMatrixFormulas.urgency),
        importance:
          value.importance === "importance" ||
          value.importance === "importance * 5" ||
          value.importance === "(impact + goal + risk + value) * 5"
            ? defaultMatrixFormulas.importance
            : (value.importance ?? defaultMatrixFormulas.importance),
        dispersion: value.dispersion ?? defaultMatrixFormulas.dispersion,
      }
    : defaultMatrixFormulas;
}

export function matrixBubble(
  task: DailyTask,
  point: TaskCoordinates,
  maximumEffort: number,
  formulas?: MatrixFormulaSettings,
  currentTime = Date.now(),
) {
  const createdTime = Date.parse(task.createdAt);
  const createdDate = new Date(createdTime);
  const dueTime = Date.parse(task.dueAt);
  const variables: Variables = {
    urgency: point.urgency,
    importance: point.importance,
    estimatedMinutes: Math.max(0, task.estimatedMinutes),
    maxEstimatedMinutes: Math.max(1, task.estimatedMinutes),
    effort: point.effort,
    maxEffort: Math.max(1, maximumEffort),
    priority: point.priority,
    remainingMinutes: Number.isFinite(dueTime)
      ? (dueTime - currentTime) / 60_000
      : 0,
    ageDays: Number.isFinite(createdTime)
      ? Math.max(0, currentTime - createdTime) / 86_400_000
      : 0,
    createdTimestamp: Number.isFinite(createdTime) ? createdTime / 1000 : 0,
    createdHour: Number.isFinite(createdTime) ? createdDate.getHours() : 0,
    createdMinute: Number.isFinite(createdTime) ? createdDate.getMinutes() : 0,
    createdSecond: Number.isFinite(createdTime) ? createdDate.getSeconds() : 0,
    quadrantXMin: point.urgency >= 50 ? 52 : 2,
    quadrantYMin: point.importance >= 50 ? 52 : 2,
    ...creationOffsets(task.createdAt),
  };
  const selected = resolveMatrixFormulas(formulas);
  const fallback = defaultMatrixFormulas;
  const calculate = (formula: string, defaultFormula: string) => {
    try {
      return evaluateMatrixFormula(formula, variables);
    } catch {
      return evaluateMatrixFormula(defaultFormula, variables);
    }
  };
  return {
    x: Math.min(100, Math.max(0, calculate(selected.x, fallback.x))),
    y: Math.min(100, Math.max(0, calculate(selected.y, fallback.y))),
    diameter: Math.min(
      200,
      Math.max(32, calculate(selected.size, fallback.size)),
    ),
  };
}

export function validateMatrixFormulas(formulas: MatrixFormulaSettings) {
  const variables = Object.fromEntries(
    matrixFormulaVariables.map((name) => [name, 1]),
  ) as Variables;
  evaluateMatrixFormula(formulas.x, variables);
  evaluateMatrixFormula(formulas.y, variables);
  evaluateMatrixFormula(formulas.size, variables);
  const dispersion = formulas.dispersion ?? 1;
  if (!Number.isFinite(dispersion) || dispersion < 0.1 || dispersion > 10)
    throw new Error("Dispersion must be between 0.1 and 10");
}

interface LayoutBubble {
  x: number;
  y: number;
  quadrant: TaskCoordinates["quadrant"];
}

function geometricMedian(points: LayoutBubble[]) {
  let center = {
    x: points.reduce((sum, item) => sum + item.x, 0) / points.length,
    y: points.reduce((sum, item) => sum + item.y, 0) / points.length,
  };
  for (let iteration = 0; iteration < 24; iteration += 1) {
    let weight = 0;
    let weightedX = 0;
    let weightedY = 0;
    for (const point of points) {
      const distance = Math.hypot(point.x - center.x, point.y - center.y);
      const pointWeight = 1 / Math.max(distance, 0.001);
      weight += pointWeight;
      weightedX += point.x * pointWeight;
      weightedY += point.y * pointWeight;
    }
    const next = { x: weightedX / weight, y: weightedY / weight };
    if (Math.hypot(next.x - center.x, next.y - center.y) < 0.001) return next;
    center = next;
  }
  return center;
}

function quadrantBounds(quadrant: TaskCoordinates["quadrant"]) {
  return {
    x: quadrant === "do" || quadrant === "delegate" ? [52, 98] : [2, 48],
    y: quadrant === "do" || quadrant === "schedule" ? [52, 98] : [2, 48],
  } as const;
}

export function adjustQuadrantDispersion<T extends LayoutBubble>(
  bubbles: T[],
  multiplier: number,
) {
  const result = new Map<T, T>();
  for (const quadrant of ["do", "schedule", "delegate", "eliminate"] as const) {
    const group = bubbles.filter((item) => item.quadrant === quadrant);
    if (!group.length) continue;
    const center = geometricMedian(group);
    const bounds = quadrantBounds(quadrant);
    for (const item of group) {
      const x = center.x + (item.x - center.x) * multiplier;
      const y = center.y + (item.y - center.y) * multiplier;
      result.set(item, {
        ...item,
        x: Math.min(bounds.x[1], Math.max(bounds.x[0], x)),
        y: Math.min(bounds.y[1], Math.max(bounds.y[0], y)),
      });
    }
  }
  return bubbles.map((item) => result.get(item) ?? item);
}
