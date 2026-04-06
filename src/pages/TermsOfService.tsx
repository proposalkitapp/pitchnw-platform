import { AuthLayout } from "@/components/AuthLayout";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto prose prose-sm sm:prose-base dark:prose-invert">
        <h1 className="font-display text-3xl font-bold mb-6 text-foreground">Terms of Service</h1>
        <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

        <p>Welcome to Pitchnw. These Terms of Service govern your use of the Pitchnw application, accessed through pitchnw.app or other platforms.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">1. Acceptance of Terms</h2>
        <p>By registering for an account or subscribing to our services, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">2. Description of Service</h2>
        <p>Pitchnw is an AI-powered proposal platform designed for freelancers and agencies. We provide tools to generate, customize, manage, and send proposals to clients.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">3. User Accounts</h2>
        <p>You may need to register via email or Google OAuth to use the service. You are responsible for safeguarding your password and any other credentials used to access your account. You agree not to disclose your password to any third party.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">4. Payment and Billing</h2>
        <p>We offer Free, Pro ($12/month), and Standard ($29/month) plans. Payments are securely processed through Dodo Payments. By subscribing to a paid plan, you authorize Dodo Payments to bill you on a recurring basis. You may cancel your subscription at any time; access will remain until the end of your billing cycle.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">5. Fair Use</h2>
        <p>The Free plan allows for standard proposal generation (up to 3 proposals). Our paid plans provide additional benefits such as CRM features and analytics. Any misuse, circumvention of tier limits, or abuse of the AI generation APIs may result in the suspension of your account.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">6. Content and Intellectual Property</h2>
        <p>You retain full rights to the content you create and distribute using Pitchnw. However, our underlying templates, designs, algorithms, and application code are the intellectual property of Pitchnw.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">7. Limitation of Liability</h2>
        <p>Pitchnw provides this service "as is" and makes no guarantees regarding win rates, business outcomes, or uninterrupted availability. We shall not be held liable for any damages arising out of your use of the service or client interactions.</p>

        <div className="mt-12 pt-6 border-t border-border">
          <p>If you have any questions about these Terms, please contact us at <a href="mailto:support@pitchnw.com" className="text-primary hover:underline">support@pitchnw.com</a>.</p>
          <div className="mt-4">
            <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
