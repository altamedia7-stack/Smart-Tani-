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
  'Boron': 'Boron: 100%',
  'Meroke Provit Hijau': 'N: 27%, P: 10%, K: 16%, TE',
  'Meroke Provit Merah': 'N: 15%, P: 10%, K: 35%, TE',
  'Chelated Trace Elements (Micro)': 'Fe, Mn, Zn, Cu, B, Mo',
  'Fungisida Mankozeb + Insek Imidakloprid': 'Proteksi: Jamur Tanah & Kutu (Vektor Virus)',
  'Insek Abamektin (Cegah Thrips/Keriting)': 'Proteksi: Thrips & Tungau Mites',
  'Fungisida Difenokonazol (Cegah Patek)': 'Proteksi: Jamur Antraknosa (Patek)',
  'Insek Klorantraniliprol (Cegah Ulat)': 'Proteksi: Ulat Grayak & Penggerek Buah'
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
    else if (name.includes('provit hijau')) { n += 27; p += 10; k += 16; }
    else if (name.includes('provit merah')) { n += 15; p += 10; k += 35; }
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
    explanation: "Sangat membutuhkan Fosfat (P) tinggi (cth: Ultradap / Calcinit) untuk memperpanjang akar dan mencegah stres pindah tanam, ditambah Nitrogen (N) untuk memacu keluarnya daun baru.",
    comparison: "💡 Ilmu Agronomi Lanjutan: Nitrogen berlebih di fase awal justru membuat dinding sel tipis & ranum, sangat mengundang Kutu Kebul (vektor Virus Bule/Gemini). Fokuslah pada Kalsium (Ca) dan Fosfat + pencegahan sistemik (Imidakloprid) agar tanaman membangun 'tembok baja' secara mekanis maupun kimiawi sejak dini."
  };
  if (week <= 8) return {
    title: "Fase Vegetatif Lanjut (Cabang & Batang)",
    explanation: "Membutuhkan N-P-K yang seimbang (cth: YaraMila 16-16-16) dicampur unsur mikro chelated untuk ukuran daun yang maksimal, fotosintesis tinggi, dan membuat dinding batang menjadi kaku.",
    comparison: "💡 Ilmu Agronomi Lanjutan: Jangan hanya mengejar klorofil daun. Fase ini rentan serangan Thrips/Tungau yang memakan meristem pucuk sehingga daun keriting. Rotasi Abamektin wajib disertakan saat penyemprotan asam amino/unsur mikro untuk menjaga rasio 'Sink and Source' tetap stabil tanpa intervensi hama."
  };
  if (week <= 12) return {
    title: "Fase Generatif Awal (Pembungaan)",
    explanation: "Fokus pada Fosfat (P) & Kalium (K) tinggi (cth: MKP Premium & KNO3), dan porsi unsur Nitrogen (N) harus diturunkan drastis. P lebatkan bunga, K cegukan panen rontok.",
    comparison: "💡 Ilmu Agronomi Lanjutan: Hukum Antagonisme Hara: Pemberian Kalium (K) dosis tinggi untuk membungakan akan otomatis memblokir penyerapan Kalsium (Ca) dari tanah. Akibatnya? Bunga lebat tapi ujung buah menghitam/busuk (Blossom End Rot). Selalu suplai foliar Kalsium-Boron di pagi hari dan cegah cuaca lembab dengan Fungisida Golongan Azol (Difenokonazol) anti-patek."
  };
  return {
    title: "Fase Generatif Lanjut (Pembesaran Panen)",
    explanation: "Sangat dominan membutuhkan Kalium (K) tinggi (cth: YaraMila Winner / KNO3 Putih) untuk pembesaran, rasa (kemanisan), warna cerah, dan bobot buah berat.",
    comparison: "💡 Ilmu Agronomi Lanjutan: Serangga tidak memiliki organ pankreas. Dengan memompa Kalium & Unsur Mikro ke ambang maksimal, kadar gula (Brix) pada getah tanaman akan melonjak tajam. Serangga yang nekat menghisap getah ber-Brix ekstra tinggi akan mati keracunan gula. Kombinasikan bio-defense alami ini dengan Klorantraniliprol untuk proteksi absolut."
  };
}

export function getExpectedResult(week: number, soilType: string = 'Normal'): string {
  if (week <= 4) return `Fase Awal: Ultradap/Calcinit & YaraMila merangsang perakaran kuat serta tunas hijau. Penyerapan dioptimalkan untuk kondisi tanah ${soilType} guna menghindari defisiensi dini.`;
  if (week <= 8) return `Fase Pertumbuhan: Mempertebal daun dan dinding sel batang secara maksimal. Hara seimbang dan Trace Elements memastikan kapasitas fotosintesis puncak tanpa gejala klorosis.`;
  if (week <= 12) return "Fase Pembungaan: MKP dan KNO3 Putih bekerja sinergis mencetak jumlah bakal bunga terbanyak (super blossom) dan Boron mengunci bunga agar anti-rontok.";
  return "Fase Pembuahan: YaraMila Winner & KNO3 Prill mendongkrak pencapaian bobot, kepadatan tekstur, warna mengkilap, dan level kemanisan buah hingga ambang genetis tertingginya.";
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
      semprotFert = ['Meroke Provit Hijau', 'Chelated Trace Elements (Micro)', 'Fungisida Mankozeb + Insek Imidakloprid'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`, `${(0.5 * doseMod).toFixed(1)} gr/L`, `Sesuai Kemasan`];
    } else if (w <= 8) {
      kocorFert = ['YaraMila 16-16-16'];
      kocorDosis = [`${(3 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Meroke Provit Hijau', 'Insek Abamektin (Cegah Thrips/Keriting)'];
      semprotDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `Sesuai Kemasan`];
    } else if (w <= 12) {
      kocorFert = ['MKP', 'KNO3 Putih'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(1.5 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Meroke Provit Merah', 'Boron', 'Fungisida Difenokonazol (Cegah Patek)'];
      semprotDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(0.5 * doseMod).toFixed(1)} gr/L`, `Sesuai Kemasan`];
    } else {
      kocorFert = ['YaraMila Winner (15-9-20)', 'KNO3 Putih'];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(2 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Meroke Provit Merah', 'Insek Klorantraniliprol (Cegah Ulat)'];
      semprotDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `Sesuai Kemasan`];
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
