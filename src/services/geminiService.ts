import { GoogleGenAI, Type } from '@google/genai';
import { DiagnosisResult } from '../types';

export async function analyzePlantAI(
  base64Image: string | undefined, 
  symptoms: string[], 
  conditions: string[], 
  historyInfo: string,
  soilType?: string
): Promise<DiagnosisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  const soilContext = soilType ? `\nJenis Tanah: ${soilType}` : '';

  const prompt = `
Anda adalah konsultan agronomi profesional tingkat dunia.
Berdasarkan data berikut (dan gambar jika ada):
Gejala: ${symptoms.join(', ')}
Kondisi Lingkungan: ${conditions.join(', ')}${soilContext}
Riwayat: ${historyInfo}

Lakukan analisa mendalam. Hitung probabilitas masalah menggunakan sistem skoring berdasarkan input pengguna dan aturan agronomi.

PENTING:
Pengguna meminta Anda untuk menggunakan standar PUPUK TERBAIK (Premium) tanpa batasan harga. Jangan lagi membatasi pada pupuk "merakyat". Gunakan pupuk kelas atas yang kualitas dan kelarutannya paling efektif (misalnya: seri YaraMila, YaraLiva Calcinit, Meroke, KNO3 Prill/Kristal, MKP premium, Chelated Trace Elements, dsb).

Aturan Interval Berdasarkan Jenis Tanah:
- Berpasir (Porous): Sangat rentan pencucian (leaching). WAJIB direkomendasikan aplikasi pupuk dengan interval yang lebih sering (misal: 3 hari sekali) tetapi dosis dikurangi (spoon-feeding).
- Liat / Lempung (Padat): Mengikat air dan hara. Gunakan dosis standar atau sedikit lebih tinggi, dengan interval normal (misal 1-2 minggu sekali). Hati-hati akumulasi dan residu.
- Gambut (Asam): Berikan rekomendasi yang memasukkan pembenah pH cepat (contoh dolomit cair / pupuk berbasis Kalsium Nitrat kualitas tinggi).

Berikan rekomendasi spesifik dengan: Jenis pupuk/obat, Dosis, Cara aplikasi, dan Frekuensi.
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
            frekuensi: { type: Type.STRING }
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
