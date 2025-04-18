"use client"

import * as React from "react"
import Link from "next/link"
import { RcwIcon, Asset807CIcon } from "@/components/icons"

import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <Link href="/" passHref>
          <SidebarMenuButton
            size="lg"
            className="w-full"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-black border border-white text-white">
              <Asset807CIcon className="size-5" />
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">
                Emirates Airlines
              </span>
            </div>
          </SidebarMenuButton>
        </Link>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
