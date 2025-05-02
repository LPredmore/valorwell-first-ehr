import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

interface TreatmentPlanTemplateProps {
  clientId: string;
}

interface Goal {
  id: string;
  description: string;
  isCompleted: boolean;
}

interface Objective {
  id: string;
  description: string;
  isCompleted: boolean;
}

const TreatmentPlanTemplate: React.FC<TreatmentPlanTemplateProps> = ({ clientId }) => {
  const [planName, setPlanName] = useState('');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoalDescription, setNewGoalDescription] = useState('');
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newObjectiveDescription, setNewObjectiveDescription] = useState('');
  const [sessionType, setSessionType] = useState('');
  const [sessionNotes, setSessionNotes] = useState('');
  const [clinicianId, setClinicianId] = useState<string | null>(null);
  const [availableClinicians, setAvailableClinicians] = useState<{ id: string; clinician_professional_name: string; }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchClinicianInfo = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      if (userData?.user?.id) {
        const { data, error } = await supabase
          .from('clinicians')
          .select('*')
          .eq('id', userData.user.id)
          .single();
        
        if (error) {
          console.error('Error fetching clinician info:', error);
          return;
        }
        
        setClinicianId(data.id);
      }
    };
    
    fetchClinicianInfo();
  }, []);

  useEffect(() => {
    const fetchAvailableClinicians = async () => {
      try {
        const { data, error } = await supabase
          .from('clinicians')
          .select('id, clinician_professional_name');

        if (error) {
          console.error('Error fetching clinicians:', error);
          toast({
            title: "Error",
            description: "Failed to load available clinicians",
            variant: "destructive"
          });
          return;
        }

        setAvailableClinicians(data);
      } catch (error) {
        console.error('Error fetching clinicians:', error);
        toast({
          title: "Error",
          description: "Failed to load available clinicians",
          variant: "destructive"
        });
      }
    };

    fetchAvailableClinicians();
  }, []);

  const addGoal = () => {
    if (newGoalDescription.trim() !== '') {
      const newGoal: Goal = {
        id: uuidv4(),
        description: newGoalDescription,
        isCompleted: false,
      };
      setGoals([...goals, newGoal]);
      setNewGoalDescription('');
    }
  };

  const addObjective = () => {
    if (newObjectiveDescription.trim() !== '') {
      const newObjective: Objective = {
        id: uuidv4(),
        description: newObjectiveDescription,
        isCompleted: false,
      };
      setObjectives([...objectives, newObjective]);
      setNewObjectiveDescription('');
    }
  };

  const toggleGoalCompletion = (id: string) => {
    setGoals(
      goals.map((goal) =>
        goal.id === id ? { ...goal, isCompleted: !goal.isCompleted } : goal
      )
    );
  };

  const toggleObjectiveCompletion = (id: string) => {
    setObjectives(
      objectives.map((objective) =>
        objective.id === id ? { ...objective, isCompleted: !objective.isCompleted } : objective
      )
    );
  };

  const removeGoal = (id: string) => {
    setGoals(goals.filter((goal) => goal.id !== id));
  };

  const removeObjective = (id: string) => {
    setObjectives(objectives.filter((objective) => objective.id !== id));
  };

  const submitTreatmentPlan = async () => {
    if (!clinicianId) {
      toast({
        title: "Error",
        description: "Clinician ID is required.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    const treatmentPlanData = {
      client_id: clientId,
      clinician_id: clinicianId,
      plan_name: planName,
      goals: goals,
      objectives: objectives,
      session_type: sessionType,
      session_notes: sessionNotes,
    };

    try {
      const { error } = await supabase
        .from('treatment_plans')
        .insert([treatmentPlanData]);

      if (error) {
        console.error('Error submitting treatment plan:', error);
        toast({
          title: "Error",
          description: "Failed to save treatment plan",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Treatment plan saved successfully",
        variant: "default"
      });

      setPlanName('');
      setGoals([]);
      setObjectives([]);
      setSessionType('');
      setSessionNotes('');
    } catch (error) {
      console.error('Error submitting treatment plan:', error);
      toast({
        title: "Error",
        description: "Failed to save treatment plan",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-[100%]">
      <CardHeader>
        <CardTitle>Treatment Plan</CardTitle>
        <CardDescription>Create and manage treatment plans for clients.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div>
            <Label htmlFor="planName">Plan Name</Label>
            <Input
              id="planName"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
              placeholder="Enter plan name"
            />
          </div>

          <div>
            <Label htmlFor="clinician">Clinician</Label>
            <Select onValueChange={setClinicianId} defaultValue={clinicianId || ""}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a clinician" />
              </SelectTrigger>
              <SelectContent>
                {availableClinicians.map((clinician) => (
                  <SelectItem key={clinician.id} value={clinician.id}>
                    {clinician.clinician_professional_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Goals</Label>
            <div className="flex items-center">
              <Input
                type="text"
                value={newGoalDescription}
                onChange={(e) => setNewGoalDescription(e.target.value)}
                placeholder="Enter new goal"
                className="flex-grow mr-2"
              />
              <Button type="button" onClick={addGoal} size="sm">
                Add Goal
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {goals.map((goal) => (
                  <TableRow key={goal.id}>
                    <TableCell>{goal.description}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={goal.isCompleted}
                        onCheckedChange={() => toggleGoalCompletion(goal.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" onClick={() => removeGoal(goal.id)} variant="ghost" size="sm">
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <Label>Objectives</Label>
            <div className="flex items-center">
              <Input
                type="text"
                value={newObjectiveDescription}
                onChange={(e) => setNewObjectiveDescription(e.target.value)}
                placeholder="Enter new objective"
                className="flex-grow mr-2"
              />
              <Button type="button" onClick={addObjective} size="sm">
                Add Objective
              </Button>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Completed</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {objectives.map((objective) => (
                  <TableRow key={objective.id}>
                    <TableCell>{objective.description}</TableCell>
                    <TableCell>
                      <Checkbox
                        checked={objective.isCompleted}
                        onCheckedChange={() => toggleObjectiveCompletion(objective.id)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button type="button" onClick={() => removeObjective(objective.id)} variant="ghost" size="sm">
                        Remove
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div>
            <Label htmlFor="sessionType">Session Type</Label>
            <Input
              id="sessionType"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              placeholder="Enter session type"
            />
          </div>

          <div>
            <Label htmlFor="sessionNotes">Session Notes</Label>
            <Textarea
              id="sessionNotes"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              placeholder="Enter session notes"
            />
          </div>

          <Button type="button" onClick={submitTreatmentPlan} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Treatment Plan'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentPlanTemplate;
