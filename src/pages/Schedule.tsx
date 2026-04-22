import React, { useState } from 'react';
import { useFarm } from '../store/FarmContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { getPlantAge, getNutrientContent, getExpectedResult, formatFertilizerName, getDominantNutrient, getNPKRatio } from '../lib/farmLogic';

export default function Schedule() {
  const { schedules, activePlantId, markScheduleCompleted, plants } = useFarm();
  
  const plant = plants.find(p => p.id === activePlantId);
  if (!plant) return <div className="p-4">Pilih lahan dahulu.</div>;

  const { weeks } = getPlantAge(plant.plantingDate);

  // Expanded weeks state - default to current week
  const [expandedWeeks, setExpandedWeeks] = useState<Record<number, boolean>>({ [weeks]: true });

  const toggleWeek = (week: number) => {
    setExpandedWeeks(prev => ({ ...prev, [week]: !prev[week] }));
  };

  // Group schedules by week
  const plantSchedules = schedules.filter(s => s.plantId === activePlantId);
  const groupedSchedules = plantSchedules.reduce((acc, sched) => {
    if (!acc[sched.weekNumber]) acc[sched.weekNumber] = [];
    acc[sched.weekNumber].push(sched);
    return acc;
  }, {} as Record<number, typeof schedules>);

  // Determine which weeks to display
  // Show the current week, and any weeks that have schedules >= current week.
  // Actually, let's just show all completed weeks, current week, and all upcoming scheduled weeks.
  const allScheduledWeeks = Object.keys(groupedSchedules).map(Number);
  const displayWeeks = Array.from(new Set([weeks, ...allScheduledWeeks]))
    .filter(w => w > 0)
    .sort((a, b) => a - b);

  return (
    <div className="p-4 space-y-6 pb-24">
      <h2 className="text-2xl font-bold text-green-900">Jadwal Pemupukan</h2>
      
      {displayWeeks.map(weekNum => {
        const weekSchedules = groupedSchedules[weekNum] || [];
        const isCurrentWeek = weekNum === weeks;
        const isExpanded = expandedWeeks[weekNum];
        
        return (
          <div key={weekNum} className="space-y-3 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
            <div 
              className={`p-4 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}
              onClick={() => toggleWeek(weekNum)}
            >
              <div className="flex items-center gap-3">
                <h3 className={`font-black text-lg ${isCurrentWeek ? 'text-green-700' : 'text-slate-800'}`}>
                  Minggu ke-{weekNum}
                </h3>
                {isCurrentWeek && <Badge variant="warning">Minggu Ini</Badge>}
                {!isExpanded && weekSchedules.length > 0 && (
                  <Badge variant="outline" className="text-[10px] text-gray-500">{weekSchedules.length} Kegiatan</Badge>
                )}
              </div>
              {isExpanded ? <ChevronUp className="text-gray-400 w-5 h-5" /> : <ChevronDown className="text-gray-400 w-5 h-5" />}
            </div>
            
            {isExpanded && (
              <div className="p-4 pt-0 space-y-4">
                {weekSchedules.length === 0 ? (
                  <div className="bg-gray-50/50 border border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center text-center space-y-2">
                    <span className="text-gray-400 font-bold text-sm tracking-tight">Fase Istirahat / Penyerapan Alami</span>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">Tidak ada jadwal pemupukan atau penyemprotan pada minggu ini. Biarkan tanaman menyerap nutrisi dengan tenang.</p>
                  </div>
                ) : (
                  weekSchedules.map(sched => {
                    const schedDate = new Date(sched.date);
                    const dateStr = schedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
                    
                    return (
                      <Card key={sched.id} className={`${sched.isCompleted ? 'bg-gray-50 opacity-70' : 'border-emerald-100 shadow-sm'}`}>
                        <CardContent className="p-4 flex items-start gap-3">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              !sched.isCompleted && markScheduleCompleted(sched.id);
                            }}
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
                                <p className="text-sm font-black text-slate-800">{dateStr}</p>
                                <div className="flex gap-2 mt-1 mb-2">
                                  <Badge variant={sched.type === 'Kocor' ? 'default' : 'secondary'} className="text-[10px] py-0">{sched.type}</Badge>
                                </div>
                              </div>
                            </div>
                            <div className="text-sm text-slate-700 space-y-3 mt-2">
                              
                              <div className="space-y-1">
                                <div className="flex gap-2 items-start">
                                  <span className="font-bold min-w-[50px] text-slate-900 border-r border-slate-100 pr-2">Pupuk</span>
                                  <span className="font-medium">{Array.from(new Set(sched.fertilizers.map(f => formatFertilizerName(f)))).join(', ')}</span>
                                </div>
                                <div className="flex gap-2 items-start">
                                  <span className="font-bold min-w-[50px] text-slate-900 border-r border-slate-100 pr-2">Dosis</span>
                                  <span className="font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-xs">{sched.dosages.map(d => {
                                    const match = d.match(/^([\d.]+)(.*)$/);
                                    if (match && match[1].length > 4) {
                                      const val = parseFloat(match[1]);
                                      if (!isNaN(val)) return val.toFixed(1) + match[2];
                                    }
                                    return d;
                                  }).join(' | ')}</span>
                                </div>
                              </div>

                              <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/50 space-y-2">
                                <div className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">Kandungan Hara</div>
                                
                                {(() => {
                                  const ratio = getNPKRatio(sched.fertilizers);
                                  const total = ratio.n + ratio.p + ratio.k || 1;
                                  const pN = (ratio.n / total) * 100;
                                  const pP = (ratio.p / total) * 100;
                                  const pK = (ratio.k / total) * 100;
                                  
                                  if (total > 1) {
                                    return (
                                      <div className="mb-2">
                                        <div className="flex h-2.5 w-full rounded-full overflow-hidden bg-white shadow-inner mb-2">
                                          <div style={{ width: `${pN}%` }} className="bg-emerald-500 h-full"></div>
                                          <div style={{ width: `${pP}%` }} className="bg-blue-500 h-full"></div>
                                          <div style={{ width: `${pK}%` }} className="bg-orange-500 h-full"></div>
                                        </div>
                                        <div className="flex justify-between text-[9px] text-slate-500 font-black px-0.5 tracking-tight uppercase">
                                          <span className="flex items-center gap-1">N: {Math.round(pN)}%</span>
                                          <span className="flex items-center gap-1">P: {Math.round(pP)}%</span>
                                          <span className="flex items-center gap-1">K: {Math.round(pK)}%</span>
                                        </div>
                                      </div>
                                    );
                                  }
                                  return null;
                                })()}

                                <div className="text-[11px] text-emerald-800 font-medium space-y-0.5 pt-1 border-t border-emerald-100/50 italic">
                                  {Array.from(new Set(getNutrientContent(sched.fertilizers))).map(n => <div key={n}>• {n}</div>)}
                                </div>
                              </div>

                              <div className="bg-amber-50/80 p-3 rounded-[1.2rem] border border-amber-200/60 shadow-sm relative overflow-hidden">
                                <div className="text-[10px] font-black text-amber-800 uppercase tracking-widest mb-2 flex items-center justify-between">
                                  Edukasi Agronomi
                                  <span className="bg-amber-200 w-4 h-4 rounded-full flex items-center justify-center text-[8px]">!</span>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-xs text-amber-900 font-black tracking-tight">{getDominantNutrient(sched.weekNumber, plant.name).title}</p>
                                  <p className="text-[11px] text-amber-800 font-medium leading-relaxed">{getDominantNutrient(sched.weekNumber, plant.name).explanation}</p>
                                  <div className="bg-white/80 p-2 rounded-xl text-[10px] text-amber-900 leading-relaxed font-bold border border-amber-100">
                                    {getDominantNutrient(sched.weekNumber, plant.name).comparison}
                                  </div>
                                </div>
                              </div>

                              <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100/50">
                                <div className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1.5">Target Hasil</div>
                                <p className="text-[11px] text-blue-700 font-medium leading-relaxed">{getExpectedResult(sched.weekNumber, plant.soilType || 'Normal', plant.name)}</p>
                              </div>

                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  );
}
