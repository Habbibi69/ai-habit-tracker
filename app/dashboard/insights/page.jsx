"use client";
import React, { useEffect, useState } from "react";
import { Sparkles, LoaderCircle, TrendingUp } from "lucide-react";

const InsightsPage = () => {
  const [insight, setInsight] = useState("");
  const [consistencyPct, setConsistencyPct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchInsights = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/habits/insights");
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to load insights.");
        return;
      }

      setInsight(data.insight);
      setConsistencyPct(data.consistencyPct);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <div className="p-10">
      <h2 className="font-bold text-2xl">Weekly Insights</h2>
      <h2 className="text-gray-500">
        An AI summary of your habit consistency over the last 7 days
      </h2>

      <div className="mt-8 max-w-2xl">
        {loading && (
          <div className="flex items-center gap-2 text-gray-500">
            <LoaderCircle className="animate-spin" size={18} />
            Analyzing your last 7 days...
          </div>
        )}

        {!loading && error && (
          <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="p-6 border rounded-lg bg-secondary flex flex-col gap-4">
            {consistencyPct !== null && (
              <div className="flex items-center gap-2 text-lg font-bold">
                <TrendingUp size={20} className="text-green-600" />
                {consistencyPct}% consistency this week
              </div>
            )}
            <div className="flex items-start gap-2">
              <Sparkles size={18} className="text-purple-500 shrink-0 mt-1" />
              <p className="leading-relaxed">{insight}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsightsPage;
