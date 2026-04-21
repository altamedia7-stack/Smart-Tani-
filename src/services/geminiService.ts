import { GoogleGenAI, Type } from '@google/genai';
import { DiagnosisResult } from '../types';

export async function analyzePlantAI(
  base64Image: string | undefined, 
  symptoms: string[], 
  conditions: string[], 
  historyInfo: string,
  soilType?: string,
  plantName?: string
): Promise<DiagnosisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const soilContext = soilType ? `\nJenis Tanah: ${soilType}` : '';
  const plantContext = plantName ? `\nJenis Tanaman yang Sedang Ditangani: ${plantName}` : '';

  const prompt = `
Anda adalah konsultan agronomi profesional tingkat dunia.
Berdasarkan data berikut (dan gambar jika ada):
Gejala: ${symptoms.join(', ')}
Kondisi Lingkungan: ${conditions.join(', ')}${soilContext}${plantContext}
Riwayat: ${historyInfo}

Lakukan analisa mendalam. Hitung probabilitas masalah menggunakan sistem skoring berdasarkan input pengguna dan aturan agronomi.

PENTING:
1. PENGGUNAAN PUPUK & OBAT TERBAIK: Gunakan standar Premium tanpa batasan harga. Jangan gunakan pupuk subsidi. Gunakan yang kualitas dan kelarutannya paling efektif (misal: YaraMila, Calcinit, Meroke, KNO3, unsur mikro chelated, fungisida sistemik gol. Azol/Strobilurin, insektisida bahan aktif seperti Abamektin/Imidakloprid/Klorantraniliprol).
2. PROTEKSI & PENCEGAHAN: Selain menyembuhkan, Anda WAJIB memberikan rekomendasi proteksi sistemik untuk mencegah penularan/masalah sekunder (misal jika hama kutu, sertakan pencegahan virus).
3. Detail Kandungan Hara / Bahan Aktif: Saat memberikan rekomendasi pupuk, sertakan NPK & mikro. Jika meresepkan pestisida, sebutkan Bahan Aktifnya secara spesifik.
4. Expected Outcome (Target Hasil): Berikan penjelasan mendalam berbasis fisiologis mengapa treatment ini digunakan dan bagaimana ia membunuh patogen atau memperbaiki jaringan tanaman. Jangan gunakan bahasa klise/buku teks, gunakan insight kelas konsultan lapang.

Aturan Interval Berdasarkan Jenis Tanah:
- Berpasir (Porous): Sangat rentan pencucian. WAJIB aplikasi pupuk lebih sering (spoon-feeding).
- Liat / Lempung (Padat): Mengikat air dan hara. Dosis standar normal. Cenderung rentan layu jamur.
- Gambut (Asam): Berikan rekomendasi yang memasukkan pembenah pH cepat (contoh dolomit cair / Kalsium Nitrat).

Berikan rekomendasi spesifik dengan: Jenis pupuk/obat, Dosis, Cara aplikasi, Frekuensi, Kandungan NPK/Bahan Aktif, dan Expected Outcome.
Berikan persentase kemungkinan (confidence) dari 0-100.
Tingkat keparahan (severity) harus salah satu dari: "Ringan", "Sedang", atau "Berat".
`;

  const parts: any[] = [{ text: prompt }];

  if (base64Image) {
    // Remove data:image/jpeg;base64, prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const mimeMatch = base64Image.match(/^data:(image\/\w+);base64,/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    
    parts.push({
      inlineData: {
        data: cleanBase64,
        mimeType: mimeType,
      }
    });
  }

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      diseaseName: { type: Type.STRING, description: "Nama penyakit atau masalah nutrisi" },
      confidence: { type: Type.NUMBER, description: "Persentase keyakinan (0-100)" },
      severity: { type: Type.STRING, description: "'Ringan', 'Sedang', atau 'Berat'" },
      affectedParts: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Bagian tanaman yang terdampak" },
      rawReasoning: { type: Type.STRING, description: "Penjelasan analisa singkat" },
      recommendations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            jenis: { type: Type.STRING },
            dosis: { type: Type.STRING },
            cara: { type: Type.STRING },
            frekuensi: { type: Type.STRING },
            kandunganNPK: { type: Type.STRING, description: "Kandungan nilai NPK eksak. Contoh: N:15%, P:9%, K:20%" },
            expectedOutcome: { type: Type.STRING, description: "Efek nyata di tanaman setelah aplikasi ini" }
          }
        }
      }
    },
    required: ["diseaseName", "confidence", "severity", "affectedParts", "recommendations"]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: { parts },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      }
    });

    const text = response.text || "{}";
    const result = JSON.parse(text) as DiagnosisResult;
    return result;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw error;
  }
}
