import { Moon, Sun } from "lucide-react";
import { useTheme } from "../../providers/theme-context";
import { Button } from "./button";
import { Tooltip } from "./tooltip";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const darkTheme = theme === "dark";
  const label = darkTheme ? "Ativar tema claro" : "Ativar tema escuro";

  return (
    <div className="fixed right-4 top-4 z-[55] sm:right-6 sm:top-6">
      <Tooltip<HTMLButtonElement>
        content={label}
        placement="left"
        className="whitespace-nowrap"
      >
        {(triggerProps) => (
          <Button
            {...triggerProps}
            variant="outline"
            size="icon"
            className="border-line/90 bg-paper/90 shadow-card backdrop-blur-md"
            aria-label={label}
            aria-pressed={darkTheme}
            onClick={toggleTheme}
          >
            {darkTheme ? (
              <Sun className="size-4" aria-hidden="true" />
            ) : (
              <Moon className="size-4" aria-hidden="true" />
            )}
          </Button>
        )}
      </Tooltip>
    </div>
  );
}
