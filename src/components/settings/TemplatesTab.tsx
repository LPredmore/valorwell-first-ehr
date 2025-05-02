import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Settings, File, FilePlus, FileText, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Instead of importing TreatmentPlanTemplate directly,
// we'll import it with an alias to avoid the naming conflict
import { TreatmentPlanTemplate as TPTemplate } from '@/components/templates/TreatmentPlanTemplate';

interface Template {
  id: string;
  template_id: string;
  template_name: string;
  template_type: string;
  is_assignable: boolean;
}

const TemplatesTab = () => {
  const [activeTab, setActiveTab] = useState("treatment-plans");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('template_settings')
          .select('*');

        if (error) throw error;

        setTemplates(data || []);
      } catch (err) {
        console.error('Error fetching templates:', err);
        toast({
          title: "Error",
          description: "Failed to fetch templates",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [toast]);

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Treatment Plan Template component with props
  const TreatmentPlanTemplate = ({ onClose, clinicianName }: { onClose: () => void, clinicianName: string }) => {
    return (
      <div>
        <h2>Create Treatment Plan</h2>
        <div className="mt-4">
          <p>Clinician: {clinicianName}</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  };

  // Filter templates by type
  const treatmentPlanTemplates = templates.filter(
    (template) => template.template_type === "treatment_plan"
  );
  
  const sessionNoteTemplates = templates.filter(
    (template) => template.template_type === "session_note"
  );
  
  const documentTemplates = templates.filter(
    (template) => template.template_type === "document"
  );
  
  const assessmentTemplates = templates.filter(
    (template) => template.template_type === "assessment"
  );

  // Mock clinician name for demonstration
  const clinicianName = "Dr. John Doe";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Document Templates</h2>
        <Button 
          onClick={openModal} 
          className="flex items-center gap-2 bg-valorwell-600 hover:bg-valorwell-700"
        >
          <PlusCircle size={16} /> Create New Template
        </Button>
      </div>

      <Tabs defaultValue="treatment-plans" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="treatment-plans" className="flex items-center gap-2">
            <ClipboardList size={16} /> Treatment Plans
          </TabsTrigger>
          <TabsTrigger value="session-notes" className="flex items-center gap-2">
            <FileText size={16} /> Session Notes
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <File size={16} /> Documents
          </TabsTrigger>
          <TabsTrigger value="assessments" className="flex items-center gap-2">
            <FilePlus size={16} /> Assessments
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="treatment-plans" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <p>Loading treatment plan templates...</p>
            ) : treatmentPlanTemplates.length > 0 ? (
              treatmentPlanTemplates.map((template) => (
                <div key={template.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <h3 className="font-semibold mb-2">{template.template_name}</h3>
                  <div className="flex justify-between items-center mt-4">
                    <span className={`px-2 py-1 rounded text-xs ${template.is_assignable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {template.is_assignable ? 'Assignable' : 'Not Assignable'}
                    </span>
                    <Button variant="outline" size="sm">
                      <Settings size={14} className="mr-1" /> Manage
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 col-span-full">No treatment plan templates found.</p>
            )}
          </div>
        </TabsContent>
        
        {/* Use our imported template component with the correct props */}
        {isModalOpen && <TPTemplate onClose={closeModal} clinicianName={clinicianName} />}
        
        {/* Other tab contents */}
        <TabsContent value="session-notes" className="mt-6">
          {/* Session notes templates here */}
          <p>Session notes templates will be displayed here.</p>
        </TabsContent>
        
        <TabsContent value="documents" className="mt-6">
          {/* Document templates here */}
          <p>Document templates will be displayed here.</p>
        </TabsContent>
        
        <TabsContent value="assessments" className="mt-6">
          {/* Assessment templates here */}
          <p>Assessment templates will be displayed here.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TemplatesTab;
