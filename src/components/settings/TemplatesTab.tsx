
import { useState } from 'react';
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
import TreatmentPlanTemplate from '@/components/templates/TreatmentPlanTemplate';
import SessionNoteTemplate from '@/components/templates/SessionNoteTemplate';
import PHQ9Template from '@/components/templates/PHQ9Template';
import GAD7Template from '@/components/templates/GAD7Template';
import PCL5Template from '@/components/templates/PCL5Template';

// Define template types for tracking assignable status
interface Template {
  id: string;
  name: string;
  isAssignable: boolean;
}

const TemplatesTab = () => {
  const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
  const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);
  const [showPHQ9Template, setShowPHQ9Template] = useState(false);
  const [showGAD7Template, setShowGAD7Template] = useState(false);
  const [showPCL5Template, setShowPCL5Template] = useState(false);

  // Initial state for assessment form templates
  const [assessmentTemplates, setAssessmentTemplates] = useState<Template[]>([
    { id: 'phq9', name: 'PHQ-9', isAssignable: false },
    { id: 'gad7', name: 'GAD-7', isAssignable: false },
    { id: 'pcl5', name: 'PCL-5', isAssignable: false },
  ]);

  // Initial state for online form templates (empty for now)
  const [onlineTemplates, setOnlineTemplates] = useState<Template[]>([]);

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

  // Handle toggle change for assessment templates
  const toggleAssessmentTemplateAssignable = (id: string) => {
    setAssessmentTemplates(prev => 
      prev.map(template => 
        template.id === id 
          ? { ...template, isAssignable: !template.isAssignable } 
          : template
      )
    );
  };

  // Handle toggle change for online templates
  const toggleOnlineTemplateAssignable = (id: string) => {
    setOnlineTemplates(prev => 
      prev.map(template => 
        template.id === id 
          ? { ...template, isAssignable: !template.isAssignable } 
          : template
      )
    );
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
                      <TableRow key={template.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{template.name}</TableCell>
                        <TableCell>Online Form</TableCell>
                        <TableCell></TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              id={`toggle-online-${template.id}`}
                              checked={template.isAssignable}
                              onCheckedChange={() => toggleOnlineTemplateAssignable(template.id)}
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
