import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { Checkin } from "@/utils/schema";
import { eq, and } from "drizzle-orm";

// POST /api/habits/[id]/checkin — mark today as done or skipped for a habit
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

    // If today's checkin already exists, update it. Otherwise insert new.
    const existing = await db
      .select()
      .from(Checkin)
      .where(and(eq(Checkin.habitId, habitId), eq(Checkin.date, today)))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(Checkin)
        .set({ status, note: note ?? existing[0].note })
        .where(eq(Checkin.id, existing[0].id));
    } else {
      await db.insert(Checkin).values({
        habitId,
        date: today,
        status,
        note: note ?? "",
        createdBy: userEmail,
        createdAt: today,
      });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[POST /api/habits/[id]/checkin]", error);
    return NextResponse.json(
      { error: "Failed to save checkin. Please try again." },
      { status: 500 }
    );
  }
}
