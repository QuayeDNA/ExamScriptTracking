# Mobile UI Components Usage Guide

Quick reference for using the mobile UI components.

## Imports

```tsx
// All UI components from one place
import {
  Button,
  Card,
  Badge,
  Input,
  Alert,
  Separator,
  H1,
  H2,
  H3,
  P,
  Text,
  Modal,
  ModalFooter,
  Dialog,
} from "@/components/ui";

// Toast (separate package)
import Toast from "react-native-toast-message";

// Layout
import { AuthLayout } from "@/components/AuthLayout";
```

---

## Button

```tsx
<Button
  variant="default" // default | outline | secondary | destructive | ghost | link
  size="lg" // sm | default | lg
  onPress={handlePress}
  disabled={isLoading}
>
  {isLoading ? (
    <ActivityIndicator color="#ffffff" />
  ) : (
    <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "600" }}>
      Click Me
    </Text>
  )}
</Button>
```

---

## Card

```tsx
<Card elevation="md">
  {" "}
  {/* sm | default | md | lg | xl */}
  <View style={{ padding: 24 }}>
    <Text>Card content</Text>
  </View>
</Card>
```

---

## Input

```tsx
<Input
  label="Email Address"
  placeholder="your.email@example.com"
  value={email}
  onChangeText={setEmail}
  keyboardType="email-address"
  autoCapitalize="none"
  editable={!isLoading}
  error={validationError} // Optional error message
/>

<Input
  label="Password"
  placeholder="Enter password"
  value={password}
  onChangeText={setPassword}
  secureTextEntry
  editable={!isLoading}
/>
```

---

## Alert

```tsx
<Alert variant="destructive"> {/* default | info | success | warning | destructive */}
  {errorMessage}
</Alert>

<Alert variant="info">
  Please complete all required fields before submitting.
</Alert>

<Alert variant="success" title="Success!">
  Your changes have been saved.
</Alert>
```

---

## Typography

```tsx
// Heading components
<H1>Main Title</H1>
<H2>Section Title</H2>
<H3>Subsection Title</H3>

// Paragraph
<P>Regular paragraph text</P>

// Generic Text with variants
<Text variant="default">Regular text</Text>
<Text variant="muted">Muted secondary text</Text>
<Text variant="h1">H1 styled text</Text>

// Custom styling
<Text style={{ textAlign: 'center', marginTop: 16 }}>
  Centered text with margin
</Text>
```

---

## Badge

```tsx
<Badge variant="success"> {/* default | secondary | success | warning | error | info | outline */}
  Active
</Badge>

<Badge variant="warning">Pending</Badge>
<Badge variant="error">Failed</Badge>
<Badge variant="info">New</Badge>
```

---

## Toast Notifications

```tsx
// Success
Toast.show({
  type: "success",
  text1: "Success!",
  text2: "Your changes have been saved.",
});

// Error
Toast.show({
  type: "error",
  text1: "Error",
  text2: "Failed to save changes. Please try again.",
});

// Info
Toast.show({
  type: "info",
  text1: "Information",
  text2: "Please complete your profile.",
});

// Warning
Toast.show({
  type: "warning",
  text1: "Warning",
  text2: "Your session will expire soon.",
});
```

---

## Modal

```tsx
const [isOpen, setIsOpen] = useState(false);

<Modal
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  title="Modal Title"
  size="md" // sm | md | lg
  showCloseButton={true}
>
  <View>
    <Text>Modal content goes here</Text>
    <Input label="Name" value={name} onChangeText={setName} />
  </View>

  <ModalFooter>
    <Button
      variant="outline"
      onPress={() => setIsOpen(false)}
      style={{ flex: 1 }}
    >
      <Text>Cancel</Text>
    </Button>
    <Button variant="default" onPress={handleSave} style={{ flex: 1 }}>
      <Text style={{ color: "#ffffff" }}>Save</Text>
    </Button>
  </ModalFooter>
</Modal>;
```

---

## Dialog (Confirmation)

