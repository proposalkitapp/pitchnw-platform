/// <reference path="./deno.d.ts" />

/**
 * Ambient modules for Deno remote imports (https:, npm:) — IDE / tsserver only.
 * Supabase Edge (Deno) resolves these at runtime; Node-style TS does not.
 */

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2.49.4" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Edge stub for IDE only
  export function createClient(supabaseUrl: string, supabaseKey: string, options?: any): any;
}

declare module "https://esm.sh/standardwebhooks@1.0.0" {
  export class Webhook {
    constructor(secret: string);
    verify(payload: string, headers: Record<string, string>): unknown;
  }
}

declare module "npm:dodopayments@2.26.0" {
  interface DodoPaymentsClient {
    checkoutSessions: {
      create: (body: Record<string, unknown>) => Promise<{
        checkout_url?: string | null;
        session_id: string;
      }>;
    };
    subscriptions: {
      update: (
        subscriptionId: string,
        body: Record<string, unknown>,
      ) => Promise<unknown>;
    };
  }
  interface DodoPaymentsConstructor {
    new (options: {
      bearerToken: string;
      environment: "live_mode" | "test_mode";
    }): DodoPaymentsClient;
  }
  const DodoPayments: DodoPaymentsConstructor;
  export default DodoPayments;
}
