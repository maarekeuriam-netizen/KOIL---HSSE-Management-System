export interface UserProfile {
  id: string;
  full_name: string;
  department: string;
  position: string;
  employee_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Incident {
  id: string;
  user_id: string;
  incident_type: 'injury' | 'near_miss' | 'hazard' | 'environmental';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: string;
  incident_date: string;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  corrective_actions: string;
  created_at: string;
  updated_at: string;
}

export interface Inspection {
  id: string;
  user_id: string;
  inspection_type: 'routine' | 'planned' | 'emergency' | 'audit';
  title: string;
  location: string;
  inspection_date: string;
  score: number;
  status: 'scheduled' | 'in_progress' | 'completed';
  findings: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  id: string;
  user_id: string;
  title: string;
  activity: string;
  hazard_identified: string;
  likelihood: number;
  consequence: number;
  risk_level: number;
  control_measures: string;
  status: 'draft' | 'under_review' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface TrainingRecord {
  id: string;
  user_id: string;
  training_name: string;
  training_type: 'safety' | 'environmental' | 'security' | 'health';
  completion_date: string;
  expiry_date: string | null;
  certificate_number: string;
  status: 'valid' | 'expiring_soon' | 'expired';
  created_at: string;
  updated_at: string;
}
