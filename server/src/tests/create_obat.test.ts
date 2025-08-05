
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type CreateObatInput } from '../schema';
import { createObat } from '../handlers/create_obat';
import { eq } from 'drizzle-orm';

// Test input for creating obat
const testInput: CreateObatInput = {
  nama_obat: 'Paracetamol',
  kode_obat: 'PCM001',
  jenis: 'Tablet',
  stok_awal: 100,
  ambang_batas: 10
};

describe('createObat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an obat with correct fields', async () => {
    const result = await createObat(testInput);

    // Basic field validation
    expect(result.nama_obat).toEqual('Paracetamol');
    expect(result.kode_obat).toEqual('PCM001');
    expect(result.jenis).toEqual('Tablet');
    expect(result.stok_awal).toEqual(100);
    expect(result.stok_tersedia).toEqual(100); // Should equal stok_awal initially
    expect(result.ambang_batas).toEqual(10);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save obat to database', async () => {
    const result = await createObat(testInput);

    // Query using proper drizzle syntax
    const obats = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, result.id))
      .execute();

    expect(obats).toHaveLength(1);
    expect(obats[0].nama_obat).toEqual('Paracetamol');
    expect(obats[0].kode_obat).toEqual('PCM001');
    expect(obats[0].jenis).toEqual('Tablet');
    expect(obats[0].stok_awal).toEqual(100);
    expect(obats[0].stok_tersedia).toEqual(100);
    expect(obats[0].ambang_batas).toEqual(10);
    expect(obats[0].created_at).toBeInstanceOf(Date);
    expect(obats[0].updated_at).toBeInstanceOf(Date);
  });

  it('should set stok_tersedia equal to stok_awal initially', async () => {
    const testWithDifferentStock: CreateObatInput = {
      nama_obat: 'Amoxicillin',
      kode_obat: 'AMX001',
      jenis: 'Kapsul',
      stok_awal: 50,
      ambang_batas: 5
    };

    const result = await createObat(testWithDifferentStock);

    expect(result.stok_awal).toEqual(50);
    expect(result.stok_tersedia).toEqual(50);
    expect(result.stok_tersedia).toEqual(result.stok_awal);
  });

  it('should enforce unique kode_obat constraint', async () => {
    // Create first obat
    await createObat(testInput);

    // Try to create another obat with same kode_obat
    const duplicateInput: CreateObatInput = {
      nama_obat: 'Different Medicine',
      kode_obat: 'PCM001', // Same kode_obat
      jenis: 'Sirup',
      stok_awal: 200,
      ambang_batas: 20
    };

    await expect(createObat(duplicateInput)).rejects.toThrow(/unique/i);
  });

  it('should handle zero stock correctly', async () => {
    const zeroStockInput: CreateObatInput = {
      nama_obat: 'Out of Stock Medicine',
      kode_obat: 'OOS001',
      jenis: 'Tablet',
      stok_awal: 0,
      ambang_batas: 5
    };

    const result = await createObat(zeroStockInput);

    expect(result.stok_awal).toEqual(0);
    expect(result.stok_tersedia).toEqual(0);
  });
});
