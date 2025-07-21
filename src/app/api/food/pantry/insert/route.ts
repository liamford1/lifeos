import { NextRequest, NextResponse } from "next/server";
import { insertPantryItem } from "@/lib/api/food";

export async function POST(req: NextRequest) {
  try {
    await insertPantryItem(await req.json());
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 