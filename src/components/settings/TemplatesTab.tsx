
import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import PHQ9Template from '@/components/templates/PHQ9Template';
import GAD7Template from '@/components/templates/GAD7Template';
import PCL5Template from '@/components/templates/PCL5Template';
import InformedConsentTemplate from '@/components/templates/InformedConsentTemplate';

// Define template types for tracking assignable status
interface Template {
  id: string;
  name: string;
  isAssignable: boolean;
}

// Template settings from database
interface TemplateSettings {
  id: string;
  template_id: string;
  template_type: string;
  template_name: string;
  is_assignable: boolean;
}

const TemplatesTab = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);
  const [showPHQ9Template, setShowPHQ9Template] = useState(false);
  const [showGAD7Template, setShowGAD7Template] = useState(false);
  const [showPCL5Template, setShowPCL5Template] = useState(false);
  const [showInformedConsentTemplate, setShowInformedConsentTemplate] = useState(false);

  // Initial state for assessment form templates
  const [assessmentTemplates, setAssessmentTemplates] = useState<Template[]>([
    { id: 'phq9', name: 'PHQ-9', isAssignable: false },
    { id: 'gad7', name: 'GAD-7', isAssignable: false },
    { id: 'pcl5', name: 'PCL-5', isAssignable: false },
  ]);

  // Initial state for online form templates
  const [onlineTemplates, setOnlineTemplates] = useState<Template[]>([
    { id: 'client_intake', name: 'Client Intake Form', isAssignable: false },
    { id: 'informed_consent', name: 'Informed Consent', isAssignable: false },
  ]);

  // Fetch template settings from the database
  useEffect(() => {
    const fetchTemplateSettings = async () => {
      try {
        setIsLoading(true);
        const { data: templateSettings, error } = await supabase
          .from('template_settings')
          .select('*');

        if (error) {
          throw error;
        }

        if (templateSettings) {
          // Update assessment templates
          setAssessmentTemplates(prev => 
            prev.map(template => {
              const dbSetting = templateSettings.find(
                (setting: TemplateSettings) => setting.template_id === template.id && setting.template_type === 'assessment'
              );
              return dbSetting ? { ...template, isAssignable: dbSetting.is_assignable } : template;
            })
          );

          // Update online templates
          setOnlineTemplates(prev => 
            prev.map(template => {
              const dbSetting = templateSettings.find(
                (setting: TemplateSettings) => setting.template_id === template.id && setting.template_type === 'online'
              );
              return dbSetting ? { ...template, isAssignable: dbSetting.is_assignable } : template;
            })
          );
        }
      } catch (error) {
        console.error('Error fetching template settings:', error);
        toast({
          title: "Error",
          description: "Failed to load template settings",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateSettings();
  }, [toast]);

  const handleCloseTreatmentPlan = () => {
    setShowTreatmentPlanTemplate(false);
  };

  const handleCloseSessionNote = () => {
    setShowSessionNoteTemplate(false);
  };
  
  const handleClosePHQ9 = () => {
    setShowPHQ9Template(false);
  };
  
  const handleCloseGAD7 = () => {
    setShowGAD7Template(false);
  };
  
  const handleClosePCL5 = () => {
    setShowPCL5Template(false);
  };
  
  const handleCloseInformedConsent = () => {
    setShowInformedConsentTemplate(false);
  };

  // Update template assignable status in database
  const updateTemplateAssignable = async (
    templateId: string, 
    isAssignable: boolean, 
    templateName: string, 
    templateType: string
  ) => {
    try {
      const { error } = await supabase
        .from('template_settings')
        .upsert({
          template_id: templateId,
          template_type: templateType,
          template_name: templateName,
          is_assignable: isAssignable,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'template_id',
        });

      if (error) {
        throw error;
      }

      toast({
        title: "Settings updated",
        description: `${templateName} is now ${isAssignable ? 'assignable' : 'not assignable'}`,
      });

    } catch (error) {
      console.error('Error updating template settings:', error);
      toast({
        title: "Update failed",
        description: "Could not update template settings",
        variant: "destructive",
      });
    }
  };

  // Handle toggle change for assessment templates
  const toggleAssessmentTemplateAssignable = (id: string) => {
    setAssessmentTemplates(prev => {
      const updatedTemplates = prev.map(template => 
        template.id === id 
          ? { ...template, isAssignable: !template.isAssignable } 
          : template
      );
      
      // Find the updated template to get name and new isAssignable value
      const updatedTemplate = updatedTemplates.find(t => t.id === id);
      if (updatedTemplate) {
        updateTemplateAssignable(id, updatedTemplate.isAssignable, updatedTemplate.name, 'assessment');
      }
      
      return updatedTemplates;
    });
  };

  // Handle toggle change for online templates
  const toggleOnlineTemplateAssignable = (id: string) => {
    setOnlineTemplates(prev => {
      const updatedTemplates = prev.map(template => 
        template.id === id 
          ? { ...template, isAssignable: !template.isAssignable } 
          : template
      );
      
      // Find the updated template to get name and new isAssignable value
      const updatedTemplate = updatedTemplates.find(t => t.id === id);
      if (updatedTemplate) {
        updateTemplateAssignable(id, updatedTemplate.isAssignable, updatedTemplate.name, 'online');
      }
      
      return updatedTemplates;
    });
  };

  return (
    <div className="p-6 animate-fade-in">
      {showTreatmentPlanTemplate ? (
        <TreatmentPlanTemplate onClose={() => setShowTreatmentPlanTemplate(false)} />
      ) : showSessionNoteTemplate ? (
        <SessionNoteTemplate onClose={() => setShowSessionNoteTemplate(false)} />
      ) : showPHQ9Template ? (
        <PHQ9Template onClose={() => setShowPHQ9Template(false)} clinicianName="" />
      ) : showGAD7Template ? (
        <GAD7Template onClose={() => setShowGAD7Template(false)} clinicianName="" />
      ) : showPCL5Template ? (
        <PCL5Template onClose={() => setShowPCL5Template(false)} clinicianName="" />
      ) : showInformedConsentTemplate ? (
        <InformedConsentTemplate onClose={() => setShowInformedConsentTemplate(false)} />
      ) : (
        <>
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Chart Templates</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800">
                <Plus size={16} />
                <span>Add Template</span>
              </button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Modified</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowTreatmentPlanTemplate(true)}>
                    <TableCell className="font-medium">Treatment Plan</TableCell>
                    <TableCell>Chart Template</TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow className="cursor-pointer hover:bg-gray-50" onClick={() => setShowSessionNoteTemplate(true)}>
                    <TableCell className="font-medium">Session Note</TableCell>
                    <TableCell>Chart Template</TableCell>
                    <TableCell>{new Date().toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Assessment Forms</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-valorwell-700 text-white rounded hover:bg-valorwell-800">
                <Plus size={16} />
                <span>Add Assessment</span>
              </button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Form Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assignable</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assessmentTemplates.map(template => (
                    <TableRow 
                      key={template.id}
                      className="hover:bg-gray-50"
                    >
                      <TableCell 
                        className="font-medium cursor-pointer" 
                        onClick={() => {
                          if (template.id === 'phq9') setShowPHQ9Template(true);
                          else if (template.id === 'gad7') setShowGAD7Template(true);
                          else if (template.id === 'pcl5') setShowPCL5Template(true);
                        }}
                      >
                        {template.name}
                      </TableCell>
                      <TableCell>{
                        template.id === 'phq9' ? 'Depression Screener' : 
                        template.id === 'gad7' ? 'Anxiety Screener' :
                        template.id === 'pcl5' ? 'Trauma Screener' : 'Assessment'
                      }</TableCell>
                      <TableCell>{
                        template.id === 'phq9' ? 'Patient Health Questionnaire (9-item)' : 
                        template.id === 'gad7' ? 'Generalized Anxiety Disorder (7-item)' :
                        template.id === 'pcl5' ? 'PTSD Checklist for DSM-5 (20-item)' : ''
                      }</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id={`toggle-${template.id}`}
                            checked={template.isAssignable}
                            onCheckedChange={() => toggleAssessmentTemplateAssignable(template.id)}
                            disabled={isLoading}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                          <Trash className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Online Forms</h2>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-white border rounded hover:bg-gray-50">
                <Plus size={16} />
                <span>Add Form</span>
              </button>
            </div>
            
            {onlineTemplates.length > 0 ? (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Assignable</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {onlineTemplates.map(template => (
                      <TableRow 
                        key={template.id} 
                        className="hover:bg-gray-50"
                      >
                        <TableCell 
                          className="font-medium cursor-pointer"
                          onClick={() => {
                            if (template.id === 'informed_consent') setShowInformedConsentTemplate(true);
                          }}
                        >
                          {template.name}
                        </TableCell>
                        <TableCell>Online Form</TableCell>
                        <TableCell>
                          {template.id === 'client_intake' ? 'Initial client history and information' :
                           template.id === 'informed_consent' ? 'Telehealth informed consent document' : ''}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`toggle-online-${template.id}`}
                              checked={template.isAssignable}
                              onCheckedChange={() => toggleOnlineTemplateAssignable(template.id)}
                              disabled={isLoading}
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500">
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-10 border rounded bg-gray-50 text-gray-500">
                No online forms available. Click the button above to create your first form.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TemplatesTab;
