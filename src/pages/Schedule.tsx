import React from 'react';
import { useFarm } from '../store/FarmContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Circle } from 'lucide-react';
import { getPlantAge, getNutrientContent, getExpectedResult, formatFertilizerName } from '../lib/farmLogic';

export default function Schedule() {
  const { schedules, activePlantId, markScheduleCompleted, plants } = useFarm();
  
  const plant = plants.find(p => p.id === activePlantId);
  if (!plant) return <div className="p-4">Pilih lahan dahulu.</div>;

  const { weeks } = getPlantAge(plant.plantingDate);

  // Group schedules by week
  const plantSchedules = schedules.filter(s => s.plantId === activePlantId);
  const groupedSchedules = plantSchedules.reduce((acc, sched) => {
    if (!acc[sched.weekNumber]) acc[sched.weekNumber] = [];
    acc[sched.weekNumber].push(sched);
    return acc;
  }, {} as Record<number, typeof schedules>);

  // Only show current week and next 3 weeks for simplicity
  const displayWeeks = [weeks, weeks + 1, weeks + 2, weeks + 3].filter(w => w > 0);

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-green-900">Jadwal Pemupukan</h2>
      
      {displayWeeks.map(weekNum => {
        const weekSchedules = groupedSchedules[weekNum] || [];
        const isCurrentWeek = weekNum === weeks;
        
        return (
          <div key={weekNum} className="space-y-3">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              Minggu ke-{weekNum}
              {isCurrentWeek && <Badge variant="warning">Minggu Ini</Badge>}
            </h3>
            
            {weekSchedules.length === 0 ? (
              <p className="text-sm text-gray-500">Tidak ada jadwal</p>
            ) : (
              weekSchedules.map(sched => {
                const schedDate = new Date(sched.date);
                const dateStr = schedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
                
                return (
                  <Card key={sched.id} className={sched.isCompleted ? 'bg-gray-50 opacity-70' : ''}>
                    <CardContent className="p-4 flex items-start gap-3">
                      <button 
                        onClick={() => !sched.isCompleted && markScheduleCompleted(sched.id)}
                        className="mt-1 flex-shrink-0 focus:outline-none"
                        disabled={sched.isCompleted}
                      >
                        {sched.isCompleted ? (
                          <CheckCircle2 className="w-6 h-6 text-green-500" />
                        ) : (
                          <Circle className="w-6 h-6 text-gray-300" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{dateStr}</p>
                            <div className="flex gap-2 mt-1 mb-2">
                              <Badge variant={sched.type === 'Kocor' ? 'default' : 'secondary'}>{sched.type}</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-700 space-y-3 mt-2">
                          
                          <div className="space-y-1">
                            <div className="flex gap-2 items-start">
                              <span className="font-medium min-w-[50px] text-gray-900">Pupuk:</span>
                              <span>{Array.from(new Set(sched.fertilizers.map(f => formatFertilizerName(f)))).join(', ')}</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="font-medium min-w-[50px] text-gray-900">Dosis:</span>
                              <span className="font-semibold text-green-700">{sched.dosages.map(d => {
                                // Format legacy long decimal numbers safely
                                const match = d.match(/^([\d.]+)(.*)$/);
                                if (match && match[1].length > 4) {
                                  const val = parseFloat(match[1]);
                                  if (!isNaN(val)) return val.toFixed(1) + match[2];
                                }
                                return d;
                              }).join(' | ')}</span>
                            </div>
                          </div>

                          <div className="bg-green-50/50 p-3 rounded-xl border border-green-100/50 space-y-1.5">
                            <div className="text-[11px] font-bold text-green-800 uppercase tracking-wider">Kandungan Hara</div>
                            <div className="text-xs text-green-700 font-medium space-y-0.5">
                               {Array.from(new Set(getNutrientContent(sched.fertilizers))).map(n => <div key={n}>• {n}</div>)}
                            </div>
                          </div>

                          <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                            <div className="text-[11px] font-bold text-blue-800 uppercase tracking-wider mb-1">Target Hasil</div>
                            <p className="text-xs text-blue-700 font-medium leading-relaxed">{getExpectedResult(sched.weekNumber)}</p>
                          </div>

                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )
      })}
    </div>
  );
}
