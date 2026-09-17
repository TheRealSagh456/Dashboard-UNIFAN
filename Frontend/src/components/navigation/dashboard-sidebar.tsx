import {
  PanelLeftClose,
  PanelLeftOpen,
  type LucideIcon,
} from "lucide-react";
import type { MouseEvent } from "react";
import { cn } from "../../lib/cn";
import { Button } from "../ui/button";
import { Tooltip } from "../ui/tooltip";
import { Text } from "../ui/typography";
import { NavigationItem } from "./navigation-item";

export type DashboardSidebarItem = {
  label: string;
  icon: LucideIcon;
  to: string;
  active?: boolean;
  disabled?: boolean;
  count?: number;
};

type DashboardSidebarProps = {
  items: DashboardSidebarItem[];
  collapsed?: boolean;
  onToggle?: () => void;
  onNavigate?: (to: string) => void;
  title?: string;
  subtitle?: string;
  footer?: string;
  className?: string;
};

export function DashboardSidebar({
  items,
  collapsed = false,
  onToggle,
  onNavigate,
  title = "UNIFAN",
  subtitle = "Analytics",
  footer,
  className,
}: DashboardSidebarProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col border-r border-line bg-paper px-3 py-5 transition-[width] duration-200",
        collapsed ? "w-20" : "w-64",
        className,
      )}
    >
      <div className={cn("flex items-center gap-3 px-2", collapsed && "justify-center px-0")}>
        {!collapsed && (
          <div className="min-w-0">
            <Text as="strong" variant="h3" tone="accent" className="block tracking-[0.06em]">
              {title}
            </Text>
            <Text variant="eyebrow" tone="muted" className="mt-0.5">{subtitle}</Text>
          </div>
        )}
        {onToggle && (
          <Tooltip<HTMLButtonElement> content={collapsed ? "Expandir menu" : "Recolher menu"} placement="right">
            {(triggerProps) => (
              <Button
                {...triggerProps}
                variant="ghost"
                size="icon"
                className={cn("ml-auto", collapsed && "ml-0")}
                aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
                onClick={onToggle}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
            )}
          </Tooltip>
        )}
      </div>

      <nav className="mt-8 grid gap-1" aria-label="Navegação do dashboard">
        {items.map((item) => {
          const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
            if (item.disabled || !onNavigate) return;
            event.preventDefault();
            onNavigate(item.to);
          };

          if (!collapsed) {
            return (
              <NavigationItem
                key={item.label}
                href={item.to}
                label={item.label}
                icon={item.icon}
                active={item.active}
                disabled={item.disabled}
                count={item.count}
                onClick={handleClick}
              />
            );
          }

          return (
            <Tooltip<HTMLAnchorElement>
              key={item.label}
              content={item.disabled ? `${item.label} · Em breve` : item.label}
              placement="right"
            >
              {(triggerProps) => (
                <NavigationItem
                  {...triggerProps}
                  href={item.to}
                  label={item.label}
                  icon={item.icon}
                  active={item.active}
                  disabled={item.disabled}
                  collapsed
                  onClick={handleClick}
                />
              )}
            </Tooltip>
          );
        })}
      </nav>

      {!collapsed && footer && (
        <Text variant="caption" tone="muted" className="mt-auto border-t border-line px-2 pt-4">
          {footer}
        </Text>
      )}
    </div>
  );
}
