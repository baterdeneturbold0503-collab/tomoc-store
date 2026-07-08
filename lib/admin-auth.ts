import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "./supabase-server";

export async function authorizeAdmin(request:Request){
  const supabase=getSupabaseAdmin();if(!supabase)return {error:NextResponse.json({error:"Supabase server тохируулаагүй байна."},{status:503})};
  const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"");if(!token)return {error:NextResponse.json({error:"Нэвтрэх шаардлагатай."},{status:401})};
  const {data:{user},error}=await supabase.auth.getUser(token);if(error||!user)return {error:NextResponse.json({error:"Session хүчингүй байна."},{status:401})};
  const {data:profile}=await supabase.from("profiles").select("role,full_name").eq("id",user.id).single();if(profile?.role!=="admin")return {error:NextResponse.json({error:"Админ эрх шаардлагатай."},{status:403})};
  return {supabase,user,profile};
}
