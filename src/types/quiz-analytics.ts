
export interface QuizData {
  created_at: string;
  creator_id: string;
  id: string;
  name: string;
  shareable_link: string;
  questions?: {
    [key: string]: {
      text: string;
      type: string;
      options?: string[];
    }
  };
}

export interface AuraPoints {
  innovator: number;
  motivator: number;
  achiever: number;
  supporter: number;
  guardian: number;
  visionary: number;
}
