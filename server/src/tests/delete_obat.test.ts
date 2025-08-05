
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable, penggunaanObatTable } from '../db/schema';
import { deleteObat } from '../handlers/delete_obat';
import { eq } from 'drizzle-orm';

describe('deleteObat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an obat successfully', async () => {
    // Create test medicine
    const testObat = await db.insert(obatTable)
      .values({
        nama_obat: 'Test Medicine',
        kode_obat: 'TEST001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obatId = testObat[0].id;

    // Delete the medicine
    const result = await deleteObat(obatId);

    expect(result.success).toBe(true);

    // Verify medicine is deleted from database
    const medicines = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, obatId))
      .execute();

    expect(medicines).toHaveLength(0);
  });

  it('should throw error when obat does not exist', async () => {
    const nonExistentId = 999;

    await expect(deleteObat(nonExistentId))
      .rejects.toThrow(/tidak ditemukan/i);
  });

  it('should throw error when obat has usage records', async () => {
    // Create test medicine
    const testObat = await db.insert(obatTable)
      .values({
        nama_obat: 'Test Medicine',
        kode_obat: 'TEST001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obatId = testObat[0].id;

    // Create usage record for this medicine
    await db.insert(penggunaanObatTable)
      .values({
        id_obat: obatId,
        tanggal: new Date(),
        jumlah_dipakai: 5,
        catatan: 'Test usage'
      })
      .execute();

    // Try to delete medicine with usage records
    await expect(deleteObat(obatId))
      .rejects.toThrow(/catatan penggunaan/i);

    // Verify medicine still exists in database
    const medicines = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, obatId))
      .execute();

    expect(medicines).toHaveLength(1);
  });

  it('should throw error with correct usage record count', async () => {
    // Create test medicine
    const testObat = await db.insert(obatTable)
      .values({
        nama_obat: 'Test Medicine',
        kode_obat: 'TEST001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 100,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obatId = testObat[0].id;

    // Create multiple usage records
    await db.insert(penggunaanObatTable)
      .values([
        {
          id_obat: obatId,
          tanggal: new Date(),
          jumlah_dipakai: 5,
          catatan: 'Usage 1'
        },
        {
          id_obat: obatId,
          tanggal: new Date(),
          jumlah_dipakai: 3,
          catatan: 'Usage 2'
        }
      ])
      .execute();

    // Try to delete medicine
    await expect(deleteObat(obatId))
      .rejects.toThrow(/2 catatan penggunaan/i);
  });
});
