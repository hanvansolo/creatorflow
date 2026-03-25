"use client";

import { UserButton } from "@clerk/nextjs";
import { useTheme } from "next-themes";
import { Moon, Sun, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HelpButton } from "@/components/shared/help-button";

export function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();

  const openCommandPalette = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true })
    );
  };

  return (
    <header className="sticky top-0 z-20 flex h-12 items-center justify-between border-b border-border/50 bg-background/60 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <button
          onClick={openCommandPalette}
          className="flex h-7 w-56 items-center gap-2 rounded-md border border-border/40 bg-muted/30 px-2.5 text-xs text-muted-foreground/70 transition-all hover:bg-muted/60 hover:text-muted-foreground hover:border-border/60"
        >
          <Search className="h-3 w-3" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="pointer-events-none hidden h-4 select-none items-center rounded border border-border/40 bg-background/80 px-1 text-[10px] font-mono text-muted-foreground/60 sm:flex">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <HelpButton />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-7 w-7",
            },
          }}
        />
      </div>
    </header>
  );
}
