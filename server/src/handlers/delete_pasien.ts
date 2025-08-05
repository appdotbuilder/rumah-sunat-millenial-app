
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deletePasien(id: number): Promise<{ success: boolean }> {
  try {
    const result = await db.delete(pasienTable)
      .where(eq(pasienTable.id, id))
      .returning()
      .execute();

    // Check if any record was actually deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Patient deletion failed:', error);
    throw error;
  }
}
