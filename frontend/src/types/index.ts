export type UserRole = 'contractor' | 'client' | 'user';
export type VisibilityType = 'private' | 'protected' | 'public';
export type ExpenseCategory = 'material' | 'labor' | 'official' | 'subcontractor';
export type MainTab = 'my-projects' | 'following' | 'profile';

export interface UserProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  location: string;
  avatar_url?: string;
  bio?: string;
  stats: {
    total_managed_projects: number;
    total_following_projects: number;
    total_budget_managed: number;
    total_units_completed: number;
  };
  settings: {
    email_notifications: boolean;
    site_updates_push: boolean;
    dark_mode: boolean;
    public_profile: boolean;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role?: UserRole;
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

export interface ProjectActivity {
  id: string;
  project_id: string;
  project_name: string;
  title: string;
  description: string;
  timestamp: string;
  type: 'stage_complete' | 'expense_added' | 'photo_upload' | 'status_change';
  image_url?: string;
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
  description?: string;
  status?: 'active' | 'planning' | 'completed';
  unit_count?: number;
  is_following?: boolean;
  last_update_date?: string;
  contractor_name?: string;
  
  // Derived metrics
  physical_progress: number;
  financial_progress: number;
  total_actual_cost: number;
  cost_variance: number;
  
  floors?: BuildingFloor[];
  expenses?: Expense[];
  stages?: Stage[];
  activities?: ProjectActivity[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
}

export const getProjectUnitCount = (project: Project): number => {
  if (project.floors && project.floors.length > 0) {
    const totalFromFloors = project.floors.reduce(
      (acc, floor) => acc + (floor.units?.length || 0),
      0
    );
    if (totalFromFloors > 0) return totalFromFloors;
  }
  if (typeof project.unit_count === 'number' && project.unit_count > 0) {
    return project.unit_count;
  }
  return 0;
};

