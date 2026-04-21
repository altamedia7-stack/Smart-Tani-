import React, { useState, useRef } from 'react';
import { useFarm } from '../store/FarmContext';
import { analyzePlantAI } from '../services/geminiService';
import { analyzeWithRuleEngine } from '../lib/farmLogic';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input, Label } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { getBase64 } from '../lib/utils';
import { Camera, Image as ImageIcon, Loader2, Info } from 'lucide-react';

export default function Scanner() {
  const { activePlantId, addHistory, updatePlantStatus, recalculateSchedule, plants } = useFarm();
  
  const [image, setImage] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [symptoms, setSymptoms] = useState('');
  const [conditions, setConditions] = useState('');
  const [historyInfo, setHistoryInfo] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await getBase64(file);
      setImage(base64);
    }
  };

  const handleAnalyze = async () => {
    if (!activePlantId) return alert("Pilih tanaman dulu");
    if (!symptoms.trim() && !image) return alert("Masukkan foto atau gejala minimal!");
    
    const activePlant = plants.find(p => p.id === activePlantId);
    const currentSoilType = activePlant?.soilType || '';

    setLoading(true);
    try {
      const sympList = symptoms.split(',').map(s => s.trim()).filter(Boolean);
      const condList = conditions.split(',').map(s => s.trim()).filter(Boolean);
      
      let res;
      try {
        res = await analyzePlantAI(image, sympList, condList, historyInfo, currentSoilType);
      } catch (e) {
        console.warn("AI failed, falling back to rule engine", e);
        res = analyzeWithRuleEngine(sympList, condList);
      }
      
      setResult(res);
      addHistory({
        id: Math.random().toString(36).substr(2, 9),
        plantId: activePlantId,
        date: new Date().toISOString(),
        imageUrl: image,
        symptoms: sympList,
        conditions: condList,
        diagnosis: res
      });

      // Update plant status based on severity
      if (res.severity === 'Berat') updatePlantStatus(activePlantId, 'Sakit');
      else if (res.severity === 'Sedang') updatePlantStatus(activePlantId, 'Warning');
      
      // We could recalculate schedules to include the new recommendations
      // recalculateSchedule(activePlantId);

    } catch (error) {
      console.error(error);
      alert("Gagal melakukan analisa");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="p-4 space-y-6 pb-24">
        <h2 className="text-3xl font-black text-emerald-900 tracking-tight">Hasil Analisis</h2>
        <div className="bg-emerald-900 rounded-[32px] p-6 shadow-xl text-white relative overflow-hidden">
          <h3 className="text-xl font-black mb-4 flex items-center space-x-2">
            <span className="bg-emerald-800 p-2 rounded-lg">🤖</span>
            <span>Diagnosis AI</span>
          </h3>
          
          <div className="bg-emerald-800 rounded-2xl p-4 mb-4">
             <h4 className="text-lg font-bold text-white mb-1">{result.diseaseName}</h4>
             <div className="flex gap-2 mb-2">
              <Badge variant="warning">{result.confidence}% Akurat</Badge>
              <Badge variant={result.severity === 'Berat' ? 'destructive' : 'secondary'}>{result.severity}</Badge>
            </div>
            {result.rawReasoning && (
              <p className="text-xs text-emerald-100 font-medium leading-relaxed italic border-l-2 border-emerald-500 pl-3">
                {result.rawReasoning}
              </p>
            )}
          </div>

          <h4 className="font-bold text-emerald-200 mb-3 text-sm uppercase tracking-wider">Rekomendasi Penanganan</h4>
          <div className="space-y-3">
            {result.recommendations.map((rec: any, idx: number) => (
              <div key={idx} className="bg-white text-slate-800 rounded-2xl p-4 text-sm space-y-2 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start">
                   <p className="font-black text-emerald-900 text-base">{rec.jenis}</p>
                   <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{rec.cara}</span>
                </div>
                <div className="flex justify-between text-xs font-medium border-t border-emerald-50 pt-2 text-slate-600">
                  <span><span className="text-emerald-600 font-bold">Dosis:</span> {rec.dosis}</span>
                  <span><span className="text-emerald-600 font-bold">Frekuensi:</span> {rec.frekuensi}</span>
                </div>
              </div>
            ))}
          </div>

          <Button variant="secondary" className="w-full mt-6 rounded-[1rem]" onClick={() => {
            setResult(null); 
            setImage(undefined);
            setSymptoms('');
            setConditions('');
          }}>Scan Ulang</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-3xl font-black text-slate-800 tracking-tight">AI Plant Doctor</h2>
      
      <Card>
        <CardContent className="p-6 space-y-6">
          <div className="space-y-3">
             <Label>Foto Tanaman Terdampak (Opsional)</Label>
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 rounded-[32px] h-48 flex flex-col items-center justify-center cursor-pointer hover:bg-emerald-100/50 transition-all overflow-hidden relative group"
             >
               {image ? (
                 <img src={image} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="Preview" />
               ) : (
                 <>
                  <Camera className="w-12 h-12 text-emerald-500 mb-3 drop-shadow-sm" />
                  <span className="text-xs font-black uppercase tracking-widest text-emerald-800">Ambil Foto Daun</span>
                  <span className="text-[10px] font-medium text-emerald-600 mt-1">Deteksi penyakit seketika</span>
                 </>
               )}
             </div>
             <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
          </div>

          <div className="space-y-2">
            <Label>Gejala yang terlihat</Label>
            <Input 
              placeholder="Cth: daun kuning, bercak hitam, keriting" 
              value={symptoms}
              onChange={e => setSymptoms(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Kondisi Lingkungan</Label>
            <Input 
              placeholder="Cth: hujan tiap hari, tanah lembab"
              value={conditions}
              onChange={e => setConditions(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Riwayat Perawatan Terakhir</Label>
            <Input 
              placeholder="Cth: NPK 3 hari lalu"
              value={historyInfo}
              onChange={e => setHistoryInfo(e.target.value)}
            />
          </div>

          <Button 
            className="w-full text-base" 
            size="lg"
            onClick={handleAnalyze} 
            disabled={loading}
          >
            {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Menganalisa...</> : 'Mulai Analisis AI'}
          </Button>

          <div className="mt-4 flex items-center space-x-3 bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
            <div className="w-10 h-10 bg-emerald-200 rounded-xl flex items-center justify-center text-emerald-700">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-800 tracking-wider">TEKNOLOGI</p>
              <p className="text-xs text-emerald-600 font-medium">Menggabungkan AI Vision & Rule Engine Agronomi</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
