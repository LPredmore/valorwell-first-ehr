import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast"
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
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { generateAndSavePDF } from "@/utils/reactPdfUtils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon } from "lucide-react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from "@/components/ui/command";
import { countries } from 'countries-list';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { z } from "zod"

// Define the schema for form validation
const formSchema = z.object({
  champva_agreement: z.boolean().optional(),
  client_first_name: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  client_last_name: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  client_date_of_birth: z.date({
    required_error: "A date of birth is required.",
  }),
  client_email: z.string().email({
    message: "Invalid email address.",
  }),
  client_phone: z.string().min(10, {
    message: "Phone number must be at least 10 digits.",
  }),
  client_address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  client_city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  client_state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  client_zip: z.string().min(5, {
    message: "Zip code must be at least 5 characters.",
  }),
  client_country: z.string().min(2, {
    message: "Country must be at least 2 characters.",
  }),
  client_gender: z.string().min(2, {
    message: "Gender must be at least 2 characters.",
  }),
  client_race: z.string().min(2, {
    message: "Race must be at least 2 characters.",
  }),
  client_ethnicity: z.string().min(2, {
    message: "Ethnicity must be at least 2 characters.",
  }),
  client_sexual_orientation: z.string().min(2, {
    message: "Sexual orientation must be at least 2 characters.",
  }),
  client_relationship_status: z.string().min(2, {
    message: "Relationship status must be at least 2 characters.",
  }),
  client_education_level: z.string().min(2, {
    message: "Education level must be at least 2 characters.",
  }),
  client_occupation: z.string().min(2, {
    message: "Occupation must be at least 2 characters.",
  }),
  client_living_situation: z.string().min(2, {
    message: "Living situation must be at least 2 characters.",
  }),
  client_preferred_language: z.string().min(2, {
    message: "Preferred language must be at least 2 characters.",
  }),
  client_emergency_contact_name: z.string().min(2, {
    message: "Emergency contact name must be at least 2 characters.",
  }),
  client_emergency_contact_phone: z.string().min(10, {
    message: "Emergency contact phone must be at least 10 digits.",
  }),
  client_emergency_contact_relationship: z.string().min(2, {
    message: "Emergency contact relationship must be at least 2 characters.",
  }),
  client_insurance_provider: z.string().optional(),
  client_insurance_policy_number: z.string().optional(),
  client_insurance_group_number: z.string().optional(),
  other_insurance: z.string().optional(),
  client_champva: z.string().optional(),
  client_referral_source: z.string().optional(),
  client_additional_information: z.string().optional(),
  terms: z.boolean().refine((value) => value === true, {
    message: "You must accept the terms and conditions.",
  }),
})

// Define the interface for country options to fix type issues
interface CountryOption {
  value: string;
  label: string;
}

