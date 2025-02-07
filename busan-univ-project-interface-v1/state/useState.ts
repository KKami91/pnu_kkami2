import { atom } from "recoil";

export interface AnalysisDataState {
  meanBpm: number;
  sumStep: number;
  sumCalorie: number;
  sumSleep: number;
  sleepQuality: number;
}

export const selectedUserState = atom<string>({
  key: 'selectedUserState',
  default: ''
});

export const analysisDataState = atom<AnalysisDataState | null>({
  key: 'analysisDataState',
  default: null,
});