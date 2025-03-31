
import React from "react";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ClientDetails } from "@/types/client";
import { Card, CardContent } from "@/components/ui/card";

interface InsuranceTabProps {
  isEditing: boolean;
  form: any;
  clientData: ClientDetails;
}

const InsuranceTab = ({ isEditing, form, clientData }: InsuranceTabProps) => {
  const insuranceTypes = [
    "HMO",
    "PPO",
    "EPO",
    "POS",
    "HDHP",
    "Medicare",
    "Medicaid",
    "TRICARE",
    "VA"
  ];

  const relationshipTypes = [
    "Self",
    "Spouse",
    "Child",
    "Other"
  ];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-8">
          {/* Primary Insurance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Primary Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_insurance_company_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Company</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_insurance_type_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Type</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insuranceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="client_policy_number_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_group_number_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_subscriber_name_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_subscriber_relationship_primary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Relationship</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipTypes.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
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
                name="client_subscriber_dob_primary"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subscriber Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!isEditing}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Secondary Insurance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Secondary Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_insurance_company_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Company</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_insurance_type_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Type</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insuranceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="client_policy_number_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_group_number_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_subscriber_name_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_subscriber_relationship_secondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Relationship</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipTypes.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
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
                name="client_subscriber_dob_secondary"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subscriber Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!isEditing}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Tertiary Insurance */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tertiary Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_insurance_company_tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Company</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_insurance_type_tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Insurance Type</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {insuranceTypes.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
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
                name="client_policy_number_tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Policy Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_group_number_tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Number</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_subscriber_name_tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Name</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={!isEditing} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="client_subscriber_relationship_tertiary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subscriber Relationship</FormLabel>
                    <Select
                      disabled={!isEditing}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {relationshipTypes.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
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
                name="client_subscriber_dob_tertiary"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Subscriber Date of Birth</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={!isEditing}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* VA Insurance Section */}
          {clientData.client_vacoverage && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">VA Insurance - {clientData.client_vacoverage}</h3>
              
              {clientData.client_vacoverage === "CHAMPVA" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="client_champva"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>CHAMPVA #</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={!isEditing} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500 italic">
                      We understand that this is your SSN. And although we do not necessarily agree with them using this as their patient identifier, we do have to follow their process. The only way to verify your coverage is to have this.
                    </p>
                  </div>
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
                          defaultValue={field.value}
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
                          <Input {...field} disabled={!isEditing} />
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
                          defaultValue={field.value}
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
                          <Input {...field} disabled={!isEditing} />
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
                          defaultValue={field.value}
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
                          defaultValue={field.value}
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
                          <Input {...field} disabled={!isEditing} />
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
                          defaultValue={field.value}
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
                            <Input {...field} disabled={!isEditing} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}
              
              {clientData.client_vacoverage === "VA Community Care" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mentalHealthReferral"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Have you requested a referral from Mental Health?</FormLabel>
                        <Select
                          disabled={!isEditing}
                          onValueChange={field.onChange}
                          defaultValue={field.value}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default InsuranceTab;
