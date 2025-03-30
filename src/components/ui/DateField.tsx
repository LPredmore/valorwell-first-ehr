
import * as React from "react";
import { format } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DateFieldProps {
  control: any;
  name: string;
  label: string;
}

export const DateField: React.FC<DateFieldProps> = ({ control, name, label }) => {
  const [calendarOpen, setCalendarOpen] = React.useState(false);
  const [yearPickerOpen, setYearPickerOpen] = React.useState(false);
  const [currentYear, setCurrentYear] = React.useState(() => new Date().getFullYear());
  const [viewDate, setViewDate] = React.useState(new Date());

  // Generate years array (from 1900 to current year)
  const years = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: currentYear - 1899 }, (_, i) => currentYear - i);
  }, []);

  // Custom rendering for calendar caption
  const captionComponent = React.useCallback(
    ({ displayMonth }: { displayMonth: Date }) => {
      const year = displayMonth.getFullYear();
      const month = format(displayMonth, 'MMMM');

      return (
        <div className="flex h-10 justify-center pt-1 relative items-center">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                setYearPickerOpen(!yearPickerOpen);
                setCurrentYear(year);
              }}
              className="text-sm font-medium hover:underline focus:outline-none"
            >
              {year}
            </button>
            <span className="text-sm font-medium">{month}</span>
          </div>
        </div>
      );
    },
    [yearPickerOpen]
  );

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex flex-col">
          <FormLabel>{label}</FormLabel>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
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
                    format(field.value, "MMMM d, yyyy")
                  ) : (
                    <span>Select date</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              {yearPickerOpen ? (
                <div className="flex flex-col p-3 pointer-events-auto max-h-72 overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {years.map((year) => (
                      <Button
                        key={year}
                        variant="ghost"
                        className={cn(
                          "h-9 w-full rounded-md p-0",
                          year === currentYear && "bg-primary text-primary-foreground"
                        )}
                        onClick={() => {
                          const newDate = new Date(viewDate);
                          newDate.setFullYear(year);
                          setViewDate(newDate);
                          setYearPickerOpen(false);
                        }}
                      >
                        {year}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={(date) => {
                    field.onChange(date);
                    setCalendarOpen(false);
                  }}
                  defaultMonth={viewDate}
                  onMonthChange={setViewDate}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  components={{
                    Caption: captionComponent,
                    IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
                    IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />
                  }}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              )}
            </PopoverContent>
          </Popover>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
