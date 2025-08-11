import { NextRequest, NextResponse } from "next/server";
import { insertPantryItem } from "@/lib/api/food";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await insertPantryItem(body);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error('API error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 