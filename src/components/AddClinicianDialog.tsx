import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlusCircle, X, Upload } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

// Define the schema for form validation
const clinicianFormSchema = z.object({
  firstName: z.string().min(2, { message: "First name must be at least 2 characters." }),
  lastName: z.string().min(2, { message: "Last name must be at least 2 characters." }),
  professionalName: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  phone: z.string().optional(),
  type: z.string().min(1, { message: "Please select a clinician type." }),
  licenseType: z.string().min(1, { message: "Please select a license type." }),
  npiNumber: z.string().optional(),
  taxonomyCode: z.string().optional(),
  bio: z.string().optional(),
  minClientAge: z.string().transform(val => (val === "" ? "18" : val)).optional(),
  acceptingNewClients: z.boolean().default(true),
  treatmentApproaches: z.array(z.string()).optional(),
});

// Define the license schema
const licenseSchema = z.object({
  state: z.string().min(1, { message: "State is required." }),
  licenseNumber: z.string().min(1, { message: "License number is required." }),
});

// Define props for the dialog component
interface AddClinicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClinicianAdded?: () => void;
}

export function AddClinicianDialog({ open, onOpenChange, onClinicianAdded }: AddClinicianDialogProps) {
  const [activeTab, setActiveTab] = useState("profile");
  const [licenses, setLicenses] = useState<{state: string; licenseNumber: string}[]>([]);
  const [licenseForm, setLicenseForm] = useState({ state: "", licenseNumber: "" });
  const [licenseError, setLicenseError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Initialize form
  const form = useForm<z.infer<typeof clinicianFormSchema>>({
    resolver: zodResolver(clinicianFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      professionalName: "",
      email: "",
      phone: "",
      type: "",
      licenseType: "",
      npiNumber: "",
      taxonomyCode: "",
      bio: "",
      minClientAge: "18",
      acceptingNewClients: true,
      treatmentApproaches: [],
    },
  });

  // Reset form function
  const resetForm = () => {
    form.reset();
    setLicenses([]);
    setLicenseForm({ state: "", licenseNumber: "" });
    setLicenseError(null);
    setImageUrl(null);
    setImageFile(null);
    setActiveTab("profile");
  };

  // Function to add a license
  const addLicense = () => {
    // Validate license
    try {
      licenseSchema.parse(licenseForm);
      setLicenses([...licenses, licenseForm]);
      setLicenseForm({ state: "", licenseNumber: "" });
      setLicenseError(null);
    } catch (error) {
      if (error instanceof z.ZodError) {
        setLicenseError(error.errors[0].message);
      }
    }
  };

  // Function to remove a license
  const removeLicense = (index: number) => {
    const newLicenses = [...licenses];
    newLicenses.splice(index, 1);
    setLicenses(newLicenses);
  };

  // Function to handle image upload
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImageFile(file);
    // Create a local preview URL
    const objectUrl = URL.createObjectURL(file);
    setImageUrl(objectUrl);
  };

  // Function to upload image to Supabase Storage
  const uploadImageToStorage = async (file: File, clinicianId: string) => {
    try {
      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `clinicians/${clinicianId}/${fileName}`;

      // Create storage bucket if it doesn't exist
      // Note: In a production app, you might want to create this bucket via SQL
      const { data: buckets } = await supabase.storage.listBuckets();
      const clinicianBucket = buckets?.find(bucket => bucket.name === 'clinicians');
      
      if (!clinicianBucket) {
        await supabase.storage.createBucket('clinicians', {
          public: true,
        });
      }

      const { error: uploadError } = await supabase.storage
        .from('clinicians')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('clinicians').getPublicUrl(filePath);
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Form submission handler
  const onSubmit = async (data: z.infer<typeof clinicianFormSchema>) => {
    try {
      // Generate a UUID for the new clinician
      const clinicianId = uuidv4();
      
      // Create clinician record
      const { error } = await supabase
        .from('clinicians')
        .insert({
          id: clinicianId,
          clinician_first_name: data.firstName,
          clinician_last_name: data.lastName,
          clinician_professional_name: data.professionalName || null,
          clinician_email: data.email,
          clinician_phone: data.phone || null,
          clinician_type: data.type,
          clinician_license_type: data.licenseType,
          clinician_npi_number: data.npiNumber || null,
          clinician_taxonomy_code: data.taxonomyCode || null,
          clinician_bio: data.bio || null,
          clinician_min_client_age: parseInt(data.minClientAge || "18"),
          clinician_accepting_new_clients: data.acceptingNewClients ? "Yes" : "No",
          clinician_treatment_approaches: data.treatmentApproaches || null,
        });

      if (error) throw error;

      // Upload image if selected
      let imagePublicUrl = null;
      if (imageFile) {
        imagePublicUrl = await uploadImageToStorage(imageFile, clinicianId);
        
        // Update clinician with image URL
        const { error: updateError } = await supabase
          .from('clinicians')
          .update({ clinician_image_url: imagePublicUrl })
          .eq('id', clinicianId);

        if (updateError) throw updateError;
      }

      // Add licenses
      if (licenses.length > 0) {
        const licenseRecords = licenses.map(license => ({
          clinician_id: clinicianId,
          state: license.state,
          license_number: license.licenseNumber,
        }));

        const { error: licenseError } = await supabase
          .from('licenses')
          .insert(licenseRecords);

        if (licenseError) throw licenseError;
      }

      toast({
        title: "Success",
        description: "Clinician added successfully!",
      });

      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
      
      // Refresh clinician list
      if (onClinicianAdded) {
        onClinicianAdded();
      }
    } catch (error) {
      console.error("Error adding clinician:", error);
      toast({
        title: "Error",
        description: "Failed to add clinician. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      if (!newOpen) resetForm();
      onOpenChange(newOpen);
    }}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Clinician</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new clinician to your practice.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="licenses">Licenses</TabsTrigger>
            <TabsTrigger value="role">Role & Details</TabsTrigger>
          </TabsList>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <TabsContent value="profile" className="space-y-4 py-4">
                <div className="flex items-center justify-center mb-6">
                  <div className="relative">
                    <Avatar className="w-24 h-24">
                      {imageUrl ? (
                        <AvatarImage src={imageUrl} alt="Clinician" />
                      ) : (
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-teal-400 to-blue-500">
                          {form.watch("firstName")?.[0] || "?"}{form.watch("lastName")?.[0] || "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <label 
                      htmlFor="clinician-image" 
                      className="absolute -bottom-2 -right-2 p-1.5 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90"
                    >
                      <Upload className="h-4 w-4" />
                      <input
                        id="clinician-image"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="First name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name*</FormLabel>
                        <FormControl>
                          <Input placeholder="Last name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="professionalName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Professional Name (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Dr. Jane Smith, Ph.D" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email*</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter clinician's bio here..."
                          className="resize-none min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              <TabsContent value="licenses" className="space-y-4 py-4">
                <div className="mb-4">
                  <h3 className="text-sm font-medium mb-2">Add License</h3>
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">State*</label>
                      <Input
                        placeholder="CA"
                        value={licenseForm.state}
                        onChange={(e) => setLicenseForm({...licenseForm, state: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">License Number*</label>
                      <Input
                        placeholder="12345"
                        value={licenseForm.licenseNumber}
                        onChange={(e) => setLicenseForm({...licenseForm, licenseNumber: e.target.value})}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={addLicense}
                      className="mb-px"
                    >
                      <PlusCircle className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {licenseError && (
                    <p className="text-sm text-red-500 mt-1">{licenseError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-medium mb-2">Current Licenses</h3>
                  {licenses.length === 0 ? (
                    <p className="text-sm text-gray-500">No licenses added yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {licenses.map((license, index) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                          <div>
                            <span className="font-medium">{license.state}: </span>
                            <span>{license.licenseNumber}</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLicense(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="role" className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinician Type*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Mental Health">Mental Health</SelectItem>
                            <SelectItem value="Speech Therapy">Speech Therapy</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="licenseType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>License Type*</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select license type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LPC">LPC</SelectItem>
                            <SelectItem value="LCSW">LCSW</SelectItem>
                            <SelectItem value="LMFT">LMFT</SelectItem>
                            <SelectItem value="LMHT">LMHT</SelectItem>
                            <SelectItem value="Psychologist">Psychologist</SelectItem>
                            <SelectItem value="Psychiatrist">Psychiatrist</SelectItem>
                            <SelectItem value="SLP">SLP</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="npiNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>NPI Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxonomyCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Taxonomy Code</FormLabel>
                        <FormControl>
                          <Input placeholder="123456789X" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="minClientAge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Client Age</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="18" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptingNewClients"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Accepting New Clients</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? "Uploading..." : "Add Clinician"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
