
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type UpdateObatInput, type Obat } from '../schema';
import { eq, sql } from 'drizzle-orm';

export async function updateObat(input: UpdateObatInput): Promise<Obat> {
  try {
    // First check if the medicine exists
    const existingObat = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, input.id))
      .execute();

    if (existingObat.length === 0) {
      throw new Error(`Medicine with id ${input.id} not found`);
    }

    // Prepare update data, excluding undefined values
    const updateData: any = {
      updated_at: sql`now()` // Automatically update timestamp
    };

    if (input.nama_obat !== undefined) {
      updateData.nama_obat = input.nama_obat;
    }
    if (input.kode_obat !== undefined) {
      updateData.kode_obat = input.kode_obat;
    }
    if (input.jenis !== undefined) {
      updateData.jenis = input.jenis;
    }
    if (input.stok_awal !== undefined) {
      updateData.stok_awal = input.stok_awal;
      // When stok_awal is updated, recalculate stok_tersedia
      // Get current usage to calculate new available stock
      const currentObat = existingObat[0];
      const usedStock = currentObat.stok_awal - currentObat.stok_tersedia;
      updateData.stok_tersedia = input.stok_awal - usedStock;
    }
    if (input.ambang_batas !== undefined) {
      updateData.ambang_batas = input.ambang_batas;
    }

    // Update the medicine record
    const result = await db.update(obatTable)
      .set(updateData)
      .where(eq(obatTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Medicine update failed:', error);
    throw error;
  }
}
