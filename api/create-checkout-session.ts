import DodoPayments from "dodopayments";

// Minimal types to avoid adding @vercel/node just for types
type Req = {
    method?: string;
    headers: Record<string, any>;
    body?: any;
    query?: Record<string, any>;
};
type Res = {
    status: (code: number) => Res;
    json: (data: any) => void;
    setHeader: (name: string, value: string) => void;
    end: (data?: any) => void;
};

/**
 * Read raw body for environments where req.body is not auto-parsed (e.g., Vercel Node Functions).
 */
async function readRawBody(req: any): Promise<string> {
    return new Promise((resolve, reject) => {
        try {
            const chunks: Buffer[] = [];
            req.on?.("data", (chunk: Buffer) =>
                chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
            );
            req.on?.("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
            req.on?.("error", (err: Error) => reject(err));
        } catch (e) {
            reject(e as Error);
        }
    });
}

function getBaseURLFromHeaders(headers: Record<string, any>) {
    // 1) Explicit override always wins (recommended for live)
    const override = process.env.DODO_RETURN_URL_BASE;
    if (override && typeof override === "string" && override.trim().length > 0) {
        return override.replace(/\/+$/, "");
    }

    // 2) If live_mode and no override provided, force your current production domain
    //    as requested: https://pitchnw.vercel.app
    const envMode = process.env.DODO_PAYMENTS_ENVIRONMENT;
    if (envMode === "live_mode") {
        const forced = "https://pitchnw.vercel.app";
        return forced.replace(/\/+$/, "");
    }

    // 3) Non-live (e.g., local dev / test_mode) — infer from headers/VERCEL_URL safely
    const host = headers["x-forwarded-host"] || headers["host"];
    const protoHeader = headers["x-forwarded-proto"];
    let proto = typeof protoHeader === "string" ? protoHeader : "https";

    if (!host) {
        const vercelURL = process.env.VERCEL_URL;
        if (vercelURL) return `https://${vercelURL}`.replace(/\/+$/, "");
        return "http://localhost:3000";
    }

    // If proto header is missing and host looks like localhost, force http for dev
    if (!protoHeader && /localhost|127\.0\.0\.1/i.test(String(host))) {
        proto = "http";
    }

    return `${proto}://${host}`.replace(/\/+$/, "");
}

export default async function handler(req: Req, res: Res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    try {
        const apiKey = process.env.DODO_PAYMENTS_API_KEY;
        const environment =
            process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode";
        const productId = process.env.DODO_PRO_PLAN_PRODUCT_ID;

        if (!apiKey) {
            res.status(500).json({ error: "Missing DODO_PAYMENTS_API_KEY" });
            return;
        }
        if (!productId) {
            res.status(500).json({ error: "Missing DODO_PRO_PLAN_PRODUCT_ID" });
            return;
        }
        if (!environment) {
            res.status(500).json({ error: "Missing DODO_PAYMENTS_ENVIRONMENT" });
            return;
        }
        if (environment !== "test_mode" && environment !== "live_mode") {
            res.status(400).json({ error: "Invalid DODO_PAYMENTS_ENVIRONMENT" });
            return;
        }

        // Normalize/parse body (Vercel functions don't auto-parse by default)
        let parsed: any = undefined;
        if (typeof req.body === "string") {
            parsed = JSON.parse(req.body);
        } else if (req.body && typeof req.body === "object") {
            parsed = req.body;
        } else {
            const raw = await readRawBody(req).catch(() => null);
            if (raw) parsed = JSON.parse(raw);
        }
        const body = parsed || {};
        const { sessionId, customer, billing_address } = body as {
            sessionId: string;
            customer?: {
                email?: string;
                name?: string;
                phone_number?: string;
            };
            billing_address?: {
                street?: string;
                city?: string;
                state?: string;
                country?: string; // ISO 3166-1 alpha-2
                zipcode?: string;
            };
        };

        if (!sessionId) {
            res.status(400).json({ error: "Missing required field: sessionId" });
            return;
        }

        const baseURL = getBaseURLFromHeaders(req.headers);
        // Dodo docs use return_url for post-checkout redirect
        // Requirement: redirect back to /?session={sessionId}
        const return_url = `${baseURL}/?session=${encodeURIComponent(sessionId)}`;

        const client = new DodoPayments({
            bearerToken: apiKey,
            environment,
        });

        // Build optional typed customer only if we have a valid email
        let customerReq: any = undefined;
        if (customer?.email && typeof customer.email === "string") {
            customerReq = {
                email: customer.email,
                name: customer.name,
                phone_number: customer.phone_number,
            };
        }

        // Build optional typed billing address only if we have a valid ISO country
        let billingReq: any = undefined;
        if (billing_address?.country && typeof billing_address.country === "string") {
            const country = billing_address.country.toUpperCase();
            billingReq = {
                street: billing_address.street,
                city: billing_address.city,
                state: billing_address.state,
                country,
                zipcode: billing_address.zipcode,
            };
        }

        // Create a checkout session for the $12 monthly subscription product
        const session = await client.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            // Ensure at least common card methods are available per docs guidance
            allowed_payment_method_types: ["credit", "debit"],
            // Explicitly configure the free trial to match UI copy (3-day trial)
            subscription_data: { trial_period_days: 3 },
            // Pre-fill if provided (types satisfied)
            customer: customerReq ?? undefined,
            billing_address: billingReq ?? undefined,
            // Use return_url per docs (acts as the "success_url" concept)
            return_url,
            // Attach sessionId for reconciliation in webhook
            metadata: {
                sessionId,
            },
        });

        // Respond with the hosted checkout URL
        res.status(200).json({
            checkout_url: session.checkout_url,
            session_id: session.session_id,
        });
    } catch (err: any) {
        // Structured server-side diagnostics without leaking secrets
        const envMode = process.env.DODO_PAYMENTS_ENVIRONMENT;
        const status = (err && (err.status || err.response?.status)) || 500;
        const code = err && (err.code || err.response?.data?.code);
        const respErr = err?.response?.data?.error || err?.response?.data;
        console.error("create-checkout-session error:", {
            envMode,
            status,
            code,
            message: err?.message || String(err),
            responseError: respErr,
            stack: err?.stack,
        });
        // Minimal client-facing error
        res.status(500).json({ error: "Failed to create checkout session" });
    }
}

/**
Documentation references:
- Checkout Sessions (Node SDK usage, return_url, metadata):
  https://docs.dodopayments.com/developer-resources/checkout-session
- Subscription Integration Guide (Node SDK with product_cart):
  https://docs.dodopayments.com/developer-resources/subscription-integration-guide

Security & Notes:
- environment must be 'test_mode' or 'live_mode' and is required via DODO_PAYMENTS_ENVIRONMENT.
- Amounts returned by APIs are in the currency’s smallest unit (minor units).
- Do NOT expose your API key on the client; keep this route server-side.
*/