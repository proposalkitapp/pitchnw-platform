"use client";
export const dynamic = 'force-dynamic';

import { AuthLayout } from "@/components/AuthLayout";
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto prose prose-sm sm:prose-base dark:prose-invert">
        <h1 className="font-display text-3xl font-bold mb-6 text-foreground">Privacy Policy</h1>
        <p className="text-muted-foreground mb-4">Last Updated: {new Date().toLocaleDateString()}</p>

        <p>At Pitchnw, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our application and website.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">1. Information We Collect</h2>
        <p>We may collect information about you in a variety of ways. The information we may collect includes:</p>
        <ul>
          <li><strong>Personal Data:</strong> Name, email address, password, company name, brand logo, signature, and profile data when you register or configure your account settings.</li>
          <li><strong>Proposal Data:</strong> Client names, emails, project details, budgets, deliverables, and the generated content or customized templates required to provide our service.</li>
          <li><strong>Authentication Data:</strong> If you use Google to authenticate, we receive your basic profile data and email.</li>
        </ul>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">2. How We Use Your Information</h2>
        <p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you to:</p>
        <ul>
          <li>Create and manage your account and authentication securely via Supabase.</li>
          <li>Generate AI-based proposals using your inputs.</li>
          <li>Handle recurring payments and process transactions via Dodo Payments.</li>
          <li>Send email notifications to you and your clients regarding generated proposals.</li>
          <li>Monitor and analyze usage and trends to improve your experience with the platform.</li>
        </ul>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">3. Disclosure of Your Information</h2>
        <p>We may share your information with trusted third-party providers purely to operate our business, such as:</p>
        <ul>
          <li><strong>Supabase:</strong> For authentication and secure, encrypted database hosting.</li>
          <li><strong>Dodo Payments:</strong> For handling secure payment processing and subscriptions.</li>
          <li><strong>Resend:</strong> For dispatching system emails and client proposals.</li>
        </ul>
        <p>We do not sell, trade, or rent your personal identification information to others.</p>

        <h2 className="font-display text-xl mt-8 font-semibold text-foreground">4. Security of Your Information</h2>
        <p>We use administrative, technical, and physical security measures to help protect your personal information. All API interactions (including payments and auth) are handled securely using encrypted communication channels.</p>

        <div className="mt-12 pt-6 border-t border-border">
          <p>If you have questions or comments about this Privacy Policy, please contact us at <a href="mailto:support@pitchnw.app" className="text-primary hover:underline">support@pitchnw.app</a>.</p>
          <div className="mt-4">
            <Link to="/" className="text-primary hover:underline">← Back to Home</Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  );
}
