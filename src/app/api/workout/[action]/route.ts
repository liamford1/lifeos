import { NextRequest, NextResponse } from "next/server";
import {
  deleteSetsAndExercises,
  insertSets,
} from "@/lib/api/workout";

export async function POST(
  req: NextRequest,
  { params }: { params: { action: "delete" | "insert" } }
) {
  const body = await req.json();

  try {
    if (params.action === "delete") {
      const { setIds, exerciseIds } = body;
      await deleteSetsAndExercises(setIds, exerciseIds);
    } else if (params.action === "insert") {
      await insertSets(body.formattedSets);
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 