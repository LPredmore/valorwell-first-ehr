import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUser } from '@/context/UserContext';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from "@/components/ui/context-menu";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Link } from 'react-router-dom';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
  NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  CardHeader as ShadCardHeader,
  CardFooter as ShadCardFooter,
  CardTitle as ShadCardTitle,
  CardDescription as ShadCardDescription,
  CardContent as ShadCardContent,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CalendarDateRangePicker } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { CalendarIcon, CheckCheck, ChevronsUpDown, Copy, Edit, ExternalLink, File, FileText, Folder, MoreHorizontal, PlusCircle, Trash } from "lucide-react"
import { format } from "date-fns"
import { DateRange } from "react-day-picker"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AspectRatioDemo } from "@/components/ui/aspect-ratio"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { SkeletonDemo } from "@/components/ui/skeleton"
import { ProgressDemo } from "@/components/ui/progress"
import { SeparatorDemo } from "@/components/ui/separator"
import { BadgeDemo } from "@/components/ui/badge"
import { AccordionDemo } from "@/components/ui/accordion"
import { AlertDialogDemo } from "@/components/ui/alert-dialog"
import { HoverCardDemo } from "@/components/ui/hover-card"
import { ContextMenuDemo } from "@/components/ui/context-menu"
import { NavigationMenuDemo } from "@/components/ui/navigation-menu"
import { CollapsibleDemo } from "@/components/ui/collapsible"
import { FormDemo } from "@/components/ui/form"
import { CalendarDemo } from "@/components/ui/calendar"
import { TableDemo } from "@/components/ui/table"
import { DrawerDemo } from "@/components/ui/drawer"
import { CommandDemo } from "@/components/ui/command"
import { PopoverDemo } from "@/components/ui/popover"
import { CheckboxDemo } from "@/components/ui/checkbox"
import { SwitchDemo } from "@/components/ui/switch"
import { ScrollAreaDemo } from "@/components/ui/scroll-area"
import { AvatarDemo } from "@/components/ui/avatar"
import { CardDemo } from "@/components/ui/card"
import { DropdownMenuDemo } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ResizableDemo } from "@/components/ui/resizable"
import { AspectRatio as RadixAspectRatio } from "@radix-ui/react-aspect-ratio"
import { ScrollArea as RadixScrollArea } from "@radix-ui/react-scroll-area"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { SheetDemo } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { TooltipDemo } from "@/components/ui/tooltip"
import { Progress as RadixProgress } from "@radix-ui/react-progress"
import { Label as RadixLabel } from "@radix-ui/react-label"
import { Input as RadixInput } from "@radix-ui/react-input"
import { Button as RadixButton } from "@/components/ui/button"
import { Textarea as RadixTextarea } from "@radix-ui/react-textarea"
import { Checkbox as RadixCheckbox } from "@radix-ui/react-checkbox"
import { Switch as RadixSwitch } from "@radix-ui/react-switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { RadioGroupDemo } from "@/components/ui/radio-group"
import {
  Select as RadixSelect,
  SelectContent as RadixSelectContent,
  SelectItem as RadixSelectItem,
  SelectTrigger as RadixSelectTrigger,
  SelectValue as RadixSelectValue,
} from "@/components/ui/select"
import { SelectDemo } from "@/components/ui/select"
import {
  Slider as RadixSlider,
  SliderThumb as RadixSliderThumb,
  SliderTrack as RadixSliderTrack,
} from "@/components/ui/slider"
import { SliderDemo } from "@/components/ui/slider"
import {
  Popover as RadixPopover,
  PopoverAnchor as RadixPopoverAnchor,
  PopoverArrow as RadixPopoverArrow,
  PopoverClose as RadixPopoverClose,
  PopoverContent as RadixPopoverContent,
  PopoverTrigger as RadixPopoverTrigger,
} from "@/components/ui/popover"
import { PopoverDemo as RadixPopoverDemo } from "@/components/ui/popover"
import {
  Command as RadixCommand,
  CommandDialog as RadixCommandDialog,
  CommandEmpty as RadixCommandEmpty,
  CommandGroup as RadixCommandGroup,
  CommandInput as RadixCommandInput,
  CommandItem as RadixCommandItem,
  CommandList as RadixCommandList,
  CommandSeparator as RadixCommandSeparator,
  CommandShortcut as RadixCommandShortcut,
} from "@/components/ui/command"
import { CommandDemo as RadixCommandDemo } from "@/components/ui/command"
import {
  Dialog as RadixDialog,
  DialogClose as RadixDialogClose,
  DialogContent as RadixDialogContent,
  DialogDescription as RadixDialogDescription,
  DialogFooter as RadixDialogFooter,
  DialogHeader as RadixDialogHeader,
  DialogOverlay as RadixDialogOverlay,
  DialogPortal as RadixDialogPortal,
  DialogTitle as RadixDialogTitle,
  DialogTrigger as RadixDialogTrigger,
} from "@/components/ui/dialog"
import { DialogDemo as RadixDialogDemo } from "@/components/ui/dialog"
import {
  ContextMenu as RadixContextMenu,
  ContextMenuAnchor as RadixContextMenuAnchor,
  ContextMenuCheckboxItem as RadixContextMenuCheckboxItem,
  ContextMenuContent as RadixContextMenuContent,
  ContextMenuGroup as RadixContextMenuGroup,
  ContextMenuItem as RadixContextMenuItem,
  ContextMenuLabel as RadixContextMenuLabel,
  ContextMenuRadioGroup as RadixContextMenuRadioGroup,
  ContextMenuRadioItem as RadixContextMenuRadioItem,
  ContextMenuSeparator as RadixContextMenuSeparator,
  ContextMenuShortcut as RadixContextMenuShortcut,
  ContextMenuSub as RadixContextMenuSub,
  ContextMenuSubContent as RadixContextMenuSubContent,
  ContextMenuSubTrigger as RadixContextMenuSubTrigger,
  ContextMenuTrigger as RadixContextMenuTrigger,
} from "@/components/ui/context-menu"
import { ContextMenuDemo as RadixContextMenuDemo } from "@/components/ui/context-menu"
import {
  HoverCard as RadixHoverCard,
  HoverCardArrow as RadixHoverCardArrow,
  HoverCardContent as RadixHoverCardContent,
  HoverCardDelayGroup as RadixHoverCardDelayGroup,
  HoverCardDelayIndicator as RadixHoverCardDelayIndicator,
  HoverCardPortal as RadixHoverCardPortal,
  HoverCardRoot as RadixHoverCardRoot,
  HoverCardTrigger as RadixHoverCardTrigger,
} from "@/components/ui/hover-card"
import { HoverCardDemo as RadixHoverCardDemo } from "@/components/ui/hover-card"
import {
  Accordion as RadixAccordion,
  AccordionContent as RadixAccordionContent,
  AccordionItem as RadixAccordionItem,
  AccordionTrigger as RadixAccordionTrigger,
} from "@/components/ui/accordion"
import { AccordionDemo as RadixAccordionDemo } from "@/components/ui/accordion"
import {
  Tooltip as RadixTooltip,
  TooltipArrow as RadixTooltipArrow,
  TooltipContent as RadixTooltipContent,
  TooltipProvider as RadixTooltipProvider,
  TooltipRoot as RadixTooltipRoot,
  TooltipTrigger as RadixTooltipTrigger,
} from "@/components/ui/tooltip"
import { TooltipDemo as RadixTooltipDemo } from "@/components/ui/tooltip"
import {
  NavigationMenu as RadixNavigationMenu,
  NavigationMenuContent as RadixNavigationMenuContent,
  NavigationMenuItem as RadixNavigationMenuItem,
  NavigationMenuLink as RadixNavigationMenuLink,
  NavigationMenuList as RadixNavigationMenuList,
  NavigationMenuTrigger as RadixNavigationMenuTrigger,
  NavigationMenuViewport as RadixNavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import { NavigationMenuDemo as RadixNavigationMenuDemo } from "@/components/ui/navigation-menu"
import {
  Collapsible as RadixCollapsible,
  CollapsibleContent as RadixCollapsibleContent,
  CollapsibleTrigger as RadixCollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CollapsibleDemo as RadixCollapsibleDemo } from "@/components/ui/collapsible"
import {
  Sheet as RadixSheet,
  SheetClose as RadixSheetClose,
  SheetContent as RadixSheetContent,
  SheetDescription as RadixSheetDescription,
  SheetFooter as RadixSheetFooter,
  SheetHeader as RadixSheetHeader,
  SheetOverlay as RadixSheetOverlay,
  SheetPortal as RadixSheetPortal,
  SheetTitle as RadixSheetTitle,
  SheetTrigger as RadixSheetTrigger,
} from "@/components/ui/sheet"
import { SheetDemo as RadixSheetDemo } from "@/components/ui/sheet"
import {
  ResizableHandle as RadixResizableHandle,
  ResizablePanel as RadixResizablePanel,
  ResizablePanelGroup as RadixResizablePanelGroup,
} from "@/components/ui/resizable"
import { ResizableDemo as RadixResizableDemo } from "@/components/ui/resizable"
import {
  Drawer as RadixDrawer,
  DrawerClose as RadixDrawerClose,
  DrawerContent as RadixDrawerContent,
  DrawerDescription as RadixDrawerDescription,
  DrawerFooter as RadixDrawerFooter,
  DrawerHeader as RadixDrawerHeader,
  DrawerOverlay as RadixDrawerOverlay,
  DrawerPortal as RadixDrawerPortal,
  DrawerTitle as RadixDrawerTitle,
  DrawerTrigger as RadixDrawerTrigger,
} from "@/components/ui/drawer"
import { DrawerDemo as RadixDrawerDemo } from "@/components/ui/drawer"
import {
  AspectRatio as ShadAspectRatio,
  Card as ShadCard,
  CardContent as ShadCardContent,
  CardDescription as ShadCardDescription,
  CardFooter as ShadCardFooter,
  CardHeader as ShadCardHeader,
  CardTitle as ShadCardTitle,
} from "@/components/ui/card"
import { Avatar as ShadAvatar, AvatarFallback as ShadAvatarFallback, AvatarImage as ShadAvatarImage } from "@/components/ui/avatar"
import { Badge as ShadBadge } from "@/components/ui/badge"
import { Button as ShadButton } from "@/components/ui/button"
import { Calendar as ShadCalendar } from "@/components/ui/calendar"
import { Checkbox as ShadCheckbox } from "@/components/ui/checkbox"
import { Collapsible as ShadCollapsible, CollapsibleContent as ShadCollapsibleContent, CollapsibleTrigger as ShadCollapsibleTrigger } from "@/components/ui/collapsible"
import { Command as ShadCommand, CommandDialog as ShadCommandDialog, CommandEmpty as ShadCommandEmpty, CommandGroup as ShadCommandGroup, CommandInput as ShadCommandInput, CommandItem as ShadCommandItem, CommandList as ShadCommandList, CommandSeparator as ShadCommandSeparator, CommandShortcut as ShadCommandShortcut } from "@/components/ui/command"
import { ContextMenu as ShadContextMenu, ContextMenuCheckboxItem as ShadContextMenuCheckboxItem, ContextMenuContent as ShadContextMenuContent, ContextMenuGroup as ShadContextMenuGroup, ContextMenuItem as ShadContextMenuItem, ContextMenuLabel as ShadContextMenuLabel, ContextMenuRadioGroup as ShadContextMenuRadioGroup, ContextMenuRadioItem as ShadContextMenuRadioItem, ContextMenuSeparator as ShadContextMenuSeparator, ContextMenuShortcut as ShadContextMenuShortcut, ContextMenuSub as ShadContextMenuSub, ContextMenuSubContent as ShadContextMenuSubContent, ContextMenuSubTrigger as ShadContextMenuSubTrigger } from "@/components/ui/context-menu"
import { Dialog as ShadDialog, DialogClose as ShadDialogClose, DialogContent as ShadDialogContent, DialogDescription as ShadDialogDescription, DialogFooter as ShadDialogFooter, DialogHeader as ShadDialogHeader, DialogOverlay as ShadDialogOverlay, DialogPortal as ShadDialogPortal, DialogTitle as ShadDialogTitle, DialogTrigger as ShadDialogTrigger } from "@/components/ui/dialog"
import { Drawer as ShadDrawer, DrawerClose as ShadDrawerClose, DrawerContent as ShadDrawerContent, DrawerDescription as ShadDrawerDescription, DrawerFooter as ShadDrawerFooter, DrawerHeader as ShadDrawerHeader, DrawerOverlay as ShadDrawerOverlay, DrawerPortal as ShadDrawerPortal, DrawerTitle as ShadDrawerTitle, DrawerTrigger as ShadDrawerTrigger } from "@/components/ui/drawer"
import { HoverCard as ShadHoverCard, HoverCardArrow as ShadHoverCardArrow, HoverCardContent as ShadHoverCardContent, HoverCardDelayGroup as ShadHoverCardDelayGroup, HoverCardDelayIndicator as ShadHoverCardDelayIndicator, HoverCardPortal as ShadHoverCardPortal, HoverCardRoot as ShadHoverCardRoot, HoverCardTrigger as ShadHoverCardTrigger } from "@/components/ui/hover-card"
import { Input as ShadInput } from "@/components/ui/input"
import { Label as ShadLabel } from "@/components/ui/label"
import { NavigationMenu as ShadNavigationMenu, NavigationMenuContent as ShadNavigationMenuContent, NavigationMenuItem as ShadNavigationMenuItem, NavigationMenuLink as ShadNavigationMenuLink, NavigationMenuList as ShadNavigationMenuList, NavigationMenuTrigger as ShadNavigationMenuTrigger, NavigationMenuViewport as ShadNavigationMenuViewport } from "@/components/ui/navigation-menu"
import { Popover as ShadPopover, PopoverAnchor as ShadPopoverAnchor, PopoverArrow as ShadPopoverArrow, PopoverClose as ShadPopoverClose, PopoverContent as ShadPopoverContent, PopoverTrigger as ShadPopoverTrigger } from "@/components/ui/popover"
import { Progress as ShadProgress } from "@/components/ui/progress"
import { RadioGroup as ShadRadioGroup, RadioGroupItem as ShadRadioGroupItem } from "@/components/ui/radio-group"
import { ResizableHandle as ShadResizableHandle, ResizablePanel as ShadResizablePanel, ResizablePanelGroup as ShadResizablePanelGroup } from "@/components/ui/resizable"
import { ScrollArea as ShadScrollArea } from "@/components/ui/scroll-area"
import { Select as ShadSelect, SelectContent as ShadSelectContent, SelectItem as ShadSelectItem, SelectTrigger as ShadSelectTrigger, SelectValue as ShadSelectValue } from "@/components/ui/select"
import { Separator as ShadSeparator } from "@/components/ui/separator"
import { Sheet as ShadSheet, SheetClose as ShadSheetClose, SheetContent as ShadSheetContent, SheetDescription as ShadSheetDescription, SheetFooter as ShadSheetFooter, SheetHeader as ShadSheetHeader, SheetOverlay as ShadSheetOverlay, SheetPortal as ShadSheetPortal, SheetTitle as ShadSheetTitle, SheetTrigger as ShadSheetTrigger } from "@/components/ui/sheet"
import { Slider as ShadSlider, SliderThumb as ShadSliderThumb, SliderTrack as ShadSliderTrack } from "@/components/ui/slider"
import { Switch as ShadSwitch } from "@/components/ui/switch"
import { Table as ShadTable, TableBody as ShadTableBody, TableCaption as ShadTableCaption, TableCell as ShadTableCell, TableHead as ShadTableHead, TableHeader as ShadTableHeader, TableRow as ShadTableRow } from "@/components/ui/table"
import { Textarea as ShadTextarea } from "@/components/ui/textarea"
import { Tooltip as ShadTooltip, TooltipContent as ShadTooltipContent, TooltipProvider as ShadTooltipProvider, TooltipTrigger as ShadTooltipTrigger } from "@/components/ui/tooltip"

const PatientDashboard = () => {
  const [message, setMessage] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [messageId, setMessageId] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { userId, isLoading: isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !userId) {
      toast({
        title: "Access restricted",
        description: "Please sign in to view the dashboard",
        variant: "destructive",
      });
      navigate('/login');
    }
  }, [userId, isUserLoading, navigate, toast]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error('Error fetching user data:', userError);
        return;
      }
      
      if (userData?.user?.id) {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userData.user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setError(error.message);
        } else {
          setProfile(data);
        }
      }
      setIsLoading(false);
    };

    fetchUserProfile();
  }, [userId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.functions.invoke('twilio-send-message', {
        body: {
          to: phoneNumber,
          message: message,
        },
      });

      if (error) throw error;

      // Set the messageId directly if data is a string, otherwise handle the object structure
      setMessageId(typeof data === 'string' ? data : data?.messageId || '');
      setMessage('');
      setIsSuccess(true);

      toast({
        title: "Success",
        description: "Message sent successfully!",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Patient Dashboard</h1>

      {profile ? (
        <Card>
          <CardHeader>
            <CardTitle>Welcome, {profile.full_name}!</CardTitle>
            <CardDescription>Manage your profile and communication settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Email: {profile.email}</p>
            <p>Phone: {profile.phone || 'Not provided'}</p>
          </CardContent>
        </Card>
      ) : (
        <p>Loading profile...</p>
      )}

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Send SMS Message</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Enter phone number"
              required
            />
          </div>
          <div>
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              required
            />
          </div>
          <Button type="submit">Send Message</Button>
        </form>

        {isSuccess && messageId && (
          <div className="mt-4">
            <p className="text-green-500">Message sent successfully!</p>
            <p>Message ID: {messageId}</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PatientDashboard;
