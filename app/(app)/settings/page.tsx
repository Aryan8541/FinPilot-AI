"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme } = useTheme();

  return (
    <div>
      <h1 className="text-3xl font-bold">Settings</h1>
      <p className="mt-2 text-muted-foreground">Manage your preferences</p>

      <div className="mt-6 space-y-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize how FinPilot AI looks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Theme</p>
                <p className="text-sm text-muted-foreground">
                  Currently: {theme === "dark" ? "Dark" : theme === "light" ? "Light" : "System"}
                </p>
              </div>
              <ThemeToggle />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <strong>Version:</strong> 1.0.0
            </p>
            <p>
              <strong>License:</strong> MIT
            </p>
            <p>
              <strong>Repository:</strong>{" "}
              <a
                href="https://github.com/FinPilot AI/FinPilot AI"
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                github.com/FinPilot AI/FinPilot AI
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
