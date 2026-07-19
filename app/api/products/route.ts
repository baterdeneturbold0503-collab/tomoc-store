import { NextResponse } from "next/server";
import { getServerProducts } from "@/lib/server-catalog";

export const dynamic="force-dynamic";
export const revalidate=0;
export async function GET(){const products=await getServerProducts();return NextResponse.json({products},{headers:{"cache-control":"no-store, no-cache, must-revalidate, proxy-revalidate"}})}
