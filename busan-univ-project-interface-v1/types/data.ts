// 각 컬렉션의 데이터 타입을 정의합니다.
export interface CalorieData {
  ds : string;
  calorie : number;
}

export interface PredictionData {
  ds : string;
  y : number;
  yhat : number;
}

export interface AnalysisData {
  ds : string;
  sdnn : number;
  rmssd : number;
}

export interface StepData {
  ds : string;
  step : number;
}

export interface SleepData {
  ds_start : string;
  ds_end : string;
  stage : string;
}


export interface AllData {
  calorieData: CalorieData[];
  predictionData: PredictionData[];
  analysisData: AnalysisData[];
  stepData: StepData[];
  sleepData: SleepData[];
  analysisDates: string[];
}