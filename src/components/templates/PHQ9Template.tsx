
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ClientDetails } from "@/types/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormField, FormItem, FormControl } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface PHQ9TemplateProps {
  onClose: () => void;
  clinicianName: string;
  clientData?: ClientDetails | null;
  onComplete?: () => void; // New callback for when assessment is completed
}

// PHQ-9 questions
const phq9Questions = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself - or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed. Or the opposite - being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead, or of hurting yourself in some way"
];

// Answer options
const answerOptions = [
  { value: 0, label: "Not at all" },
  { value: 1, label: "Several days" },
  { value: 2, label: "More than half the days" },
  { value: 3, label: "Nearly every day" }
];

const PHQ9Template: React.FC<PHQ9TemplateProps> = ({ onClose, clinicianName, clientData, onComplete }) => {
  const { toast } = useToast();
  const [scores, setScores] = useState<number[]>(new Array(9).fill(0));
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  const form = useForm({
    defaultValues: {
      date: format(new Date(), "yyyy-MM-dd"),
      clinicianName: clinicianName,
      patientName: clientData ? `${clientData.client_first_name} ${clientData.client_last_name}` : "",
    }
  });

  // Calculate total score
  const totalScore = scores.reduce((sum, score) => sum + score, 0);
  
  // Get severity based on total score
  const getSeverity = (score: number) => {
    if (score >= 0 && score <= 4) return "None-minimal";
    if (score >= 5 && score <= 9) return "Mild";
    if (score >= 10 && score <= 14) return "Moderate";
    if (score >= 15 && score <= 19) return "Moderately severe";
    return "Severe";
  };

  const handleScoreChange = (index: number, value: number) => {
    const newScores = [...scores];
    newScores[index] = value;
    setScores(newScores);
  };

  const handleSubmit = () => {
    toast({
      title: "Assessment Saved",
      description: "PHQ-9 assessment has been saved successfully.",
    });
    
    // Call onComplete if provided, otherwise just close
    if (onComplete) {
      onComplete();
    } else {
      onClose();
    }
  };

  return (
    <Card className="w-full mb-6">
      <CardHeader className="bg-valorwell-600 text-white">
        <CardTitle className="flex justify-between items-center">
          <span>PHQ-9 Depression Screener</span>
          <Button 
            variant="outline" 
            onClick={onClose}
            className="text-white border-white hover:bg-valorwell-700"
          >
            Close
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <Label>Date</Label>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="clinicianName"
              render={({ field }) => (
                <FormItem>
                  <Label>Clinician</Label>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="patientName"
              render={({ field }) => (
                <FormItem>
                  <Label>Patient</Label>
                  <FormControl>
                    <Input {...field} readOnly />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="mb-6">
            <h3 className="font-medium text-lg mb-4">
              Over the last 2 weeks, how often have you been bothered by any of the following problems?
            </h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Question</TableHead>
                  {answerOptions.map((option) => (
                    <TableHead key={option.value} className="text-center">
                      {option.label}<br />
                      <span className="text-sm font-normal">({option.value})</span>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {phq9Questions.map((question, index) => (
                  <TableRow key={index}>
                    <TableCell>{question}</TableCell>
                    {answerOptions.map((option) => (
                      <TableCell key={`${index}-${option.value}`} className="text-center">
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option.value}
                          checked={scores[index] === option.value}
                          onChange={() => handleScoreChange(index, option.value)}
                          className="h-4 w-4"
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mb-6">
            <div className="bg-gray-100 p-4 rounded-md">
              <h3 className="font-medium mb-2">Score Interpretation</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>Total Score:</strong> {totalScore}</p>
                  <p><strong>Severity:</strong> {getSeverity(totalScore)}</p>
                </div>
                <div>
                  <p><strong>PHQ-9 Score Ranges:</strong></p>
                  <ul className="text-sm">
                    <li>0-4: None-minimal</li>
                    <li>5-9: Mild</li>
                    <li>10-14: Moderate</li>
                    <li>15-19: Moderately severe</li>
                    <li>20-27: Severe</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <Label htmlFor="additionalNotes">Additional Notes</Label>
            <Textarea 
              id="additionalNotes" 
              value={additionalNotes} 
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="mt-1"
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Save Assessment
            </Button>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
};

export default PHQ9Template;
