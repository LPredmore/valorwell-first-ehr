
import { useState } from 'react';

// Extend the ClientDetails interface to include the missing properties
interface ClientDetails {
  id?: string;
  client_first_name?: string;
  client_last_name?: string;
  client_diagnosis?: string[];
  client_functioning?: string;
  client_progress?: string;
  client_sessionnarrative?: string;
  [key: string]: any; // Allow for other properties
}

interface SessionNoteState {
  functioning: string;
  prognosis: string;
  progress: string;
  sessionNarrative: string;
}

export function useSessionNoteState(clientData: ClientDetails | null) {
  const initialState: SessionNoteState = {
    functioning: clientData?.client_functioning || '',
    prognosis: clientData?.client_diagnosis ? clientData.client_diagnosis.join(', ') : '',
    progress: clientData?.client_progress || '',
    sessionNarrative: clientData?.client_sessionnarrative || ''
  };

  const [sessionNote, setSessionNote] = useState<SessionNoteState>(initialState);

  const updateSessionNote = (field: keyof SessionNoteState, value: string) => {
    setSessionNote(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return {
    sessionNote,
    updateSessionNote
  };
}
