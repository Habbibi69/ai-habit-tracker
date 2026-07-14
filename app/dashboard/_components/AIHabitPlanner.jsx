"use client";
import React, { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LoaderCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

const AIHabitPlanner = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [goal, setGoal] = useState("");
  const [plan, setPlan] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const reset = () => {
    setGoal("");
    setPlan(null);
    setError("");
  };

  const generatePlan = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError("");
    setPlan(null);

    try {
      const res = await fetch("/api/habits/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate a plan. Please try again.");
        return;
      }

      setPlan(data.plan);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  };

  const acceptPlan = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: plan.name,
          description: plan.description,
          frequency: plan.frequency,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create habit. Please try again.");
        return;
      }

      setOpenDialog(false);
      reset();
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div
        className="p-10 rounded-lg border bg-secondary hover:scale-105 hover:shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
        onClick={() => setOpenDialog(true)}
      >
        <Sparkles size={18} />
        <h2 className="text-lg text-center">AI Habit Plan</h2>
      </div>

      <Dialog open={openDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Turn your goal into a habit
            </DialogTitle>
            <DialogDescription>
              <div className="my-3">
                <h2>
                  Describe what you want to achieve, and AI will suggest a
                  starter habit with a 3-step milestone plan
                </h2>

                {error && (
                  <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                  </div>
                )}

                <form onSubmit={generatePlan}>
                  <div className="mt-7 my-3">
                    <label className="text-black">Your Goal</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. I want to read more books"
                      value={goal}
                      required
                      onChange={(e) => {
                        setGoal(e.target.value);
                        setError("");
                      }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" disabled={generating}>
                      {generating ? (
                        <>
                          <LoaderCircle className="animate-spin mr-2" size={16} />
                          Generating Plan
                        </>
                      ) : (
                        "Generate Plan"
                      )}
                    </Button>
                  </div>
                </form>

                {plan && (
                  <div className="mt-6 p-4 border rounded-lg bg-secondary flex flex-col gap-3">
                    <div>
                      <h3 className="font-bold text-lg text-black">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Frequency: {plan.frequency}
                      </p>
                    </div>

                    {Array.isArray(plan.milestones) && plan.milestones.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold text-black mb-1">
                          Suggested progression:
                        </p>
                        <ul className="text-sm text-gray-600 list-disc list-inside">
                          {plan.milestones.map((m, i) => (
                            <li key={i}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button onClick={acceptPlan} disabled={saving} className="mt-2">
                      {saving ? (
                        <>
                          <LoaderCircle className="animate-spin mr-2" size={16} />
                          Adding Habit
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} className="mr-2" />
                          Add This Habit
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <div className="flex justify-end mt-5">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpenDialog(false);
                      reset();
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIHabitPlanner;
