import React from 'react';
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { auth } from '@/app/(auth)/auth';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export default async function ChatLayout({ children }: ChatLayoutProps) {
  const session = await auth();

  // You can grab the default layout settings from cookies
  // const layout = cookies().get('react-resizable-panels:layout');
  // const isCollapsed = cookies().get('react-resizable-panels:collapsed');

  return (
    <>
      {/* Removed SidebarProvider and AppSidebar */}
      {/* <SidebarProvider defaultOpen={!isCollapsed}> */}
        {/* <AppSidebar user={session?.user} /> */}
        {/* <SidebarInset>{children}</SidebarInset> */}
      {/* </SidebarProvider> */}

      {/* Render children directly now */}
      {children}
    </>
  );
}
