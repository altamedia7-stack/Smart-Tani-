import React from 'react';
import { useFarm } from '../store/FarmContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Map, Bell, ShieldCheck, Banknote, ChevronRight, User, Trash2 } from 'lucide-react';

export default function Settings() {
  const { plants, activePlantId, setActivePlant, toggleEconomyMode, resetData } = useFarm();
  
  const activePlant = plants.find(p => p.id === activePlantId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Pengaturan</h2>
        <p className="text-sm text-gray-500 mt-1">Kelola lahan dan preferensi aplikasi</p>
      </div>

      {/* Account Profile Preview */}
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-700">
              <User size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Petani Cerdas</p>
              <p className="text-xs text-gray-500">Premium Member</p>
            </div>
          </div>
          <ChevronRight className="text-gray-400 w-5 h-5" />
        </CardContent>
      </Card>
      
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Lahan Aktif</h3>
        {plants.length === 0 ? (
          <div className="bg-white border text-center border-dashed border-gray-200 rounded-2xl p-6">
             <p className="text-sm text-gray-500 font-medium">Belum ada lahan ditambahkan.</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-4 space-y-3">
              {plants.map((p, index) => (
                <div 
                  key={p.id}
                  onClick={() => setActivePlant(p.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-all ${p.id === activePlantId ? 'bg-green-50 border-green-500' : 'bg-white border-gray-100 hover:border-green-200'}`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm ${p.id === activePlantId ? 'bg-green-600 shadow-md shadow-green-200' : 'bg-gray-300'}`}>
                    {p.name.substring(0,2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    <p className="text-[10px] text-gray-500 font-medium">{p.location || 'Kebun'}</p>
                  </div>
                  {p.id === activePlantId && (
                    <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                      <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {activePlant && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">Preferensi AI</h3>
          <Card>
            <CardContent className="p-0 divide-y divide-gray-100">
              
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                    <Banknote className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Mode Hemat Pupuk</p>
                    <p className="text-xs text-gray-500 mt-0.5 w-[200px]">Mengurangi dosis rekomendasi hingga 30%</p>
                  </div>
                </div>
                {/* Mock iOS Style Switch */}
                <div 
                  className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ease-in-out ${activePlant.economyMode ? 'bg-green-500' : 'bg-gray-200'}`}
                  onClick={() => toggleEconomyMode(activePlant.id)}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ease-in-out ${activePlant.economyMode ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Bell className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Notifikasi Cerdas</p>
                    <p className="text-xs text-gray-500 mt-0.5">Pengingat harian jadwal pupuk</p>
                  </div>
                </div>
                <div className="w-12 h-6 rounded-full p-1 cursor-pointer bg-green-500 transition-colors duration-300 ease-in-out">
                  <div className="bg-white w-4 h-4 rounded-full shadow-md transform translate-x-6 transition-transform duration-300 ease-in-out"></div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      )}

      {/* Danger Zone */}
      <div className="space-y-3 pt-2">
         <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider ml-1 flex items-center gap-2">Data Aplikasi</h3>
         <Card className="border-red-100 bg-red-50/30">
            <CardContent className="p-4">
               <p className="text-sm text-gray-600 mb-4 font-medium">Hapus semua data tanaman, jadwal, dan riwayat yang tersimpan di perangkat ini.</p>
               <Button 
                variant="destructive" 
                className="w-full flex items-center justify-center gap-2"
                onClick={() => {
                  if(window.confirm('Yakin ingin menghapus seluruh data tanaman dan jadwal? Tindakan ini tidak dapat dibatalkan.')) {
                    resetData();
                  }
                }}
              >
                <Trash2 className="w-5 h-5" />
                Hapus Semua Data
              </Button>
            </CardContent>
         </Card>
      </div>

      <div className="pt-4 pb-8 text-center">
        <ShieldCheck className="w-6 h-6 text-green-600 mx-auto mb-1" />
        <p className="text-xs text-gray-500 font-medium">Smart Pupuk Tani AI v2.1.0</p>
      </div>

    </div>
  );
}
