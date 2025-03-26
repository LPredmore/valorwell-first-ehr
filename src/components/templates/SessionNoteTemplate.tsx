
import React from 'react';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { CalendarIcon, FileText } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SessionNoteTemplateProps {
  onClose: () => void;
}

const SessionNoteTemplate: React.FC<SessionNoteTemplateProps> = ({ onClose }) => {
  const [sessionDate, setSessionDate] = React.useState<Date | undefined>(new Date());

  return (
    <Card className="w-full border border-gray-200 rounded-md">
      <CardHeader className="pb-0">
        <CardTitle className="text-lg font-semibold text-valorwell-700">Session Note Template</CardTitle>
        <p className="text-sm text-gray-500 mt-1">
          This is the template used for client session notes. This template will be used when creating a new session note for a client.
        </p>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-6">
          <div className="border rounded-md p-4 bg-white">
            <div className="flex items-center mb-4">
              <FileText className="mr-2 h-5 w-5 text-valorwell-700" />
              <h2 className="text-xl font-semibold text-valorwell-800">Therapy Session Note</h2>
            </div>
            
            {/* Client and Session Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="patient-name" className="text-sm text-valorwell-700 font-semibold">Patient Name</Label>
                <Input id="patient-name" placeholder="Enter patient name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patient-dob" className="text-sm text-valorwell-700 font-semibold">Patient DOB</Label>
                <Input id="patient-dob" placeholder="MM/DD/YYYY" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clinician-name" className="text-sm text-valorwell-700 font-semibold">Clinician Name</Label>
                <Input id="clinician-name" placeholder="Enter clinician name" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="diagnosis" className="text-sm text-valorwell-700 font-semibold">Diagnosis</Label>
                <Input id="diagnosis" placeholder="Select diagnosis code" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="plan-type" className="text-sm text-valorwell-700 font-semibold">Plan Type</Label>
                <Select>
                  <SelectTrigger id="plan-type">
                    <SelectValue placeholder="Select plan length" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1month">1 month</SelectItem>
                    <SelectItem value="3month">3 month</SelectItem>
                    <SelectItem value="6month">6 month</SelectItem>
                    <SelectItem value="9month">9 month</SelectItem>
                    <SelectItem value="12month">12 month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="treatment-frequency" className="text-sm text-valorwell-700 font-semibold">Treatment Frequency</Label>
                <Select>
                  <SelectTrigger id="treatment-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="asneeded">As Needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="session-date" className="text-sm text-valorwell-700 font-semibold">Session Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full pl-3 text-left font-normal",
                        !sessionDate && "text-muted-foreground"
                      )}
                    >
                      {sessionDate ? format(sessionDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={sessionDate}
                      onSelect={setSessionDate}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medications" className="text-sm text-valorwell-700 font-semibold">Medications</Label>
                <Input id="medications" placeholder="List current medications" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="session-type" className="text-sm text-valorwell-700 font-semibold">Session Type</Label>
                <Input id="session-type" placeholder="Enter session type" />
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <Label htmlFor="persons-attendance" className="text-sm text-valorwell-700 font-semibold">Person's in Attendance</Label>
              <Input id="persons-attendance" placeholder="List all attendees" />
            </div>
            
            {/* Mental Status Examination */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-valorwell-700 border-b pb-2">Mental Status Examination</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="appearance" className="text-sm text-valorwell-700 font-semibold">Appearance</Label>
                  <Input id="appearance" placeholder="Describe appearance" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="attitude" className="text-sm text-valorwell-700 font-semibold">Attitude</Label>
                  <Input id="attitude" placeholder="Describe attitude" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="behavior" className="text-sm text-valorwell-700 font-semibold">Behavior</Label>
                  <Input id="behavior" placeholder="Describe behavior" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speech" className="text-sm text-valorwell-700 font-semibold">Speech</Label>
                  <Input id="speech" placeholder="Describe speech" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="affect" className="text-sm text-valorwell-700 font-semibold">Affect</Label>
                  <Input id="affect" placeholder="Describe affect" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thought-process" className="text-sm text-valorwell-700 font-semibold">Thought Process</Label>
                  <Input id="thought-process" placeholder="Describe thought process" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="perception" className="text-sm text-valorwell-700 font-semibold">Perception</Label>
                  <Input id="perception" placeholder="Describe perception" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orientation" className="text-sm text-valorwell-700 font-semibold">Orientation</Label>
                  <Input id="orientation" placeholder="Describe orientation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="memory" className="text-sm text-valorwell-700 font-semibold">Memory/Concentration</Label>
                  <Input id="memory" placeholder="Describe memory/concentration" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="insight" className="text-sm text-valorwell-700 font-semibold">Insight/Judgement</Label>
                  <Input id="insight" placeholder="Describe insight/judgement" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mood" className="text-sm text-valorwell-700 font-semibold">Mood</Label>
                  <Input id="mood" placeholder="Describe mood" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="substance-abuse" className="text-sm text-valorwell-700 font-semibold">Substance Abuse Risk</Label>
                  <Input id="substance-abuse" placeholder="Describe risk" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suicidal-ideation" className="text-sm text-valorwell-700 font-semibold">Suicidal Ideation</Label>
                  <Input id="suicidal-ideation" placeholder="Describe ideation" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="homicidal-ideation" className="text-sm text-valorwell-700 font-semibold">Homicidal Ideation</Label>
                  <Input id="homicidal-ideation" placeholder="Describe ideation" />
                </div>
              </div>
            </div>
            
            {/* Treatment Objectives and Interventions */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-valorwell-700 border-b pb-2">Treatment Objectives & Interventions</h3>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="primary-objective" className="text-sm text-valorwell-700 font-semibold">Primary Objective</Label>
                <Textarea id="primary-objective" placeholder="Describe the primary objective" className="min-h-[80px]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="intervention-1" className="text-sm text-valorwell-700 font-semibold">Intervention 1</Label>
                  <Input id="intervention-1" placeholder="Describe intervention" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervention-2" className="text-sm text-valorwell-700 font-semibold">Intervention 2</Label>
                  <Input id="intervention-2" placeholder="Describe intervention" />
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="secondary-objective" className="text-sm text-valorwell-700 font-semibold">Secondary Objective</Label>
                <Textarea id="secondary-objective" placeholder="Describe the secondary objective" className="min-h-[80px]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="intervention-3" className="text-sm text-valorwell-700 font-semibold">Intervention 3</Label>
                  <Input id="intervention-3" placeholder="Describe intervention" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervention-4" className="text-sm text-valorwell-700 font-semibold">Intervention 4</Label>
                  <Input id="intervention-4" placeholder="Describe intervention" />
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <Label htmlFor="tertiary-objective" className="text-sm text-valorwell-700 font-semibold">Tertiary Objective</Label>
                <Textarea id="tertiary-objective" placeholder="Describe the tertiary objective" className="min-h-[80px]" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="intervention-5" className="text-sm text-valorwell-700 font-semibold">Intervention 5</Label>
                  <Input id="intervention-5" placeholder="Describe intervention" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="intervention-6" className="text-sm text-valorwell-700 font-semibold">Intervention 6</Label>
                  <Input id="intervention-6" placeholder="Describe intervention" />
                </div>
              </div>
            </div>
            
            {/* Session Assessment */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4 text-valorwell-700 border-b pb-2">Session Assessment</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-symptoms" className="text-sm text-valorwell-700 font-semibold">Current Symptoms</Label>
                  <Textarea id="current-symptoms" placeholder="Describe current symptoms" className="min-h-[80px]" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="functioning" className="text-sm text-valorwell-700 font-semibold">Functioning</Label>
                  <Textarea id="functioning" placeholder="Describe client functioning" className="min-h-[80px]" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prognosis" className="text-sm text-valorwell-700 font-semibold">Prognosis</Label>
                  <Textarea id="prognosis" placeholder="Describe prognosis" className="min-h-[80px]" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="progress" className="text-sm text-valorwell-700 font-semibold">Progress</Label>
                  <Textarea id="progress" placeholder="Describe progress" className="min-h-[80px]" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="problem-narrative" className="text-sm text-valorwell-700 font-semibold">Problem Narrative</Label>
                  <Textarea id="problem-narrative" placeholder="Describe the problem narrative" className="min-h-[80px]" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="treatment-goal" className="text-sm text-valorwell-700 font-semibold">Treatment Goal Narrative</Label>
                  <Textarea id="treatment-goal" placeholder="Describe the treatment goals" className="min-h-[80px]" />
                </div>
              </div>
            </div>
            
            {/* Plan Update and Signature */}
            <div>
              <h3 className="text-lg font-medium mb-4 text-valorwell-700 border-b pb-2">Plan & Signature</h3>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="next-update" className="text-sm text-valorwell-700 font-semibold">Next Treatment Plan Update</Label>
                  <Input id="next-update" placeholder="When will this plan be reviewed next" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="signature" className="text-sm text-valorwell-700 font-semibold">Signature</Label>
                  <Input id="signature" placeholder="Digital signature" />
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose} className="mr-2">Close</Button>
            <Button className="bg-valorwell-700 hover:bg-valorwell-800">Save Template</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SessionNoteTemplate;
