import { GoogleGenAI, Type } from '@google/genai';
import { DiagnosisResult } from '../types';

export async function analyzePlantAI(
  base64Image: string | undefined, 
  symptoms: string[], 
  conditions: string[], 
  historyInfo: string
): Promise<DiagnosisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Anda adalah asisten konsultan pertanian semi-profesional.
Berdasarkan data berikut (dan gambar jika ada):
Gejala: ${symptoms.join(', ')}
Kondisi Lingkungan: ${conditions.join(', ')}
Riwayat: ${historyInfo}

Lakukan analisa mendalam layaknya konsultan pertanian. Hitung probabilitas masalah menggunakan sistem skoring berdasarkan input pengguna dan aturan agronomi.

Jika pengguna melaporkan:
- Daun kuning tanpa bercak = Kekurangan Nitrogen
- Bercak hitam di kondisi lembab = Penyakit jamur (Antraknosa)
- Daun keriting = Hama / virus
- Buah kecil = Kekurangan Kalium
- Bunga rontok = Kekurangan Fosfat/Boron

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
