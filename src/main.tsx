import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { FarmProvider } from './store/FarmContext';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FarmProvider>
      <App />
    </FarmProvider>
  </StrictMode>,
);
