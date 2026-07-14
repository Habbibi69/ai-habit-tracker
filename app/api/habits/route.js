import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/utils/db";
import { Habit } from "@/utils/schema";

// POST /api/habits — create a new habit
export async function POST(request) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, frequency } = body;

    if (!name?.trim() || !frequency?.trim()) {
      return NextResponse.json(
        { error: "Habit name and frequency are required" },
        { status: 400 }
      );
    }

    const sanitize = (str) =>
      (str || "").replace(/[<>{}]/g, "").trim().substring(0, 500);

    const userEmail = user.primaryEmailAddress?.emailAddress ?? "";
    const createdAt = new Date().toISOString().split("T")[0];

    const result = await db
      .insert(Habit)
      .values({
        name: sanitize(name),
        description: sanitize(description),
        frequency: sanitize(frequency),
        createdBy: userEmail,
        createdAt,
      })
      .returning({ id: Habit.id });

    return NextResponse.json({ id: result[0].id }, { status: 201 });
  } catch (error) {
    console.error("[POST /api/habits]", error);
    return NextResponse.json(
      { error: "Failed to create habit. Please try again." },
      { status: 500 }
    );
  }
}
