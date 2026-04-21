export type FormattedDate = string; // YYYY-MM-DD

export interface Plant {
  id: string;
  name: string;
  plantingDate: string; // ISO string
  location?: string;
  status: 'Sehat' | 'Warning' | 'Sakit';
  economyMode: boolean;
  soilType?: string;
}

export type FertType = 'Kocor' | 'Semprot' | 'Tabur';

export interface ScheduleEntry {
  id: string;
  plantId: string;
  date: string; // ISO string
  weekNumber: number;
  type: FertType;
  fertilizers: string[];
  dosages: string[];
  isCompleted: boolean;
  completedAt?: string; // ISO string
}

export interface DiagnosisResult {
  diseaseName: string;
  confidence: number;
  severity: 'Ringan' | 'Sedang' | 'Berat';
  affectedParts: string[];
  recommendations: {
    jenis: string;
    dosis: string;
    cara: string;
    frekuensi: string;
    kandunganNPK?: string;
    expectedOutcome?: string;
  }[];
  rawReasoning?: string;
}

export interface ScanHistory {
  id: string;
  plantId: string;
  date: string;
  imageUrl?: string;
  symptoms: string[];
  conditions: string[];
  diagnosis: DiagnosisResult;
  feedback?: 'Membaik' | 'Tidak Membaik';
}

export interface CostAnalysis {
  estimatedCost: number;
  harvestPrediction: string; // e.g. "Optimal", "Beresiko"
}
