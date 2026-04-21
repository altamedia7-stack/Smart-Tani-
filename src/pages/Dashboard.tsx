import React, { useState } from 'react';
import { useFarm } from '../store/FarmContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input, Label } from '../components/ui/input';
import { getPlantAge, getPlantPhase } from '../lib/farmLogic';
import { Plus, Sprout, Calendar, AlertTriangle, CheckCircle2, Leaf, ScanLine, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { plants, schedules, activePlantId, addPlant, markScheduleCompleted } = useFarm();
  const [showAdd, setShowAdd] = useState(plants.length === 0);

  const activePlant = plants.find(p => p.id === activePlantId);

  const handleAddPlant = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const name = (form.elements.namedItem('name') as HTMLInputElement).value;
    const plantingDate = (form.elements.namedItem('plantingDate') as HTMLInputElement).value;
    const location = (form.elements.namedItem('location') as HTMLInputElement).value;
    
    addPlant({ name, plantingDate, location, economyMode: false });
    setShowAdd(false);
  };

  if (showAdd) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Tambah Lahan</h2>
          <p className="text-gray-500 text-sm mt-1">Masukkan data tanaman baru Anda</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleAddPlant} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">Nama Tanaman</Label>
                <Input id="name" placeholder="Cth: Cabai Rawit (Blok A)" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plantingDate">Tanggal Tanam</Label>
                <Input id="plantingDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Lokasi (Opsional)</Label>
                <Input id="location" placeholder="Blok C, Sektor 2" />
              </div>
              <Button type="submit" className="w-full">Simpan Data</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activePlant) return <div className="p-4 text-gray-500 text-center font-medium">Silahkan pilih atau tambah tanaman.</div>;

  const { days, weeks } = getPlantAge(activePlant.plantingDate);
  const phase = getPlantPhase(weeks);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysSchedule = schedules.filter(s => s.plantId === activePlantId && s.date.startsWith(todayStr));
  
  const statusColors = {
    'Sehat': 'default',
    'Warning': 'warning',
    'Sakit': 'destructive'
  } as const;

  // Mock data for chart
  const dataChart = [
    { name: 'M1', pertumbuhan: 20 },
    { name: 'M2', pertumbuhan: 35 },
    { name: 'M3', pertumbuhan: 50 },
    { name: 'M4', pertumbuhan: 65 },
    { name: 'M5', pertumbuhan: 80 },
    { name: 'M6', pertumbuhan: 95 }
  ];

  const maxDaysInPhase = 120; // Example max days for a season
  const progressPercent = Math.min(100, Math.round((days / maxDaysInPhase) * 100));

  return (
    <div className="space-y-6">
      
      {/* Title Area */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{activePlant.name}</h2>
          <div className="flex items-center text-sm text-gray-500 mt-1 gap-2">
             <span className="flex items-center gap-1"><MapPinIcon className="w-4 h-4"/> {activePlant.location || 'Kebun Utama'}</span>
          </div>
        </div>
        <Badge variant={statusColors[activePlant.status]} className="px-3 py-1 text-sm shadow-sm">
          {activePlant.status === 'Sehat' ? 'Kondisi Baik' : activePlant.status === 'Warning' ? 'Perlu Perhatian' : 'Sakit'}
        </Badge>
      </div>

      {/* Card 1: Status & Progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                 <Sprout className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-500">Umur Tanaman</p>
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-gray-900">{days}</span>
                  <span className="text-sm text-gray-500 mb-1">Hari</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-500">Fase</p>
              <p className="text-base font-bold text-gray-900">{phase.split(' ')[0]}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500 font-medium">
               <span>Progress Musim Tanam</span>
               <span>{progressPercent}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
               <div className="bg-green-600 h-2.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${progressPercent}%` }}></div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-600 hover:bg-green-50 shadow-sm" onClick={() => (window as any).simulateNavScn && (window as any).simulateNavScn()}>
          <div className="bg-green-100 p-3 rounded-full text-green-600">
             <ScanLine className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm">Scan AI</span>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2 border-gray-200 text-gray-700 hover:text-green-600 hover:border-green-600 hover:bg-green-50 shadow-sm" onClick={() => setShowAdd(true)}>
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
             <Plus className="w-6 h-6" />
          </div>
          <span className="font-semibold text-sm">Tambah Lahan</span>
        </Button>
      </div>

      {/* Card 3: Todays Schedule */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-lg text-gray-900">Jadwal Hari Ini</h3>
          <span className="text-sm text-gray-500">{new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
        </div>
        
        {todaysSchedule.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-200 bg-transparent shadow-none">
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">Santai, tidak ada jadwal pemupukan hari ini.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {todaysSchedule.map(sched => (
              <Card key={sched.id} className={`transition-all ${sched.isCompleted ? 'bg-gray-50 opacity-60' : 'hover:shadow-md'}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm ${sched.type === 'Kocor' ? 'bg-green-600' : 'bg-blue-500'}`}>
                    <Activity className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-gray-900">{sched.type}</p>
                      {sched.isCompleted && <span className="text-xs font-semibold text-green-600 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Selesai</span>}
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{sched.fertilizers.join(', ')}</p>
                    <p className="text-xs font-semibold text-green-600 mt-1">{sched.dosages.join(' | ')}</p>
                  </div>
                  {!sched.isCompleted && (
                    <Button onClick={() => markScheduleCompleted(sched.id)} variant="outline" size="sm" className="shrink-0 h-10 px-3">
                      Selesai
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Card 4: Progress Chart */}
      <div>
        <h3 className="font-bold text-lg text-gray-900 mb-3">Grafik Pertumbuhan</h3>
        <Card>
          <CardContent className="p-5 pl-0 pb-3">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorPertumbuhan" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Area type="monotone" dataKey="pertumbuhan" stroke="#16A34A" strokeWidth={3} fillOpacity={1} fill="url(#colorPertumbuhan)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}

// Simple fallback icon
const MapPinIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
)
