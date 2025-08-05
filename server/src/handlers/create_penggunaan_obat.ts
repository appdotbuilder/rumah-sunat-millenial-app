
import { db } from '../db';
import { obatTable, penggunaanObatTable } from '../db/schema';
import { type CreatePenggunaanObatInput, type PenggunaanObat } from '../schema';
import { eq } from 'drizzle-orm';

export const createPenggunaanObat = async (input: CreatePenggunaanObatInput): Promise<PenggunaanObat> => {
  try {
    // First, verify the medicine exists and check available stock
    const obatResult = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, input.id_obat))
      .execute();

    if (obatResult.length === 0) {
      throw new Error(`Medicine with ID ${input.id_obat} not found`);
    }

    const obat = obatResult[0];

    // Check if sufficient stock is available
    if (obat.stok_tersedia < input.jumlah_dipakai) {
      throw new Error(`Insufficient stock. Available: ${obat.stok_tersedia}, Required: ${input.jumlah_dipakai}`);
    }

    // Create the usage record
    const penggunaanResult = await db.insert(penggunaanObatTable)
      .values({
        id_obat: input.id_obat,
        tanggal: input.tanggal,
        jumlah_dipakai: input.jumlah_dipakai,
        catatan: input.catatan
      })
      .returning()
      .execute();

    // Update the available stock by subtracting the used amount
    await db.update(obatTable)
      .set({
        stok_tersedia: obat.stok_tersedia - input.jumlah_dipakai,
        updated_at: new Date()
      })
      .where(eq(obatTable.id, input.id_obat))
      .execute();

    return penggunaanResult[0];
  } catch (error) {
    console.error('Medicine usage creation failed:', error);
    throw error;
  }
};
