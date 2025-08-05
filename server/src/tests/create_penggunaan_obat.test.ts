
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable, penggunaanObatTable } from '../db/schema';
import { type CreatePenggunaanObatInput } from '../schema';
import { createPenggunaanObat } from '../handlers/create_penggunaan_obat';
import { eq } from 'drizzle-orm';

// Test medicine data
const testObat = {
  nama_obat: 'Paracetamol',
  kode_obat: 'PCM001',
  jenis: 'Tablet',
  stok_awal: 100,
  stok_tersedia: 100,
  ambang_batas: 10
};

// Test usage input
const testInput: CreatePenggunaanObatInput = {
  id_obat: 0, // Will be set after creating medicine
  tanggal: new Date('2024-01-15'),
  jumlah_dipakai: 20,
  catatan: 'Used for patient treatment'
};

describe('createPenggunaanObat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create medicine usage record', async () => {
    // Create a medicine first
    const obatResult = await db.insert(obatTable)
      .values(testObat)
      .returning()
      .execute();
    
    const createdObat = obatResult[0];
    const input = { ...testInput, id_obat: createdObat.id };

    const result = await createPenggunaanObat(input);

    // Verify the usage record fields
    expect(result.id_obat).toEqual(createdObat.id);
    expect(result.tanggal).toEqual(new Date('2024-01-15'));
    expect(result.jumlah_dipakai).toEqual(20);
    expect(result.catatan).toEqual('Used for patient treatment');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save usage record to database', async () => {
    // Create a medicine first
    const obatResult = await db.insert(obatTable)
      .values(testObat)
      .returning()
      .execute();
    
    const createdObat = obatResult[0];
    const input = { ...testInput, id_obat: createdObat.id };

    const result = await createPenggunaanObat(input);

    // Query the usage record from database
    const usageRecords = await db.select()
      .from(penggunaanObatTable)
      .where(eq(penggunaanObatTable.id, result.id))
      .execute();

    expect(usageRecords).toHaveLength(1);
    expect(usageRecords[0].id_obat).toEqual(createdObat.id);
    expect(usageRecords[0].jumlah_dipakai).toEqual(20);
    expect(usageRecords[0].catatan).toEqual('Used for patient treatment');
    expect(usageRecords[0].created_at).toBeInstanceOf(Date);
  });

  it('should reduce available stock after usage', async () => {
    // Create a medicine first
    const obatResult = await db.insert(obatTable)
      .values(testObat)
      .returning()
      .execute();
    
    const createdObat = obatResult[0];
    const input = { ...testInput, id_obat: createdObat.id };

    await createPenggunaanObat(input);

    // Check that stock was reduced
    const updatedObat = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, createdObat.id))
      .execute();

    expect(updatedObat[0].stok_tersedia).toEqual(80); // 100 - 20 = 80
    expect(updatedObat[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when medicine does not exist', async () => {
    const input = { ...testInput, id_obat: 999 }; // Non-existent ID

    expect(createPenggunaanObat(input)).rejects.toThrow(/medicine with id 999 not found/i);
  });

  it('should throw error when insufficient stock', async () => {
    // Create a medicine with low stock
    const lowStockObat = {
      ...testObat,
      stok_tersedia: 5 // Only 5 available
    };

    const obatResult = await db.insert(obatTable)
      .values(lowStockObat)
      .returning()
      .execute();
    
    const createdObat = obatResult[0];
    const input = { ...testInput, id_obat: createdObat.id }; // Trying to use 20 when only 5 available

    expect(createPenggunaanObat(input)).rejects.toThrow(/insufficient stock/i);
  });

  it('should handle exact stock usage', async () => {
    // Create a medicine with exact stock needed
    const exactStockObat = {
      ...testObat,
      stok_tersedia: 20 // Exactly what we need
    };

    const obatResult = await db.insert(obatTable)
      .values(exactStockObat)
      .returning()
      .execute();
    
    const createdObat = obatResult[0];
    const input = { ...testInput, id_obat: createdObat.id };

    const result = await createPenggunaanObat(input);

    expect(result.jumlah_dipakai).toEqual(20);

    // Check that stock is now zero
    const updatedObat = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, createdObat.id))
      .execute();

    expect(updatedObat[0].stok_tersedia).toEqual(0);
  });
});
