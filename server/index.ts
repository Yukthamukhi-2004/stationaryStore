/**
 * Local Express server for handling Clerk webhooks during development.
 *
 * Run:
 *   cd server && npm install && npm run dev
 *
 * To expose to Clerk's webhook system:
 *   1. Start the server: npm run dev (runs on port 3001)
 *   2. Use ngrok: ngrok http 3001
 *   3. Add the ngrok URL (https://xxx.ngrok.io/api/webhooks/clerk) to
 *      Clerk Dashboard > Webhooks > Add Endpoint
 *   4. Select events: user.created, user.updated, user.deleted
 *   5. Copy the signing secret into CLERK_WEBHOOK_SECRET
 */

import express from "express";
import { Webhook } from "svix";
import { createClient } from "@supabase/supabase-js";

const app = express();
const PORT = 3001;

// Clerk webhook verifier (Svix-based)
function verifyClerkWebhook(
  payload: string,
  headers: Record<string, string>,
  secret: string
) {
  const wh = new Webhook(secret);
  return wh.verify(payload, headers);
}

// Middleware: raw body needed for webhook signature verification
app.use(
  express.json({
    verify: (req, _res, buf) => {
      (req as any).rawBody = buf.toString();
    },
  })
);

app.post("/api/webhooks/clerk", async (req, res) => {
  try {
    const secret = process.env.CLERK_WEBHOOK_SECRET;

    if (!secret) {
      throw new Error("Missing CLERK_WEBHOOK_SECRET env var");
    }

    // Verify the webhook signature
    const svixHeaders = {
      "svix-id": req.headers["svix-id"] as string,
      "svix-timestamp": req.headers["svix-timestamp"] as string,
      "svix-signature": req.headers["svix-signature"] as string,
    };

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new Error("Missing raw body");
    }

    let payload: any;
    try {
      payload = verifyClerkWebhook(rawBody, svixHeaders, secret);
    } catch {
      return res.status(401).json({
        success: false,
        error: "Invalid webhook signature",
      });
    }

    const { type, data } = payload;
    const clerkId = data.id;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error(
        "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
      );
    }

    // Use service role key for admin database operations (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (type) {
      case "user.created":
      case "user.updated": {
        const email = data.email_addresses?.[0]?.email_address ?? null;

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
          return res.status(500).json({ success: false, error: error.message });
        }

        console.log(`User ${clerkId} synced to Supabase (${type})`);
        return res.json({ success: true });
      }

      case "user.deleted": {
        const { error } = await supabase
          .from("profiles")
          .delete()
          .eq("clerk_id", clerkId);

        if (error) {
          console.error("Error deleting user from Supabase:", error);
          return res.status(500).json({ success: false, error: error.message });
        }

        console.log(`User ${clerkId} removed from Supabase`);
        return res.json({ success: true });
      }

      default:
        return res.status(400).json({
          success: false,
          error: `Unknown event type: ${type}`,
        });
    }
  } catch (error) {
    console.error("Webhook handler error:", error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : "Internal server error",
    });
  }
});

app.listen(PORT, () => {
  console.log(`Webhook server running on http://localhost:${PORT}`);
  console.log(`POST /api/webhooks/clerk`);
});
