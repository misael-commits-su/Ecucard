
import React from 'react';
import { ECUState, UI_MODE, KeyMapping, VehicleProfile } from '../types';

interface Props {
  ecu: ECUState;
  uiMode: UI_MODE;
  selectedIndex: number;
  mappings: KeyMapping;
  sdFiles: VehicleProfile[];
  onSaveToSD: () => void;
  onLoadFromSD: (p: VehicleProfile) => void;
}

const VirtualScreen: React.FC<Props> = ({ ecu, uiMode, selectedIndex, mappings, sdFiles, onSaveToSD, onLoadFromSD }) => {
  const rpmPercent = (ecu.rpm / 8500) * 100;

  return (
    <div className="w-full aspect-[240/135] bg-[#050505] rounded-xl overflow-hidden border-[6px] border-[#0a0a0a] lcd-glow relative shadow-2xl">
      <div className="absolute inset-0 p-3 flex flex-col font-mono text-[9px] leading-none select-none overflow-hidden">
        
        {/* Barra Superior */}
        <div className="flex justify-between items-center mb-2 text-zinc-500 border-b border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5">
                <div className={`w-1.5 h-1.5 rounded-full ${ecu.bleEnabled ? 'bg-blue-500' : 'bg-zinc-800'}`}></div>
                <span className="text-[8px] font-bold tracking-tighter">OBD_SD_SYS</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[7px] opacity-50">BT:{ecu.bleConnected ? 'CONN' : 'ADV'}</span>
                <span className="text-white/80 font-black">{uiMode}</span>
            </div>
        </div>

        {uiMode === UI_MODE.DASHBOARD && (
          <div className="flex flex-col flex-grow">
            <div className="w-full h-4 bg-zinc-900/50 rounded-sm mb-3 relative overflow-hidden border border-zinc-800">
                <div 
                    className={`h-full transition-all duration-300 ${ecu.rpm > 7000 ? 'bg-red-500' : 'bg-green-500'}`}
                    style={{ width: `${rpmPercent}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[7px] font-black text-white/40">
                    <span>0</span>
                    <span>4k</span>
                    <span>8k</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <DataRow label="RPM" value={ecu.rpm} active={selectedIndex === 0} />
                <DataRow label="SPD" value={ecu.speed} active={selectedIndex === 1} />
                <DataRow label="TMP" value={ecu.temp + "°C"} active={selectedIndex === 2} />
                <DataRow label="VLT" value={ecu.voltage.toFixed(1) + "v"} active={selectedIndex === 3} />
            </div>

            <div className="mt-auto flex justify-between items-end border-t border-zinc-900 pt-1.5">
                <div className="flex flex-col gap-0.5">
                    <span className="text-[7px] text-zinc-600 uppercase">Estado Diagnóstico</span>
                    <span className={`text-[10px] font-black ${ecu.mil ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
                        {ecu.mil ? "FALLO MOTOR" : "SISTEMA OK"}
                    </span>
                </div>
                <span className="text-[7px] text-zinc-700 bg-zinc-900 px-1 py-0.5 rounded">{ecu.dtc}</span>
            </div>
          </div>
        )}

        {uiMode === UI_MODE.KEY_MAPPER && (
          <div className="flex flex-col flex-grow">
            <span className="text-[8px] text-zinc-500 mb-2 uppercase font-bold">Configuración de Teclas</span>
            <div className="flex-grow overflow-y-auto pr-1 space-y-1 scrollbar-hide">
                {Object.entries(mappings).map(([key, action], idx) => (
                    <div key={key} className={`flex justify-between p-1 rounded ${selectedIndex === idx ? 'bg-zinc-800 text-blue-400' : 'text-zinc-500'}`}>
                        <span className="font-bold">TECLA {key}</span>
                        <span>{action}</span>
                    </div>
                ))}
            </div>
            <div className="mt-2 text-[7px] text-zinc-700 italic">UP/DOWN para navegar</div>
          </div>
        )}

        {uiMode === UI_MODE.SD_MANAGER && (
          <div className="flex flex-col flex-grow">
             <div className="flex justify-between items-center mb-2">
                <span className="text-yellow-500 font-bold">GESTIÓN SD CARD</span>
                <button onClick={onSaveToSD} className="bg-zinc-800 text-[7px] px-2 py-0.5 rounded border border-zinc-700 hover:text-white">NUEVO LOG</button>
             </div>
             <div className="flex-grow overflow-y-auto space-y-1">
                {sdFiles.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-zinc-800 italic">SD Vacía</div>
                ) : (
                    sdFiles.map((file, idx) => (
                        <div key={file.id} onClick={() => onLoadFromSD(file)} className="flex justify-between p-1 bg-zinc-900 rounded border border-zinc-800 cursor-pointer hover:border-yellow-500/50">
                            <span className="text-white">{file.name}.JSON</span>
                            <span className="text-[7px] text-zinc-600">{file.timestamp}</span>
                        </div>
                    ))
                )}
             </div>
          </div>
        )}

        {uiMode === UI_MODE.TERMINAL && (
          <div className="text-zinc-500 space-y-1 overflow-hidden">
             {/* Vista terminal igual a la anterior */}
             <div className="space-y-0.5">
                <div>&gt; ATZ</div>
                <div className="text-white/80 pl-2">ELM327 v1.5 [SD_EXT]</div>
                <div>&gt; 01 0C</div>
                <div className="text-green-500 pl-2">41 0C {(ecu.rpm * 4).toString(16).toUpperCase()}</div>
                <div className="animate-pulse text-white">_</div>
            </div>
          </div>
        )}

      </div>
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0)_50%,rgba(0,0,0,0.05)_50%)] bg-[length:100%_4px] opacity-20"></div>
    </div>
  );
};

const DataRow: React.FC<{ label: string, value: string | number, active: boolean }> = ({ label, value, active }) => (
    <div className={`flex justify-between items-center px-1.5 py-1.5 rounded-md border transition-all ${active ? 'bg-zinc-900 border-blue-500/50 text-blue-400' : 'border-transparent text-white/70'}`}>
        <span className="text-[8px] font-black opacity-50">{label}</span>
        <span className="font-bold text-[10px]">{value}</span>
    </div>
);

export default VirtualScreen;
