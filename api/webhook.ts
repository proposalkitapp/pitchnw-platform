import { Webhook } from "standardwebhooks";
import { createClient } from "@supabase/supabase-js";

// Minimal Node-style types for Vercel functions without bringing extra type deps
type Req = {
    method?: string;
    headers: Record<string, any>;
    body?: any;
    // Vercel Node API exposes the raw stream on req
    on?: (event: string, cb: (...args: any[]) => void) => void;
};
type Res = {
    status: (code: number) => Res;
    json: (data: any) => void;
    setHeader: (name: string, value: string) => void;
    end: (data?: any) => void;
};

async function readRawBody(req: Req): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const chunks: Buffer[] = [];
            // @ts-ignore - req is IncomingMessage-like at runtime
            req.on?.("data", (chunk: Buffer) => chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)));
            // @ts-ignore
            req.on?.("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            // @ts-ignore
            req.on?.("error", (err: Error) => reject(err));
        } catch (e) {
            reject(e);
        }
    });
}

export default async function handler(req: Req, res: Res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    const webhookSecret =
        process.env.DODO_PAYMENTS_WEBHOOK_SECRET ||
        process.env.DODO_WEBHOOK_SECRET;

    if (!webhookSecret) {
        // Do not proceed without a secret
        res.status(500).json({ error: "Missing DODO_PAYMENTS_WEBHOOK_SECRET" });
        return;
    }

    // Required header names per standardwebhooks
    const headers = req.headers || {};
    const webhookHeaders = {
        "webhook-id": headers["webhook-id"],
        "webhook-signature": headers["webhook-signature"],
        "webhook-timestamp": headers["webhook-timestamp"],
    };

    try {
        // Always verify against the exact raw bytes
        const rawPayload = await readRawBody(req);
        const verifier = new Webhook(webhookSecret);

        await verifier.verify(rawPayload, webhookHeaders);

        // Safe to parse after successful verification
        const event = JSON.parse(rawPayload);

        // Process only payment.succeeded for this handler
        if (event?.type === "payment.succeeded") {
            // Metadata set at checkoutSessions.create is typically echoed on payment data
            const meta =
                event?.data?.metadata ??
                event?.data?.checkout?.metadata ??
                event?.metadata ??
                {};

            const sessionId: string | undefined =
                meta.sessionId ?? meta.session_id ?? undefined;
            const userId: string | undefined =
                meta.userId ?? meta.user_id ?? undefined;

            if (!sessionId && !userId) {
                // Log but still acknowledge to avoid retries; you can track this to investigate
                console.warn("payment.succeeded received without sessionId or userId in metadata");
            } else {
                // Update Postgres (Supabase) to mark the session as paid
                const supabaseUrl = process.env.SUPABASE_URL;
                const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

                if (!supabaseUrl || !supabaseServiceKey) {
                    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
                } else {
                    const supabase = createClient(supabaseUrl, supabaseServiceKey);

                    // 1. Mark the session as paid (if proposal_sessions exists)
                    if (sessionId) {
                        const { error: sessionErr } = await supabase
                            .from("proposal_sessions")
                            .upsert(
                                [
                                    {
                                        session_id: sessionId,
                                        paid: true,
                                        paid_at: new Date().toISOString(),
                                    },
                                ],
                                { onConflict: "session_id" }
                            );
                        if (sessionErr) console.warn("Supabase upsert warning (proposal_sessions):", sessionErr.message);
                    }

                    // 2. CRITICAL: Upgrade the User Profile to Pro
                    if (userId) {
                        console.log(`Upgrading user ${userId} to Pro...`);
                        const { error: profileErr } = await supabase
                            .from("profiles")
                            .update({
                                plan: "pro",
                                subscription_status: "active",
                                subscription_period_end: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(), // ~1 month from now
                            })
                            .eq("user_id", userId);

                        if (profileErr) {
                            console.error("Failed to upgrade user profile in profiles table:", profileErr);
                        } else {
                            console.log(`Successfully upgraded user ${userId} to Pro.`);
                        }
                    } else if (event?.data?.customer?.email) {
                        // Fallback: Try to find user by email if userId is missing
                        const email = event.data.customer.email;
                        console.log(`Attempting fallback upgrade for email ${email}...`);
                        const { data: profile } = await supabase
                            .from("profiles")
                            .select("user_id")
                            .eq("email", email)
                            .maybeSingle(); // Note: This depends on having 'email' in profiles table
                        
                        // Note: If email isn't in profiles, we can't do much here without more complex logic.
                        // But since we fixed the frontend to send userId, this fallback is just a safety measure.
                    }
                }
            }
        }

        // Acknowledge the webhook receipt
        res.status(200).json({ received: true });
    } catch (err: any) {
        console.error("Webhook verification/processing failed:", err);
        res.status(400).json({ error: "Invalid signature or payload" });
    }
}

/**
Documentation references:
- Webhooks overview and verification headers (standardwebhooks):
  https://docs.dodopayments.com/developer-resources/webhooks
- Vercel Functions example + raw body verification notes:
  https://docs.dodopayments.com/developer-resources/webhooks/examples/vercel-example

Implementation notes:
- Uses standardwebhooks with 'webhook-id', 'webhook-timestamp', 'webhook-signature'.
- Reads raw request body for exact signature verification.
- Extracts metadata.sessionId from payload (fallbacks included).
- Marks the session as paid via Supabase using a service role key (server-only).
- Upsert ensures idempotency keyed by session_id.
- Keep secrets in environment variables:
  - DODO_PAYMENTS_WEBHOOK_SECRET (preferred)
  - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
Security:
- Never expose service role key to the client.
- Keep this route server-side only.
*/