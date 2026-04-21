import React, { createContext, useContext, useState, useEffect } from 'react';
import { Plant, ScheduleEntry, ScanHistory } from '../types';
import { generateScheduleForPlant } from '../lib/farmLogic';

interface FarmState {
  plants: Plant[];
  schedules: ScheduleEntry[];
  history: ScanHistory[];
  activePlantId: string | null;
}

interface FarmContextType extends FarmState {
  addPlant: (plant: Omit<Plant, 'id' | 'status'>) => void;
  setActivePlant: (id: string) => void;
  updatePlantStatus: (id: string, status: Plant['status']) => void;
  toggleEconomyMode: (id: string) => void;
  addHistory: (history: ScanHistory) => void;
  markScheduleCompleted: (id: string) => void;
  recalculateSchedule: (plantId: string) => void;
  resetData: () => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<FarmState>(() => {
    const saved = localStorage.getItem('farmState');
    if (saved) return JSON.parse(saved);
    return { plants: [], schedules: [], history: [], activePlantId: null };
  });

  useEffect(() => {
    localStorage.setItem('farmState', JSON.stringify(state));
  }, [state]);

  const resetData = () => {
    localStorage.removeItem('farmState');
    setState({ plants: [], schedules: [], history: [], activePlantId: null });
  };

  const addPlant = (newPlantData: Omit<Plant, 'id' | 'status'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const plant: Plant = { ...newPlantData, id, status: 'Sehat' };
    const schedules = generateScheduleForPlant(plant);
    
    setState(prev => ({
      ...prev,
      plants: [...prev.plants, plant],
      schedules: [...prev.schedules, ...schedules],
      activePlantId: prev.activePlantId || id
    }));
  };

  const setActivePlant = (id: string) => setState(prev => ({ ...prev, activePlantId: id }));

  const updatePlantStatus = (id: string, status: Plant['status']) => {
    setState(prev => ({
      ...prev,
      plants: prev.plants.map(p => p.id === id ? { ...p, status } : p)
    }));
  };

  const toggleEconomyMode = (id: string) => {
    setState(prev => {
      const updatedPlants = prev.plants.map(p => p.id === id ? { ...p, economyMode: !p.economyMode } : p);
      const targetPlant = updatedPlants.find(p => p.id === id);
      const newSchedules = targetPlant ? generateScheduleForPlant(targetPlant) : [];
      
      // Replace future schedules for this plant
      const now = new Date().toISOString();
      const keptSchedules = prev.schedules.filter(s => s.plantId !== id || s.isCompleted || s.date < now);
      const futureSchedules = newSchedules.filter(s => s.date >= now);
      
      return {
        ...prev,
        plants: updatedPlants,
        schedules: [...keptSchedules, ...futureSchedules]
      };
    });
  };

  const addHistory = (historyItem: ScanHistory) => {
    setState(prev => ({ ...prev, history: [historyItem, ...prev.history] }));
  };

  const markScheduleCompleted = (id: string) => {
    setState(prev => ({
      ...prev,
      schedules: prev.schedules.map(s => s.id === id ? { ...s, isCompleted: true, completedAt: new Date().toISOString() } : s)
    }));
  };

  const recalculateSchedule = (plantId: string) => {
     // A simple recalculation based on current rules, replacing future ones
     setState(prev => {
      const plant = prev.plants.find(p => p.id === plantId);
      if (!plant) return prev;
      const newSchedules = generateScheduleForPlant(plant);
      const now = new Date().toISOString();
      const keptSchedules = prev.schedules.filter(s => s.plantId !== plantId || s.isCompleted || s.date < now);
      const futureSchedules = newSchedules.filter(s => s.date >= now);
      
      return { ...prev, schedules: [...keptSchedules, ...futureSchedules] };
    });
  };

  return (
    <FarmContext.Provider value={{
      ...state, addPlant, setActivePlant, updatePlantStatus, 
      toggleEconomyMode, addHistory, markScheduleCompleted, recalculateSchedule, resetData
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) throw new Error("useFarm must be used within FarmProvider");
  return context;
};
