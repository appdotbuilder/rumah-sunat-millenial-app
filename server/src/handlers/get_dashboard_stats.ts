
import { db } from '../db';
import { obatTable, pasienTable, penggunaanObatTable } from '../db/schema';
import { type DashboardStats } from '../schema';
import { count, lte, gte, and, sum } from 'drizzle-orm';

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Get total number of medicines
    const totalObatResult = await db.select({ count: count() })
      .from(obatTable)
      .execute();

    // Get total number of patients
    const totalPasienResult = await db.select({ count: count() })
      .from(pasienTable)
      .execute();

    // Get medicines with low stock (stok_tersedia <= ambang_batas)
    const obatHampirHabisResult = await db.select({ count: count() })
      .from(obatTable)
      .where(lte(obatTable.stok_tersedia, obatTable.ambang_batas))
      .execute();

    // Get total medicine usage today
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1); // Start of tomorrow

    const penggunaanHariIniResult = await db.select({ 
      total: sum(penggunaanObatTable.jumlah_dipakai) 
    })
      .from(penggunaanObatTable)
      .where(
        and(
          gte(penggunaanObatTable.tanggal, today),
          lte(penggunaanObatTable.tanggal, tomorrow)
        )
      )
      .execute();

    // Extract values and handle null cases
    const totalObat = totalObatResult[0]?.count || 0;
    const totalPasien = totalPasienResult[0]?.count || 0;
    const obatHampirHabis = obatHampirHabisResult[0]?.count || 0;
    const totalPenggunaanHariIni = penggunaanHariIniResult[0]?.total || 0;

    return {
      total_obat: totalObat,
      total_pasien: totalPasien,
      obat_hampir_habis: obatHampirHabis,
      total_penggunaan_hari_ini: Number(totalPenggunaanHariIni)
    };
  } catch (error) {
    console.error('Dashboard stats retrieval failed:', error);
    throw error;
  }
}
