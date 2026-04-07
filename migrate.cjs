const fs = require('fs');
const path = require('path');

const rootDir = 'c:\\Users\\danie\\Downloads\\aurora-scroll-studio-main';
const srcDir = path.join(rootDir, 'src');
const appDir = path.join(srcDir, 'app');

if (!fs.existsSync(appDir)) {
  fs.mkdirSync(appDir, { recursive: true });
}

const routes = {
  'Index.tsx': '',
  'ProposalGenerator.tsx': 'generate',
  'AuthPage.tsx': 'auth',
  'Dashboard.tsx': 'dashboard',
  'Marketplace.tsx': 'marketplace',
  'TemplateDetail.tsx': 'marketplace/[id]',
  'ForgotPassword.tsx': 'forgot-password',
  'ResetPassword.tsx': 'reset-password',
  'Settings.tsx': 'settings',
  'CRM.tsx': 'crm',
  'Admin.tsx': 'admin',
  'ClientPortal.tsx': 'p/[slug]',
  'Checkout.tsx': 'checkout',
  'PaymentSuccess.tsx': 'payment/success',
  'AuthCallback.tsx': 'auth/callback',
  'Testimonials.tsx': 'testimonials',
  'TermsOfService.tsx': 'terms',
  'PrivacyPolicy.tsx': 'privacy',
};

// 1. Migrate pages
for (const [file, route] of Object.entries(routes)) {
  const oldPath = path.join(srcDir, 'pages', file);
  if (fs.existsSync(oldPath)) {
    let content = fs.readFileSync(oldPath, 'utf8');
    
    // Add "use client" as it's almost certainly needed for all these pages initially
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
        content = '"use client";\n\n' + content;
    }

    const routeDir = path.join(appDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    const newPath = path.join(routeDir, 'page.tsx');
    fs.writeFileSync(newPath, content);
    console.log(`Moved ${file} to app/${route}/page.tsx`);
  }
}

// 2. Add Layout
const layoutContent = `import { Inter } from "next/font/google";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/use-auth";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
`;
fs.writeFileSync(path.join(appDir, 'layout.tsx'), layoutContent);

const providersContent = `"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}
`;
fs.writeFileSync(path.join(appDir, 'providers.tsx'), providersContent);

// 3. Move global css
if (fs.existsSync(path.join(srcDir, 'index.css'))) {
  fs.copyFileSync(path.join(srcDir, 'index.css'), path.join(appDir, 'globals.css'));
}

// 4. Update all files to use next/navigation and next/link instead of react-router-dom
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let changed = false;

      // Replace imports
      if (content.includes('react-router-dom')) {
        content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]react-router-dom['"];?/g, (match, imports) => {
          let nextImports = [];
          if (imports.includes('Link')) {
            nextImports.push(`import Link from 'next/link';`);
          }
          let routingImports = [];
          if (imports.includes('useNavigate')) routingImports.push('useRouter');
          if (imports.includes('useLocation')) routingImports.push('usePathname');
          if (imports.includes('useParams')) routingImports.push('useParams');
          
          let res = nextImports.join('\n');
          if (routingImports.length > 0) {
              if (res) res += '\n';
              res += `import { ${routingImports.join(', ')} } from 'next/navigation';`;
          }
          return res;
        });
        
        // Hooks replacements
        content = content.replace(/useNavigate\(\)/g, 'useRouter()');
        content = content.replace(/useLocation\(\)/g, 'usePathname()');
        
        // <Link to="..."> to <Link href="...">
        content = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');
        
        changed = true;
        
        // Next router needs "use client"
        if (!content.includes('"use client"') && !content.includes("'use client'")) {
            content = '"use client";\n\n' + content;
        }
      }
      
      if (changed) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

processDirectory(srcDir);

// 5. Build configuration files
const nextConfig = `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};
module.exports = nextConfig;
`;
fs.writeFileSync(path.join(rootDir, 'next.config.js'), nextConfig);

console.log("Migration script complete.");
