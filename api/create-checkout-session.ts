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

function getBaseURLFromHeaders(headers: Record<string, any>) {
    const host = headers["x-forwarded-host"] || headers["host"];
    const proto = headers["x-forwarded-proto"] || "https";
    if (!host) {
        // Fallback to Vercel env if available
        const vercelURL = process.env.VERCEL_URL;
        if (vercelURL) return `https://${vercelURL}`;
        return "http://localhost:3000";
    }
    return `${proto}://${host}`;
}

export default async function handler(req: Req, res: Res) {
    if (req.method !== "POST") {
        res.status(405).json({ error: "Method Not Allowed" });
        return;
    }

    try {
        const apiKey = process.env.DODO_PAYMENTS_API_KEY;
        const environment =
            (process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") ||
            "test_mode";
        const productId = process.env.DODO_PRO_PLAN_PRODUCT_ID;

        if (!apiKey) {
            res.status(500).json({ error: "Missing DODO_PAYMENTS_API_KEY" });
            return;
        }
        if (!productId) {
            res.status(500).json({ error: "Missing DODO_PRO_PLAN_PRODUCT_ID" });
            return;
        }

        // Normalize body (Vercel may give object already)
        const body =
            typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
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
        // Avoid leaking internals
        console.error("create-checkout-session error:", err);
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
- environment must be 'test_mode' or 'live_mode'; defaulting to 'test_mode' here.
- Amounts returned by APIs are in minor units (e.g., cents) if you later inspect them.
- Do NOT expose your API key on the client; keep this route server-side.
*/