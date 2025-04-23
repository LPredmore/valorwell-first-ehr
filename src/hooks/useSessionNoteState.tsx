
import { useState } from 'react';
import { ClientDetails } from '@/packages/core/types/client';

interface SessionNoteState {
  functioning: string;
  prognosis: string;
  progress: string;
  sessionNarrative: string;
}

export function useSessionNoteState(clientData: ClientDetails | null) {
  const initialState: SessionNoteState = {
    functioning: clientData?.client_functioning ?? '',
    prognosis: clientData?.client_diagnosis ? clientData.client_diagnosis.join(', ') : '',
    progress: clientData?.client_progress ?? '',
    sessionNarrative: clientData?.client_sessionnarrative ?? ''
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
