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
  'Insek Klorantraniliprol (Cegah Ulat)': 'Proteksi: Ulat Grayak & Penggerek Buah',
  'ZA (Amonium Sulfat)': 'N: 21%, S: 24%'
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

export function getPlantCategory(name: string): 'Hortikultura' | 'Pohon Buah' | 'Pangan' {
  if (['Durian', 'Alpukat', 'Jeruk'].includes(name)) return 'Pohon Buah';
  if (['Padi', 'Jagung'].includes(name)) return 'Pangan';
  return 'Hortikultura';
}

export function getDominantNutrient(week: number, plantName: string = 'Cabai'): { title: string, explanation: string, comparison: string } {
  const cat = getPlantCategory(plantName);
  
  if (cat === 'Pohon Buah') {
    if (week <= 12) return {
      title: "Fase Vegetatif Pembentukan Pola Tajuk",
      explanation: "Pohon seperti Durian butuh Nitrogen (N) tinggi via NPK dan pupuk kandang matang. Akar tunjang sedang turun menembus lapisan keras.",
      comparison: "💡 Ilmu Agronomi Lanjutan: Pemupukan pohon buah muda jangan pakai KCL dulu, klorida membuat pucuk daun terbakar. Pakailah NPK 16-16-16 tabur di ujung kanopi tajuk, bukan di pangkal batang!"
    };
    if (week <= 24) return {
      title: "Fase Pendewasaan Batang & Percabangan",
      explanation: "Rasio P mulai penting untuk lignifikasi (pengerasa batang).",
      comparison: "💡 Ilmu Agronomi Lanjutan: Batang yang keras menghindari pecah batang. Tambahkan Kalsium (Dolomit) setiap 3 bulan."
    };
    if (week <= 36) return {
      title: "Fase Stressing / Pembungaan",
      explanation: "Hentikan N total, gunakan MKP dan KNO3 dosis tinggi disiram di sekitar perakaran untuk memacu bunga keluar di dahan sekunder.",
      comparison: "💡 Ilmu Agronomi Lanjutan: Jika pohon keluar sirung air (tunas baru), bunga akan rontok karena kompetisi energi. Berhenti mengairi untuk memberi 'stressing' air."
    };
    return {
      title: "Fase Pembesaran Buah & Kualitas Rasa",
      explanation: "Kalium Tinggi dan Trace Elements. Cth: NPK Grower pembesar buah.",
      comparison: "💡 Ilmu Agronomi Lanjutan: Untuk Durian/Alpukat, kekurangan Boron membuat buah bengkok atau berongga. Kalium tinggi dan Sulfate (dari ZA) menjamin rasa buah berkarakter tegas (manis/pahit)."
    };
  }

  if (cat === 'Pangan') {
    if (week <= 3) return {
      title: "Fase Pembentukan Anakan / V-Phase",
      explanation: "Fokus pada Nitrogen (Urea) tinggi untuk mengejar jumlah anakan per rumpun (padi) / lebar daun (jagung).",
      comparison: "💡 Ilmu Agronomi Lanjutan: Pemupukan pertama Padi maks di umur 12 HST agar primordia (bakal bulir) banyak yang jadi."
    };
    if (week <= 7) return {
      title: "Fase Bunting / Taselling",
      explanation: "Puncak kebutuhan Kalium (KCl) agar batang tak rebah dan bulir akan penuh nantinya.",
      comparison: "💡 Ilmu Agronomi Lanjutan: Di umur 40-45 HST, Padi butuh KCL. Banyak petani hanya memberi SP/Urea, sehingga saat padi berbulir, leher malai lemes dan mudah patah kena angin."
    };
    return {
      title: "Fase Pengisian Bulir",
      explanation: "Cuaca panas dan air cukuP. Tidak perlu pupuk tabur lagi, bisa semprot KNO3 daun.",
      comparison: "💡 Ilmu Agronomi Lanjutan: Hentikan Urea mutlak. Daun terlalu hijau di fase ini hanya menjadi sarang empuk bagi Wereng dan Walang Sangit."
    };
  }

  // Hortikultura
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

export function getExpectedResult(week: number, soilType: string = 'Normal', plantName: string = 'Cabai'): string {
  const cat = getPlantCategory(plantName);
  
  if (cat === 'Pohon Buah') {
    if (week <= 12) return `Perakaran mendalam di tanah ${soilType}, terhindar dari busuk akar Phytophthora. Trubus bermunculan lebat memutar.`;
    if (week <= 24) return `Batang utama melebar dan rimbun, percabangan lateral mulai kuat menyangga struktur tajuk.`;
    if (week <= 36) return `Bakal bunga muncul di batang/dahan sekunder serempak akibat lonjakan nisbah rasio C/N yang optimal.`;
    return `Buah padat berisi, bentuk simetris sempurna, dan peningkatan intensitas warna, tekstur, serta rasa yang tajam.`;
  }
  
  if (cat === 'Pangan') {
    if (week <= 3) return `Anakan lebat, daun bendera berkembang optimal untuk menopang produksi karbohidrat.`;
    if (week <= 7) return `Mencegah kerebahan dan kegagalan primordia bulir, tangkai malai menjadi tangguh.`;
    return `Pengisian butir/bulir hingga pangkal (bernaz) dengan efektivitas pengurasan asimilat dari daun ke biji mentok 100%.`;
  }

  // Hortikultura
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
  const isLiat = plant.soilType === 'Liat / Lempung (Padat)';
  const isKapur = plant.soilType === 'Tanah Kapur (Basa / pH Tinggi)';
  const isVulkanik = plant.soilType === 'Vulkanik (Andosol / Pegunungan)';
  
  // Kocor frequency & dosage logic based on soil
  let kocorIntervalDays = 7;
  let doseMultiplier = 1.0;

  if (isSandy) {
    kocorIntervalDays = 4;
    doseMultiplier = 0.6;
  } else if (isLiat) {
    kocorIntervalDays = 10;
    doseMultiplier = 1.2;
  } else if (isVulkanik) {
    doseMultiplier = 1.0;
  } else if (isKapur) {
    doseMultiplier = 1.1;
  }
  
  const cat = getPlantCategory(plant.name);

  if (cat === 'Pohon Buah') {
    // Generate schedule every month (every 4 weeks) for 1 year (48 weeks)
    for (let w = 4; w <= 48; w += 4) {
      let taburFert: string[] = [];
      let taburDosis: string[] = [];
      let semprotFert: string[] = [];
      let semprotDosis: string[] = [];

      if (w <= 12) {
        taburFert = ['YaraMila 16-16-16', 'Pupuk Kandang (Fermentasi)'];
        taburDosis = ['250 gr / pohon', '10 kg / pohon'];
        semprotFert = ['Fungisida Mankozeb', 'Insek Imidakloprid'];
        semprotDosis = ['2 gr/L', '1 ml/L'];
      } else if (w <= 24) {
        taburFert = ['YaraMila 16-16-16', 'SP-36'];
        taburDosis = ['300 gr / pohon', '100 gr / pohon'];
        semprotFert = ['Meroke Provit Hijau'];
        semprotDosis = ['2 gr/L'];
      } else if (w <= 36) {
        taburFert = ['MKP', 'KNO3 Putih']; // Stop Nitrogen
        taburDosis = ['200 gr / pohon', '200 gr / pohon'];
        semprotFert = ['Boron', 'Fungisida Difenokonazol (Cegah Patek)'];
        semprotDosis = ['1 gr/L', 'Sesuai Kemasan'];
      } else {
        taburFert = ['YaraMila Winner (15-9-20)', 'ZA (Amonium Sulfat)'];
        taburDosis = ['400 gr / pohon', '100 gr / pohon'];
        semprotFert = ['Meroke Provit Merah', 'Insek Klorantraniliprol'];
        semprotDosis = ['2 gr/L', 'Sesuai Kemasan'];
      }

      const date = addDays(start, w * 7);
      schedules.push({ id: generateId(), plantId: plant.id, date: date.toISOString(), weekNumber: w, type: 'Tabur', fertilizers: taburFert, dosages: taburDosis, isCompleted: false });
      
      const semprotDate = addDays(start, w * 7 + 3);
      schedules.push({ id: generateId(), plantId: plant.id, date: semprotDate.toISOString(), weekNumber: w, type: 'Semprot', fertilizers: semprotFert, dosages: semprotDosis, isCompleted: false });
    }
    return schedules;
  }

  if (cat === 'Pangan') {
    // Generate schedule roughly at week 2, 4, 6 (approx 14, 28, 42 days)
    const panganScheds = [
      { w: 2, fert: ['Urea', 'SP-36'], dosis: ['100 kg/Ha', '50 kg/Ha'] },
      { w: 4, fert: ['Urea', 'NPK Phonska'], dosis: ['75 kg/Ha', '100 kg/Ha'] },
      { w: 7, fert: ['KCl', 'Urea'], dosis: ['50 kg/Ha', '50 kg/Ha'] },
      { w: 10, fert: ['KNO3 Putih (Foliar)'], dosis: ['3 gr/L (Semprot)'] },
    ];

    panganScheds.forEach(ps => {
      const date = addDays(start, ps.w * 7);
      const isSemprot = ps.fert[0].includes('Foliar');
      schedules.push({
        id: generateId(),
        plantId: plant.id,
        date: date.toISOString(),
        weekNumber: ps.w,
        type: isSemprot ? 'Semprot' : 'Tabur',
        fertilizers: ps.fert,
        dosages: ps.dosis,
        isCompleted: false
      });
    });
    return schedules;
  }

  // Generate for 16 weeks (Hortikultura lifecycle)
  for (let w = 1; w <= 16; w++) {
    const isEco = plant.economyMode;
    const doseMod = isEco ? 0.7 * doseMultiplier : 1.0 * doseMultiplier;

    // Phase logic (Premium Fertilizers Recommended)
    let kocorFert: string[] = [];
    let kocorDosis: string[] = [];
    let semprotFert: string[] = [];
    let semprotDosis: string[] = [];

    if (w <= 4) {
      // Logic modifikasi pupuk berdasarkan tanah
      let pSource = 'Ultradap';
      let nSource = 'YaraMila 16-16-16';
      
      if (isGambut) pSource = 'Kalsium Nitrat (Calcinit)'; // Butuh pH buffer
      if (isKapur) {
        pSource = 'Ultradap'; // Butuh P tinggi karena P terikat di tanah kapur
        nSource = 'ZA (Amonium Sulfat)'; // Asamkan sedikit area perakaran
      }

      kocorFert = [nSource, pSource];
      kocorDosis = [`${(2 * doseMod).toFixed(1)} gr/L`, `${(1 * doseMod).toFixed(1)} gr/L`];
      semprotFert = ['Meroke Provit Hijau', 'Chelated Trace Elements (Micro)', 'Fungisida Mankozeb + Insek Imidakloprid'];
      semprotDosis = [`${(1.5 * doseMod).toFixed(1)} gr/L`, `${(0.5 * doseMod).toFixed(1)} gr/L`, `Sesuai Kemasan`];
    } else if (w <= 8) {
      kocorFert = ['YaraMila 16-16-16'];
      if (isKapur) kocorFert.push('ZA (Amonium Sulfat)');
      
      kocorDosis = [`${(3 * doseMod).toFixed(1)} gr/L`];
      if (isKapur) kocorDosis.push(`${(1 * doseMod).toFixed(1)} gr/L`);

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

    // kocor based on interval
    // If it's clay (10 days), we might skip some weeks or shift days, but for simplicity of weekly loops:
    // We'll place it on day 2. If it's clay, maybe we only Kocor every 1.5 weeks. 
    // To keep the data model simple, we will adjust the date using the dynamic interval
    let kocorDate = addDays(start, Math.floor((w - 1) * 7 * (kocorIntervalDays / 7)) + 2);
    
    // Only add Kocor if it falls roughly within this week (to avoid duplicates or skipping too much in a simple loop)
    // For a real app we'd generate a flat list of dates, but let's stick to the weekly bucket structure.
    
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

    // semprot (Foliar is less affected by soil type, but we adjust day slightly if watering changes)
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
