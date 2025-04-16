'use client';

import { useState } from 'react';
import type { User } from 'next-auth';
import { useRouter } from 'next/navigation';

import { PlusIcon } from '@/components/icons';
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  useSidebar,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { HomeIcon, BookmarkIcon, HistoryIcon, SettingsIcon } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { BookmarksContent } from './bookmarks-content';
import { SettingsContent } from './settings-content';
import { HomeContent } from './home-content';
import { cn } from '@/lib/utils';

type ActiveSection = 'home' | 'bookmarks' | 'history' | 'settings';

export function AppSidebar({ user }: { user: User | undefined }) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const [activeSection, setActiveSection] = useState<ActiveSection>('history');

  const getButtonClass = (section: ActiveSection) => {
    return cn(
      'rounded-lg',
      activeSection === section ? 'bg-muted text-foreground' : 'text-muted-foreground'
    );
  };

  return (
    <Sidebar className="group-data-[side=left]:border-r-0 flex flex-col">
      <div className="flex flex-row justify-center items-center gap-2 p-4 border-b">
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={getButtonClass('home')}
                aria-label="Home"
                onClick={() => setActiveSection('home')}
              >
                <HomeIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Home
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={getButtonClass('bookmarks')}
                aria-label="Bookmarks"
                onClick={() => setActiveSection('bookmarks')}
              >
                <BookmarkIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Bookmarks
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={getButtonClass('history')}
                aria-label="History"
                onClick={() => setActiveSection('history')}
              >
                <HistoryIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              History
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className={getButtonClass('settings')}
                aria-label="Settings"
                onClick={() => setActiveSection('settings')}
              >
                <SettingsIcon className="size-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={5}>
              Settings
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {activeSection === 'history' && (
        <SidebarHeader>
          <SidebarMenu>
            <div className="flex flex-row justify-between items-center">
              <Link
                href="/"
                onClick={() => {
                  setOpenMobile(false);
                }}
                className="flex flex-row gap-3 items-center"
              >
                <span className="text-lg font-semibold px-2 hover:bg-muted rounded-md cursor-pointer">
                  Chatbot
                </span>
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    type="button"
                    className="p-2 h-fit"
                    onClick={() => {
                      setOpenMobile(false);
                      router.push('/');
                      router.refresh();
                    }}
                  >
                    <PlusIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent align="end">New Chat</TooltipContent>
              </Tooltip>
            </div>
          </SidebarMenu>
        </SidebarHeader>
      )}
      <SidebarContent className="flex-grow">
        {activeSection === 'home' && <HomeContent />}
        {activeSection === 'history' && <SidebarHistory user={user} />}
        {activeSection === 'bookmarks' && <BookmarksContent />}
        {activeSection === 'settings' && <SettingsContent />}
      </SidebarContent>
      <SidebarFooter>{user && <SidebarUserNav user={user} />}</SidebarFooter>
    </Sidebar>
  );
}
