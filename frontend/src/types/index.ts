export type UserRole = 'contractor' | 'client';
export type VisibilityType = 'private' | 'protected' | 'public';
export type ExpenseCategory = 'material' | 'labor' | 'official' | 'subcontractor';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at?: string;
}

export interface Stage {
  id: string;
  project_id: string;
  floor_id?: string;
  unit_id?: string;
  name: string;
  category: string;
  estimated_cost: number;
  actual_cost: number;
  weight_percentage: number;
  is_completed: boolean;
  order_index: number;
}

export interface Unit {
  id: string;
  floor_id: string;
  unit_number: number;
  name: string;
  owner_id?: string;
  is_completed: boolean;
  stages?: Stage[];
}

export interface BuildingFloor {
  id: string;
  project_id: string;
  floor_number: number;
  name: string;
  is_completed: boolean;
  units?: Unit[];
  stages?: Stage[];
}

export interface Expense {
  id: string;
  project_id: string;
  stage_id?: string;
  category: ExpenseCategory;
  amount: number;
  invoice_url?: string;
  notes?: string;
  date: string;
  created_at?: string;
}

export interface Project {
  id: string;
  contractor_id: string;
  name: string;
  location: string;
  total_budget: number;
  visibility: VisibilityType;
  show_financials_to_clients: boolean;
  created_at?: string;
  
  // Derived metrics
  physical_progress: number;
  financial_progress: number;
  total_actual_cost: number;
  cost_variance: number;
  
  floors?: BuildingFloor[];
  expenses?: Expense[];
  stages?: Stage[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  activeRole: UserRole;
}
