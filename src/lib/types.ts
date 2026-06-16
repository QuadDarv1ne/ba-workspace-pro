export type TaskType = 'integration' | 'migration' | 'uiux' | 'feature' | 'bug' | 'general' | 'api-design' | 'performance' | 'security' | 'compliance';
export type TaskStatus = 'active' | 'done' | 'blocked' | 'backlog';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Question {
  id: string;
  text: string;
  answer: string;
  completed: boolean;
  removed: boolean;
}

export interface AcceptanceCriteria {
  id: string;
  text: string;
  done: boolean;
}

export interface Decision {
  id: string;
  text: string;
}

export interface Risk {
  id: string;
  text: string;
  severity: 'low' | 'medium' | 'high';
}

export interface Tail {
  id: string;
  who: string;
  what: string;
  deadline: string;
}

export interface Dependency {
  id: string;
  text: string;
  blocks: boolean; // true = blocks us, false = we depend on
}

export interface Task {
  id: string;
  name: string;
  type: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  questions: Question[];
  acceptanceCrit: AcceptanceCriteria[];
  decisions: Decision[];
  risks: Risk[];
  tails: Tail[];
  dependencies: Dependency[];
  notes: string;
  timerSeconds: number;
  timerRunning: boolean;
  timerStartedAt: string | null;
  collapsedSecs: Record<string, boolean>;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = 'workspace' | 'analytics' | 'settings';
export type FilterStatus = 'all' | TaskStatus;
