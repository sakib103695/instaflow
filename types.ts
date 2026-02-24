
export interface VoiceDemoState {
  isActive: boolean;
  isConnecting: boolean;
  error: string | null;
  transcription: string;
}

export interface AudioVisualizerProps {
  isActive: boolean;
  volume: number;
}
