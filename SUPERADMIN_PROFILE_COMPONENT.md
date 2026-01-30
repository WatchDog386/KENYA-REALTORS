# SuperAdmin Profile Component

## Overview

A comprehensive profile management component for Super Administrators that allows them to view, edit, and manage their profile information with image upload capabilities.

## Features

### 1. **Profile Display**
   - View full profile information including:
     - First and last name
     - Email address
     - Phone number
     - Location
     - Department
     - Bio
     - Account status (Active/Inactive)
     - Role (Super Admin)
     - Member since date
     - Last updated date

### 2. **Profile Editing**
   - Edit the following fields:
     - First name
     - Last name
     - Phone number
     - Location
     - Department
     - Bio
   - Save changes with validation
   - Cancel editing and revert changes
   - Real-time form state management

### 3. **Profile Image Management**
   - Upload custom profile avatar image
   - Supported formats: JPG, PNG, GIF, WebP, etc.
   - Maximum file size: 5MB
   - Automatic image storage in Supabase
   - Display fallback avatar using UI Avatars API
   - Image validation and error handling

### 4. **Security Features**
   - Email field is read-only (cannot be edited)
   - Super Admin role verification
   - Account security status display
   - Verification status indicator

### 5. **User Experience**
   - Loading state with spinner
   - Toast notifications for success/error messages
   - Smooth animations using Framer Motion
   - Responsive design (mobile-friendly)
   - Hover effects and visual feedback

## Component Structure

### File Location
```
src/components/portal/super-admin/SuperAdminProfile.tsx
```

### Integration into Dashboard
The component is accessible from the SuperAdmin Dashboard:

1. **Via Shortcuts Menu**: Click "My Profile" in the Shortcuts section
2. **Modal Display**: Opens in an overlay modal on the dashboard
3. **Close Button**: Click the X button to close the profile modal

## Data Model

### ProfileData Interface
```typescript
interface ProfileData {
  id: string;                    // User ID
  email: string;                 // Email address (read-only)
  first_name: string;            // First name
  last_name: string;             // Last name
  phone?: string;                // Phone number
  avatar_url?: string;           // Profile image URL
  bio?: string;                  // User biography
  department?: string;           // Department name
  location?: string;             // Location/City
  role: string;                  // User role
  status: string;                // Account status
  created_at: string;            // Account creation date
  updated_at: string;            // Last update date
}
```

## API Integration

### Database Operations

#### Fetch Profile Data
```typescript
// Retrieves the current super admin's profile from the 'profiles' table
const { data, error } = await supabase
  .from("profiles")
  .select("*")
  .eq("id", user.id)
  .single();
```

#### Update Profile Information
```typescript
// Updates profile fields in the 'profiles' table
const { error } = await supabase
  .from("profiles")
  .update({
    first_name: editFormData.first_name,
    last_name: editFormData.last_name,
    phone: editFormData.phone,
    bio: editFormData.bio,
    department: editFormData.department,
    location: editFormData.location,
    updated_at: new Date().toISOString(),
  })
  .eq("id", user.id);
```

### File Storage Operations

#### Upload Profile Image
```typescript
// Uploads image to 'avatars' bucket in Supabase Storage
const { error: uploadError } = await supabase.storage
  .from("avatars")
  .upload(filePath, file, { upsert: true });

// Gets the public URL for the uploaded image
const { data } = supabase.storage
  .from("avatars")
  .getPublicUrl(filePath);
```

#### Delete Old Avatar
```typescript
// Cleans up old avatar when new one is uploaded
await supabase.storage
  .from("avatars")
  .remove([`profile-images/${oldFileName}`]);
```

## Database Tables Required

### Profiles Table
The component expects the following columns in the `profiles` table:

```sql
- id (uuid, primary key)
- email (text)
- first_name (text)
- last_name (text)
- phone (text, nullable)
- avatar_url (text, nullable)
- bio (text, nullable)
- department (text, nullable)
- location (text, nullable)
- role (text)
- status (text)
- created_at (timestamp)
- updated_at (timestamp)
```

## Storage Buckets Required

