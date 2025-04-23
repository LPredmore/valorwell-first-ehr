
import { z } from "zod";

export const phq9Schema = z.object({
  phq9_interest: z.string(),
  phq9_feeling_down: z.string(),
  phq9_sleep: z.string(),
  phq9_energy: z.string(),
  phq9_appetite: z.string(),
  phq9_feeling_bad: z.string(),
  phq9_concentration: z.string(),
  phq9_movement: z.string(),
  phq9_thoughts: z.string(),
});

export const gad7Schema = z.object({
  gad7_nervous: z.string(),
  gad7_control: z.string(),
  gad7_worrying: z.string(),
  gad7_relaxing: z.string(),
  gad7_restless: z.string(),
  gad7_irritable: z.string(),
  gad7_afraid: z.string(),
});
