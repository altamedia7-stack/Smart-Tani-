import React, { useState } from 'react';
import { Home, Calendar as CalendarIcon, ScanLine, Clock, Settings } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Scanner from './pages/Scanner';
import History from './pages/History';
import SettingsPage from './pages/Settings';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'schedule': return <Schedule />;
      case 'scanner': return <Scanner />;
      case 'history': return <History />;
      case 'settings': return <SettingsPage />;
      default: return <Dashboard />;
    }
  };

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Home' },
    { id: 'schedule', icon: CalendarIcon, label: 'Jadwal' },
    { id: 'scanner', icon: ScanLine, label: 'Scan' },
    { id: 'history', icon: Clock, label: 'Riwayat' },
    { id: 'settings', icon: Settings, label: 'Akun' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center text-gray-900 font-sans">
      {/* Mobile container constraint for modern app look */}
      <div className="w-full max-w-md bg-gray-50 min-h-screen relative shadow-2xl overflow-hidden flex flex-col">
        
        {/* Top Header */}
        <header className="bg-white p-5 sticky top-0 z-10 border-b border-gray-100 flex items-center justify-between shadow-sm">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Smart Pupuk Tani<span className="text-green-600"> AI</span></h1>
            <p className="text-gray-500 text-xs">Konsultan Cerdas Petani</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
            <span className="text-green-700 text-xs font-bold">PT</span>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pt-4 pb-24 px-4 bg-gray-50">
          {renderContent()}
        </main>

        {/* Bottom Navigation */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex justify-between items-center px-6 py-3 pb-safe z-20">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            // Special styling for Scan button
            if (item.id === 'scanner') {
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="flex flex-col items-center justify-center -mt-8"
                >
                  <div className="w-14 h-14 bg-green-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-green-200 transition-transform active:scale-95">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className={`text-[10px] font-medium mt-1 ${isActive ? 'text-green-600' : 'text-gray-500'}`}>{item.label}</span>
                </button>
              )
            }

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className="flex flex-col items-center justify-center space-y-1 w-12 transition-all"
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-green-600' : 'text-gray-400'}`} strokeWidth={isActive ? 2.5 : 2} />
                <span className={`text-[10px] font-medium ${isActive ? 'text-green-600' : 'text-gray-500'}`}>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  );
}
