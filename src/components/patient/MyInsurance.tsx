
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Save, Edit } from 'lucide-react';
import { Form } from '@/components/ui/form';
import InsuranceSection from '@/components/ui/InsuranceSection';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface MyInsuranceProps {
  clientData: any | null;
  loading: boolean;
  isEditing: boolean;
  setIsEditing: (isEditing: boolean) => void;
  form: any;
  isSaving: boolean;
  handleSaveProfile: () => Promise<void>;
  handleCancelEdit: () => void;
  insuranceTypes: string[];
  relationshipTypes: string[];
}

const MyInsurance: React.FC<MyInsuranceProps> = ({
  clientData,
  loading,
  isEditing,
  setIsEditing,
  form,
  isSaving,
  handleSaveProfile,
  handleCancelEdit,
  insuranceTypes,
  relationshipTypes
}) => {
  // Add debugging to check if client_champva exists in clientData
  console.log("Client data in MyInsurance:", clientData);
  console.log("Form values in MyInsurance:", form.getValues());
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle className="text-2xl">Insurance Information</CardTitle>
          <CardDescription>View and manage your insurance details</CardDescription>
        </div>
        {isEditing ? (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleCancelEdit}
              disabled={isSaving}
              type="button"
            >
              <X className="h-4 w-4" />
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex items-center gap-1"
              onClick={handleSaveProfile}
              disabled={isSaving}
              type="button"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setIsEditing(true)}
            type="button"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <p>Loading your insurance data...</p>
          </div>
        ) : (
          <Form {...form}>
            <InsuranceSection
              title="Primary Insurance"
              prefix="client_"
              form={form}
              isEditing={isEditing}
              insuranceTypes={insuranceTypes}
              relationshipTypes={relationshipTypes}
            />

            <InsuranceSection
              title="Secondary Insurance"
              prefix="client_"
              form={form}
              isEditing={isEditing}
              insuranceTypes={insuranceTypes}
              relationshipTypes={relationshipTypes}
            />

            <InsuranceSection
              title="Tertiary Insurance"
              prefix="client_"
              form={form}
              isEditing={isEditing}
              insuranceTypes={insuranceTypes}
              relationshipTypes={relationshipTypes}
            />

            {clientData?.client_vacoverage && (
              <div className="mb-6 border rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">VA Insurance - {clientData.client_vacoverage}</h3>
                
                {clientData.client_vacoverage === "CHAMPVA" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="client_champva"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CHAMPVA #</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <p className="text-sm text-gray-500 italic">
                      We understand that this is your SSN. And although we do not necessarily agree with them using this as their patient identifier, we do have to follow their process. The only way to verify your coverage is to have this.
                    </p>
                  </div>
                )}

                {clientData.client_vacoverage === "TRICARE" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="client_tricare_beneficiary_category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TRICARE Beneficiary Category</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                "Active Duty Service Member",
                                "Active Duty Family Member",
                                "Retired Service Member",
                                "Retired Family Member",
                                "Guard/Reserve Service Member",
                                "Guard/Reserve Family Member",
                                "Surviving Family Member",
                                "Medal of Honor Recipient",
                                "TRICARE For Life",
                                "TRICARE Young Adult",
                                "Former Spouse",
                                "Children with Disabilities"
                              ].map((category) => (
                                <SelectItem key={category} value={category}>
                                  {category}
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
                      name="client_tricare_sponsor_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TRICARE Sponsor's Name</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="client_tricare_sponsor_branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TRICARE Sponsor's Branch of Service</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select branch" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                "Air Force",
                                "Army",
                                "Coast Guard",
                                "Marine Corps",
                                "Navy",
                                "NOAA Corps",
                                "Space Force",
                                "USPHS"
                              ].map((branch) => (
                                <SelectItem key={branch} value={branch}>
                                  {branch}
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
                      name="client_tricare_sponsor_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TRICARE Sponsor's SSN or DOD ID Number</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="client_tricare_plan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TRICARE Plan</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select plan" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                "TRICARE Prime",
                                "TRICARE Prime Remote",
                                "TRICARE Prime Option",
                                "TRICARE Prime Overseas",
                                "TRICARE Remote Overseas",
                                "TRICARE Select",
                                "TRICARE Select Overseas",
                                "TRICARE For Life",
                                "TRICARE Reserve Select",
                                "TRICARE Retired Reserve",
                                "TRICARE Young Adult"
                              ].map((plan) => (
                                <SelectItem key={plan} value={plan}>
                                  {plan}
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
                      name="client_tricare_region"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>TRICARE Region</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select region" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {[
                                "TRICARE East",
                                "TRICARE West",
                                "TRICARE Overseas"
                              ].map((region) => (
                                <SelectItem key={region} value={region}>
                                  {region}
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
                      name="client_tricare_policy_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Policy #/Plan ID</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="client_tricare_has_referral"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Do you have a Referral Number?</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Yes", "No"].map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {clientData.client_tricare_has_referral === "Yes" && (
                      <FormField
                        control={form.control}
                        name="client_tricare_referral_number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Referral Number</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly={!isEditing} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}
                
                {clientData.client_vacoverage === "VA Community Care" && (
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="mentalHealthReferral"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Have you requested a referral from Mental Health?</FormLabel>
                          <Select
                            disabled={!isEditing}
                            onValueChange={field.onChange}
                            defaultValue={field.value || ""}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {["Yes", "No"].map((option) => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
            )}
          </Form>
        )}
      </CardContent>
    </Card>
  );
};

export default MyInsurance;
