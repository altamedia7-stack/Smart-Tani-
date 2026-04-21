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
      kocorFert = ['DAP / Ultra DAP', 'NPK Grower'];
      kocorDosis = [`${2 * doseMod} gr/L`, `${3 * doseMod} gr/L`];
      semprotFert = ['Pupuk Daun Nitrogen'];
      semprotDosis = [`${1.5 * doseMod} gr/L`];
    } else if (w <= 8) {
      kocorFert = ['NPK Grower', 'KNO3 Putih'];
      kocorDosis = [`${3 * doseMod} gr/L`, `${1 * doseMod} gr/L`];
      semprotFert = ['Pupuk Daun Mikro'];
      semprotDosis = [`${1 * doseMod} gr/L`];
    } else if (w <= 12) {
      kocorFert = ['MKP'];
      kocorDosis = [`${3 * doseMod} gr/L`];
      semprotFert = ['Boron'];
      semprotDosis = [`${1 * doseMod} gr/L`];
    } else {
      kocorFert = ['KNO3 Merah', 'NPK Kalium Tinggi'];
      kocorDosis = [`${2 * doseMod} gr/L`, `${3 * doseMod} gr/L`];
      // Tabur ZK omitted for simplicity, but could be added
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
      jenis: "NPK Grower & KNO3 Putih", dosis: "1 sdm/pohon (kocor), 1 gr/L (semprot)", cara: "Kocor & Semprot", frekuensi: "1x seminggu"
    }];
  } else if (sympStr.includes('bercak hitam') && condStr.includes('lembab')) {
    disease = "Penyakit Jamur (Antraknosa)";
    confidence = 90;
    severity = 'Sedang';
    recs = [{
      jenis: "Fungisida Sistemik", dosis: "Sesuai kemasan", cara: "Semprot", frekuensi: "3 hari sekali"
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
      jenis: "KNO3 Merah & ZK", dosis: "2 gr/L (kocor), 1 sdm (tabur)", cara: "Kocor & Tabur", frekuensi: "1x seminggu"
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
