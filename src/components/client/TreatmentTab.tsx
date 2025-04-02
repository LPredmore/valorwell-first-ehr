
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TabProps } from "@/types/client";

const TreatmentTab: React.FC<TabProps> = ({ 
  isEditing, 
  form, 
  clinicians = [] 
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Treatment Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="client_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Client Status</FormLabel>
                <Select
                  disabled={!isEditing}
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="New Lead">New Lead</SelectItem>
                    <SelectItem value="Activated">Activated</SelectItem>
                    <SelectItem value="Profile Complete">Profile Complete</SelectItem>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="First Sessions">First Sessions</SelectItem>
                    <SelectItem value="Established">Established</SelectItem>
                    <SelectItem value="At Risk">At Risk</SelectItem>
                    <SelectItem value="Re-Engaged">Re-Engaged</SelectItem>
                    <SelectItem value="Went Dark">Went Dark</SelectItem>
                    <SelectItem value="Success">Success</SelectItem>
                    <SelectItem value="Do Not Contact">Do Not Contact</SelectItem>
                    <SelectItem value="Discharged">Discharged</SelectItem>
                    <SelectItem value="BlackList">BlackList</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_assigned_therapist"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Therapist</FormLabel>
                <Select
                  disabled={!isEditing}
                  onValueChange={field.onChange}
                  defaultValue={field.value || ""}
                  value={field.value || ""}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {clinicians.map((clinician) => (
                      <SelectItem key={clinician.id} value={clinician.id}>
                        {clinician.clinician_professional_name || `${clinician.clinician_first_name} ${clinician.clinician_last_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="client_referral_source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Referral Source</FormLabel>
                <FormControl>
                  <Input {...field} readOnly={!isEditing} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="col-span-2">
            <FormField
              control={form.control}
              name="client_self_goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Self Goal</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      readOnly={!isEditing}
                      className="min-h-[100px]" 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TreatmentTab;
