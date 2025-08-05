
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type UpdateObatInput, type CreateObatInput } from '../schema';
import { updateObat } from '../handlers/update_obat';
import { eq } from 'drizzle-orm';

// Test data
const testObat: CreateObatInput = {
  nama_obat: 'Paracetamol',
  kode_obat: 'PCT001',
  jenis: 'Tablet',
  stok_awal: 100,
  ambang_batas: 10
};

// Helper function to create test medicine directly in database
const createTestObat = async (input: CreateObatInput) => {
  const result = await db.insert(obatTable)
    .values({
      nama_obat: input.nama_obat,
      kode_obat: input.kode_obat,
      jenis: input.jenis,
      stok_awal: input.stok_awal,
      stok_tersedia: input.stok_awal, // Initially same as stok_awal
      ambang_batas: input.ambang_batas
    })
    .returning()
    .execute();

  return result[0];
};

describe('updateObat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update medicine name', async () => {
    // Create initial medicine
    const created = await createTestObat(testObat);

    // Update medicine name
    const updateInput: UpdateObatInput = {
      id: created.id,
      nama_obat: 'Paracetamol 500mg'
    };

    const result = await updateObat(updateInput);

    expect(result.id).toEqual(created.id);
    expect(result.nama_obat).toEqual('Paracetamol 500mg');
    expect(result.kode_obat).toEqual(testObat.kode_obat); // Unchanged
    expect(result.jenis).toEqual(testObat.jenis); // Unchanged
    expect(result.stok_awal).toEqual(testObat.stok_awal); // Unchanged
    expect(result.ambang_batas).toEqual(testObat.ambang_batas); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should update multiple fields', async () => {
    // Create initial medicine
    const created = await createTestObat(testObat);

    // Update multiple fields
    const updateInput: UpdateObatInput = {
      id: created.id,
      nama_obat: 'Aspirin',
      kode_obat: 'ASP001',
      jenis: 'Kaplet',
      ambang_batas: 15
    };

    const result = await updateObat(updateInput);

    expect(result.nama_obat).toEqual('Aspirin');
    expect(result.kode_obat).toEqual('ASP001');
    expect(result.jenis).toEqual('Kaplet');
    expect(result.ambang_batas).toEqual(15);
    expect(result.stok_awal).toEqual(testObat.stok_awal); // Unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update stok_awal and recalculate stok_tersedia', async () => {
    // Create initial medicine
    const created = await createTestObat(testObat);
    
    // Simulate some usage by updating stok_tersedia directly
    await db.update(obatTable)
      .set({ stok_tersedia: 80 }) // 20 units used
      .where(eq(obatTable.id, created.id))
      .execute();

    // Update stok_awal
    const updateInput: UpdateObatInput = {
      id: created.id,
      stok_awal: 150
    };

    const result = await updateObat(updateInput);

    expect(result.stok_awal).toEqual(150);
    expect(result.stok_tersedia).toEqual(130); // 150 - 20 (used stock)
  });

  it('should save updated medicine to database', async () => {
    // Create initial medicine
    const created = await createTestObat(testObat);

    // Update medicine
    const updateInput: UpdateObatInput = {
      id: created.id,
      nama_obat: 'Updated Medicine',
      jenis: 'Sirup'
    };

    await updateObat(updateInput);

    // Verify in database
    const medicines = await db.select()
      .from(obatTable)
      .where(eq(obatTable.id, created.id))
      .execute();

    expect(medicines).toHaveLength(1);
    expect(medicines[0].nama_obat).toEqual('Updated Medicine');
    expect(medicines[0].jenis).toEqual('Sirup');
    expect(medicines[0].kode_obat).toEqual(testObat.kode_obat); // Unchanged
  });

  it('should throw error for non-existent medicine', async () => {
    const updateInput: UpdateObatInput = {
      id: 999,
      nama_obat: 'Non-existent'
    };

    expect(updateObat(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should handle partial updates correctly', async () => {
    // Create initial medicine
    const created = await createTestObat(testObat);

    // Update only ambang_batas
    const updateInput: UpdateObatInput = {
      id: created.id,
      ambang_batas: 25
    };

    const result = await updateObat(updateInput);

    // Only ambang_batas and updated_at should change
    expect(result.ambang_batas).toEqual(25);
    expect(result.nama_obat).toEqual(created.nama_obat);
    expect(result.kode_obat).toEqual(created.kode_obat);
    expect(result.jenis).toEqual(created.jenis);
    expect(result.stok_awal).toEqual(created.stok_awal);
    expect(result.stok_tersedia).toEqual(created.stok_tersedia);
    expect(result.updated_at > created.updated_at).toBe(true);
  });

  it('should handle unique constraint violation for kode_obat', async () => {
    // Create two medicines
    const created1 = await createTestObat(testObat);
    const created2 = await createTestObat({
      ...testObat,
      kode_obat: 'PCT002',
      nama_obat: 'Paracetamol 2'
    });

    // Try to update second medicine with first medicine's kode_obat
    const updateInput: UpdateObatInput = {
      id: created2.id,
      kode_obat: created1.kode_obat // This should cause unique constraint violation
    };

    expect(updateObat(updateInput)).rejects.toThrow();
  });
});
