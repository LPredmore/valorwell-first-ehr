
import React from 'react';
import { Textarea } from '@/packages/ui/textarea';
import { Label } from '@/packages/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui/card';
import { ClientDetails } from '@/packages/core/types/client';

interface NotesTabProps {
  formData: ClientDetails;
  handleInputChange: (field: string, value: string | string[] | boolean) => void;
  isEditing: boolean;
}

const NotesTab: React.FC<NotesTabProps> = ({ 
  formData, 
  handleInputChange, 
  isEditing 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="client_privatenote">Private Notes</Label>
          <Textarea
            id="client_privatenote"
            value={formData.client_privatenote || ''}
            onChange={(e) => handleInputChange('client_privatenote', e.target.value)}
            className="min-h-[150px]"
            readOnly={!isEditing}
          />
          <p className="text-sm text-muted-foreground mt-1">
            These notes are only visible to clinicians and administrators.
          </p>
        </div>

        <div>
          <Label htmlFor="client_additional_notes">Additional Notes</Label>
          <Textarea
            id="client_additional_notes"
            value={formData.client_additional_notes || ''}
            onChange={(e) => handleInputChange('client_additional_notes', e.target.value)}
            className="min-h-[150px]"
            readOnly={!isEditing}
          />
          <p className="text-sm text-muted-foreground mt-1">
            General notes about the client.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotesTab;
