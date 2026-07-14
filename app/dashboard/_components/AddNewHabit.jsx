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
import { Textarea } from "@/components/ui/textarea";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

const AddNewHabit = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const clearForm = () => {
    setName("");
    setDescription("");
    setFrequency("");
    setError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, frequency }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create habit. Please try again.");
        return;
      }

      setOpenDialog(false);
      clearForm();
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div
        className="p-10 rounded-lg border bg-secondary hover:scale-105 hover:shadow-sm transition-all cursor-pointer"
        onClick={() => setOpenDialog(true)}
      >
        <h2 className="text-lg text-center">+ Add New Habit</h2>
      </div>

      <Dialog open={openDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              Tell us about your new habit
            </DialogTitle>
            <DialogDescription>
              <form onSubmit={onSubmit}>
                <div className="my-3">
                  <h2>Add a habit name, optional details, and how often you want to do it</h2>

                  {error && (
                    <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                      {error}
                    </div>
                  )}

                  <div className="mt-7 my-3">
                    <label className="text-black">Habit Name</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. Drink water, Read 20 pages"
                      value={name}
                      required
                      onChange={(e) => {
                        setName(e.target.value);
                        setError("");
                      }}
                    />
                  </div>
                  <div className="my-5">
                    <label className="text-black">Description (optional)</label>
                    <Textarea
                      className="placeholder-opacity-50"
                      placeholder="Ex. Drink 8 glasses of water a day"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
                  <div className="my-5">
                    <label className="text-black">Frequency</label>
                    <Input
                      className="mt-1"
                      placeholder="Ex. daily, 3x_week"
                      value={frequency}
                      required
                      onChange={(e) => {
                        setFrequency(e.target.value);
                        setError("");
                      }}
                    />
                  </div>
                </div>
                <div className="flex gap-5 justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setOpenDialog(false);
                      clearForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <LoaderCircle className="animate-spin mr-2" />
                        Saving
                      </>
                    ) : (
                      "Create Habit"
                    )}
                  </Button>
                </div>
              </form>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AddNewHabit;
