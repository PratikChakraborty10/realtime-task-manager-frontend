"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Users, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20 max-w-6xl">
        <div className="text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Zap className="h-4 w-4" />
            Real-time Collaboration
          </div>

          {/* Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Manage Tasks.
            <br />
            <span className="text-primary">Together, in Real-time.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            A modern task management platform for teams. Create projects, assign tasks, 
            and watch updates happen instantly across all devices.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2 text-base px-8">
                Get Started Free
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base px-8">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-16 max-w-4xl mx-auto">
            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Task Management</h3>
              <p className="text-sm text-muted-foreground text-center">
                Create, assign, and track tasks with status updates and comments.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Team Collaboration</h3>
              <p className="text-sm text-muted-foreground text-center">
                Invite team members to projects and collaborate seamlessly.
              </p>
            </div>

            <div className="flex flex-col items-center gap-3 p-6 rounded-xl bg-card border">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold">Real-time Sync</h3>
              <p className="text-sm text-muted-foreground text-center">
                See changes instantly as teammates update tasks and comments.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