### Avatars Bucket
Create a public bucket in Supabase Storage:
- **Bucket Name**: `avatars`
- **Access**: Public
- **Folder Structure**: `profile-images/{userId}-{timestamp}.ext`

## Usage in SuperAdminDashboard

### 1. Import the Component
```typescript
import SuperAdminProfile from "@/components/portal/super-admin/SuperAdminProfile";
```

### 2. Add State for Profile Modal
```typescript
const [showProfile, setShowProfile] = useState(false);
```

### 3. Add to Shortcuts (in dashboard shortcuts array)
```typescript
{
  title: "My Profile",
  icon: <Shield className="w-4 h-4" />,
  action: () => setShowProfile(true)
}
```

### 4. Render Modal
```typescript
{showProfile && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
    <div className="w-full m-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-4xl mx-auto relative">
        <button onClick={() => setShowProfile(false)}>
          <X className="w-5 h-5" />
        </button>
        <SuperAdminProfile />
      </div>
    </div>
  </div>
)}
```

## Validation & Error Handling

### Image Upload Validation
- File type check: Only image files accepted
- File size check: Maximum 5MB
- Storage error handling with user feedback

### Form Validation
- Required fields validation on save
- Email field disabled (read-only)
- Trim whitespace from input values

### Error Messages
- Failed to load profile data
- Failed to upload image
- Image size exceeds limit
- Invalid file type
- Failed to save profile changes

## Styling

### Design System
- Primary color: `#00356B` (Dark Blue)
- Secondary colors: Blue, Green, Gray palette
- Tailwind CSS for all styling
- Responsive grid layouts
- Smooth transitions and animations

### Components Used
- Custom UI components from `@/components/ui/`
- Lucide React icons
- Framer Motion for animations
- Sonner for toast notifications

## Performance Considerations

1. **Data Fetching**: Uses useEffect with dependency on user.id
2. **Image Optimization**: Client-side validation before upload
3. **State Management**: Efficient form state updates
4. **Re-renders**: Minimized with proper state management

## Security Considerations

1. **Authentication**: Requires active user session
2. **Authorization**: Only super admin can access
3. **File Upload**: 
   - Server-side validation in Supabase
   - File size limits enforced
   - File type validation
4. **Email Field**: Read-only to prevent changes
5. **Data Privacy**: Only user's own profile accessible

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "framer-motion": "^10.x",
  "lucide-react": "^0.x",
  "@supabase/supabase-js": "^2.x",
  "sonner": "^1.x",
  "tailwindcss": "^3.x"
}
```

## Future Enhancements

1. **Two-Factor Authentication**: Add 2FA setup option
2. **Password Change**: Dedicated password change functionality
3. **Account Activity**: Show login history and activity logs
4. **Notification Preferences**: Customize notification settings
5. **API Keys**: Manage API keys for integrations
6. **Export Data**: Export profile data as PDF/CSV
7. **Darkmode Support**: Full dark mode support
8. **Internationalization**: Multi-language support

## Troubleshooting

### Profile data not loading
- Check if user is authenticated
- Verify `profiles` table exists and has correct structure
- Check browser console for API errors

### Image upload failing
- Verify `avatars` bucket exists in Supabase Storage
- Check file size (max 5MB)
- Verify file is a valid image format
- Check bucket permissions (should be public)

### Changes not saving
- Verify user has write permissions on `profiles` table
- Check network connection
- Verify table structure matches ProfileData interface

## Testing Checklist

- [ ] Profile data displays correctly
- [ ] Profile modal opens from shortcuts
- [ ] Profile modal closes properly
- [ ] Edit mode activates when clicking Edit Profile button
- [ ] Form fields update on input change
- [ ] Profile saves without image upload
- [ ] Profile image uploads successfully
- [ ] Image displays after upload
- [ ] Old image is deleted when new one uploaded
- [ ] Cancel button reverts form changes
- [ ] Toast notifications appear on success/error
- [ ] Loading states display correctly
- [ ] Email field is read-only
- [ ] Responsive design works on mobile
- [ ] Account dates format correctly

## Support

For issues or questions about this component, refer to:
- Supabase Documentation: https://supabase.com/docs
- React Documentation: https://react.dev
- Tailwind CSS: https://tailwindcss.com
