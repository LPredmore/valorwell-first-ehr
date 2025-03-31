
import React, { useState, useEffect } from "react";
import { format, addMinutes, addDays, addWeeks } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Check, ChevronsUpDown, CalendarIcon, Clock, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Time options for selection
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 8; hour < 18; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const formattedHour = hour.toString().padStart(2, "0");
      const formattedMinute = minute.toString().padStart(2, "0");
      options.push(`${formattedHour}:${formattedMinute}`);
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();
const appointmentTypes = ["Initial Consultation", "Therapy Session", "Follow-up", "Assessment"];

// Form schema validation
const formSchema = z.object({
  clientId: z.string({
    required_error: "Please select a client",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  startTime: z.string({
    required_error: "Please select a start time",
  }),
  endTime: z.string({
    required_error: "Please select an end time",
  }),
  appointmentType: z.string({
    required_error: "Please select an appointment type",
  }),
  notes: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.enum(["weekly", "biweekly", "monthly"]).optional(),
  recurrenceCount: z.number().min(2).max(12).optional(),
});

interface AppointmentCreationDialogProps {
  clinicianId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onAppointmentCreated: () => void;
}

interface Client {
  id: string;
  name: string;
}

const AppointmentCreationDialog: React.FC<AppointmentCreationDialogProps> = ({
  clinicianId,
  isOpen,
  onClose,
  onAppointmentCreated,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      appointmentType: "Therapy Session",
      notes: "",
      isRecurring: false,
      recurrenceType: "weekly",
      recurrenceCount: 4,
    },
  });

  const isRecurring = form.watch("isRecurring");
  const startTime = form.watch("startTime");

  // Auto-adjust end time when start time changes
  useEffect(() => {
    if (startTime) {
      const [hours, minutes] = startTime.split(":").map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = addMinutes(startDate, 50);
      const endTimeString = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
      form.setValue("endTime", endTimeString);
    }
  }, [startTime, form]);

  // Fetch clients for this clinician
  const { data: clientsData, isLoading: isLoadingClients, error: clientsError } = useQuery({
    queryKey: ["clients", clinicianId],
    queryFn: async () => {
      if (!clinicianId) return [];

      try {
        const { data, error } = await supabase
          .from("clients")
          .select("id, client_first_name, client_last_name, client_preferred_name")
          .eq("client_assigned_therapist", clinicianId);

        if (error) {
          console.error("Error fetching clients:", error);
          return [];
        }

        return (data || []).map((client) => ({
          id: client.id,
          name: client.client_preferred_name 
            ? `${client.client_preferred_name} ${client.client_last_name}`
            : `${client.client_first_name} ${client.client_last_name}`,
        }));
      } catch (e) {
        console.error("Exception when fetching clients:", e);
        return [];
      }
    },
    enabled: !!clinicianId && isOpen,
  });

  // Ensure we always have a valid array for clients
  const clients: Client[] = Array.isArray(clientsData) ? clientsData : [];

  const createRecurringAppointments = (baseAppointment, recurrenceType, count) => {
    const appointments = [];
    let currentDate = new Date(baseAppointment.date);
    
    for (let i = 0; i < count; i++) {
      // Clone the base appointment
      const appointment = { ...baseAppointment };
      
      if (i > 0) {
        // Calculate the next date based on recurrence type
        if (recurrenceType === "weekly") {
          currentDate = addWeeks(currentDate, 1);
        } else if (recurrenceType === "biweekly") {
          currentDate = addWeeks(currentDate, 2);
        } else if (recurrenceType === "monthly") {
          currentDate = addWeeks(currentDate, 4);
        }
        
        appointment.date = format(currentDate, "yyyy-MM-dd");
      }
      
      appointments.push(appointment);
    }
    
    return appointments;
  };

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!clinicianId) {
      toast({
        title: "Error",
        description: "No clinician selected. Please select a clinician.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      let appointments = [];
      const baseAppointment = {
        client_id: data.clientId,
        clinician_id: clinicianId,
        date: format(data.date, "yyyy-MM-dd"),
        start_time: data.startTime,
        end_time: data.endTime,
        type: data.appointmentType,
        status: "scheduled",
        notes: data.notes || null
      };
      
      if (data.isRecurring && data.recurrenceType && data.recurrenceCount) {
        // Create multiple appointments
        appointments = createRecurringAppointments(
          baseAppointment,
          data.recurrenceType,
          data.recurrenceCount
        );
      } else {
        // Just one appointment
        appointments = [baseAppointment];
      }
      
      // Insert appointments
      const { error } = await supabase
        .from("appointments")
        .insert(appointments);
        
      if (error) throw error;
      
      toast({
        title: "Success!",
        description: `${appointments.length > 1 ? "Recurring appointments" : "Appointment"} created successfully.`,
      });
      
      // Close dialog and refresh calendar
      onClose();
      onAppointmentCreated();
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when dialog opens or closes
  useEffect(() => {
    if (!isOpen) {
      form.reset({
        date: new Date(),
        startTime: "09:00",
        endTime: "10:00",
        appointmentType: "Therapy Session",
        notes: "",
        isRecurring: false,
        recurrenceType: "weekly",
        recurrenceCount: 4,
      });
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Appointment</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Client Selection */}
            <FormField
              control={form.control}
              name="clientId"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Client</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          role="combobox"
                          className={cn(
                            "justify-between w-full",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value && clients.length > 0
                            ? clients.find((client) => client.id === field.value)?.name || "Select client"
                            : "Select client"}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-full">
                      {isLoadingClients ? (
                        <div className="flex items-center justify-center p-4">
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <p>Loading clients...</p>
                        </div>
                      ) : clientsError ? (
                        <div className="p-4 text-sm text-red-500">
                          Error loading clients. Please try again.
                        </div>
                      ) : (
                        <Command>
                          <CommandInput placeholder="Search client..." />
                          <CommandEmpty>No client found.</CommandEmpty>
                          {clients.length > 0 && (
                            <CommandGroup>
                              {clients.map((client) => (
                                <CommandItem
                                  key={client.id}
                                  value={client.name}
                                  onSelect={() => {
                                    form.setValue("clientId", client.id);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      client.id === field.value
                                        ? "opacity-100"
                                        : "opacity-0"
                                    )}
                                  />
                                  {client.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          )}
                        </Command>
                      )}
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date Selection */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
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
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date(Date.now() - 86400000)}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Time Selection - Start time */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select start time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Time Selection - End time */}
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select end time" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {timeOptions.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Appointment Type */}
            <FormField
              control={form.control}
              name="appointmentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Appointment Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select appointment type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {appointmentTypes.map((type) => (
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

            {/* Recurring Options */}
            <FormField
              control={form.control}
              name="isRecurring"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel>Recurring Appointment</FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="recurrenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recurrence</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                          <SelectItem value="monthly">Every 4 weeks</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recurrenceCount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>How many sessions?</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select count" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {[2, 3, 4, 5, 6, 8, 10, 12].map((num) => (
                            <SelectItem key={num} value={num.toString()}>
                              {num} sessions
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter any additional notes here"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AppointmentCreationDialog;
