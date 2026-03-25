"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Lightbulb,
  StickyNote,
  FileText,
  MessageSquare,
  Search,
  Keyboard,
  Link2,
  Slash,
  ArrowRight,
} from "lucide-react";

const steps = [
  {
    title: "Welcome to JottrPad",
    description: "Your AI-powered creator workspace. Here's a quick tour of what you can do.",
    features: [
      { icon: Lightbulb, label: "Capture ideas instantly" },
      { icon: StickyNote, label: "Write rich notes with a powerful editor" },
      { icon: FileText, label: "Draft scripts for videos, podcasts & more" },
      { icon: MessageSquare, label: "Ask AI questions about your content" },
    ],
  },
  {
    title: "Power Features",
    description: "JottrPad has shortcuts and tools to help you work faster.",
    features: [
      { icon: Slash, label: "Type / in the editor for slash commands" },
      { icon: Keyboard, label: "Press Cmd+K to search & navigate anywhere" },
      { icon: Link2, label: "Type [[ to link to other notes, ideas & scripts" },
      { icon: Search, label: "AI Chat searches all your content for answers" },
    ],
  },
];

export function OnboardingDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem("jottrpad-onboarding-seen");
    if (!seen) {
      // Small delay so the dashboard loads first
      const timer = setTimeout(() => setOpen(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("jottrpad-onboarding-seen", "true");
    setOpen(false);
    setStep(0);
  };

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      handleClose();
    }
  };

  const current = steps[step];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">{current.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">{current.description}</p>

          <div className="grid gap-3">
            {current.features.map((feature) => (
              <div key={feature.label} className="flex items-center gap-3 rounded-lg border p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <div className="flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  i === step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <Button onClick={handleNext}>
            {step < steps.length - 1 ? (
              <>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              "Get Started"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
