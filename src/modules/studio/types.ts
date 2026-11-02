export type DealStage = 'lead' | 'proposal' | 'negotiation' | 'won';
export type WorkKind = 'Video production' | 'Full-stack development' | 'Mobile app' | 'Brand design' | 'Content system';
/** Call/Meeting/Task/Email are entered by hand; Payment/Delivery/Deal are generated from invoices, projects and deals. */
export type TaskType = 'Call' | 'Meeting' | 'Task' | 'Email' | 'Payment' | 'Delivery' | 'Deal';
export type ProjectStatus = 'Planning' | 'Active' | 'Review' | 'Complete';

export interface Deal {
  id: string;
  title: string;
  client: string;
  kind: WorkKind;
  stage: DealStage;
  value: number;
  probability: number;
  owner: string;
  dueDate: string;
  source: string;
  nextAction: string;
  outcome?: 'open' | 'won' | 'lost';
  /** ISO date the deal was marked won or lost — drives the Growth and Finance reports. */
  closedAt?: string;
  /** ISO date the deal was added — with closedAt it gives the sales cycle. */
  createdAt?: string;
  /** Project created automatically when this deal was won (or that this deal was created from). */
  projectId?: string;
}

export interface StudioTask {
  id: string;
  title: string;
  client: string;
  date: string;
  startMinutes: number;
  duration: number;
  type: TaskType;
  owner: string;
  completed: boolean;
  /** Generated from an invoice, project or deal — shown on the schedule but edited at its source. */
  auto?: boolean;
  priority?: 'Normal' | 'High';
  reminderMinutes?: number;
  notes?: string;
}

export interface StudioProject {
  id: string;
  title: string;
  client: string;
  kind: WorkKind;
  status: ProjectStatus;
  progress: number;
  budget: number;
  dueDate: string;
  owner: string;
  team: string[];
  tasksDone: number;
  tasksTotal: number;
  steps?: ProjectStep[];
  contactName?: string;
  contactRole?: string;
  /** The won deal this project delivers. */
  dealId?: string;
}

export interface ProjectStep {
  id: string;
  title: string;
  completed: boolean;
}

export interface Invoice {
  id: string;
  client: string;
  project: string;
  amount: number;
  issuedAt: string;
  dueAt: string;
  status: 'Paid' | 'Due' | 'Overdue';
  /** ISO date the invoice was paid — places the revenue in the right month. */
  paidAt?: string;
  dealId?: string;
  projectId?: string;
}

export interface Deliverable {
  id: string;
  projectId: string;
  title: string;
  format: 'Video' | 'Design' | 'Build' | 'Document';
  status: 'Draft' | 'Client review' | 'Approved';
  dueDate: string;
  feedback: number;
}

export interface TeamMember {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  label: string;
  amount: number;
  date: string;
}

export interface StudioData {
  team: TeamMember[];
  expenses: Expense[];
  deals: Deal[];
  tasks: StudioTask[];
  projects: StudioProject[];
  invoices: Invoice[];
  deliverables: Deliverable[];
}

