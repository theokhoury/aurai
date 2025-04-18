"use client"

import * as React from "react"
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PlusIcon } from "@/components/icons";
import { SidebarHistory } from '@/components/sidebar-history';
import { SidebarUserNav } from '@/components/sidebar-user-nav';
import type { User } from 'next-auth';
import {
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  Frame,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
} from "lucide-react"
import {
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
  Asset642CIcon,
  RcwIcon,
  Asset1478CIcon,
  Asset63BIcon,
  Asset1301CIcon,
  Asset136CIcon,
  Asset1470CIcon,
  Asset171BIcon,
  Asset65AIcon,
  Asset631CIcon
} from "@/components/icons"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenu
} from "@/components/ui/sidebar"

// This is sample data.
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
  projects: [
    {
      name: "Design Engineering",
      url: "#",
      icon: Frame,
    },
    {
      name: "Sales & Marketing",
      url: "#",
      icon: PieChart,
    },
    {
      name: "Travel",
      url: "#",
      icon: Map,
    },
  ],
}

// Define props to include user
interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: User;
}

export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const router = useRouter();
  const { setOpenMobile } = useSidebar();

  const currentUser = user || data.user as User;

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        {false ? (
           <SidebarHistory user={user} /> 
        ) : (
          <>
            <NavMain items={data.navMain} />
            <NavProjects projects={data.projects} />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={{ 
          name: currentUser.name ?? 'User Name',
          email: currentUser.email ?? 'user@example.com',
          avatar: currentUser.image ?? '/avatars/default.png'
        }} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
