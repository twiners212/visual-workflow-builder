"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

async function getSessionUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function updateSettingsAction(
  biography: string,
  preferences: any
) {
  try {
    const user = await getSessionUser();
    
    await db
      .update(users)
      .set({
        biography,
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    revalidatePath("/settings");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save settings" };
  }
}

export async function updatePreferencesAction(
  preferences: any
) {
  try {
    const user = await getSessionUser();
    
    await db
      .update(users)
      .set({
        preferences,
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));

    revalidatePath("/settings");
    revalidatePath("/workflows");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update preferences" };
  }
}

export async function getSettingsAction() {
  try {
    const user = await getSessionUser();
    
    const result = await db
      .select({
        biography: users.biography,
        preferences: users.preferences,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    if (result.length === 0) {
      return { success: true, data: { biography: "", preferences: {} } };
    }

    return { 
      success: true, 
      data: { 
        biography: result[0].biography || "", 
        preferences: result[0].preferences || {} 
      } 
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to fetch settings" };
  }
}

export async function deleteAccountAction(confirmEmail: string) {
  try {
    const user = await getSessionUser();
    
    if (!user.email || user.email !== confirmEmail) {
      throw new Error("Confirmation email does not match active user email");
    }

    // Delete user from database (this will cascade delete workflows, sessions, etc.)
    await db.delete(users).where(eq(users.id, user.id));
    
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete account" };
  }
}
