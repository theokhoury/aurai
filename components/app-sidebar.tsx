"use client"

import * as React from "react"
import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { fetcher, cn } from '@/lib/utils';
import { useSidebar, Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail, SidebarMenu } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusIcon, Asset642CIcon, RcwIcon, Asset1478CIcon, Asset63BIcon, Asset1301CIcon, Asset136CIcon, Asset1470CIcon, Asset171BIcon, Asset65AIcon, Asset631CIcon } from "@/components/icons";
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import type { User } from 'next-auth';
import type { Snippet } from '@/lib/db/schema';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  GalleryVerticalEnd,
  Settings2,
  SquareTerminal,
  ChevronRightIcon,
  CircleUser,
  Package2,
  Search,
  Bell,
  Home,
  ShoppingCart,
  Package,
  Users,
  LineChart,
  PanelLeft,
  PlusCircle,
} from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { emitter } from '@/lib/event-emitter';
import {
  PanelGroup, 
  Panel, 
  PanelResizeHandle 
} from 'react-resizable-panels';
import { NavMain } from "@/components/nav-main";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";

// Define the type for a snippet group
export interface SnippetGroup {
  id: string;
  name: string;
  icon: React.ElementType;
}

// Define the context type
export interface SnippetGroupContextType {
  snippetGroups: SnippetGroup[];
  renameGroup: (id: string, newName: string) => void;
}

// Snippet type (consider moving to a shared types file later)
type PopulatedSnippet = Snippet & {
    id: string;
    messageParts: unknown | null;
};

// Create the context
export const SnippetGroupContext = createContext<SnippetGroupContextType | null>(null);

// Custom hook for consuming the context
export function useSnippetGroups() {
  const context = useContext(SnippetGroupContext);
  if (!context) {
    throw new Error("useSnippetGroups must be used within a SnippetGroupProvider");
  }
  return context;
}

// Export the initial data
export const initialSnippetGroupsData = {
  snippetGroups: [
    { icon: GalleryVerticalEnd, id: "group-general", name: "General Snippets" },
    { icon: BookOpen, id: "group-marketing", name: "Marketing Ideas" },
    { icon: Settings2, id: "group-research", name: "Research Notes" },
  ] as SnippetGroup[],
};

// Keep data structure for teams, navMain etc. if still used
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    image: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      id: "t1",
      name: "Royal Canin",
      logo: RcwIcon,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Search",
      url: "#",
      icon: Asset65AIcon as any,
      isActive: true,
      items: [
        {
          title: "History",
          url: "#",
        },
        {
          title: "Starred",
          url: "#",
        },
        {
          title: "Settings",
          url: "#",
        },
      ],
    },
    {
      title: "Social",
      url: "#",
      icon: Asset136CIcon as any,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Programmatic",
      url: "#",
      icon: Asset1470CIcon as any,
      items: [
        {
          title: "Introduction",
          url: "#",
        },
        {
          title: "Get Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
        {
          title: "Changelog",
          url: "#",
        },
      ],
    },
    {
      title: "Commerce",
      url: "#",
      icon: Asset631CIcon as any,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Team",
          url: "#",
        },
        {
          title: "Billing",
          url: "#",
        },
        {
          title: "Limits",
          url: "#",
        },
      ],
    },
  ],
  // snippetGroups data is now managed in RootLayout
}

