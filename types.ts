
export interface ECUState {
  rpm: number;
  speed: number;
  temp: number;
  voltage: number;
  load: number;
  throttle: number;
  mil: boolean;
  dtc: string;
  bleConnected: boolean;
  bleEnabled: boolean;
  deviceName: string;
}

export enum UI_MODE {
  DASHBOARD = 'DASHBOARD',
  TERMINAL = 'TERMINAL',
  SETTINGS = 'SETTINGS',
  DTC_MANAGER = 'DTC_MANAGER',
  KEY_MAPPER = 'KEY_MAPPER',
  SD_MANAGER = 'SD_MANAGER'
}

export type KeyAction = 
  | 'NONE' 
  | 'RPM_UP' | 'RPM_DOWN' 
  | 'SPD_UP' | 'SPD_DOWN' 
  | 'TOGGLE_MIL' | 'TOGGLE_BLE' 
  | 'NEXT_MODE' | 'PREV_MODE';

export interface KeyMapping {
  [key: string]: KeyAction;
}

export interface VehicleProfile {
  id: string;
  name: string;
  timestamp: string;
  data: ECUState;
}

export interface ProjectBundle {
  ino: string;
  platformio: string;
  workflow: string;
}
