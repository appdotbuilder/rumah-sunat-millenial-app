
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type Obat, type FilterObatInput } from '../schema';
import { and, ilike, lte, type SQL } from 'drizzle-orm';

export async function getObat(filter?: FilterObatInput): Promise<Obat[]> {
  try {
    // Build conditions array for filtering
    const conditions: SQL<unknown>[] = [];

    if (filter?.nama_obat) {
      conditions.push(ilike(obatTable.nama_obat, `%${filter.nama_obat}%`));
    }

    if (filter?.jenis) {
      conditions.push(ilike(obatTable.jenis, `%${filter.jenis}%`));
    }

    if (filter?.stok_rendah === true) {
      conditions.push(lte(obatTable.stok_tersedia, obatTable.ambang_batas));
    }

    // Build and execute query
    const results = conditions.length > 0
      ? await db.select()
          .from(obatTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute()
      : await db.select()
          .from(obatTable)
          .execute();

    // Return results (no numeric conversion needed - all fields are integers or text)
    return results;
  } catch (error) {
    console.error('Get obat failed:', error);
    throw error;
  }
}
