import { useState, useEffect } from 'react';
import { ClientDetails } from '@/packages/core/types/client';

export const useSessionNoteState = (clientData: ClientDetails) => {
  const [sessionNoteData, setSessionNoteData] = useState({
    date: new Date().toISOString().split('T')[0],
    client_appearance: '',
    client_attitude: '',
    client_behavior: '',
    client_speech: '',
    client_affect: '',
    client_thoughtprocess: '',
    client_perception: '',
    client_orientation: '',
    client_memoryconcentration: '',
    client_insightjudgement: '',
    client_mood: '',
    client_substanceabuserisk: '',
    client_suicidalideation: '',
    client_homicidalideation: '',
    client_primaryobjective: '',
    client_secondaryobjective: '',
    client_tertiaryobjective: '',
    client_intervention1: '',
    client_intervention2: '',
    client_intervention3: '',
    client_intervention4: '',
    client_intervention5: '',
    client_intervention6: '',
    diagnosis: [] as string[],
    plan_length: '',
    treatment_frequency: '',
    problem: '',
    treatment_goal: '',
    next_treatment_plan_update: '',
    private_note: ''
  });

  const updateSessionNoteData = (newData: Partial<typeof sessionNoteData>) => {
    setSessionNoteData(prevData => ({ ...prevData, ...newData }));
  };
  
  useEffect(() => {
    if (clientData) {
      setSessionNoteData({
        date: new Date().toISOString().split('T')[0], // Keep current date
        client_appearance: clientData.client_appearance || '',
        client_attitude: clientData.client_attitude || '',
        client_behavior: clientData.client_behavior || '',
        client_speech: clientData.client_speech || '',
        client_affect: clientData.client_affect || '',
        client_thoughtprocess: clientData.client_thoughtprocess || '',
        client_perception: clientData.client_perception || '',
        client_orientation: clientData.client_orientation || '',
        client_memoryconcentration: clientData.client_memoryconcentration || '',
        client_insightjudgement: clientData.client_insightjudgement || '',
        client_mood: clientData.client_mood || '',
        client_substanceabuserisk: clientData.client_substanceabuserisk || '',
        client_suicidalideation: clientData.client_suicidalideation || '',
        client_homicidalideation: clientData.client_homicidalideation || '',
        client_primaryobjective: clientData.client_primaryobjective || '',
        client_secondaryobjective: clientData.client_secondaryobjective || '',
        client_tertiaryobjective: clientData.client_tertiaryobjective || '',
        client_intervention1: clientData.client_intervention1 || '',
        client_intervention2: clientData.client_intervention2 || '',
        client_intervention3: clientData.client_intervention3 || '',
        client_intervention4: clientData.client_intervention4 || '',
        client_intervention5: clientData.client_intervention5 || '',
        client_intervention6: clientData.client_intervention6 || '',
        diagnosis: clientData.client_diagnosis || [],
        plan_length: clientData.client_planlength || '',
        treatment_frequency: clientData.client_treatmentfrequency || '',
        problem: clientData.client_problem || '',
        treatment_goal: clientData.client_treatmentgoal || '',
        next_treatment_plan_update: clientData.client_nexttreatmentplanupdate || '',
        private_note: clientData.client_privatenote || ''
      });
    }
  }, [clientData]);

  return {
    sessionNoteData,
    updateSessionNoteData
  };
};
