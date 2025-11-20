"use client";

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { CreditCardIcon, InboxIcon, LayoutDashboardIcon, LibraryBigIcon, Mic, PaletteIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
} from "@workspace/ui/components/sidebar";
import { cn } from "@workspace/ui/lib/utils";

const customerSupportItems = [
  { title: "Conversations", url: "/conversations", icon: InboxIcon },
  { title: "Knowledge Base", url: "/files", icon: LibraryBigIcon },
];

const configurationItems = [
  { title: "Widget Customization", url: "/customization", icon: PaletteIcon },
  { title: "Integrations", url: "/integrations", icon: LayoutDashboardIcon },
  { title: "Voice Assistant", url: "/plugins/vapi", icon: Mic },
];

const accountItems = [
  { title: "Plans & Billing", url: "/billing", icon: CreditCardIcon },
];

export const DashboardSidebar = () => {
  const pathname = usePathname();
  // Checks if the path starts with the item's URL for active state
  const isActive = (url: string) => pathname.startsWith(url);

  return (
    // 'collapsible="icon"' handles the state that the CSS targets with '.sidebar.collapsed'
    <Sidebar className="sidebar h-screen w-64 group" collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className="!m-0 !rounded-none"> 
            <SidebarMenuButton asChild size="lg" className="w-full">
              <OrganizationSwitcher 
                hidePersonal 
                skipInvitationScreen 
                appearance={{
                  elements: {
                    rootBox: "w-full h-8",
                    avatarBox: "size-4 rounded-sm",
                    // Custom class for glow effect and to manage collapse behavior
                    organizationSwitcherTrigger: "w-full justify-start organization-switcher-glow-tab",
                    // Make organization name visible
                    organizationPreviewTextContainer: "text-xs font-medium text-sidebar-text",
                    organizationSwitcherTriggerIcon: "ml-auto text-sidebar-text block",
                  }
                }}
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Customer Support</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {customerSupportItems.map(item => (
                <SidebarMenuItem key={item.title} className={cn(isActive(item.url) && "active")}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Configuration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {configurationItems.map(item => (
                <SidebarMenuItem key={item.title} className={cn(isActive(item.url) && "active")}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map(item => (
                <SidebarMenuItem key={item.title} className={cn(isActive(item.url) && "active")}>
                  <SidebarMenuButton asChild>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <UserButton showName afterSignOutUrl="/" appearance={{
                elements: {
                    // Custom class for glow effect and to manage collapse behavior
                    userButtonBox: "w-full user-button-glow-tab"
                }
            }}/>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};