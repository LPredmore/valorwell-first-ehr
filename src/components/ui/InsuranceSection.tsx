import React from 'react';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UseFormReturn } from "react-hook-form";
interface InsuranceSectionProps {
  title: string;
  prefix: string;
  form: UseFormReturn<any>;
  isEditing: boolean;
  insuranceTypes: string[];
  relationshipTypes: string[];
}
const InsuranceSection: React.FC<InsuranceSectionProps> = ({
  title,
  prefix,
  form,
  isEditing,
  insuranceTypes,
  relationshipTypes
}) => {
  // Determine the suffix based on title
  const getSuffix = () => {
    if (title.includes('Primary')) return '_primary';
    if (title.includes('Secondary')) return '_secondary';
    if (title.includes('Tertiary')) return '_tertiary';
    return '';
  };
  const suffix = getSuffix();
  return;
};
export default InsuranceSection;