// Define props - Restore user prop
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();
  const { snippetGroups } = useSnippetGroups();

  // Fetch all snippets for filtering
  const { data: allSnippets, error: snippetsError } = useSWR<PopulatedSnippet[]>('/api/snippets', fetcher);

  // State to manage open/closed collapsible groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [isHistoryOpen, setIsHistoryOpen] = useState(true); // State for History collapsible

  // Use passed user prop or fallback to default data
  const currentUser = user || data.user as User;

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      
      <PanelGroup direction="vertical" className="flex-1">

        {/* Panel 1: Platform Nav */}
        <Panel defaultSize={25} minSize={15}> 
          <SidebarContent className="flex flex-col h-full p-0 overflow-y-auto"> 
             {data.navMain && <NavMain items={data.navMain} />} 
          </SidebarContent>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="h-px w-full bg-border hover:bg-primary data-[resize-handle-state=drag]:bg-primary transition-colors" />
        
        {/* Panel 3: Snippet Groups (Was Panel 2) */}
        <Panel defaultSize={30} minSize={20}> 
          <SidebarContent className="flex flex-col h-full p-0"> 
            <div className="px-4 py-2 border-t flex-1 overflow-y-auto">
              {/* Clickable Snippets Header */} 
              <Link 
                href="/snippets" 
                className="block mb-2 hover:text-primary" 
                onClick={() => setOpenMobile?.(false)} // Close mobile sidebar on nav
              >
                 <h3 className="text-xs font-semibold uppercase text-muted-foreground tracking-wider hover:text-primary">Snippets</h3>
              </Link>
              {snippetGroups.map((group) => {
                const snippetsInGroup = allSnippets?.filter(s => s.groupId === group.id) ?? [];
                const IconComponent = group.icon;
                const isOpen = openGroups[group.id] ?? false;

                return (
                  <Collapsible
                    key={group.id}
                    open={isOpen}
                    onOpenChange={() => toggleGroup(group.id)}
                    className="space-y-1"
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                          variant="ghost"
                          className="w-full justify-start h-8 px-2"
                        >
                          <IconComponent className="mr-2 size-4 shrink-0" aria-hidden="true" />
                          <span className="flex-1 text-sm font-medium truncate text-left">{group.name}</span>
                          <ChevronRightIcon
                            className={cn(
                              "ml-auto size-4 transition-transform duration-200",
                              isOpen && "rotate-90"
                            )}
                          />
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pl-6 space-y-1">
                      {snippetsInGroup.length > 0 ? (
                        snippetsInGroup.map((snippet) => (
                          <Button
                            key={snippet.id}
                            variant="ghost"
                            className="w-full justify-start h-7 px-2 text-xs font-normal"
                            title={snippet.title}
                            onClick={() => {
                              emitter.emit('displayBookmarkedMessage', { 
                                title: snippet.title, 
                                text: snippet.text 
                              }); 
                              setOpenMobile?.(false);
                            }}
                          >
                            <span className="truncate">{snippet.title}</span>
                          </Button>
                        ))
                      ) : (
                        <div className="px-2 py-1 text-xs text-muted-foreground italic">No snippets</div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </SidebarContent>
        </Panel>

        {/* Resize Handle */}
        <PanelResizeHandle className="h-px w-full bg-border hover:bg-primary data-[resize-handle-state=drag]:bg-primary transition-colors" />

        {/* Panel 3: Chat History (Moved Down & Made Collapsible) */}
        <Panel defaultSize={30} minSize={10}> 
          <SidebarContent className="flex flex-col h-full p-0"> 
             <Collapsible
                open={isHistoryOpen}
                onOpenChange={setIsHistoryOpen}
                className="flex flex-col flex-1 px-4 py-2 border-t" // Use flex to structure trigger/content
             >
                <CollapsibleTrigger asChild>
                   <Button
                        variant="ghost"
                        className="w-full justify-start h-8 px-0 mb-1" // Adjusted padding/margin
                      >
                        <span className="flex-1 text-xs font-semibold uppercase text-muted-foreground tracking-wider text-left">History</span>
                        <ChevronRightIcon
                          className={cn(
                            "ml-auto size-4 transition-transform duration-200",
                            isHistoryOpen && "rotate-90"
                          )}
                        />
                      </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="flex-1 overflow-y-auto -mx-4 px-4"> {/* Allow content to scroll */} 
                  <SidebarHistory user={currentUser} />
                </CollapsibleContent>
             </Collapsible>
          </SidebarContent>
        </Panel>

      </PanelGroup> 

      <SidebarFooter>
        <SidebarUserNav user={currentUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
