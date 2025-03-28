
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Save, Edit } from 'lucide-react';
import { Form } from '@/components/ui/form';
import InsuranceSection from '@/components/ui/InsuranceSection';

interface MyInsuranceProps {
  clientData: any | null;
  loading: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  form: any;
  isSaving: boolean;
  handleSaveProfile: () => Promise<void>;
  handleCancelEdit: () => void;
  insuranceTypes: string[];
  relationshipTypes: string[];
}

const MyInsurance: React.FC<MyInsuranceProps> = ({
  clientData,
  loading,
  isEditing,
  setIsEditing,
  form,
  isSaving,
  handleSaveProfile,
  handleCancelEdit,
  insuranceTypes,
  relationshipTypes
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl">Insurance Information</CardTitle>
          <CardDescription>View and manage your insurance details</CardDescription>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleCancelEdit}
              disabled={isSaving}
              type="button"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleSaveProfile}
              disabled={isSaving}
              type="button"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading your insurance data...</p>
          </div>
        ) : (
          <Form {...form}>
            <InsuranceSection
              title="Primary Insurance"
              prefix="client_"
              form={form}
              isEditing={isEditing}
              insuranceTypes={insuranceTypes}
              relationshipTypes={relationshipTypes}
            />

            <InsuranceSection
              title="Secondary Insurance"
              prefix="client_"
              form={form}
              isEditing={isEditing}
              insuranceTypes={insuranceTypes}
              relationshipTypes={relationshipTypes}
            />

            <InsuranceSection
              title="Tertiary Insurance"
              prefix="client_"
              form={form}
              isEditing={isEditing}
              insuranceTypes={insuranceTypes}
              relationshipTypes={relationshipTypes}
            />
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default MyInsurance;
