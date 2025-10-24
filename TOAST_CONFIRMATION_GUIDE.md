# Toast Confirmation System Documentation

## Overview
We've implemented a modern toast-based confirmation system to replace the traditional `window.confirm()` dialogs throughout the StudyHub application. This provides a better user experience with styled confirmations that match the app's design.

## Components

### 1. ConfirmToast Component
- **Location**: `/src/components/common/ConfirmToast.tsx`
- **Purpose**: A reusable confirmation dialog component using Ionic's IonAlert
- **Features**: Custom header, message, and button text with styled appearance

### 2. useConfirmation Hook
- **Location**: `/src/hooks/useConfirmation.ts`
- **Purpose**: Manages confirmation dialog state and callbacks
- **Returns**: Methods to show confirmation, handle confirm/cancel actions

## Implementation

### Step 1: Import Dependencies
```tsx
import { useConfirmation } from "../../hooks/useConfirmation";
import { ConfirmToast } from "../../components/common/ConfirmToast";
```

### Step 2: Add Confirmation Hook
```tsx
const {
  isOpen: isConfirmOpen,
  options: confirmOptions,
  showConfirmation,
  handleConfirm: confirmAction,
  handleCancel: cancelAction,
  handleDismiss: dismissConfirm
} = useConfirmation();
```

### Step 3: Update Action Functions
**Before (window.confirm):**
```tsx
const handleDelete = async () => {
  const confirmed = window.confirm("Are you sure you want to delete this item?");
  if (!confirmed) return;
  
  await deleteItem();
};
```

**After (Toast Confirmation):**
```tsx
const handleDelete = async () => {
  showConfirmation({
    header: 'Delete Item',
    message: 'Are you sure you want to delete this item?\n\nThis action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel'
  }, async () => {
    await performDelete();
  });
};

const performDelete = async () => {
  try {
    await deleteItem();
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### Step 4: Add ConfirmToast Component
```tsx
return (
  <IonPage>
    {/* Your component content */}
    
    <ConfirmToast
      isOpen={isConfirmOpen}
      onDidDismiss={dismissConfirm}
      onConfirm={confirmAction}
      onCancel={cancelAction}
      message={confirmOptions.message}
      header={confirmOptions.header}
      confirmText={confirmOptions.confirmText}
      cancelText={confirmOptions.cancelText}
    />
  </IonPage>
);
```

## Updated Components

The following components have been updated to use the toast confirmation system:

### Client-Side Components:
1. **Dashboard.tsx** - Session ending confirmation
2. **Profile.tsx** - Sign out confirmation
3. **UserManagement.tsx** - Add credits and toggle admin confirmations

### Features of Toast Confirmations:
- **Better UX**: Styled dialogs that match the app design
- **Rich Content**: Support for multi-line messages with details
- **Customizable**: Custom headers, button text, and styling
- **Consistent**: Uniform appearance across all components
- **Mobile-Friendly**: Responsive design for all screen sizes

## Benefits

1. **Improved User Experience**: Modern, styled confirmations instead of browser dialogs
2. **Consistent Design**: Matches the app's visual design system
3. **Better Information**: Can display more detailed confirmation messages
4. **Mobile Optimization**: Better suited for mobile app interfaces
5. **Customizable**: Easy to customize appearance and behavior

## Styling

The confirmation toasts are styled with:
- Custom CSS in `ConfirmToast.css`
- Ionic design tokens for consistency
- Dark mode support
- Responsive design for mobile devices
- Smooth animations and transitions

## Usage Guidelines

1. Use for destructive actions (delete, sign out, end session)
2. Use for actions that cannot be undone
3. Use for actions with significant consequences
4. Provide clear, descriptive confirmation messages
5. Use appropriate button text (e.g., "Delete" vs "Confirm")

This system provides a much better user experience while maintaining all the safety benefits of confirmation dialogs.