const ProfileSetup = () => {
  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isAlertDialogOpen, setIsAlertDialogOpen] = React.useState<boolean>(false);
  const [progress, setProgress] = React.useState<number>(0);
  const [showChampva, setShowChampva] = React.useState<boolean>(false);
  const [showInsurance, setShowInsurance] = React.useState<boolean>(false);
  const [showReferral, setShowReferral] = React.useState<boolean>(false);
  const [showAdditionalInfo, setShowAdditionalInfo] = React.useState<boolean>(false);
  const [showTerms, setShowTerms] = React.useState<boolean>(false);
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);
  const [showError, setShowError] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');
  const [showProgress, setShowProgress] = React.useState<boolean>(false);
  const [showDrawer, setShowDrawer] = React.useState<boolean>(false);
  const [showHoverCard, setShowHoverCard] = React.useState<boolean>(false);
  const [date, setDate] = React.useState<Date | undefined>(new Date())
  const [isMounted, setIsMounted] = useState(false);
  const { userId } = useUser();
  const navigate = useNavigate();
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      client_first_name: "",
      client_last_name: "",
      client_date_of_birth: new Date(),
      client_email: "",
      client_phone: "",
      client_address: "",
      client_city: "",
      client_state: "",
      client_zip: "",
      client_country: "",
      client_gender: "",
      client_race: "",
      client_ethnicity: "",
      client_sexual_orientation: "",
      client_relationship_status: "",
      client_education_level: "",
      client_occupation: "",
      client_living_situation: "",
      client_preferred_language: "",
      client_emergency_contact_name: "",
      client_emergency_contact_phone: "",
      client_emergency_contact_relationship: "",
      client_insurance_provider: "",
      client_insurance_policy_number: "",
      client_insurance_group_number: "",
      other_insurance: "",
      client_champva: "",
      client_referral_source: "",
      client_additional_information: "",
      terms: false,
    },
  })

  const countryOptions: CountryOption[] = Object.entries(countries).map(([key, value]) => ({
    value: key,
    label: value.name as string,
  }));

  const genderOptions = [
    "Male",
    "Female",
    "Non-binary",
    "Transgender",
    "Other",
    "Prefer not to say",
  ];

  const raceOptions = [
    "White",
    "Black or African American",
    "Asian",
    "Native American or Alaska Native",
    "Native Hawaiian or Other Pacific Islander",
    "Other",
    "Prefer not to say",
  ];

  const ethnicityOptions = [
    "Hispanic or Latino",
    "Not Hispanic or Latino",
    "Prefer not to say",
  ];

  const sexualOrientationOptions = [
    "Straight",
    "Gay",
    "Lesbian",
    "Bisexual",
    "Pansexual",
    "Asexual",
    "Other",
    "Prefer not to say",
  ];

  const relationshipStatusOptions = [
    "Single",
    "Married",
    "Divorced",
    "Widowed",
    "Separated",
    "In a relationship",
    "Other",
    "Prefer not to say",
  ];

  const educationLevelOptions = [
    "Less than high school",
    "High school graduate",
    "Some college",
    "Associate's degree",
    "Bachelor's degree",
    "Master's degree",
    "Doctorate degree",
    "Other",
    "Prefer not to say",
  ];

  const livingSituationOptions = [
    "Living with family",
    "Living with friends",
    "Living alone",
    "Living in a dorm",
    "Living in a shelter",
    "Living on the street",
    "Other",
    "Prefer not to say",
  ];

  const referralSourceOptions = [
    "Google",
    "Friend",
    "Family",
    "Therapist",
    "Psychiatrist",
    "Other",
    "Prefer not to say",
  ];

  const stateOptions = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
    "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas",
    "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota",
    "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon",
    "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas",
    "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
  ];

  function handleOtherInsuranceChange(value: string) {
    setShowChampva(value === "No");
    setShowInsurance(value === "Yes");
  }

  function handleReferralSourceChange(value: string) {
    setShowReferral(value === "Other");
  }

  function handleAdditionalInfoChange(value: string) {
    setShowAdditionalInfo(value === "Yes");
  }

  function handleTermsChange(value: string) {
    setShowTerms(value === "Yes");
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSaving(true);
    setShowProgress(true);
    setProgress(0);

    try {
      // Simulate progress
      for (let i = 0; i <= 100; i += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setProgress(i);
      }

      // Step 1: Upload the data to Supabase
      const { data, error } = await supabase
        .from('clients')
        .insert([
          {
            ...values,
            user_id: userId,
          },
        ]);

      if (error) {
        console.error("Error uploading data:", error);
        setErrorMessage('Failed to create profile. Please try again.');
        setShowError(true);
        setShowSuccess(false);
        return;
      }

      console.log("Data uploaded successfully:", data);

      // Step 2: Generate and save the PDF
      const documentInfo = {
        clientId: userId || 'unknown', // Use a default if userId is null
        documentType: 'profile-setup',
        documentDate: new Date(),
        documentTitle: 'Profile Setup Form',
        createdBy: userId,
      };

      const pdfResult = await generateAndSavePDF('profile-setup-form', documentInfo);

      if (!pdfResult.success) {
        console.error("PDF generation failed:", pdfResult.error);
        setErrorMessage('Profile created, but PDF generation failed. Please contact support.');
        setShowError(true);
        setShowSuccess(true);
        return;
      }

      console.log("PDF generated and saved successfully:", pdfResult.filePath);

      // Step 3: Update the user's metadata
      const { data: userUpdate, error: userError } = await supabase.auth.updateUser({
        data: {
          isNewUser: false,
        },
      });

      if (userError) {
        console.error("Error updating user metadata:", userError);
        setErrorMessage('Profile created, but failed to update user status. Please contact support.');
        setShowError(true);
        setShowSuccess(true);
        return;
      }

      console.log("User metadata updated successfully:", userUpdate);

      // If everything was successful
      setShowSuccess(true);
      setShowError(false);
      setErrorMessage('');

      toast({
        title: "Success!",
        description: "You've completed your profile setup.",
      })

      // Redirect to the patient dashboard
      navigate('/patient-dashboard');

    } catch (error: any) {
      console.error("An unexpected error occurred:", error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setShowError(true);
      setShowSuccess(false);
    } finally {
      setIsSaving(false);
      setShowProgress(false);
      setProgress(100);
    }
  }

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div className="container py-12">
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Open Alert</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Drawer open={showDrawer} onOpenChange={setShowDrawer}>
        <DrawerTrigger asChild>
          <Button variant="outline">Open Drawer</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Are you absolutely sure?</DrawerTitle>
            <DrawerDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-6 pb-4">
            <Input placeholder="Type at..." />
          </div>
          <DrawerFooter>
            <DrawerClose>
              <Button variant="outline" size="lg">Cancel</Button>
            </DrawerClose>
            <Button size="lg">Continue</Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <HoverCard open={showHoverCard} onOpenChange={setShowHoverCard}>
        <HoverCardTrigger asChild>
          <Button variant="outline">Open HoverCard</Button>
        </HoverCardTrigger>
        <HoverCardContent className="w-80">
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">shadcn/ui</h4>
            <p className="text-sm">
              Beautifully designed components that you can copy and paste into
              your apps. Accessible. Customizable. Open Source.
            </p>
            <div className="flex items-center pt-2">
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
              <span className="text-xs text-muted-foreground">
                Tuesday, Jan 23, 2023
              </span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      <Card>
        <CardHeader>
          <CardTitle>Profile Setup</CardTitle>
          <CardDescription>
            Please fill out the form below to complete your profile setup.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="profile-setup-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Accordion type="single" collapsible>
                <AccordionItem value="personal">
                  <AccordionTrigger>Personal Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="client_first_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input placeholder="First name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_last_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Last Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Last name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_date_of_birth"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Date of birth</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={cn(
                                      "w-full pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
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
                                  onSelect={(date) => field.onChange(date)}
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
                      <FormField
                        control={form.control}
                        name="client_email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input placeholder="Email" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {genderOptions.map((gender) => (
                                  <SelectItem key={gender} value={gender}>
                                    {gender}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="address">
                  <AccordionTrigger>Address Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="client_address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="Address" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a state" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {stateOptions.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
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
                        name="client_zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Zip Code</FormLabel>
                            <FormControl>
                              <Input placeholder="Zip Code" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a country" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {countryOptions.map((country) => (
                                  <SelectItem key={country.value} value={country.value}>
                                    {country.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="background">
                  <AccordionTrigger>Background Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="client_race"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Race</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a race" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {raceOptions.map((race) => (
                                  <SelectItem key={race} value={race}>
                                    {race}
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
                        name="client_ethnicity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ethnicity</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an ethnicity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {ethnicityOptions.map((ethnicity) => (
                                  <SelectItem key={ethnicity} value={ethnicity}>
                                    {ethnicity}
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
                        name="client_sexual_orientation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Sexual Orientation</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a sexual orientation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {sexualOrientationOptions.map((orientation) => (
                                  <SelectItem key={orientation} value={orientation}>
                                    {orientation}
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
                        name="client_relationship_status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Relationship Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a relationship status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {relationshipStatusOptions.map((status) => (
                                  <SelectItem key={status} value={status}>
                                    {status}
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
                        name="client_education_level"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Education Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select an education level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {educationLevelOptions.map((level) => (
                                  <SelectItem key={level} value={level}>
                                    {level}
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
                        name="client_occupation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Occupation</FormLabel>
                            <FormControl>
                              <Input placeholder="Occupation" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_living_situation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Living Situation</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a living situation" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {livingSituationOptions.map((situation) => (
                                  <SelectItem key={situation} value={situation}>
                                    {situation}
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
                        name="client_preferred_language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Language</FormLabel>
                            <FormControl>
                              <Input placeholder="Preferred Language" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="emergency">
                  <AccordionTrigger>Emergency Contact Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="client_emergency_contact_name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Emergency Contact Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_emergency_contact_phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Phone</FormLabel>
                            <FormControl>
                              <Input placeholder="Emergency Contact Phone" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="client_emergency_contact_relationship"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emergency Contact Relationship</FormLabel>
                            <FormControl>
                              <Input placeholder="Emergency Contact Relationship" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="insurance">
                  <AccordionTrigger>Insurance Information</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="other_insurance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Do you have other insurance?</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                handleOtherInsuranceChange(value); // Call the handler here
                              }}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Yes">Yes</SelectItem>
                                <SelectItem value="No">No</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {showInsurance && (
                        <>
                          <FormField
                            control={form.control}
                            name="client_insurance_provider"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insurance Provider</FormLabel>
                                <FormControl>
                                  <Input placeholder="Insurance Provider" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client_insurance_policy_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insurance Policy Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Insurance Policy Number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="client_insurance_group_number"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Insurance Group Number</FormLabel>
                                <FormControl>
                                  <Input placeholder="Insurance Group Number" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                      {showChampva && (
                        <FormField
                          control={form.control}
                          name="client_champva"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CHAMPVA Number</FormLabel>
                              <FormControl>
                                <Input placeholder="CHAMPVA Number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              
              {showProgress && (
                <Progress value={progress} max={100} className="w-full" />
              )}
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Submit"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileSetup;
