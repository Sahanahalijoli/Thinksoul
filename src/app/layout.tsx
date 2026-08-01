import "./globals.css";

import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
        <title>ThinkSoul — Startup Incubation Platform</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="description" content="Enterprise-grade workspace for managing and incubating startup projects. Track progress, collaborate with mentors, and build your startup journey." />
        
        {/* Official Favicon Branding */}
        <link rel="icon" href="/assets/ThinkSoul.jpg" />
        <link rel="apple-touch-icon" href="/assets/ThinkSoul.jpg" />
        
        {/* Core Font Hierarchy */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="min-h-full bg-[#f8f9fa] text-neutral-900 antialiased selection:bg-indigo-50 selection:text-indigo-600" style={{ fontFamily: "'Inter', sans-serif" }}>
        <Toaster position="bottom-right" reverseOrder={true} />
        {children}
      </body>
    </html>
  );
}
