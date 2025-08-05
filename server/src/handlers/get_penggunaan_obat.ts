
import { db } from '../db';
import { penggunaanObatTable } from '../db/schema';
import { type PenggunaanObat, type FilterPenggunaanInput } from '../schema';
import { eq, gte, lte, and, desc } from 'drizzle-orm';
import { SQL } from 'drizzle-orm';

export async function getPenggunaanObat(filter?: FilterPenggunaanInput): Promise<PenggunaanObat[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      // Filter by specific medicine ID
      if (filter.id_obat !== undefined) {
        conditions.push(eq(penggunaanObatTable.id_obat, filter.id_obat));
      }

      // Filter by start date (tanggal >= tanggal_mulai)
      if (filter.tanggal_mulai) {
        conditions.push(gte(penggunaanObatTable.tanggal, filter.tanggal_mulai));
      }

      // Filter by end date (tanggal <= tanggal_akhir)
      if (filter.tanggal_akhir) {
        conditions.push(lte(penggunaanObatTable.tanggal, filter.tanggal_akhir));
      }
    }

    // Build query based on whether we have conditions or not
    const results = conditions.length > 0 
      ? await db.select()
          .from(penggunaanObatTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(penggunaanObatTable.tanggal))
          .execute()
      : await db.select()
          .from(penggunaanObatTable)
          .orderBy(desc(penggunaanObatTable.tanggal))
          .execute();

    // Return results directly as they match the PenggunaanObat schema
    return results;
  } catch (error) {
    console.error('Failed to fetch penggunaan obat:', error);
    throw error;
  }
}
