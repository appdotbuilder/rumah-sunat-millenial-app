
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable, penggunaanObatTable } from '../db/schema';
import { type FilterPenggunaanInput } from '../schema';
import { getPenggunaanObat } from '../handlers/get_penggunaan_obat';

describe('getPenggunaanObat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should fetch all penggunaan obat records when no filter is provided', async () => {
    // Create test obat first
    const obatResult = await db.insert(obatTable)
      .values({
        nama_obat: 'Paracetamol',
        kode_obat: 'PCM001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 80,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obatId = obatResult[0].id;

    // Create test penggunaan obat records
    const testDate1 = new Date('2024-01-15');
    const testDate2 = new Date('2024-01-20');

    await db.insert(penggunaanObatTable)
      .values([
        {
          id_obat: obatId,
          tanggal: testDate1,
          jumlah_dipakai: 5,
          catatan: 'Penggunaan rutin'
        },
        {
          id_obat: obatId,
          tanggal: testDate2,
          jumlah_dipakai: 3,
          catatan: 'Penggunaan darurat'
        }
      ])
      .execute();

    const results = await getPenggunaanObat();

    expect(results).toHaveLength(2);
    expect(results[0].id_obat).toEqual(obatId);
    expect(results[0].jumlah_dipakai).toEqual(3); // Most recent first due to ordering
    expect(results[0].catatan).toEqual('Penggunaan darurat');
    expect(results[1].jumlah_dipakai).toEqual(5);
    expect(results[1].catatan).toEqual('Penggunaan rutin');
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
  });

  it('should filter by id_obat correctly', async () => {
    // Create two different obat
    const obat1Result = await db.insert(obatTable)
      .values({
        nama_obat: 'Paracetamol',
        kode_obat: 'PCM001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 80,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obat2Result = await db.insert(obatTable)
      .values({
        nama_obat: 'Ibuprofen',
        kode_obat: 'IBU001',
        jenis: 'Kapsul',
        stok_awal: 50,
        stok_tersedia: 40,
        ambang_batas: 5
      })
      .returning()
      .execute();

    const obat1Id = obat1Result[0].id;
    const obat2Id = obat2Result[0].id;

    // Create penggunaan for both obat
    await db.insert(penggunaanObatTable)
      .values([
        {
          id_obat: obat1Id,
          tanggal: new Date('2024-01-15'),
          jumlah_dipakai: 5,
          catatan: 'Obat 1'
        },
        {
          id_obat: obat2Id,
          tanggal: new Date('2024-01-16'),
          jumlah_dipakai: 2,
          catatan: 'Obat 2'
        }
      ])
      .execute();

    const filter: FilterPenggunaanInput = {
      id_obat: obat1Id
    };

    const results = await getPenggunaanObat(filter);

    expect(results).toHaveLength(1);
    expect(results[0].id_obat).toEqual(obat1Id);
    expect(results[0].catatan).toEqual('Obat 1');
  });

  it('should filter by date range correctly', async () => {
    // Create test obat
    const obatResult = await db.insert(obatTable)
      .values({
        nama_obat: 'Paracetamol',
        kode_obat: 'PCM001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 80,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obatId = obatResult[0].id;

    // Create penggunaan with different dates
    await db.insert(penggunaanObatTable)
      .values([
        {
          id_obat: obatId,
          tanggal: new Date('2024-01-10'),
          jumlah_dipakai: 2,
          catatan: 'Before range'
        },
        {
          id_obat: obatId,
          tanggal: new Date('2024-01-15'), 
          jumlah_dipakai: 5,
          catatan: 'In range'
        },
        {
          id_obat: obatId,
          tanggal: new Date('2024-01-20'),
          jumlah_dipakai: 3,
          catatan: 'In range 2'
        },
        {
          id_obat: obatId,
          tanggal: new Date('2024-01-25'),
          jumlah_dipakai: 1,
          catatan: 'After range'
        }
      ])
      .execute();

    const filter: FilterPenggunaanInput = {
      tanggal_mulai: new Date('2024-01-15'),
      tanggal_akhir: new Date('2024-01-20')
    };

    const results = await getPenggunaanObat(filter);

    expect(results).toHaveLength(2);
    expect(results[0].catatan).toEqual('In range 2'); // Most recent first
    expect(results[1].catatan).toEqual('In range');
  });

  it('should combine multiple filters correctly', async () => {
    // Create two different obat
    const obat1Result = await db.insert(obatTable)
      .values({
        nama_obat: 'Paracetamol',
        kode_obat: 'PCM001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 80,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obat2Result = await db.insert(obatTable)
      .values({
        nama_obat: 'Ibuprofen',
        kode_obat: 'IBU001',
        jenis: 'Kapsul',
        stok_awal: 50,
        stok_tersedia: 40,
        ambang_batas: 5
      })
      .returning()
      .execute();

    const obat1Id = obat1Result[0].id;
    const obat2Id = obat2Result[0].id;

    // Create penggunaan with different combinations
    await db.insert(penggunaanObatTable)
      .values([
        {
          id_obat: obat1Id,
          tanggal: new Date('2024-01-10'),
          jumlah_dipakai: 2,
          catatan: 'Obat 1 early'
        },
        {
          id_obat: obat1Id,
          tanggal: new Date('2024-01-15'),
          jumlah_dipakai: 5,
          catatan: 'Obat 1 target'
        },
        {
          id_obat: obat2Id,
          tanggal: new Date('2024-01-15'),
          jumlah_dipakai: 3,
          catatan: 'Obat 2 same date'
        }
      ])
      .execute();

    const filter: FilterPenggunaanInput = {
      id_obat: obat1Id,
      tanggal_mulai: new Date('2024-01-15'),
      tanggal_akhir: new Date('2024-01-20')
    };

    const results = await getPenggunaanObat(filter);

    expect(results).toHaveLength(1);
    expect(results[0].id_obat).toEqual(obat1Id);
    expect(results[0].catatan).toEqual('Obat 1 target');
  });

  it('should return empty array when no records match filter', async () => {
    const filter: FilterPenggunaanInput = {
      id_obat: 999 // Non-existent obat ID
    };

    const results = await getPenggunaanObat(filter);

    expect(results).toHaveLength(0);
  });

  it('should handle null catatan correctly', async () => {
    // Create test obat
    const obatResult = await db.insert(obatTable)
      .values({
        nama_obat: 'Paracetamol',
        kode_obat: 'PCM001',
        jenis: 'Tablet',
        stok_awal: 100,
        stok_tersedia: 80,
        ambang_batas: 10
      })
      .returning()
      .execute();

    const obatId = obatResult[0].id;

    // Create penggunaan with null catatan
    await db.insert(penggunaanObatTable)
      .values({
        id_obat: obatId,
        tanggal: new Date('2024-01-15'),
        jumlah_dipakai: 5,
        catatan: null
      })
      .execute();

    const results = await getPenggunaanObat();

    expect(results).toHaveLength(1);
    expect(results[0].catatan).toBeNull();
    expect(results[0].jumlah_dipakai).toEqual(5);
  });

  it('should verify foreign key constraint by requiring valid obat ID', async () => {
    // This test ensures foreign key relationship is enforced
    // Attempting to insert penggunaan with non-existent obat ID should fail
    const invalidObatId = 999;

    await expect(
      db.insert(penggunaanObatTable)
        .values({
          id_obat: invalidObatId,
          tanggal: new Date('2024-01-15'),
          jumlah_dipakai: 5,
          catatan: 'Should fail'
        })
        .execute()
    ).rejects.toThrow(/violates foreign key constraint/i);
  });
});
