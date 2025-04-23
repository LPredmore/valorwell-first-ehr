import { useState } from 'react';
import { ClientDetails } from '@/types/client';

interface SessionNoteState {
  functioning: string;
  prognosis: string;
  progress: string;
  sessionNarrative: string;
}

export function useSessionNoteState(clientData: ClientDetails | null) {
  // Update property names to match the ClientDetails type
  const initialState: SessionNoteState = {
    functioning: clientData?.functioning || '',
    prognosis: clientData?.diagnosis || '', // Changed from client_prognosis to diagnosis
    progress: clientData?.progress || '',
    sessionNarrative: clientData?.sessionNarrative || ''
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
