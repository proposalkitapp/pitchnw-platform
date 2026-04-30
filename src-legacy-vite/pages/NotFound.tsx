"use client";

import { useLocation } from 'react-router-dom';
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center p-6 bg-transparent">
      <div className="bg-card w-full max-w-md p-12 text-center relative z-10 overflow-hidden group">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-3xl animate-pulse" />
        
        <h1 className="mb-6 text-7xl font-black tracking-tighter text-foreground decoration-primary underline-offset-8">
          404
        </h1>
        <p className="mb-8 text-xl font-medium text-muted-foreground leading-relaxed">
          Oops! That page seems to have <span className="text-primary italic">evaporated</span> into thin air.
        </p>
        <a 
          href="/" 
          className="inline-flex h-12 items-center justify-center px-8 rounded-2xl bg-primary text-primary-foreground font-bold hover:shadow-lg shadow-primary/25 active:scale-95 transition-all"
        >
          Return to Hub
        </a>
      </div>
    </div>
  );
};

export default NotFound;
