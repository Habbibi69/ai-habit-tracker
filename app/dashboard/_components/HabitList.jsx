"use client";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Flame } from "lucide-react";

const HabitList = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/habits/list");
      const data = await res.json();
      setHabits(data.habits || []);
    } catch {
      setHabits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const markStatus = async (habitId, status) => {
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, todayStatus: status } : h))
    );

    await fetch(`/api/habits/${habitId}/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    fetchHabits(); // refresh to get updated streak
  };

  if (loading) {
    return <h2 className="text-gray-500 mt-5">Loading your habits...</h2>;
  }

  if (habits.length === 0) {
    return (
      <h2 className="text-gray-500 mt-5">
        No habits yet. Create one to get started!
      </h2>
    );
  }

  return (
    <div className="mt-8">
      <h2 className="font-bold text-xl mb-4">Your Habits</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {habits.map((habit) => (
          <div
            key={habit.id}
            className="p-5 border rounded-lg bg-secondary flex flex-col gap-3"
          >
            <div>
              <h3 className="font-bold text-lg">{habit.name}</h3>
              {habit.description && (
                <p className="text-sm text-gray-500">{habit.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Frequency: {habit.frequency}
              </p>
            </div>

            <div className="flex items-center gap-1 text-orange-500 text-sm">
              <Flame size={16} />
              <span>{habit.streak} day streak</span>
            </div>

            <div className="flex gap-2 mt-2">
              <Button
                size="sm"
                variant={habit.todayStatus === "done" ? "default" : "outline"}
                onClick={() => markStatus(habit.id, "done")}
                className="flex-1"
              >
                <CheckCircle2 size={16} className="mr-1" />
                Done
              </Button>
              <Button
                size="sm"
                variant={habit.todayStatus === "skipped" ? "default" : "outline"}
                onClick={() => markStatus(habit.id, "skipped")}
                className="flex-1"
              >
                <XCircle size={16} className="mr-1" />
                Skip
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HabitList;
