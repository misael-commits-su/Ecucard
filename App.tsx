
import React, { useState, useEffect } from 'react';
import { ECUState, UI_MODE, KeyMapping, VehicleProfile, ProjectBundle } from './types';
import { M5_KEYS } from './constants';
import VirtualScreen from './components/VirtualScreen';
import KeyboardLayout from './components/KeyboardLayout';
import CodeExporter from './components/CodeExporter';
import { GoogleGenAI, Type } from "@google/genai";

const DEFAULT_MAPPINGS: KeyMapping = {
  'UP': 'RPM_UP',
  ';': 'RPM_UP',
  'DWN': 'RPM_DOWN',
  '.': 'RPM_DOWN',
  'RGT': 'SPD_UP',
  '/': 'SPD_UP',
  'LFT': 'SPD_DOWN',
  ',': 'SPD_DOWN',
  'OPT': 'TOGGLE_BLE',
  'TAB': 'NEXT_MODE',
  'ENT': 'TOGGLE_MIL'
};

const App: React.FC = () => {
  const [ecu, setEcu] = useState<ECUState>({
    rpm: 850,
    speed: 0,
    temp: 85,
    voltage: 14.1,
    load: 12,
    throttle: 5,
    mil: false,
    dtc: 'P0000',
    bleConnected: false,
    bleEnabled: true,
    deviceName: 'CARDPUTER_OBD'
  });

  const [uiMode, setUiMode] = useState<UI_MODE>(UI_MODE.DASHBOARD);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectBundle, setProjectBundle] = useState<ProjectBundle | null>(null);
  const [log, setLog] = useState<string[]>(['[SYS] Firmware simulation active.']);
  
  const [mappings, setMappings] = useState<KeyMapping>(() => {
    const saved = localStorage.getItem('ecu_key_mappings');
    return saved ? JSON.parse(saved) : DEFAULT_MAPPINGS;
  });

  const [sdFiles, setSdFiles] = useState<VehicleProfile[]>(() => {
    const saved = localStorage.getItem('ecu_sd_files');
    return saved ? JSON.parse(saved) : [];
  });

  const addLog = (msg: string) => {
    setLog(prev => [...prev.slice(-12), `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    localStorage.setItem('ecu_key_mappings', JSON.stringify(mappings));
  }, [mappings]);

  useEffect(() => {
    localStorage.setItem('ecu_sd_files', JSON.stringify(sdFiles));
  }, [sdFiles]);

  const handleKeyClick = (key: string) => {
    if (uiMode === UI_MODE.KEY_MAPPER) {
       if (key === 'TAB') { setUiMode(UI_MODE.SD_MANAGER); return; }
       if (key === 'UP' || key === ';') { setSelectedIndex(p => Math.max(0, p - 1)); return; }
       if (key === 'DWN' || key === '.') { setSelectedIndex(p => p + 1); return; }
       return;
    }

    const action = mappings[key];
    switch(action) {
        case 'NEXT_MODE': 
            const modes = Object.values(UI_MODE);
            setUiMode(modes[(modes.indexOf(uiMode) + 1) % modes.length]);
            setSelectedIndex(0);
            return;
        case 'RPM_UP': adjustECU(1, 'rpm'); return;
        case 'RPM_DOWN': adjustECU(-1, 'rpm'); return;
        case 'SPD_UP': adjustECU(1, 'speed'); return;
        case 'SPD_DOWN': adjustECU(-1, 'speed'); return;
        case 'TOGGLE_BLE': setEcu(p => ({...p, bleEnabled: !p.bleEnabled})); return;
        case 'TOGGLE_MIL': setEcu(p => ({...p, mil: !p.mil, dtc: !p.mil ? 'P0300' : 'P0000'})); return;
    }

    if (key === 'TAB') {
        const modes = Object.values(UI_MODE);
        setUiMode(modes[(modes.indexOf(uiMode) + 1) % modes.length]);
    }
  };

  const adjustECU = (dir: number, field: keyof ECUState) => {
    setEcu(prev => {
        let next = { ...prev };
        if (field === 'rpm') next.rpm = Math.max(0, Math.min(8500, prev.rpm + (dir * 250)));
        if (field === 'speed') next.speed = Math.max(0, Math.min(260, prev.speed + (dir * 10)));
        return next;
    });
  };

  const saveToSD = () => {
    const newProfile: VehicleProfile = {
        id: Math.random().toString(36).substr(2, 9),
        name: `LOG_${new Date().getHours()}${new Date().getMinutes()}`,
        timestamp: new Date().toLocaleString(),
        data: { ...ecu }
    };
    setSdFiles(prev => [...prev, newProfile]);
    addLog(`SD: Archivo ${newProfile.name}.JSON creado.`);
  };

  const loadFromSD = (profile: VehicleProfile) => {
    setEcu(profile.data);
    addLog(`SD: Cargado ${profile.name}`);
  };

  const generateProjectBundle = async () => {
    setIsGenerating(true);
    addLog("Preparando bundle de compilación CI/CD...");
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Genera un bundle de proyecto completo para M5Stack Cardputer (ESP32-S3) que sea compilable automáticamente mediante GitHub Actions.
        
        Debes devolver un JSON con tres propiedades:
        1. "ino": Código C++ principal (Arduino/PlatformIO) que incluya BLE ELM327, soporte SD y gestión de teclado.
        2. "platformio": Contenido de un archivo platformio.ini configurado para M5Cardputer con las librerías necesarias (NimBLE-Arduino, M5Cardputer, ArduinoJson).
        3. "workflow": Contenido de un archivo YAML (.github/workflows/main.yml) que use 'platformio/platformio-action' para compilar el proyecto y subir el archivo .bin como un artifact de GitHub.
        
        Hardware: M5Cardputer (ESP32-S3, 8MB Flash).
        Asegúrate de que el YAML de GitHub incluya pasos para instalar dependencias y exportar el firmware.bin.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    ino: { type: Type.STRING },
                    platformio: { type: Type.STRING },
                    workflow: { type: Type.STRING }
                },
                required: ["ino", "platformio", "workflow"]
            }
        }
      });

      const data = JSON.parse(response.text);
      setProjectBundle(data);
      addLog("Bundle de GitHub Actions listo para exportar.");
    } catch (err) {
      addLog("Error de Generación: " + err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 lg:p-8 flex flex-col gap-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-green-500 flex items-center gap-3">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9L16 12l-5 4.5z"/></svg>
            Cardputer <span className="text-white">ECU Pro</span>
          </h1>
          <p className="text-zinc-400 mt-1 uppercase text-[10px] tracking-widest font-bold">CI/CD & GitHub Workflow Integrated</p>
        </div>
        <div className="flex gap-3">
            <button 
                onClick={generateProjectBundle}
                disabled={isGenerating}
                className="bg-green-600 hover:bg-green-500 disabled:bg-zinc-700 text-white font-black py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-green-900/20 active:scale-95"
            >
                {isGenerating ? "Generando..." : "🚀 Generar Bundle GitHub (.bin)"}
            </button>
        </div>
      </header>

      <main className="grid grid-cols-1 xl:grid-cols-12 gap-8 flex-grow">
        <div className="xl:col-span-7 flex flex-col items-center gap-10 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-xl">
           
           <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-tr from-blue-500/10 via-green-500/10 to-purple-500/10 rounded-[50px] blur-2xl group-hover:blur-3xl transition-all duration-700"></div>
                <div className="relative w-[340px] md:w-[480px] bg-[#1a1a1a] rounded-[40px] p-7 cardputer-bezel border border-white/10 ring-1 ring-white/5">
                    <div className="flex justify-between items-center mb-5 px-3">
                         <div className="flex gap-2">
                            <div className={`w-3 h-3 rounded-full shadow-inner ${ecu.bleEnabled ? 'bg-blue-500 animate-pulse' : 'bg-zinc-700'}`}></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-inner"></div>
                         </div>
                         <div className="text-[9px] mono text-zinc-500 uppercase tracking-[0.2em] font-black">GITHUB_CI_ACTIVE</div>
                    </div>

                    <VirtualScreen 
                        ecu={ecu} 
                        uiMode={uiMode} 
                        selectedIndex={selectedIndex}
                        mappings={mappings}
                        sdFiles={sdFiles}
                        onSaveToSD={saveToSD}
                        onLoadFromSD={loadFromSD}
                    />

                    <div className="mt-8 px-1">
                        <KeyboardLayout onKeyClick={handleKeyClick} mappings={mappings} />
                    </div>
                </div>
           </div>

           <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-4 px-4">
                <ControlBox label="RPM" value={ecu.rpm} min={0} max={8500} step={100} onChange={(v) => setEcu(p => ({...p, rpm: v}))} unit="R" />
                <ControlBox label="SPD" value={ecu.speed} min={0} max={260} step={5} onChange={(v) => setEcu(p => ({...p, speed: v}))} unit="K" />
                <ControlBox label="TMP" value={ecu.temp} min={-40} max={150} step={1} onChange={(v) => setEcu(p => ({...p, temp: v}))} unit="C" />
                <ControlBox label="VLT" value={ecu.voltage} min={9} max={16} step={0.1} onChange={(v) => setEcu(p => ({...p, voltage: parseFloat(v.toFixed(1))}))} unit="V" />
           </div>
        </div>

        <div className="xl:col-span-5 flex flex-col gap-6">
            <div className="bg-black/40 rounded-3xl border border-white/5 overflow-hidden flex flex-col h-[280px] shadow-inner">
                <div className="bg-zinc-800/50 px-5 py-3 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
                      <span className="text-[10px] font-black mono text-zinc-400 tracking-wider">CI_RUN_LOG</span>
                    </div>
                    <span className="text-[9px] mono text-zinc-600">YAML v2.1</span>
                </div>
                <div className="p-5 flex-grow overflow-y-auto mono text-[10px] space-y-1.5 scrollbar-hide">
                    {log.map((line, i) => (
                        <div key={i} className={`flex gap-3 ${line.includes('GitHub') ? 'text-blue-400' : 'text-zinc-500'}`}>
                            <span className="opacity-30">[{i.toString().padStart(2, '0')}]</span>
                            <span>{line}</span>
                        </div>
                    ))}
                </div>
            </div>

            <CodeExporter bundle={projectBundle} />
        </div>
      </main>
    </div>
  );
};

const ControlBox: React.FC<{ label: string, value: number, min: number, max: number, step: number, unit: string, onChange: (v: number) => void }> = ({ label, value, min, max, step, unit, onChange }) => (
    <div className="bg-zinc-800/40 p-3.5 rounded-2xl border border-white/5 flex flex-col gap-2 hover:bg-zinc-800/60 transition-colors">
        <div className="flex justify-between items-end">
            <span className="text-[9px] font-black text-zinc-500">{label}</span>
            <span className="text-xs font-mono font-bold text-white">{value}<span className="text-[7px] text-zinc-500 ml-0.5">{unit}</span></span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            step={step} 
            value={value} 
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-zinc-700/50 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
    </div>
);

export default App;
