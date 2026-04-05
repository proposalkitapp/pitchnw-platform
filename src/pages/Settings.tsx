import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { AuthLayout } from "@/components/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { User, Building, Save, Lock, Loader2, CreditCard, Check, Sparkles, PenTool, Image, Upload } from "lucide-react";
import { SignatureCanvas } from "@/components/SignatureCanvas";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [portfolioError, setPortfolioError] = useState("");
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [currentPlan, setCurrentPlan] = useState("free");
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("display_name, company_name, signature_data, plan, brand_name, brand_logo_url, portfolio_url")
        .eq("user_id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setDisplayName(data.display_name || "");
            setCompanyName(data.company_name || "");
            setSignatureData(data.signature_data || null);
            setCurrentPlan(data.plan || "free");
            setBrandName(data.brand_name || "");
            setBrandLogoUrl(data.brand_logo_url || "");
            setPortfolioUrl(data.portfolio_url || "");
          }
          setLoadingProfile(false);
        });
    }
  }, [user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be under 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      // Convert to base64 data URL for storage in profile
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoUrl(reader.result as string);
        setUploadingLogo(false);
        toast.success("Logo uploaded! Don't forget to save.");
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Failed to upload logo");
      setUploadingLogo(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    if (portfolioUrl && !portfolioUrl.startsWith("http://") && !portfolioUrl.startsWith("https://")) {
      setPortfolioError("Please enter a valid URL starting with https://");
      return;
    }
    setPortfolioError("");
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        company_name: companyName,
        signature_data: signatureData,
        brand_name: brandName,
        brand_logo_url: brandLogoUrl,
        portfolio_url: portfolioUrl || null,
      })
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated ✓");
    }
    setSaving(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully.");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleUpgrade = async (planName: string) => {
    if (!user) return;
    setUpgradingPlan(planName);
    try {
      const { data, error } = await supabase.functions.invoke("create-paystack-subscription", {
        body: { plan: planName, userEmail: user.email, userId: user.id },
      });
      if (error) throw new Error(error.message);
      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start payment");
      setUpgradingPlan(null);
    }
  };

  if (loadingProfile) {
    return (
      <AuthLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AuthLayout>
    );
  }

  const plans = [
    {
      name: "Pro",
      price: "$12",
      period: "/month",
      features: [
        "Unlimited AI proposals",
        "All templates",
        "Full proposal analytics",
        "CRM pipeline dashboard",
        "Client accept/decline flow",
        "Delete & manage proposals",
      ],
    },
    {
      name: "Standard",
      price: "$29",
      period: "/month",
      features: [
        "Everything in Pro",
        "Template Builder",
        "Sell templates — earn 80%",
        "AI Win-Rate Coach",
        "Revenue dashboard",
        "Priority support",
      ],
    },
  ];

  return (
    <AuthLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold mb-6">Settings</h1>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="billing">Billing & Plans</TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-card-foreground">
                  <User className="h-5 w-5 text-primary" /> Profile Information
                </h2>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" value={user?.email || ""} disabled className="mt-1.5 bg-muted" />
                  <p className="text-xs text-muted-foreground mt-1">Contact support to change email</p>
                </div>
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <div className="relative mt-1.5">
                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyName"
                      placeholder="Your company"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              {/* Brand Customization */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-card-foreground">
                  <Image className="h-5 w-5 text-primary" /> Brand Customization
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your brand name and logo will appear on proposals generated from templates.
                </p>
                <div>
                  <Label htmlFor="brandName">Brand Name</Label>
                  <Input
                    id="brandName"
                    placeholder="e.g. Acme Design Studio"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Brand Logo</Label>
                  <div className="mt-1.5 space-y-3">
                    {brandLogoUrl && (
                      <div className="rounded-lg border border-border bg-background p-4 flex items-center gap-4">
                        <img
                          src={brandLogoUrl}
                          alt="Brand logo"
                          className="h-12 w-auto max-w-[200px] object-contain"
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive text-xs"
                          onClick={() => setBrandLogoUrl("")}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingLogo}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingLogo ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <p className="text-xs text-muted-foreground">PNG, JPG, or SVG. Max 2MB.</p>
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-4">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-card-foreground">
                  <PenTool className="h-5 w-5 text-primary" /> Your Signature
                </h2>
                <p className="text-sm text-muted-foreground">
                  Your signature will be automatically applied to all proposals you create.
                </p>

                {signatureData && (
                  <div className="rounded-lg border border-border bg-background p-4">
                    <p className="text-xs text-muted-foreground mb-2">Current signature:</p>
                    <img src={signatureData} alt="Your signature" className="h-16 object-contain" />
                  </div>
                )}

                <SignatureCanvas
                  onSignatureChange={setSignatureData}
                  initialData={signatureData}
                  height={120}
                />
              </div>

              <Button variant="hero" onClick={handleSaveProfile} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <form onSubmit={handleChangePassword} className="rounded-xl border border-border bg-card p-6 sm:p-8 space-y-5">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-card-foreground">
                  <Lock className="h-5 w-5 text-primary" /> Change Password
                </h2>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-1.5"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum 8 characters</p>
                </div>
                <div>
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="mt-1.5"
                  />
                </div>
                <Button variant="hero" type="submit" disabled={changingPassword} className="gap-2">
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                  {changingPassword ? "Updating..." : "Change Password"}
                </Button>
              </form>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 sm:p-8">
                <h2 className="font-display text-lg font-semibold flex items-center gap-2 text-card-foreground mb-4">
                  <CreditCard className="h-5 w-5 text-primary" /> Current Plan
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <span className={`inline-block text-xs font-mono uppercase tracking-wider px-3 py-1 rounded-full ${
                    currentPlan === "free" ? "bg-secondary text-muted-foreground" :
                    currentPlan === "pro" ? "bg-primary/10 text-primary" :
                    "bg-success/10 text-success"
                  }`}>
                    {currentPlan === "free" ? "Free Plan" : currentPlan === "pro" ? "Pro Plan" : "Standard Plan"}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPlan === "free" ? "3 proposals · Free templates only · Cannot delete proposals" :
                   currentPlan === "pro" ? "Unlimited proposals · All templates · Full analytics" :
                   "Everything in Pro + Template Builder + AI Win-Rate Coach"}
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.name}
                    className="rounded-xl border border-border bg-card p-6 hover:border-primary/20 transition-colors"
                  >
                    <h3 className="font-display text-xl font-bold text-card-foreground">{plan.name}</h3>
                    <div className="mt-2 mb-4">
                      <span className="font-display text-3xl font-extrabold text-card-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      variant="hero"
                      className="w-full gap-2"
                      disabled={currentPlan === plan.name.toLowerCase() || upgradingPlan !== null}
                      onClick={() => handleUpgrade(plan.name.toLowerCase())}
                    >
                      {upgradingPlan === plan.name.toLowerCase() ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {currentPlan === plan.name.toLowerCase() ? "Current Plan" : `Upgrade to ${plan.name}`}
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AuthLayout>
  );
}
