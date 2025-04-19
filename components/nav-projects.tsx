"use client"

import * as React from "react"
import {
  Folder,
  Forward,
  MoreHorizontal,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

// Import the context hook and type
import { useSnippetGroups, type SnippetGroup } from '@/components/app-sidebar';
import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

// Remove props, component will use context
export function NavProjects() {
  // Get data and functions from context
  const { snippetGroups, renameGroup } = useSnippetGroups();
  const { isMobile } = useSidebar()
  const [editingProjectId, setEditingProjectId] = React.useState<string | null>(null)
  const [editingValue, setEditingValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingProjectId(id)
    setEditingValue(currentName)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const handleCancelEdit = () => {
    setEditingProjectId(null)
    setEditingValue("")
  }

  const handleRename = () => {
    if (editingProjectId && editingValue.trim()) {
      // Call renameGroup from context
      renameGroup(editingProjectId, editingValue.trim())
    }
    handleCancelEdit()
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleRename()
    } else if (event.key === "Escape") {
      handleCancelEdit()
    }
  }

  React.useEffect(() => {
    if (editingProjectId) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [editingProjectId])

  // Check if snippetGroups is available before mapping
  if (!snippetGroups) {
    return null; // Or render a loading state
  }

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Snippet Groups</SidebarGroupLabel>
      <SidebarMenu>
        {snippetGroups.map((item) => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild={editingProjectId !== item.id} className="relative">
              {editingProjectId === item.id ? (
                <div className="flex items-center w-full">
                  <item.icon />
                  <Input
                    ref={inputRef}
                    type="text"
                    value={editingValue}
                    onChange={(e) => setEditingValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-6 ml-2 flex-1 px-1 py-0 border border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                    aria-label={`Rename project ${item.name}`}
                  />
                </div>
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={`/snippets?group=${item.id}`}
                      className={cn(
                        'flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:size-8'
                      )}
                    >
                      <item.icon />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{item.name}</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">More options for {item.name}</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onSelect={() => handleStartEdit(item.id, item.name)}>
                  <Pencil className="text-muted-foreground" />
                  <span>Edit Name</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>View Project</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>Share Project</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>Delete Project</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem key="more-projects-item">
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontal className="text-sidebar-foreground/70" />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  )
}
