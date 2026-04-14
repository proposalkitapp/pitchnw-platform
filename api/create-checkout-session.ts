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

    // 2) If live_mode and no override provided, check if we have a valid host.
    // We prefer inferred headers even in live mode to support different deployment domains (preview domains, etc.)
    // but we can have a production fallback if everything else fails.
    const productionFallback = "https://pitchnw.vercel.app";

    // 3) Safely infer from headers / VERCEL_URL
    const host = headers["x-forwarded-host"] || headers["host"];
    const protoHeader = headers["x-forwarded-proto"];
    let proto = typeof protoHeader === "string" ? protoHeader : "https";

    // Detect if VERCEL_URL is set to a dashboard URL (common misconfiguration)
    const vercelURL = process.env.VERCEL_URL;
    const isDashboardURL = vercelURL?.includes("vercel.com/");

    if (vercelURL && !isDashboardURL) {
        const normalized = vercelURL.startsWith("http") ? vercelURL : `https://${vercelURL}`;
        return normalized.replace(/\/+$/, "");
    }

    if (!host || String(host).includes("vercel.com")) {
        // Fallback for local development or broken headers
        // If in live_mode, use the production fallback instead of localhost
        if (process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode") {
            return productionFallback;
        }
        return "http://localhost:3000";
    }

    // Force http for local dev
    if (/localhost|127\.0\.0\.1/i.test(String(host))) {
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
        // Default to test_mode if not provided, per docs examples
        const environment =
            ((process.env.DODO_PAYMENTS_ENVIRONMENT as "test_mode" | "live_mode") || "test_mode");

        if (!apiKey) {
            res.status(500).json({ error: "Missing DODO_PAYMENTS_API_KEY" });
            return;
        }

        // Parse body (Vercel functions may not auto-parse)
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

        // Allow product_id from body, otherwise fallback to env (backward compatible with existing setup)
        const productIdFromEnv = process.env.DODO_PRO_PLAN_PRODUCT_ID;
        const productId = (body.product_id as string) || productIdFromEnv;
        if (!productId) {
            res.status(400).json({ error: "Missing product_id (body) or DODO_PRO_PLAN_PRODUCT_ID (env)" });
            return;
        }

        // Optional prefill customer per docs
        const customer = body.customer as
            | { email?: string; name?: string }
            | undefined;

        const baseURL = getBaseURLFromHeaders(req.headers);
        const return_url = `${baseURL}/payment/success`;

        // Validate URL early
        try {
            // eslint-disable-next-line no-new
            new URL(return_url);
        } catch {
            res.status(400).json({
                error: "Invalid return_url",
                message: "return_url must be an absolute URL",
                detail: { return_url },
            });
            return;
        }

        const client = new DodoPayments({
            bearerToken: apiKey,
            environment,
        });

        // Per docs: create checkout session with product_cart, optional customer, and return_url
        const session = await client.checkoutSessions.create({
            product_cart: [{ product_id: productId, quantity: 1 }],
            customer: customer?.email ? { email: customer.email, name: customer.name } : undefined,
            return_url,
        });

        // Return hosted checkout URL and session id
        res.status(200).json({
            checkout_url: session.checkout_url,
            session_id: session.session_id,
        });
    } catch (err: any) {
        const envMode = process.env.DODO_PAYMENTS_ENVIRONMENT;
        const status = (err && (err.status || err.response?.status)) || 500;
        const code = err && (err.code || err.response?.data?.code);
        const respErr = err?.response?.data?.error || err?.response?.data;
        const message = err?.message || String(err);

        console.error("create-checkout-session failure:", {
            envMode,
            status,
            code,
            message,
            responseError: respErr,
        });

        res.status(status).json({
            error: "Failed to create checkout session",
            message: message,
            detail: respErr || null,
        });
    }
}

/**
 Documentation used (provided in your message):
 - One-time Payments Integration Guide (Checkout Sessions)
   https://docs.dodopayments.com/developer-resources/checkout-session
 - API Reference (Create Checkout Session)
   https://docs.dodopayments.com/api-reference/checkout-sessions/create

 Notes:
 - Use environment 'test_mode' for sandbox; amounts are in minor units.
 - Keep API key server-side only; never expose to the client.
 - Redirect customer to `checkout_url` returned by this endpoint.
 */