import { supabase } from '@/integrations/supabase/client';

const BUCKET_NAME = 'property_images';

export const propertyImageService = {
  /**
   * Upload an image file to the property_images bucket
   * @param file The image file to upload
   * @param propertyId The ID of the property
   * @returns Promise with public URL of the uploaded image
   */
  async uploadPropertyImage(file: File, propertyId: string): Promise<string> {
    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileName = `${propertyId}/${timestamp}-${file.name}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('❌ Upload error:', uploadError);
        throw new Error(`Failed to upload image: ${uploadError.message}`);
      }

      // Get public URL
      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

      if (!data?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded image');
      }

      console.log('✅ Image uploaded successfully:', data.publicUrl);
      return data.publicUrl;
    } catch (error) {
      console.error('❌ Error in uploadPropertyImage:', error);
      throw error;
    }
  },

  /**
   * Delete an image from the property_images bucket
   * @param imageUrl The public URL of the image to delete
   */
  async deletePropertyImage(imageUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const urlParts = imageUrl.split('/');
      const bucketIndex = urlParts.indexOf(BUCKET_NAME);
      
      if (bucketIndex === -1) {
        throw new Error('Invalid image URL');
      }

      const filePath = urlParts.slice(bucketIndex + 1).join('/');

      const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        console.error('❌ Delete error:', error);
        throw error;
      }

      console.log('✅ Image deleted successfully');
    } catch (error) {
      console.error('❌ Error in deletePropertyImage:', error);
      throw error;
    }
  },

  /**
   * Validate if a file is a valid image
   * @param file The file to validate
   * @returns true if valid, false otherwise
   */
  isValidImageFile(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  },

  /**
   * Get validation error message for an invalid file
   * @param file The file to validate
   * @returns Error message or null if valid
   */
  getImageValidationError(file: File): string | null {
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      return 'Only JPEG, PNG, GIF, and WebP images are allowed';
    }

    if (file.size > maxSize) {
      return 'Image size must be less than 5MB';
    }

    return null;
  },
};
