"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Lightbulb,
  StickyNote,
  FileText,
  MessageSquare,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Capture Ideas",
    description: "Never lose a content idea again. Capture, tag, and organize them instantly.",
  },
  {
    icon: StickyNote,
    title: "Write Notes",
    description: "Rich text notes for research, outlines, and reference material.",
  },
  {
    icon: FileText,
    title: "Script Editor",
    description: "Write and refine scripts for videos, podcasts, and any content format.",
  },
  {
    icon: MessageSquare,
    title: "AI-Powered Chat",
    description: "Ask questions across all your content. Get answers grounded in your own data.",
  },
];

export function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="flex h-14 items-center justify-between border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <span className="text-sm font-bold text-primary-foreground">JP</span>
          </div>
          <span className="text-lg font-semibold">JottrPad</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in" className={buttonVariants({ variant: "ghost" })}>
            Sign In
          </Link>
          <Link href="/sign-up" className={buttonVariants()}>
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            AI-powered creator workspace
          </div>
          <h1 className="mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Your second brain for{" "}
            <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              content creation
            </span>
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            Capture ideas, write scripts, organize research, and ask AI questions across
            all your content. From idea to publish, in one workspace.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/sign-up" className={buttonVariants({ size: "lg" })}>
              Start for Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-muted/30 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-2xl font-bold">
              Everything creators need
            </h2>
            <p className="mt-2 text-center text-muted-foreground">
              One workspace for your entire content workflow
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <div key={feature.title} className="space-y-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t px-6 py-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>JottrPad</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}
