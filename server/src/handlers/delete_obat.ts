
import { db } from '../db';
import { obatTable, penggunaanObatTable } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function deleteObat(id: number): Promise<{ success: boolean }> {
  try {
    // First check if the medicine exists
    const existingObat = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, id))
      .execute();

    if (existingObat.length === 0) {
      throw new Error(`Obat dengan ID ${id} tidak ditemukan`);
    }

    // Check if there are any usage records for this medicine
    const usageRecords = await db.select()
      .from(penggunaanObatTable)
      .where(eq(penggunaanObatTable.id_obat, id))
      .execute();

    if (usageRecords.length > 0) {
      throw new Error(`Tidak dapat menghapus obat karena masih memiliki ${usageRecords.length} catatan penggunaan`);
    }

    // Delete the medicine record
    await db.delete(obatTable)
      .where(eq(obatTable.id, id))
      .execute();

    return { success: true };
  } catch (error) {
    console.error('Medicine deletion failed:', error);
    throw error;
  }
}
