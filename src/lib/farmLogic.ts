import { Plant, ScheduleEntry, DiagnosisResult } from '../types';
import { differenceInDays, differenceInWeeks, addDays, startOfDay, parseISO } from 'date-fns';
import { generateId } from './utils';

export function getPlantAge(plantingDate: string) {
  const start = startOfDay(parseISO(plantingDate));
  const now = startOfDay(new Date());
  const days = differenceInDays(now, start);
  const weeks = differenceInWeeks(now, start);
  return { days, weeks };
}

export function getPlantPhase(weeks: number) {
  if (weeks <= 4) return 'Awal (0-4 minggu)';
  if (weeks <= 8) return 'Pertumbuhan (5-8 minggu)';
  if (weeks <= 12) return 'Pembungaan (9-12 minggu)';
  return 'Pembuahan (13+ minggu)';
}

const NUTRIENT_MAP: Record<string, string> = {
  // Use specific names for mapping
  'NPK Mutiara 16-16-16': 'N: 16%, P: 16%, K: 16%',
  'Urea': 'N: 46%',
  'SP-36': 'P: 36%',
  'KCl': 'K: 60%',
  'Gandasil D': 'N: 20%, P: 15%, K: 15%',
  'Gandasil B': 'N: 6%, P: 20%, K: 30%',
  'Boroni': 'Boron: 100%'
};

export function formatFertilizerName(f: string): string {
  const mapper: Record<string, string> = {
    // Translate all legacy or generic strings to specific products
    'Pupuk Daun Nitrogen': 'Gandasil D',
    'Pupuk Daun Mikro': 'Gandasil D',
    'DAP / Ultra DAP': 'NPK Mutiara 16-16-16',
    'NPK Grower': 'NPK Mutiara 16-16-16',
    'KNO3 Putih': 'KCl',
    'MKP': 'SP-36',
    'KNO3 Merah': 'KCl',
    'NPK Kalium Tinggi': 'NPK Mutiara 16-16-16',
    'Boron': 'Boroni',
    'NPK 16-16-16 (Phonska/Mutiara)': 'NPK Mutiara 16-16-16',
    'NPK 16-16-16 (Phonska)': 'NPK Mutiara 16-16-16',
    'SP-36 / TSP': 'SP-36',
    'Gandasil D / POC Daun': 'Gandasil D',
    'Gandasil B / POC Buah': 'Gandasil B',
    'NPK Phonska': 'NPK Mutiara 16-16-16'
  };
  return mapper[f] || f;
}

export function getNutrientContent(fertilizers: string[]): string[] {
  return fertilizers.map(f => {
    const modernName = formatFertilizerName(f);
    const nut = NUTRIENT_MAP[modernName];
    return nut ? `${modernName} (${nut})` : `${modernName}`;
  });
}

export function getExpectedResult(week: number): string {
  if (week <= 4) return "Fase Awal: Merangsang pembentukan akar baru yang kuat dan perluasan tunas hijau (Vege awal).";
  if (week <= 8) return "Fase Pertumbuhan: Mempertebal daun, batang lebih kokoh, dan memaksimalkan kapasitas fotosintesis (Vege lanjut).";
  if (week <= 12) return "Fase Pembungaan: Memicu bakal bunga yang lebat dan mencegah kerontokan bunga (Generatif awal).";
  return "Fase Pembuahan: Membesarkan ukuran buah, meningkatkan bobot panen, dan mempercepat pematangan buah (Generatif lanjut).";
}

// Fitur 2: Generate jadwal otomatis
export function generateScheduleForPlant(plant: Plant): ScheduleEntry[] {
  const schedules: ScheduleEntry[] = [];
  const start = startOfDay(parseISO(plant.plantingDate));
  
  // Generate for 16 weeks (example lifecycle)
  for (let w = 1; w <= 16; w++) {
    // Phase logic
    let kocorFert: string[] = [];
    let kocorDosis: string[] = [];
    let semprotFert: string[] = [];
    let semprotDosis: string[] = [];

    const isEco = plant.economyMode;
    const doseMod = isEco ? 0.7 : 1.0; // Hemat 30%

    if (w <= 4) {
      kocorFert = ['NPK Mutiara 16-16-16', 'Urea'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(1 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil D / POC Daun'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    } else if (w <= 8) {
      kocorFert = ['NPK Mutiara 16-16-16'];
      kocorDosis = [`${(3 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil D / POC Daun'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    } else if (w <= 12) {
      kocorFert = ['SP-36 / TSP', 'KCl'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(1.5 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil B'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    } else {
      kocorFert = ['NPK Mutiara 16-16-16', 'KCl'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(2 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil B / POC Buah'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    }

    // kocor is typically early week (e.g., day 2 of week)
    const kocorDate = addDays(start, (w - 1) * 7 + 2);
    schedules.push({
      id: generateId(),
      plantId: plant.id,
      date: kocorDate.toISOString(),
      weekNumber: w,
      type: 'Kocor',
      fertilizers: kocorFert,
      dosages: kocorDosis,
      isCompleted: false
    });

    // semprot is mid week (e.g., day 5 of week)
    const semprotDate = addDays(start, (w - 1) * 7 + 5);
    schedules.push({
      id: generateId(),
      plantId: plant.id,
      date: semprotDate.toISOString(),
      weekNumber: w,
      type: 'Semprot',
      fertilizers: semprotFert,
      dosages: semprotDosis,
      isCompleted: false
    });
  }

  return schedules;
}

// Fitur 7: Rule Engine Basic Fallback
export function analyzeWithRuleEngine(symptoms: string[], conditions: string[]): DiagnosisResult {
  // Simple heuristic if AI fails
  let disease = "Tidak Diketahui";
  let confidence = 50;
  let severity: 'Ringan' | 'Sedang' | 'Berat' = 'Ringan';
  let recs = [];

  const sympStr = symptoms.join(' ').toLowerCase();
  const condStr = conditions.join(' ').toLowerCase();

  if (sympStr.includes('kuning') && !sympStr.includes('bercak')) {
    disease = "Kekurangan Nitrogen";
    confidence = 85;
    recs = [{
      jenis: "NPK 16-16-16 & Urea", dosis: "1 sdm/pohon (kocor), 1.5 gr/L (semprot)", cara: "Kocor & Semprot", frekuensi: "1x seminggu"
    }];
  } else if (sympStr.includes('bercak hitam') && condStr.includes('lembab')) {
    disease = "Penyakit Jamur (Antraknosa)";
    confidence = 90;
    severity = 'Sedang';
    recs = [{
      jenis: "Fungisida Sistemik & Kontak", dosis: "Sesuai kemasan", cara: "Semprot", frekuensi: "3 hari sekali"
    }];
  } else if (sympStr.includes('keriting')) {
    disease = "Serangan Hama/Virus";
    confidence = 80;
    severity = 'Berat';
    recs = [{
      jenis: "Insektisida / Akarisida", dosis: "Sesuai kemasan", cara: "Semprot", frekuensi: "Seminggu sekali"
    }];
  } else if (sympStr.includes('buah kecil')) {
    disease = "Kekurangan Kalium";
    confidence = 75;
    recs = [{
      jenis: "NPK Mutiara 16-16-16 & KCl", dosis: "2 gr/L (kocor), 1 sdm (tabur)", cara: "Kocor & Tabur", frekuensi: "1x seminggu"
    }];
  }

  return {
    diseaseName: disease,
    confidence,
    severity,
    affectedParts: ["Daun/Batang/Buah"],
    recommendations: recs
  };
}
