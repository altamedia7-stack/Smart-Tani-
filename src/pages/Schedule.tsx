import React from 'react';
import { useFarm } from '../store/FarmContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { getPlantAge } from '../lib/farmLogic';

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
                        <div className="text-sm text-gray-700 space-y-1">
                          <p><span className="font-medium">Pupuk:</span> {sched.fertilizers.join(', ')}</p>
                          <p><span className="font-medium">Dosis:</span> {sched.dosages.join(' | ')}</p>
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
