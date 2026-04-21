import React from 'react';
import { useFarm } from '../store/FarmContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Filter } from 'lucide-react';

export default function History() {
  const { history, activePlantId, plants } = useFarm();
  
  const plantHistory = history.filter(h => h.plantId === activePlantId);
  const plant = plants.find(p => p.id === activePlantId);

  if (!plant) return <div className="p-4 text-gray-500 text-center font-medium">Pilih lahan dahulu.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Riwayat</h2>
          <p className="text-sm text-gray-500 mt-1">Aktivitas & Log Diagnosa</p>
        </div>
        <button className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 shadow-sm hover:bg-gray-50">
          <Filter className="w-5 h-5" />
        </button>
      </div>
      
      {plantHistory.length === 0 ? (
        <div className="text-center bg-white p-8 rounded-2xl border border-dashed border-gray-200 mt-10">
          <p className="text-gray-500 font-medium text-sm">Belum ada riwayat aktivitas.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plantHistory.map(h => (
            <Card key={h.id} className="overflow-hidden">
              <div className="h-1 w-full bg-blue-500" />
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-gray-500">
                    {new Date(h.date).toLocaleDateString('id-ID', { dateStyle: 'medium' })}
                  </span>
                  <Badge variant={h.diagnosis.severity === 'Berat' ? 'destructive' : 'warning'}>
                    {h.diagnosis.severity}
                  </Badge>
                </div>
                
                <div className="flex gap-4">
                  {h.imageUrl && (
                    <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-gray-100 shadow-sm">
                      <img src={h.imageUrl} alt="Scan" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h4 className="font-bold text-base text-gray-900 leading-tight mb-1">{h.diagnosis.diseaseName}</h4>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-medium">
                      <span className="text-gray-700">Gejala:</span> {h.symptoms.join(', ') || 'N/A'}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                        AI Akurasi {h.diagnosis.confidence}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
