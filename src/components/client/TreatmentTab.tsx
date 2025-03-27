
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash } from "lucide-react";
import { TabProps } from "@/types/client";

const TreatmentTab: React.FC<TabProps> = ({ 
  isEditing, 
  form, 
  clinicians = [], 
  handleAddDiagnosis, 
  handleRemoveDiagnosis 
}) => {
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Diagnosis</CardTitle>
          <CardDescription>Add client diagnoses here</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {form.watch("client_diagnosis")?.map((diagnosis: string, index: number) => (
              <div key={index} className="flex items-center gap-2">
                <Input 
                  value={diagnosis}
                  onChange={(e) => {
                    const updatedDiagnoses = [...(form.getValues("client_diagnosis") || [])];
                    updatedDiagnoses[index] = e.target.value;
                    form.setValue("client_diagnosis", updatedDiagnoses);
                  }}
                  readOnly={!isEditing}
                  placeholder="Enter diagnosis"
                  className="flex-grow"
                />
                {isEditing && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveDiagnosis && handleRemoveDiagnosis(index)}
                  >
                    <Trash size={16} className="text-red-500" />
                  </Button>
                )}
              </div>
            ))}
            {isEditing && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleAddDiagnosis}
                className="flex items-center gap-1"
              >
                <Plus size={16} /> Add Diagnosis
              </Button>
            )}
            {(!form.watch("client_diagnosis") || form.watch("client_diagnosis")?.length === 0) && !isEditing && (
              <p className="text-sm text-gray-500">No diagnoses have been added yet.</p>
            )}
          </div>
        </CardContent>
      </Card>

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
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="On Hold">On Hold</SelectItem>
                      <SelectItem value="Discharged">Discharged</SelectItem>
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
    </>
  );
};

export default TreatmentTab;
