import React, { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@/context/UserContext';

const formSchema = z.object({
  littleInterest: z.string().optional(),
  feelingDown: z.string().optional(),
  troubleSleeping: z.string().optional(),
  feelingTired: z.string().optional(),
  poorAppetite: z.string().optional(),
  feelingBad: z.string().optional(),
  troubleConcentrating: z.string().optional(),
  movingOrSpeaking: z.string().optional(),
  thoughtsYouWouldBeBetterOffDead: z.string().optional(),
})

const PHQ9Template = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [assessmentDate, setAssessmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId } = useUser();

  useEffect(() => {
    if (id) {
      setClientId(id);
    }
  }, [id]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      littleInterest: "",
      feelingDown: "",
      troubleSleeping: "",
      feelingTired: "",
      poorAppetite: "",
      feelingBad: "",
      troubleConcentrating: "",
      movingOrSpeaking: "",
      thoughtsYouWouldBeBetterOffDead: "",
    },
  })

  const assessmentData = form.watch();

  const submitPHQ9 = async () => {
    if (!clientId) {
      toast({
        title: "Error",
        description: "Client ID is missing. Please ensure you are viewing this form from a client's profile.",
        variant: "destructive"
      });
      return;
    }

    const assessmentData = {
      client_id: clientId,
      assessment_date: assessmentDate,
      little_interest: form.getValues("littleInterest"),
      feeling_down: form.getValues("feelingDown"),
      trouble_sleeping: form.getValues("troubleSleeping"),
      feeling_tired: form.getValues("feelingTired"),
      poor_appetite: form.getValues("poorAppetite"),
      feeling_bad: form.getValues("feelingBad"),
      trouble_concentrating: form.getValues("troubleConcentrating"),
      moving_or_speaking: form.getValues("movingOrSpeaking"),
      thoughts_you_would_be_better_off_dead: form.getValues("thoughtsYouWouldBeBetterOffDead"),
      created_by: userId,
    };
    
    const { data, error } = await supabase
      .from('phq9_assessments')
      .insert([assessmentData])
      .select();

    if (error) {
      console.error('Error submitting PHQ9:', error);
      toast({
        title: "Error",
        description: "Failed to save PHQ-9 assessment",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "PHQ-9 assessment saved successfully",
      variant: "default"
    });

    navigate(`/clientdetails/${clientId}`);
  };

  return (
    <Card className="w-[80%] mx-auto">
      <CardHeader>
        <CardTitle>PHQ-9 Assessment</CardTitle>
        <CardDescription>
          Patient Health Questionnaire-9 (PHQ-9)
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="assessment-date">Assessment Date</Label>
            <Input
              type="date"
              id="assessment-date"
              value={assessmentDate}
              onChange={(e) => setAssessmentDate(e.target.value)}
            />
          </div>
        </div>

        <Form {...form}>
          <form className="space-y-8">
            <FormField
              control={form.control}
              name="littleInterest"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    1. Little interest or pleasure in doing things?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feelingDown"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>2. Feeling down, depressed, or hopeless?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="troubleSleeping"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    3. Trouble falling or staying asleep, or sleeping too much?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feelingTired"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>4. Feeling tired or having little energy?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="poorAppetite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>5. Poor appetite or overeating?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="feelingBad"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    6. Feeling bad about yourself - or that you're a failure or
                    have let yourself or your family down?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="troubleConcentrating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    7. Trouble concentrating on things, such as reading the
                    newspaper or watching television?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="movingOrSpeaking"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    8. Moving or speaking so slowly that other people could have
                    noticed? Or the opposite - being so fidgety or restless that
                    you have been moving around a lot more than usual?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="thoughtsYouWouldBeBetterOffDead"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    9. Thoughts that you would be better off dead or of hurting
                    yourself in some way?
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="0">Not at all</SelectItem>
                      <SelectItem value="1">Several days</SelectItem>
                      <SelectItem value="2">More than half the days</SelectItem>
                      <SelectItem value="3">Nearly every day</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => navigate(`/clientdetails/${clientId}`)}>Cancel</Button>
        <Button onClick={submitPHQ9}>Submit</Button>
      </CardFooter>
    </Card>
  );
};

export default PHQ9Template;
