
import React, { useState } from 'react';
import { ProjectBundle } from '../types';

interface Props {
  bundle: ProjectBundle | null;
}

const CodeExporter: React.FC<Props> = ({ bundle }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'ino' | 'platformio' | 'workflow'>('ino');

  const copyToClipboard = () => {
    if (!bundle) return;
    navigator.clipboard.writeText(bundle[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!bundle) return (
    <div className="bg-zinc-900 border border-white/5 rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-6 text-zinc-600 flex-grow shadow-2xl">
        <div className="w-20 h-20 bg-green-500/5 rounded-full flex items-center justify-center border border-green-500/10">
            <svg className="w-10 h-10 text-green-500/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0C5.374 0 0 5.374 0 12c0 5.302 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.011-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.195.69.81.57C20.565 21.795 24 17.298 24 12c0-6.626-5.374-12-12-12z"/>
            </svg>
        </div>
        <div className="space-y-2">
            <h3 className="text-white font-bold">Sin bundle generado</h3>
            <p className="mono text-[11px] leading-relaxed max-w-xs mx-auto opacity-40">Presiona el botón "Generar Bundle GitHub" para obtener los archivos necesarios para compilar tu .bin en la nube.</p>
        </div>
    </div>
  );

  const getFileName = () => {
    if (activeTab === 'ino') return 'src/main.cpp';
    if (activeTab === 'platformio') return 'platformio.ini';
    return '.github/workflows/build.yml';
  };

  return (
    <div className="flex flex-col gap-2 bg-zinc-900 rounded-[2rem] border border-white/10 overflow-hidden shadow-2xl flex-grow">
      <div className="px-6 pt-6 pb-4 bg-zinc-800/40">
        <h3 className="text-xs font-black mono text-zinc-500 uppercase tracking-[0.2em] mb-4">Exportación de Proyecto</h3>
        <div className="flex gap-2">
            <TabButton active={activeTab === 'ino'} label="Código (C++)" onClick={() => setActiveTab('ino')} />
            <TabButton active={activeTab === 'platformio'} label="Config (INI)" onClick={() => setActiveTab('platformio')} />
            <TabButton active={activeTab === 'workflow'} label="GitHub (YAML)" onClick={() => setActiveTab('workflow')} />
        </div>
      </div>
      
      <div className="flex justify-between items-center px-6 py-3 border-b border-white/5 bg-black/20">
        <span className="text-[10px] font-bold mono text-green-500/70 tracking-tighter">{getFileName()}</span>
        <button 
          onClick={copyToClipboard}
          className="text-[10px] bg-green-600/10 hover:bg-green-600/20 text-green-500 px-4 py-1.5 rounded-full transition-all flex items-center gap-2 border border-green-500/20 font-bold"
        >
          {copied ? "¡COPIADO!" : "COPIAR"}
        </button>
      </div>

      <div className="relative group flex-grow">
          <div className="max-h-[500px] overflow-auto p-6 mono text-[10px] leading-relaxed text-blue-300/80 bg-black/40 h-full scrollbar-hide">
            <pre className="whitespace-pre">
              {bundle[activeTab]}
            </pre>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900 pointer-events-none"></div>
      </div>

      <div className="p-6 bg-blue-900/10 border-t border-white/5">
        <h4 className="text-[9px] font-black text-blue-400 uppercase mb-2 tracking-widest">Guía de Compilación en GitHub:</h4>
        <div className="space-y-2 text-[10px] text-zinc-400 leading-normal font-medium">
            <p>1. Crea un repo en GitHub y sube estos 3 archivos respetando las rutas indicadas arriba.</p>
            <p>2. GitHub detectará el archivo en <code className="text-blue-300">.github/workflows</code> y ejecutará la compilación automáticamente.</p>
            <p>3. Tras 2-3 minutos, descarga el <code className="text-green-400 font-bold">firmware.bin</code> desde la pestaña "Actions" de tu repositorio.</p>
        </div>
      </div>
    </div>
  );
};

const TabButton: React.FC<{ active: boolean, label: string, onClick: () => void }> = ({ active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
    >
        {label}
    </button>
);

export default CodeExporter;
