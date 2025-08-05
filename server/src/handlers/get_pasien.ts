
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type Pasien, type FilterPasienInput } from '../schema';
import { and, eq, gte, lte, ilike, type SQL } from 'drizzle-orm';

export async function getPasien(filter?: FilterPasienInput): Promise<Pasien[]> {
  try {
    // Build conditions array
    const conditions: SQL<unknown>[] = [];

    if (filter) {
      if (filter.nama) {
        conditions.push(ilike(pasienTable.nama, `%${filter.nama}%`));
      }

      if (filter.tanggal_mulai) {
        conditions.push(gte(pasienTable.tanggal_tindakan, filter.tanggal_mulai));
      }

      if (filter.tanggal_akhir) {
        conditions.push(lte(pasienTable.tanggal_tindakan, filter.tanggal_akhir));
      }

      if (filter.jenis_kelamin) {
        conditions.push(eq(pasienTable.jenis_kelamin, filter.jenis_kelamin));
      }

      if (filter.status_pembayaran) {
        conditions.push(eq(pasienTable.status_pembayaran, filter.status_pembayaran));
      }
    }

    // Execute query with or without conditions
    const results = conditions.length === 0
      ? await db.select().from(pasienTable).execute()
      : await db.select()
          .from(pasienTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .execute();

    // Convert numeric fields back to numbers
    return results.map(pasien => ({
      ...pasien,
      biaya: parseFloat(pasien.biaya)
    }));
  } catch (error) {
    console.error('Get pasien failed:', error);
    throw error;
  }
}
