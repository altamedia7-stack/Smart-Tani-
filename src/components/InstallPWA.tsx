import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from './ui/button';

export function InstallPWA() {
  const [supportsPWA, setSupportsPWA] = useState(false);
  const [promptInstall, setPromptInstall] = useState<any>(null);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setSupportsPWA(true);
      setPromptInstall(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onClick = async () => {
    if (!promptInstall) return;
    promptInstall.prompt();
    const { outcome } = await promptInstall.userChoice;
    if (outcome === 'accepted') {
      setSupportsPWA(false);
    }
  };

  if (!supportsPWA) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-1.5 bg-green-50 border-green-200 text-green-700 hover:text-green-800 hover:bg-green-100 rounded-full px-3 py-1 h-8"
      onClick={onClick}
      title="Install Aplikasi"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold">Install</span>
    </Button>
  );
}
