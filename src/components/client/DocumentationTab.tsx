import React, { useState } from "react";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, ClipboardCheck, FileText } from "lucide-react";
import TreatmentPlanTemplate from "@/components/templates/TreatmentPlanTemplate";
import SessionNoteTemplate from "@/components/ui/SessionNoteTemplate";
import { useClinicianData } from "@/hooks/useClinicianData";

interface DocumentationTabProps {
clientData?: any;
}

const DocumentationTab: React.FC<DocumentationTabProps> = ({ clientData }) => {
const [showTreatmentPlanTemplate, setShowTreatmentPlanTemplate] = useState(false);
const [showSessionNoteTemplate, setShowSessionNoteTemplate] = useState(false);
const { clinicianData } = useClinicianData();

const handleCloseTreatmentPlan = () => {
setShowTreatmentPlanTemplate(false);
};

const handleCloseSessionNote = () => {
setShowSessionNoteTemplate(false);
};

return (
<div className="grid grid-cols-1 gap-6">
{/* Charting Card */}
<Card>
<CardHeader>
<CardTitle className="flex items-center gap-2">
<BarChart2 className="h-5 w-5 text-valorwell-600" />
Charting
</CardTitle>
<CardDescription>View and manage patient charts and progress tracking</CardDescription>
</CardHeader>
<CardContent>
<div className="py-6">
<div className="flex gap-4">
<Button onClick={() => setShowTreatmentPlanTemplate(true)}>
Create Treatment Plan
</Button>
<Button onClick={() => setShowSessionNoteTemplate(true)}>
Create Session Note
</Button>
</div>
</div>
</CardContent>
</Card>

{/* Conditionally render the templates right after the Charting card */}
{showTreatmentPlanTemplate && (
<div className="animate-fade-in">
<TreatmentPlanTemplate
onClose={handleCloseTreatmentPlan}
clinicianName={clinicianData?.clinician_professional_name || ''}
clientName={`${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`}
clientDob={clientData?.client_date_of_birth || ''}
/>
</div>
)}

{showSessionNoteTemplate && (
<div className="animate-fade-in">
<SessionNoteTemplate
onClose={handleCloseSessionNote}
clinicianName={clinicianData?.clinician_professional_name || ''}
clientName={`${clientData?.client_first_name || ''} ${clientData?.client_last_name || ''}`}
clientDob={clientData?.client_date_of_birth || ''}
/>
</div>
)}

{/* Assessments Card */}
<Card>
<CardHeader>
<CardTitle className="flex items-center gap-2">
<ClipboardCheck className="h-5 w-5 text-valorwell-600" />
Assessments
</CardTitle>
<CardDescription>View and complete patient assessments</CardDescription>
</CardHeader>
<CardContent className="py-6">
{/* Assessment content */}
</CardContent>
</Card>

{/* Completed Notes Card */}
<Card>
<CardHeader>
<CardTitle className="flex items-center gap-2">
<FileText className="h-5 w-5 text-valorwell-600" />
Completed Notes
</CardTitle>
<CardDescription>View completed session notes and documentation</CardDescription>
</CardHeader>
<CardContent className="py-6">
{/* Completed notes content */}
</CardContent>
</Card>
</div>
);
};

export default DocumentationTab;
