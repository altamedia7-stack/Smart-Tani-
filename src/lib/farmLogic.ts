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
  'YaraMila 16-16-16': 'N: 16%, P: 16%, K: 16%',
  'YaraMila Winner (15-9-20)': 'N: 15%, P: 9%, K: 20%',
  'Kalsium Nitrat (Calcinit)': 'N: 15.5%, Ca: 26%',
  'Urea': 'N: 46%',
  'SP-36': 'P: 36%',
  'KCl': 'K: 60%',
  'KNO3 Putih': 'N: 13%, K: 45%',
  'KNO3 Merah': 'N: 15%, K: 14%',
  'MKP': 'P: 52%, K: 34%',
  'Ultradap': 'N: 12%, P: 60%',
  'Gandasil D': 'N: 20%, P: 15%, K: 15%',
  'Gandasil B': 'N: 6%, P: 20%, K: 30%',
  'Boron': 'Boron: 100%'
};

export function formatFertilizerName(f: string): string {
  const mapper: Record<string, string> = {
    'Pupuk Daun Mikro': 'Gandasil D',
    'DAP / Ultra DAP': 'Ultradap',
    'NPK Grower': 'YaraMila Winner (15-9-20)',
    'NPK Kalium Tinggi': 'YaraMila Winner (15-9-20)',
    'Boroni': 'Boron',
    'NPK 16-16-16 (Phonska/Mutiara)': 'YaraMila 16-16-16',
    'NPK 16-16-16 (Phonska)': 'YaraMila 16-16-16',
    'NPK Mutiara 16-16-16': 'YaraMila 16-16-16',
    'SP-36 / TSP': 'SP-36',
    'Gandasil D / POC Daun': 'Gandasil D',
    'Gandasil D (Atau setara)': 'Gandasil D',
    'Gandasil B / POC Buah': 'Gandasil B',
    'NPK Phonska': 'YaraMila 16-16-16'
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

export function getNPKRatio(fertilizers: string[]): { n: number; p: number; k: number; target: 'N' | 'P' | 'K' | 'Balanced' } {
  let n = 0, p = 0, k = 0;
  
  fertilizers.forEach(f => {
    const name = f.toLowerCase();
    if (name.includes('npk') || name.includes('16-16-16') || name.includes('yaramila 16-16-16') || name.includes('phonska') || name.includes('mutiara')) { n += 16; p += 16; k += 16; }
    else if (name.includes('yaramila winner') || name.includes('15-9-20')) { n += 15; p += 9; k += 20; }
    else if (name.includes('urea')) { n += 46; }
    else if (name.includes('sp-36') || name.includes('tsp')) { p += 36; }
    else if (name.includes('kcl')) { k += 60; }
    else if (name.includes('za')) { n += 21; }
    else if (name.includes('calcinit') || name.includes('kalsium nitrat')) { n += 15.5; }
    else if (name.includes('kno3 merah')) { n += 15; k += 14; }
    else if (name.includes('kno3 putih')) { n += 13; k += 45; }
    else if (name.includes('ultradap')) { n += 12; p += 60; }
    else if (name.includes('mkp')) { p += 52; k += 34; }
    else if (name.includes('gandasil d') || name.includes('poc daun')) { n += 20; p += 15; k += 15; }
    else if (name.includes('gandasil b') || name.includes('poc buah')) { n += 6; p += 20; k += 30; }
  });

  const total = n + p + k || 1; // avoid div by 0
  
  let target: 'N' | 'P' | 'K' | 'Balanced' = 'Balanced';
  if (n / total >= 0.4) target = 'N';
  else if (p / total >= 0.45) target = 'P';
  else if (k / total >= 0.4) target = 'K';

  return { n, p, k, target };
}

export function getDominantNutrient(week: number): { title: string, explanation: string, comparison: string } {
  if (week <= 4) return {
    title: "Fase Vegetatif Awal (Akar & Tunas)",
    explanation: "Sangat membutuhkan Fosfat (P) tinggi (cth: Ultradap) untuk memperpanjang akar dan mencegah stres pindah tanam, ditambah Nitrogen (N) untuk memacu keluarnya daun baru.",
    comparison: "💡 Tips Petani Pemula: Banyak yang asal beri Urea/Phonska di awal. Padahal, jika kita pakai pupuk tinggi Fosfat di minggu awal, perakaran akan sangat rimbun (gondrong). Akar rimbun = kuat makan pupuk NPK di minggu-minggu berikutnya."
  };
  if (week <= 8) return {
    title: "Fase Vegetatif Lanjut (Cabang & Batang)",
    explanation: "Membutuhkan N-P-K yang seimbang (cth: NPK Mutiara 16-16-16) untuk ukuran daun yang maksimal, fotosintesis tinggi, dan membuat dinding batang menjadi kaku.",
    comparison: "💡 Tips Petani Pemula: Jika fase awal fokus pemanjangan akar, fase ini fokus 'membangun tiang' pondasi. Tanaman harus punya batang kokoh agar tidak roboh menahan beban buah yang berat nanti."
  };
  if (week <= 12) return {
    title: "Fase Generatif Awal (Pembungaan)",
    explanation: "Fokus pada Fosfat (P) & Kalium (K) tinggi (cth: MKP), dan porsi unsur Nitrogen (N) harus diturunkan drastis. P lebatkan bunga, K cegukan panen rontok.",
    comparison: "💡 Tips Petani Pemula: Kesalahan fatal pemula adalah terus memberi Urea di fase ini. N tinggi membuat tanaman asyik 'menumbuhkan daun' & lupa berbunga. Hentikan/kurangi N agar bunga keluar serempak."
  };
  return {
    title: "Fase Generatif Lanjut (Pembesaran Panen)",
    explanation: "Sangat dominan membutuhkan Kalium (K) tinggi (cth: KNO3 Putih / KCL) untuk pembesaran, rasa (kemanisan), warna cerah, dan bobot buah berat.",
    comparison: "💡 Tips Petani Pemula: Ibarat manusia, ini fase 'penggemukan'. Unsur Kalium menarik seluruh gizi tanaman ke buah. Tanpa Kalium tinggi, buah gampang kerdil, rasanya hambar, dan mudah busuk saat disimpan/dikirim."
  };
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
  
  // Soil properties
  const isSandy = plant.soilType === 'Berpasir (Porous)';
  const isGambut = plant.soilType === 'Gambut (Asam)';
  
  // Kocor frequency: Sandy soil needs more frequent watering but lower doses
  const kocorIntervalDays = isSandy ? 4 : 7;
  const doseMultiplier = isSandy ? 0.6 : 1.0; 
  
  // Generate for 16 weeks (example lifecycle)
  for (let w = 1; w <= 16; w++) {
    const isEco = plant.economyMode;
    const doseMod = isEco ? 0.7 * doseMultiplier : 1.0 * doseMultiplier;

    // Phase logic (Premium Fertilizers Recommended)
    let kocorFert: string[] = [];
    let kocorDosis: string[] = [];
    let semprotFert: string[] = [];
    let semprotDosis: string[] = [];

    if (w <= 4) {
      kocorFert = ['YaraMila 16-16-16', isGambut ? 'Kalsium Nitrat (Calcinit)' : 'Ultradap'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(1 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil D (Atau setara)'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    } else if (w <= 8) {
      kocorFert = ['YaraMila 16-16-16'];
      kocorDosis = [`${(3 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil D'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    } else if (w <= 12) {
      kocorFert = ['MKP', 'KNO3 Putih'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(1.5 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil B', 'Boron'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`, `${(0.5 * doseMod).toFixed(1)} gr/L`];
    } else {
      kocorFert = ['YaraMila Winner (15-9-20)', 'KNO3 Putih'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(2 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Gandasil B'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`];
    }

    // kocor
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

    if (isSandy) {
      // Extra kocor for sandy
      const kocorDate2 = addDays(start, (w - 1) * 7 + 6);
      schedules.push({
        id: generateId(),
        plantId: plant.id,
        date: kocorDate2.toISOString(),
        weekNumber: w,
        type: 'Kocor',
        fertilizers: kocorFert,
        dosages: kocorDosis,
        isCompleted: false
      });
    }

    // semprot 
    const semprotDate = addDays(start, (w - 1) * 7 + (isSandy ? 4 : 5));
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
