
import React from 'react';
import { M5_KEYS } from '../constants';
import { KeyMapping } from '../types';

interface Props {
  onKeyClick: (key: string) => void;
  mappings: KeyMapping;
}

const KeyboardLayout: React.FC<Props> = ({ onKeyClick, mappings }) => {
  return (
    <div className="flex flex-col gap-1.5 md:gap-2">
      {M5_KEYS.map((row, i) => (
        <div key={i} className="flex justify-center gap-1 md:gap-1.5">
          {row.map((key) => {
            const isMapped = !!mappings[key];
            return (
              <button
                key={key}
                onClick={() => onKeyClick(key)}
                className={`
                  flex items-center justify-center rounded-md border-b-2 border-zinc-950
                  active:translate-y-0.5 active:border-b-0
                  text-[7px] md:text-[9px] font-bold transition-all
                  ${key === 'SPC' ? 'w-24 md:w-32' : 'w-6 h-6 md:w-8 md:h-8'}
                  ${isMapped 
                    ? 'bg-blue-600/20 text-blue-400 border-blue-900 hover:bg-blue-600/30' 
                    : 'bg-zinc-700 text-zinc-300 border-zinc-800 hover:bg-zinc-600'}
                  ${['ENT', 'TAB', 'ESC'].includes(key) ? 'ring-1 ring-white/10' : ''}
                `}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default KeyboardLayout;
