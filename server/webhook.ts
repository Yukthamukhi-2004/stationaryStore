/**
 * Clerk Webhook Handler - Sync Users to Supabase
 *
 * Deploy this as a serverless function (Vercel, Netlify, Cloudflare Workers, etc.)
 * or run the Express server from server/index.ts.
 *
 * Endpoint: POST /api/webhooks/clerk
 *
 * Clerk sends webhook events when users are created/updated/deleted.
 * This handler syncs those changes to the Supabase profiles table.
 *
 * To set up in Clerk Dashboard:
 * 1. Go to Clerk Dashboard > Webhooks
 * 2. Add Endpoint: https://your-domain.com/api/webhooks/clerk
 * 3. Select events: user.created, user.updated, user.deleted
 * 4. Copy the signing secret into CLERK_WEBHOOK_SECRET env var
 */

import { createClient } from "@supabase/supabase-js";

interface ClerkUserPayload {
  data: {
    id: string;
    email_addresses: { email_address: string; id: string }[];
    first_name: string | null;
    last_name: string | null;
    image_url: string | null;
    created_at: number;
    updated_at: number;
  };
  type: "user.created" | "user.updated" | "user.deleted";
}

export async function handleClerkWebhook(
  payload: ClerkUserPayload,
  supabaseUrl: string,
  supabaseServiceKey: string
) {
  // Use service role key for admin database operations
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { type, data } = payload;
  const clerkId = data.id;

  switch (type) {
    case "user.created":
    case "user.updated": {
      const email =
        data.email_addresses?.[0]?.email_address ?? null;

      const { error } = await supabase.from("profiles").upsert(
        {
          clerk_id: clerkId,
          email,
          first_name: data.first_name,
          last_name: data.last_name,
          avatar_url: data.image_url,
        },
        { onConflict: "clerk_id" }
      );

      if (error) {
        console.error("Error syncing user to Supabase:", error);
        return { success: false, error: error.message };
      }

      console.log(`User ${clerkId} synced to Supabase (${type})`);
      return { success: true };
    }

    case "user.deleted": {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("clerk_id", clerkId);

      if (error) {
        console.error("Error deleting user from Supabase:", error);
        return { success: false, error: error.message };
      }

      console.log(`User ${clerkId} removed from Supabase`);
      return { success: true };
    }

    default:
      return { success: false, error: `Unknown event type: ${type}` };
  }
}
