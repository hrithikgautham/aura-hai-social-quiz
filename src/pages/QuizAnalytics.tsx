// src/pages/QuizAnalytics.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { UserAnswerCard } from '@/components/quiz/UserAnswerCard';
import { calculateMCQAuraPoints, auraColors } from '@/utils/auraCalculations';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal } from 'lucide-react';
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
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { PopoverClose } from '@radix-ui/react-popover';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { SwitchDemo } from '@/components/ui/switch';
import { Progress } from "@/components/ui/progress"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { InputWithButton } from "@/components/ui/input"
import { CardDemo } from "@/components/ui/card"
import { AccordionDemo } from "@/components/ui/accordion"
import { AlertDestructive } from "@/components/ui/alert"
import { AlertLink } from "@/components/ui/alert"
import { AlertWithActions } from "@/components/ui/alert"
import { AlertDemo } from "@/components/ui/alert"
import { AlertDialogDemo } from "@/components/ui/alert-dialog"
import { CalendarDemo } from "@/components/ui/calendar"
import { ComboboxDemo } from "@/components/ui/combobox"
import { CommandDemo } from "@/components/ui/command"
import { ContextMenuCheckbox } from "@/components/ui/context-menu"
import { ContextMenuRadioGroup } from "@/components/ui/context-menu"
import { ContextMenuSeparator } from "@/components/ui/context-menu"
import { ContextMenuSub } from "@/components/ui/context-menu"
import { ContextMenuDemo } from "@/components/ui/context-menu"
import { DialogDemo } from "@/components/ui/dialog"
import { DropdownMenuCheckbox } from "@/components/ui/dropdown-menu"
import { DropdownMenuRadioGroup } from "@/components/ui/dropdown-menu"
import { DropdownMenuSeparator as DropdownMenuSeparatorComponent } from "@/components/ui/dropdown-menu"
import { DropdownMenuSub } from "@/components/ui/dropdown-menu"
import { DropdownMenuDemo } from "@/components/ui/dropdown-menu"
import { FormDemo } from "@/components/ui/form"
import { HoverCardDemo } from "@/components/ui/hover-card"
import { InputDemo } from "@/components/ui/input"
import { LabelDemo } from "@/components/ui/label"
import { MenubarCheckbox } from "@/components/ui/menubar"
import { MenubarRadioGroup } from "@/components/ui/menubar"
import { MenubarSeparator } from "@/components/ui/menubar"
import { MenubarSub } from "@/components/ui/menubar"
import { MenubarDemo } from "@/components/ui/menubar"
import { NavigationMenuDemo } from "@/components/ui/navigation-menu"
import { PaginationDemo } from "@/components/ui/pagination"
import { PopoverDemo } from "@/components/ui/popover"
import { ProgressDemo } from "@/components/ui/progress"
import { RadioGroupDemo } from "@/components/ui/radio-group"
import { ScrollAreaAutosize } from "@/components/ui/scroll-area"
import { SelectDemo } from "@/components/ui/select"
import { SeparatorDemo } from "@/components/ui/separator"
import { SheetDemo } from "@/components/ui/sheet"
import { SliderDemo } from "@/components/ui/slider"
import { SwitchDemo as SwitchDemoComponent } from "@/components/ui/switch"
import { TableDemo } from "@/components/ui/table"
import { TabsDemo } from "@/components/ui/tabs"
import { TextareaDemo } from "@/components/ui/textarea"
import { ToastDemo } from "@/components/ui/toast"
import { ToggleDemo } from "@/components/ui/toggle"
import { TooltipDemo } from "@/components/ui/tooltip"
import { AspectRatioDemo } from "@/components/ui/aspect-ratio"
import { InputWithButtonDemo } from "@/components/ui/input"
import { AlertCircle, CheckCircle, Info, Loader2, XCircle } from "lucide-react"
import { HoverCard, HoverCardContent, HoverCardDescription, HoverCardHeader, HoverCardTrigger } from "@/components/ui/hover-card"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Toggle } from "@/components/ui/toggle"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroupItem, ContextMenuSeparator as ContextMenuSeparatorComponent, ContextMenuSubContent, ContextMenuSubMenu, ContextMenuTrigger } from "@/components/ui/context-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, NavigationMenuViewport } from "@/components/ui/navigation-menu"
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxGroup, ComboboxInput, ComboboxItem, ComboboxLabel, ComboboxList, ComboboxPopover, ComboboxSeparator, ComboboxTrigger } from "@/components/ui/combobox"
import { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarList, MenubarMenu, MenubarRadioGroupItem, MenubarSeparator as MenubarSeparatorComponent, MenubarSubContent, MenubarSubMenu, MenubarTrigger } from "@/components/ui/menubar"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { SkeletonDemo } from "@/components/ui/skeleton"
import { Separator as SeparatorComponent } from "@/components/ui/separator"
import { Label as LabelComponent } from "@/components/ui/label"
import { Input as InputComponent } from "@/components/ui/input"
import { Switch as SwitchComponent } from "@/components/ui/switch"
import { AlertDialog as AlertDialogComponent } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent } from "@/components/ui/combobox"
import { Command as CommandComponent } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent } from "@/components/ui/context-menu"
import { Dialog as DialogComponent } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent } from "@/components/ui/dropdown-menu"
import { Form as FormComponent } from "@/components/ui/form"
import { HoverCard as HoverCardComponent } from "@/components/ui/hover-card"
import { Input as InputComponent2 } from "@/components/ui/input"
import { Label as LabelComponent2 } from "@/components/ui/label"
import { Menubar as MenubarComponent } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent } from "@/components/ui/pagination"
import { Popover as PopoverComponent } from "@/components/ui/popover"
import { Progress as ProgressComponent } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent } from "@/components/ui/scroll-area"
import { Select as SelectComponent } from "@/components/ui/select"
import { Separator as SeparatorComponent2 } from "@/components/ui/separator"
import { Sheet as SheetComponent } from "@/components/ui/sheet"
import { Slider as SliderComponent } from "@/components/ui/slider"
import { Switch as SwitchComponent2 } from "@/components/ui/switch"
import { Table as TableComponent } from "@/components/ui/table"
import { Tabs as TabsComponent } from "@/components/ui/tabs"
import { Textarea as TextareaComponent } from "@/components/ui/textarea"
import { Toast as ToastComponent } from "@/components/ui/toast"
import { Toggle as ToggleComponent } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent } from "@/components/ui/input"
import { Card as CardComponent } from "@/components/ui/card"
import { Accordion as AccordionComponent } from "@/components/ui/accordion"
import { Alert as AlertComponent } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent2 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent2 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent2 } from "@/components/ui/combobox"
import { Command as CommandComponent2 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent2 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent2 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent2 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent2 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent2 } from "@/components/ui/hover-card"
import { Input as InputComponent3 } from "@/components/ui/input"
import { Label as LabelComponent3 } from "@/components/ui/label"
import { Menubar as MenubarComponent2 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent2 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent2 } from "@/components/ui/pagination"
import { Popover as PopoverComponent2 } from "@/components/ui/popover"
import { Progress as ProgressComponent2 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent2 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent2 } from "@/components/ui/scroll-area"
import { Select as SelectComponent2 } from "@/components/ui/select"
import { Separator as SeparatorComponent3 } from "@/components/ui/separator"
import { Sheet as SheetComponent2 } from "@/components/ui/sheet"
import { Slider as SliderComponent3 } from "@/components/ui/slider"
import { Switch as SwitchComponent3 } from "@/components/ui/switch"
import { Table as TableComponent2 } from "@/components/ui/table"
import { Tabs as TabsComponent2 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent2 } from "@/components/ui/textarea"
import { Toast as ToastComponent2 } from "@/components/ui/toast"
import { Toggle as ToggleComponent2 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent2 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent2 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent2 } from "@/components/ui/input"
import { Card as CardComponent2 } from "@/components/ui/card"
import { Accordion as AccordionComponent2 } from "@/components/ui/accordion"
import { Alert as AlertComponent2 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent3 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent3 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent3 } from "@/components/ui/combobox"
import { Command as CommandComponent3 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent3 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent3 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent3 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent3 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent3 } from "@/components/ui/hover-card"
import { Input as InputComponent4 } from "@/components/ui/input"
import { Label as LabelComponent4 } from "@/components/ui/label"
import { Menubar as MenubarComponent3 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent3 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent3 } from "@/components/ui/pagination"
import { Popover as PopoverComponent3 } from "@/components/ui/popover"
import { Progress as ProgressComponent3 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent3 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent3 } from "@/components/ui/scroll-area"
import { Select as SelectComponent3 } from "@/components/ui/select"
import { Separator as SeparatorComponent4 } from "@/components/ui/separator"
import { Sheet as SheetComponent3 } from "@/components/ui/sheet"
import { Slider as SliderComponent4 } from "@/components/ui/slider"
import { Switch as SwitchComponent4 } from "@/components/ui/switch"
import { Table as TableComponent3 } from "@/components/ui/table"
import { Tabs as TabsComponent3 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent3 } from "@/components/ui/textarea"
import { Toast as ToastComponent3 } from "@/components/ui/toast"
import { Toggle as ToggleComponent3 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent3 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent3 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent3 } from "@/components/ui/input"
import { Card as CardComponent3 } from "@/components/ui/card"
import { Accordion as AccordionComponent3 } from "@/components/ui/accordion"
import { Alert as AlertComponent3 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent4 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent4 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent4 } from "@/components/ui/combobox"
import { Command as CommandComponent4 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent4 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent4 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent4 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent4 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent4 } from "@/components/ui/hover-card"
import { Input as InputComponent5 } from "@/components/ui/input"
import { Label as LabelComponent5 } from "@/components/ui/label"
import { Menubar as MenubarComponent4 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent4 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent4 } from "@/components/ui/pagination"
import { Popover as PopoverComponent4 } from "@/components/ui/popover"
import { Progress as ProgressComponent4 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent4 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent4 } from "@/components/ui/scroll-area"
import { Select as SelectComponent4 } from "@/components/ui/select"
import { Separator as SeparatorComponent5 } from "@/components/ui/separator"
import { Sheet as SheetComponent4 } from "@/components/ui/sheet"
import { Slider as SliderComponent5 } from "@/components/ui/slider"
import { Switch as SwitchComponent5 } from "@/components/ui/switch"
import { Table as TableComponent4 } from "@/components/ui/table"
import { Tabs as TabsComponent4 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent4 } from "@/components/ui/textarea"
import { Toast as ToastComponent4 } from "@/components/ui/toast"
import { Toggle as ToggleComponent4 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent4 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent4 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent4 } from "@/components/ui/input"
import { Card as CardComponent4 } from "@/components/ui/card"
import { Accordion as AccordionComponent4 } from "@/components/ui/accordion"
import { Alert as AlertComponent4 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent5 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent5 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent5 } from "@/components/ui/combobox"
import { Command as CommandComponent5 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent5 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent5 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent5 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent5 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent5 } from "@/components/ui/hover-card"
import { Input as InputComponent6 } from "@/components/ui/input"
import { Label as LabelComponent6 } from "@/components/ui/label"
import { Menubar as MenubarComponent5 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent5 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent5 } from "@/components/ui/pagination"
import { Popover as PopoverComponent5 } from "@/components/ui/popover"
import { Progress as ProgressComponent5 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent5 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent5 } from "@/components/ui/scroll-area"
import { Select as SelectComponent5 } from "@/components/ui/select"
import { Separator as SeparatorComponent6 } from "@/components/ui/separator"
import { Sheet as SheetComponent5 } from "@/components/ui/sheet"
import { Slider as SliderComponent6 } from "@/components/ui/slider"
import { Switch as SwitchComponent6 } from "@/components/ui/switch"
import { Table as TableComponent5 } from "@/components/ui/table"
import { Tabs as TabsComponent5 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent5 } from "@/components/ui/textarea"
import { Toast as ToastComponent5 } from "@/components/ui/toast"
import { Toggle as ToggleComponent5 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent5 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent5 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent5 } from "@/components/ui/input"
import { Card as CardComponent5 } from "@/components/ui/card"
import { Accordion as AccordionComponent5 } from "@/components/ui/accordion"
import { Alert as AlertComponent5 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent6 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent6 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent6 } from "@/components/ui/combobox"
import { Command as CommandComponent6 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent6 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent6 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent6 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent6 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent6 } from "@/components/ui/hover-card"
import { Input as InputComponent7 } from "@/components/ui/input"
import { Label as LabelComponent7 } from "@/components/ui/label"
import { Menubar as MenubarComponent6 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent6 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent6 } from "@/components/ui/pagination"
import { Popover as PopoverComponent6 } from "@/components/ui/popover"
import { Progress as ProgressComponent6 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent6 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent6 } from "@/components/ui/scroll-area"
import { Select as SelectComponent6 } from "@/components/ui/select"
import { Separator as SeparatorComponent7 } from "@/components/ui/separator"
import { Sheet as SheetComponent6 } from "@/components/ui/sheet"
import { Slider as SliderComponent7 } from "@/components/ui/slider"
import { Switch as SwitchComponent7 } from "@/components/ui/switch"
import { Table as TableComponent6 } from "@/components/ui/table"
import { Tabs as TabsComponent6 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent6 } from "@/components/ui/textarea"
import { Toast as ToastComponent6 } from "@/components/ui/toast"
import { Toggle as ToggleComponent6 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent6 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent6 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent6 } from "@/components/ui/input"
import { Card as CardComponent6 } from "@/components/ui/card"
import { Accordion as AccordionComponent6 } from "@/components/ui/accordion"
import { Alert as AlertComponent6 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent7 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent7 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent7 } from "@/components/ui/combobox"
import { Command as CommandComponent7 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent7 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent7 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent7 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent7 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent7 } from "@/components/ui/hover-card"
import { Input as InputComponent8 } from "@/components/ui/input"
import { Label as LabelComponent8 } from "@/components/ui/label"
import { Menubar as MenubarComponent7 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent7 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent7 } from "@/components/ui/pagination"
import { Popover as PopoverComponent7 } from "@/components/ui/popover"
import { Progress as ProgressComponent7 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent7 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent7 } from "@/components/ui/scroll-area"
import { Select as SelectComponent7 } from "@/components/ui/select"
import { Separator as SeparatorComponent8 } from "@/components/ui/separator"
import { Sheet as SheetComponent7 } from "@/components/ui/sheet"
import { Slider as SliderComponent8 } from "@/components/ui/slider"
import { Switch as SwitchComponent8 } from "@/components/ui/switch"
import { Table as TableComponent7 } from "@/components/ui/table"
import { Tabs as TabsComponent7 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent7 } from "@/components/ui/textarea"
import { Toast as ToastComponent7 } from "@/components/ui/toast"
import { Toggle as ToggleComponent7 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent7 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent7 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent7 } from "@/components/ui/input"
import { Card as CardComponent7 } from "@/components/ui/card"
import { Accordion as AccordionComponent7 } from "@/components/ui/accordion"
import { Alert as AlertComponent7 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent8 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent8 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent8 } from "@/components/ui/combobox"
import { Command as CommandComponent8 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent8 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent8 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent8 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent8 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent8 } from "@/components/ui/hover-card"
import { Input as InputComponent9 } from "@/components/ui/input"
import { Label as LabelComponent9 } from "@/components/ui/label"
import { Menubar as MenubarComponent8 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent8 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent8 } from "@/components/ui/pagination"
import { Popover as PopoverComponent8 } from "@/components/ui/popover"
import { Progress as ProgressComponent8 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent8 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent8 } from "@/components/ui/scroll-area"
import { Select as SelectComponent8 } from "@/components/ui/select"
import { Separator as SeparatorComponent9 } from "@/components/ui/separator"
import { Sheet as SheetComponent8 } from "@/components/ui/sheet"
import { Slider as SliderComponent9 } from "@/components/ui/slider"
import { Switch as SwitchComponent9 } from "@/components/ui/switch"
import { Table as TableComponent8 } from "@/components/ui/table"
import { Tabs as TabsComponent8 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent8 } from "@/components/ui/textarea"
import { Toast as ToastComponent8 } from "@/components/ui/toast"
import { Toggle as ToggleComponent8 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent8 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent8 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent8 } from "@/components/ui/input"
import { Card as CardComponent8 } from "@/components/ui/card"
import { Accordion as AccordionComponent8 } from "@/components/ui/accordion"
import { Alert as AlertComponent8 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent9 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent9 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent9 } from "@/components/ui/combobox"
import { Command as CommandComponent9 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent9 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent9 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent9 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent9 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent9 } from "@/components/ui/hover-card"
import { Input as InputComponent10 } from "@/components/ui/input"
import { Label as LabelComponent10 } from "@/components/ui/label"
import { Menubar as MenubarComponent9 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent9 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent9 } from "@/components/ui/pagination"
import { Popover as PopoverComponent9 } from "@/components/ui/popover"
import { Progress as ProgressComponent9 } from "@/components/ui/progress"
import { RadioGroup as RadioGroupComponent9 } from "@/components/ui/radio-group"
import { ScrollArea as ScrollAreaComponent9 } from "@/components/ui/scroll-area"
import { Select as SelectComponent9 } from "@/components/ui/select"
import { Separator as SeparatorComponent10 } from "@/components/ui/separator"
import { Sheet as SheetComponent9 } from "@/components/ui/sheet"
import { Slider as SliderComponent10 } from "@/components/ui/slider"
import { Switch as SwitchComponent10 } from "@/components/ui/switch"
import { Table as TableComponent9 } from "@/components/ui/table"
import { Tabs as TabsComponent9 } from "@/components/ui/tabs"
import { Textarea as TextareaComponent9 } from "@/components/ui/textarea"
import { Toast as ToastComponent9 } from "@/components/ui/toast"
import { Toggle as ToggleComponent9 } from "@/components/ui/toggle"
import { Tooltip as TooltipComponent9 } from "@/components/ui/tooltip"
import { AspectRatio as AspectRatioComponent9 } from "@/components/ui/aspect-ratio"
import { InputWithButton as InputWithButtonComponent9 } from "@/components/ui/input"
import { Card as CardComponent9 } from "@/components/ui/card"
import { Accordion as AccordionComponent9 } from "@/components/ui/accordion"
import { Alert as AlertComponent9 } from "@/components/ui/alert"
import { AlertDialog as AlertDialogComponent10 } from "@/components/ui/alert-dialog"
import { Calendar as CalendarComponent10 } from "@/components/ui/calendar"
import { Combobox as ComboboxComponent10 } from "@/components/ui/combobox"
import { Command as CommandComponent10 } from "@/components/ui/command"
import { ContextMenu as ContextMenuComponent10 } from "@/components/ui/context-menu"
import { Dialog as DialogComponent10 } from "@/components/ui/dialog"
import { DropdownMenu as DropdownMenuComponent10 } from "@/components/ui/dropdown-menu"
import { Form as FormComponent10 } from "@/components/ui/form"
import { HoverCard as HoverCardComponent10 } from "@/components/ui/hover-card"
import { Input as InputComponent11 } from "@/components/ui/input"
import { Label as LabelComponent11 } from "@/components/ui/label"
import { Menubar as MenubarComponent10 } from "@/components/ui/menubar"
import { NavigationMenu as NavigationMenuComponent10 } from "@/components/ui/navigation-menu"
import { Pagination as PaginationComponent10 } from "@/components/ui/pagination"
import { Popover as PopoverComponent10 } from "@/components/ui/popover"
import
