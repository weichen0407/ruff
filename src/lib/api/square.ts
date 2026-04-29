// iOS 模拟器访问 Mac 主机不能用 localhost，用 127.0.0.1 或局域网 IP
const API_BASE = 'http://127.0.0.1:3000';

export interface SquarePlan {
  id: string;
  name: string;
  targetDistance: string;
  targetTime: number;
  vdot: number;
  paceE: number;
  paceM: number;
  paceT: number;
  paceI: number;
  paceR: number;
  weeks: number;
  planDesc: string | null;
  weeksData: SquareWeek[];
}

export interface SquareWeek {
  id: string;
  weekIndex: number;
  weekDesc: string | null;
  days: SquareDay[];
}

export interface SquareDay {
  id: string;
  dayIndex: number;
  dayDesc: string | null;
  units: SquareUnit[];
}

export interface SquareUnit {
  id: string;
  type: 'run' | 'rest' | 'other';
  orderIndex: number;
  paceMode: string | null;
  paceValue: string | null;
  standardType: string | null;
  standardValue: number | null;
  standard: string | null;
  content: string | null;
}

export async function fetchPlanSquare(): Promise<SquarePlan[]> {
  const res = await fetch(`${API_BASE}/api/plan-square`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error);
  return json.plans;
}
