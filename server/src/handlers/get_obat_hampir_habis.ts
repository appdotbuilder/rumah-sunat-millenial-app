
import { db } from '../db';
import { obatTable } from '../db/schema';
import { lte } from 'drizzle-orm';
import { type Obat } from '../schema';

export const getObatHampirHabis = async (): Promise<Obat[]> => {
  try {
    // Query medicines where stock available is less than or equal to threshold
    const results = await db.select()
      .from(obatTable)
      .where(lte(obatTable.stok_tersedia, obatTable.ambang_batas))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch medicines with low stock:', error);
    throw error;
  }
};
