import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import {
  Loader2,
  Check,
  X,
  AlertCircle,
  Info,
  ChevronDown,
  User,
  Settings,
  LogOut,
  Terminal,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

export default function DesignSystemDemo() {
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [switchValue, setSwitchValue] = useState(false);
  const [radioValue, setRadioValue] = useState("option1");
  const [selectValue, setSelectValue] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLoadingDemo = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Action completed!");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Design System Demo
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Comprehensive showcase of all UI components with light/dark theme
            support
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <Badge variant="success">✓ Theme Support</Badge>
            <Badge variant="default">✓ Accessibility</Badge>
            <Badge variant="secondary">✓ Responsive</Badge>
          </div>
        </div>

        {/* Quick Navigation */}
        <Card>
          <CardHeader>
            <CardTitle>Component Showcase</CardTitle>
            <CardDescription>
              Jump to any component section below to explore the design system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
              <a
                href="#theme-system"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Theme System
              </a>
              <a
                href="#buttons"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Buttons
              </a>
              <a
                href="#forms"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Form Components
              </a>
              <a
                href="#select"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Select Dropdown
              </a>
              <a
                href="#badges"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Badges
              </a>
              <a
                href="#cards"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Cards
              </a>
              <a
                href="#alerts"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Alerts
              </a>
              <a
                href="#dialog"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Dialog/Modal
              </a>
              <a
                href="#separator"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Separator
              </a>
              <a
                href="#dropdown"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Dropdown Menu
              </a>
              <a
                href="#toasts"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Toast Notifications
              </a>
              <a
                href="#typography"
                className="text-primary-600 dark:text-primary-400 hover:underline"
              >
                → Typography
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Theme Demonstration */}
        <section
          id="theme-system"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Theme System
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Toggle the theme using the button in the top navigation. All
              components automatically adapt to the selected theme.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
              <h3 className="font-medium text-primary-900 dark:text-primary-100">
                Primary Colors
              </h3>
              <div className="mt-2 space-y-2">
                <div className="h-8 bg-primary-500 rounded"></div>
                <div className="h-8 bg-primary-600 rounded"></div>
                <div className="h-8 bg-primary-700 rounded"></div>
              </div>
            </div>

            <div className="p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <h3 className="font-medium text-success-900 dark:text-success-100">
                Success Colors
              </h3>
              <div className="mt-2 space-y-2">
                <div className="h-8 bg-success-500 rounded"></div>
                <div className="h-8 bg-success-600 rounded"></div>
                <div className="h-8 bg-success-700 rounded"></div>
              </div>
            </div>

            <div className="p-4 bg-error-50 dark:bg-error-900/20 rounded-lg">
              <h3 className="font-medium text-error-900 dark:text-error-100">
                Error Colors
              </h3>
              <div className="mt-2 space-y-2">
                <div className="h-8 bg-error-500 rounded"></div>
                <div className="h-8 bg-error-600 rounded"></div>
                <div className="h-8 bg-error-700 rounded"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section
          id="buttons"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Buttons
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Multiple variants and states for different use cases
            </p>
          </div>

          {/* Button Variants */}
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button variant="default">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="destructive">Destructive Button</Button>
                <Button variant="link">Link Button</Button>
              </div>
            </div>

            {/* Button Sizes */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Sizes
              </h3>
              <div className="flex flex-wrap items-center gap-4">
                <Button size="sm">Small</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large</Button>
                <Button size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Button States */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                States
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button disabled>Disabled</Button>
                <Button onClick={handleLoadingDemo} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    "Click to Load"
                  )}
                </Button>
              </div>
            </div>

            {/* Button with Icons */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                With Icons
              </h3>
              <div className="flex flex-wrap gap-4">
                <Button>
                  <Check className="mr-2 h-4 w-4" />
                  Confirm
                </Button>
                <Button variant="destructive">
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
                <Button variant="outline">
                  <Info className="mr-2 h-4 w-4" />
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Components */}
        <section
          id="forms"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Form Components
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Accessible form inputs with proper focus and validation states
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Text Input */}
            <div className="space-y-2">
              <Label htmlFor="text-input">Text Input</Label>
              <Input id="text-input" placeholder="Enter some text..." />
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email-input">Email Input</Label>
              <Input
                id="email-input"
                type="email"
                placeholder="email@example.com"
              />
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <Label htmlFor="password-input">Password Input</Label>
              <Input
                id="password-input"
                type="password"
                placeholder="••••••••"
              />
            </div>

            {/* Disabled Input */}
            <div className="space-y-2">
              <Label htmlFor="disabled-input">Disabled Input</Label>
              <Input
                id="disabled-input"
                placeholder="This is disabled"
                disabled
              />
            </div>
          </div>

          {/* Textarea */}
          <div className="space-y-2">
            <Label htmlFor="textarea">Textarea</Label>
            <Textarea
              id="textarea"
              placeholder="Enter a longer message here..."
              rows={4}
            />
          </div>

          {/* Checkbox */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Checkboxes
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={checked}
                  onCheckedChange={(value) => setChecked(value as boolean)}
                />
                <Label
                  htmlFor="terms"
                  className="text-sm font-normal cursor-pointer"
                >
                  Accept terms and conditions
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="marketing" />
                <Label
                  htmlFor="marketing"
                  className="text-sm font-normal cursor-pointer"
                >
                  Receive marketing emails
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="disabled-check" disabled />
                <Label
                  htmlFor="disabled-check"
                  className="text-sm font-normal cursor-not-allowed opacity-70"
                >
                  Disabled checkbox
                </Label>
              </div>
            </div>
          </div>

          {/* Radio Group */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Radio Group
            </h3>
            <RadioGroup value={radioValue} onValueChange={setRadioValue}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="option1" />
                <Label htmlFor="option1" className="font-normal cursor-pointer">
                  Option 1
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="option2" />
                <Label htmlFor="option2" className="font-normal cursor-pointer">
                  Option 2
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option3" id="option3" />
                <Label htmlFor="option3" className="font-normal cursor-pointer">
                  Option 3
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Switch */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Switch Toggle
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifications"
                  checked={switchValue}
                  onCheckedChange={setSwitchValue}
                />
                <Label
                  htmlFor="notifications"
                  className="font-normal cursor-pointer"
                >
                  Enable notifications
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="marketing-switch" />
                <Label
                  htmlFor="marketing-switch"
                  className="font-normal cursor-pointer"
                >
                  Marketing communications
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="disabled-switch" disabled />
                <Label
                  htmlFor="disabled-switch"
                  className="font-normal cursor-not-allowed opacity-70"
                >
                  Disabled switch
                </Label>
              </div>
            </div>
          </div>
        </section>

        {/* Select Dropdown */}
        <section
          id="select"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Select Dropdown
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Accessible select menus with keyboard navigation
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="select-demo">Select an option</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger id="select-demo">
                  <SelectValue placeholder="Select a framework..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue</SelectItem>
                  <SelectItem value="angular">Angular</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="select-disabled">Disabled Select</Label>
              <Select disabled>
                <SelectTrigger id="select-disabled">
                  <SelectValue placeholder="Cannot select..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="option1">Option 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section
          id="badges"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Badges
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Status indicators and labels with various styles
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Variants
              </h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="destructive">Error</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Use Cases
              </h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Status:
                  </span>
                  <Badge variant="success">Active</Badge>
                  <Badge variant="warning">Pending</Badge>
                  <Badge variant="destructive">Inactive</Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Role:
                  </span>
                  <Badge variant="default">Admin</Badge>
                  <Badge variant="secondary">User</Badge>
                  <Badge variant="outline">Guest</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cards */}
        <section
          id="cards"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Cards
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Container components for grouping related content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Card</CardTitle>
                <CardDescription>
                  A simple card with header and content
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This is the card content area. You can place any content here.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Card with Footer</CardTitle>
                <CardDescription>Includes action buttons</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Card content goes here with additional information.
                </p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-success-500" />
                  Stats Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  1,234
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Total users this month
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Alerts */}
        <section
          id="alerts"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Alerts
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Contextual feedback messages for user actions
            </p>
          </div>

          <div className="space-y-4">
            <Alert variant="default">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Default Alert</AlertTitle>
              <AlertDescription>
                This is a default alert with informational content.
              </AlertDescription>
            </Alert>

            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertTitle>Info</AlertTitle>
              <AlertDescription>
                New updates are available. Check the changelog for details.
              </AlertDescription>
            </Alert>

            <Alert variant="success">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                Your changes have been saved successfully!
              </AlertDescription>
            </Alert>

            <Alert variant="warning">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Please review your changes before submitting.
              </AlertDescription>
            </Alert>

            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                An error occurred while processing your request.
              </AlertDescription>
            </Alert>
          </div>
        </section>

        {/* Dialog/Modal */}
        <section
          id="dialog"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Dialog / Modal
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Overlay windows for focused user interactions
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm Action</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to proceed with this action? This
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => {
                      setDialogOpen(false);
                      toast.success("Action confirmed!");
                    }}
                  >
                    Confirm
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Form Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>
                    Make changes to your profile here. Click save when you're
                    done.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button>Save changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>

        {/* Separator */}
        <section
          id="separator"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Separator
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Visual dividers for content sections
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Content above separator
              </p>
              <Separator className="my-4" />
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Content below separator
              </p>
            </div>

            <div className="flex h-20 items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">Left</p>
              </div>
              <Separator orientation="vertical" />
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Right
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dropdown Menu */}
        <section
          id="dropdown"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Dropdown Menu
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Accessible dropdown menus with keyboard navigation
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Open Menu
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </section>

        {/* Toast Notifications */}
        <section
          id="toasts"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Toast Notifications
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Non-intrusive notifications with automatic dismissal
            </p>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={() => toast.success("Operation completed successfully!")}
            >
              <Check className="mr-2 h-4 w-4" />
              Success Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.error("Something went wrong!")}
            >
              <X className="mr-2 h-4 w-4" />
              Error Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.warning("Please review your changes")}
            >
              <AlertCircle className="mr-2 h-4 w-4" />
              Warning Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.info("New updates are available")}
            >
              <Info className="mr-2 h-4 w-4" />
              Info Toast
            </Button>

            <Button
              variant="outline"
              onClick={() => toast.loading("Processing...", { duration: 2000 })}
            >
              <Loader2 className="mr-2 h-4 w-4" />
              Loading Toast
            </Button>

            <Button
              variant="outline"
              onClick={() =>
                toast("Custom toast", {
                  description: "This is a custom toast with description",
                  action: {
                    label: "Undo",
                    onClick: () => toast.success("Undo clicked!"),
                  },
                })
              }
            >
              Custom Toast
            </Button>
          </div>
        </section>

        {/* Typography */}
        <section
          id="typography"
          className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-8 space-y-6"
        >
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Typography
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Consistent text styles across the application
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Heading 1
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                text-4xl font-bold
              </p>
            </div>

            <div>
              <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">
                Heading 2
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                text-3xl font-semibold
              </p>
            </div>

            <div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Heading 3
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                text-2xl font-semibold
              </p>
            </div>

            <div>
              <p className="text-base text-gray-900 dark:text-gray-100">
                Body text - Lorem ipsum dolor sit amet, consectetur adipiscing
                elit. Sed do eiusmod tempor incididunt ut labore et dolore magna
                aliqua.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                text-base
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Small text - Lorem ipsum dolor sit amet, consectetur adipiscing
                elit.
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                text-sm
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Extra small text - Metadata and captions
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                text-xs
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
