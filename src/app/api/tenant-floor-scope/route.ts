import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongo";

export async function PUT(req: Request) {
  const body = await req.json();

  const { propertyId, tenantAccountId } = body;
  if (!propertyId || !tenantAccountId) {
    return NextResponse.json(
      { error: "propertyId and tenantAccountId are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const now = new Date();

  const result = await db
    .collection("tenant_floor_scope")
    .findOneAndUpdate(
      { propertyId, tenantAccountId },
      {
        $set: {
          ...body,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: "after" }
    );

  return NextResponse.json({
    ok: true,
    scope: result.value,
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const propertyId = url.searchParams.get("propertyId");
  const tenantAccountId = url.searchParams.get("tenantAccountId");

  if (!propertyId || !tenantAccountId) {
    return NextResponse.json(
      { error: "propertyId and tenantAccountId are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const scope = await db
    .collection("tenant_floor_scope")
    .findOne({ propertyId, tenantAccountId });

  return NextResponse.json({
    ok: true,
    scope,
  });
}
