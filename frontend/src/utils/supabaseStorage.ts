// src/utils/supabaseStorage.ts
import { supabase } from '@/integrations/supabase/client';

/**
 * Convert a storage path to a public URL
 * @param bucketName - The storage bucket name (e.g., 'maintenance-images')
 * @param path - The file path returned from upload (e.g., 'property-id/file.jpg')
 * @returns The public URL for the image
 */
export function getPublicImageUrl(bucketName: string, path: string): string {
  if (!path) return '';
  
  // Get the Supabase project URL
  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);
  return data?.publicUrl || '';
}

/**
 * Get public URL for maintenance request image
 */
export function getMaintenanceImageUrl(path: string): string {
  return getPublicImageUrl('maintenance-images', path);
}

/**
 * Get public URL for completion report images
 */
export function getCompletionReportImageUrl(path: string): string {
  return getPublicImageUrl('completion-reports', path);
}

/**
 * Upload image to storage and return public URL
 */
export async function uploadImage(
  bucketName: string,
  file: File,
  folderPath: string
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`;
  const fullPath = `${folderPath}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from(bucketName)
    .upload(fullPath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  
  return data?.path || '';
}

/**
 * Upload multiple images and return their paths
 */
export async function uploadMultipleImages(
  bucketName: string,
  files: { [key: string]: File },
  folderPath: string
): Promise<{ [key: string]: string }> {
  const results: { [key: string]: string } = {};
  
  for (const [key, file] of Object.entries(files)) {
    if (file) {
      results[key] = await uploadImage(bucketName, file, folderPath);
    }
  }
  
  return results;
}

/**
 * Delete image from storage
 */
export async function deleteImage(bucketName: string, path: string): Promise<void> {
  if (!path) return;
  
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([path]);

  if (error) throw error;
}
