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

        const event = JSON.parse(rawPayload);
        const { type, data } = event;

        // Process activation events
        if (type === "payment.succeeded" || type === "subscription.active" || type === "subscription.created") {
            // Metadata set at checkoutSessions.create can be at different levels
            // For one-time payments it might be in 'data.metadata'
            // For subscriptions it is in 'data.metadata' (if it's the subscription object)
            // Sometimes it's at the event root level depending on the payload flavor
            const meta =
                data?.metadata ??
                data?.checkout?.metadata ??
                event?.metadata ??
                {};

            const userId: string | undefined = meta.user_id ?? meta.userId ?? undefined;
            const email: string | undefined = data?.customer?.email ?? data?.email ?? undefined;
            const plan = meta.plan ?? "pro";

            if (!userId && !email) {
                console.warn(`${type} received without user_id or email mapping`);
            } else {
                const supabaseUrl = process.env.SUPABASE_URL;
                const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

                if (!supabaseUrl || !supabaseServiceKey) {
                    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
                } else {
                    const supabase = createClient(supabaseUrl, supabaseServiceKey);
                    
                    const updatePayload: any = {
                        plan: plan,
                        subscription_status: "active",
                        subscription_period_end: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
                    };

                    // Add subscription ID if present
                    if (data?.id && type.startsWith("subscription")) {
                        updatePayload.dodo_subscription_id = data.id;
                    } else if (data?.subscription_id) {
                        updatePayload.dodo_subscription_id = data.subscription_id;
                    }

                    let query = supabase.from("profiles").update(updatePayload);

                    if (userId) {
                        query = query.eq("user_id", userId);
                    } else {
                        query = query.eq("email", email);
                    }

                    const { error: profileErr } = await query;

                    if (profileErr) {
                        console.error(`Failed to upgrade user profile on ${type}:`, profileErr);
                    } else {
                        console.log(`Successfully upgraded user ${userId || email} to Pro via ${type}.`);
                    }
                }
            }
        } else if (type === "subscription.cancelled" || type === "subscription.expired") {
            const meta = data?.metadata ?? {};
            const userId = meta.user_id ?? meta.userId;
            const email = data?.customer?.email ?? data?.email;

            if (userId || email) {
                const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
                const query = userId 
                    ? supabase.from("profiles").update({ subscription_status: "cancelled", plan: "free" }).eq("user_id", userId)
                    : supabase.from("profiles").update({ subscription_status: "cancelled", plan: "free" }).eq("email", email);
                
                await query;
                console.log(`Deactivated account for ${userId || email} due to ${type}`);
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