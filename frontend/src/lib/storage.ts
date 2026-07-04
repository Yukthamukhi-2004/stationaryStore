import supabase from "./supabase";

const BUCKET_NAME = "product-images";

/**
 * Get the public URL for a file stored in the product-images bucket.
 */
export function getProductImageUrl(filename: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filename);
  return data.publicUrl;
}

/**
 * Upload an image file to Supabase Storage and return the public URL.
 * The file is stored as `products/{productId}/{timestamp}-{safeName}`.
 *
 * Note: This uses the anon key. For uploads to work, the bucket needs
 * an RLS policy allowing INSERT on storage.objects for the anon role,
 * OR use the service_role key on the backend.
 */
export async function uploadProductImage(
  file: File,
  productId?: number,
): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const safeName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = productId
    ? `products/${productId}/${safeName}`
    : `products/temp/${safeName}`;

  const { error } = await supabase.storage.from(BUCKET_NAME).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  return getProductImageUrl(path);
}

/**
 * Delete an image from Supabase Storage by its full public URL.
 * Returns true if deleted, false otherwise.
 */
export async function deleteProductImage(imageUrl: string): Promise<boolean> {
  const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl("");
  const bucketPrefix = urlData.publicUrl.replace(/\/$/, "");

  if (!imageUrl.startsWith(bucketPrefix)) return false;

  const path = imageUrl.replace(bucketPrefix + "/", "");
  if (!path) return false;

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);
  return !error;
}
