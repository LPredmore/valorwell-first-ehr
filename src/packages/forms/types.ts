
// Assessment Types
export interface PHQ9Question {
  id: number;
  text: string;
  field: string;
}

export interface PHQ9Assessment {
  phq9_interest: string;
  phq9_feeling_down: string;
  phq9_sleep: string;
  phq9_energy: string;
  phq9_appetite: string;
  phq9_feeling_bad: string;
  phq9_concentration: string;
  phq9_movement: string;
  phq9_thoughts: string;
}

export interface GAD7Question {
  id: number;
  text: string;
  field: string;
}

export interface GAD7Assessment {
  gad7_nervous: string;
  gad7_control: string;
  gad7_worrying: string;
  gad7_relaxing: string;
  gad7_restless: string;
  gad7_irritable: string;
  gad7_afraid: string;
}
