export interface ResponseData {
  id: string;
  respondent_id: string;
  answers: Record<string, any>;
  aura_points: number;
  quiz_id: string;
  created_at: string;
}

export interface QuestionData {
  id: string;
  text: string;
  type: string;
  options?: string[];
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

export interface Question {
  id: string;
  text: string;
  type: 'mcq' | 'number';
  options?: string[];
  is_fixed: boolean;
}
