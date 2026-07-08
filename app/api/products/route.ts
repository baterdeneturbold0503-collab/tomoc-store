import { NextResponse } from "next/server";
import { getServerProducts } from "@/lib/server-catalog";

export const revalidate=60;
export async function GET(){const products=await getServerProducts();return NextResponse.json({products},{headers:{"cache-control":"public, s-maxage=60, stale-while-revalidate=300"}})}
