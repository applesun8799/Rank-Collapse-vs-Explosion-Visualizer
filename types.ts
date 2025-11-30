export enum ModelStatus {
  COLLAPSED = 'COLLAPSED',
  STABLE = 'STABLE',
  EXPLODING = 'EXPLODING'
}

export interface TrainingMetrics {
  loss: number;
  vramUsage: number;
  gradientNorm: number;
  intelligenceScore: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}