```tsx
const [showDialog, setShowDialog] = useState(false);

<Dialog
  visible={showDialog}
  onClose={() => setShowDialog(false)}
  title="Delete Item?"
  message="Are you sure you want to delete this item? This action cannot be undone."
  variant="error" // default | success | warning | error
  icon="trash" // Optional custom icon (Ionicons name)
  primaryAction={{
    label: "Delete",
    onPress: handleDelete,
  }}
  secondaryAction={{
    label: "Cancel",
    onPress: () => setShowDialog(false),
  }}
/>

// Info Dialog
<Dialog
  visible={showInfo}
  onClose={() => setShowInfo(false)}
  title="Information"
  message="Your data has been synced successfully."
  variant="success"
  primaryAction={{
    label: "OK",
    onPress: () => setShowInfo(false),
  }}
/>
```

---

## Separator

```tsx
// Horizontal (default)
<Separator />

// Vertical
<View style={{ flexDirection: 'row', height: 40 }}>
  <Text>Left</Text>
  <Separator orientation="vertical" />
  <Text>Right</Text>
</View>
```

---

## AuthLayout (For Auth Screens)

```tsx
<AuthLayout
  title="Exam Script Tracking"
  subtitle="Sign in to manage exam scripts and attendance"
>
  <Card elevation="md">
    <View style={styles.cardContent}>{/* Form content */}</View>
  </Card>
</AuthLayout>;

const styles = StyleSheet.create({
  cardContent: {
    padding: 24,
  },
});
```

---

## Complete Form Example

```tsx
import { useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { Button, Card, Input, Alert, Text } from "@/components/ui";
import { AuthLayout } from "@/components/AuthLayout";

export default function FormScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // API call here
      await submitForm({ email, password });

      Toast.show({
        type: "success",
        text1: "Success!",
        text2: "Form submitted successfully.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to submit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout title="Form Title" subtitle="Form subtitle">
      <Card elevation="md">
        <View style={styles.cardContent}>
          {error && (
            <View style={styles.alertContainer}>
              <Alert variant="destructive">{error}</Alert>
            </View>
          )}

          <View style={styles.inputContainer}>
            <Input
              label="Email Address"
              placeholder="your.email@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <Input
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!isLoading}
            />
          </View>

          <View style={styles.buttonContainer}>
            <Button
              variant="default"
              size="lg"
              onPress={handleSubmit}
              disabled={isLoading}
              style={styles.button}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </Button>
          </View>
        </View>
      </Card>
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  cardContent: {
    padding: 24,
  },
  alertContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    width: "100%",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

---

## Styling Best Practices

### 1. Always Use StyleSheet.create()

```tsx
// ✅ Good - Cached and performant
const styles = StyleSheet.create({
  container: { padding: 24 },
});

// ❌ Bad - Recreated on every render
<View style={{ padding: 24 }} />;
```

### 2. Use Theme Colors

```tsx
import { useThemeColors } from "@/constants/design-system";

const colors = useThemeColors();

<View style={{ backgroundColor: colors.background }} />;
```

### 3. Combine Styles

```tsx
<View style={[styles.container, { marginTop: 20 }, customStyle]} />
```

### 4. Platform-Specific Code

```tsx
import { Platform, StyleSheet } from "react-native";

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

---

## Common Patterns

### Loading State

```tsx
{
  isLoading ? (
    <ActivityIndicator size="large" color={colors.primary} />
  ) : (
    <Text>Content</Text>
  );
}
```

### Conditional Rendering

```tsx
{
  error && <Alert variant="destructive">{error}</Alert>;
}
```

### List Items

```tsx
<FlatList
  data={items}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => (
    <Card elevation="sm">
      <View style={{ padding: 16 }}>
        <Text>{item.name}</Text>
        <Badge variant="success">{item.status}</Badge>
      </View>
    </Card>
  )}
/>
```

---

## Tips

1. **Import from index**: Always import from `@/components/ui` for cleaner imports
2. **Use TypeScript**: All components have proper TypeScript types
3. **Theme-aware**: All components respond to light/dark mode automatically
4. **Consistent spacing**: Use multiples of 4 (4, 8, 12, 16, 20, 24, etc.)
5. **Toast for feedback**: Always show Toast on success/error for user feedback
6. **Dialogs for confirmations**: Use Dialog for destructive actions
7. **Modals for forms**: Use Modal for complex multi-field forms
8. **Loading states**: Always show ActivityIndicator when loading

---

**Ready to use!** All components are production-ready with proper styling, theming, and React Native best practices.
