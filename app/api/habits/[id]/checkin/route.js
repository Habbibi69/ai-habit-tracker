import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { Checkin, Habit } from "@/utils/schema";
import { eq, and, desc } from "drizzle-orm";
import { createChatSession } from "@/utils/GeminiAIModal";

// POST /api/habits/[id]/checkin — mark today as done or skipped, get short AI feedback
export async function POST(request, { params }) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habitId = parseInt(params.id);
    if (isNaN(habitId)) {
      return NextResponse.json({ error: "Invalid habit id" }, { status: 400 });
    }

    const body = await request.json();
    const { status, note } = body;

    if (status !== "done" && status !== "skipped") {
      return NextResponse.json(
        { error: "Status must be 'done' or 'skipped'" },
        { status: 400 }
      );
    }

    const userEmail = user.primaryEmailAddress?.emailAddress ?? "";
    const today = new Date().toISOString().split("T")[0];

    // Get the habit itself for context
    const habitRows = await db
      .select()
      .from(Habit)
      .where(eq(Habit.id, habitId))
      .limit(1);

    if (habitRows.length === 0) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }
    const habit = habitRows[0];

    // Get last 7 checkins for this habit for a bit of context
    const recentCheckins = await db
      .select()
      .from(Checkin)
      .where(eq(Checkin.habitId, habitId))
      .orderBy(desc(Checkin.date))
      .limit(7);

    const historySummary = recentCheckins
      .map((c) => `${c.date}: ${c.status}`)
      .join(", ") || "No history yet";

    // Ask Gemini for a short, motivating one-liner
    let aiFeedback = "";
    try {
      const prompt = `You are a supportive, upbeat habit coach.
Habit: "${habit.name}" (${habit.frequency})
Today's status: ${status}
Recent history (most recent first): ${historySummary}

Reply with ONE short sentence (max 20 words) of encouragement or a gentle nudge based on today's status and recent history. No quotes, no markdown, just the sentence.`;

      const session = createChatSession();
      const aiResult = await session.sendMessage(prompt);
      aiFeedback = aiResult.response.text().trim().slice(0, 300);
    } catch (aiError) {
      console.error("[checkin AI feedback]", aiError);
      // Non-fatal: fall back to a simple default message so checkin still succeeds
      aiFeedback =
        status === "done"
          ? "Nice work, keep it up!"
          : "No worries, tomorrow is a fresh start.";
    }

    // If today's checkin already exists, update it. Otherwise insert new.
    const existing = await db
      .select()
      .from(Checkin)
      .where(and(eq(Checkin.habitId, habitId), eq(Checkin.date, today)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(Checkin)
        .set({ status, note: note ?? existing[0].note, aiFeedback })
        .where(eq(Checkin.id, existing[0].id));
    } else {
      await db.insert(Checkin).values({
        habitId,
        date: today,
        status,
        note: note ?? "",
        aiFeedback,
        createdBy: userEmail,
        createdAt: today,
      });
    }

    return NextResponse.json({ success: true, aiFeedback }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/habits/[id]/checkin]", error);
    return NextResponse.json(
      { error: "Failed to save checkin. Please try again." },
      { status: 500 }
    );
  }
}
