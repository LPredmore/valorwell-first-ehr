
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon } from 'lucide-react';
import LoadingSkeleton from '@/components/common/LoadingSkeleton';

interface Note {
  id: string;
  session_date: string;
  session_type: string;
  created_at: string;
  pdf_path?: string;
}

interface PatientNotesProps {
  patientId: string;
}

export const PatientNotes: React.FC<PatientNotesProps> = ({ patientId }) => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchNotes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('session_notes')
          .select('id, session_date, session_type, created_at, pdf_path')
          .eq('client_id', patientId)
          .order('session_date', { ascending: false });
          
        if (error) {
          throw error;
        }
        
        setNotes(data || []);
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotes();
  }, [patientId]);
  
  const handleAddNote = () => {
    navigate(`/patients/${patientId}/notes/new`);
  };
  
  const handleViewNote = (noteId: string) => {
    navigate(`/patients/${patientId}/notes/${noteId}`);
  };
  
  if (loading) {
    return <LoadingSkeleton count={3} height="100px" />;
  }
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Session Notes</h2>
        <Button onClick={handleAddNote}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Note
        </Button>
      </div>
      
      {notes.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-gray-500">No notes available for this patient.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="cursor-pointer hover:bg-gray-50" onClick={() => handleViewNote(note.id)}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{new Date(note.session_date).toLocaleDateString()} - {note.session_type}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">Created: {new Date(note.created_at).toLocaleString()}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PatientNotes;
