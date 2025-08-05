
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type CreateObatInput, type FilterObatInput } from '../schema';
import { getObat } from '../handlers/get_obat';

// Test data
const testObat1: CreateObatInput = {
  nama_obat: 'Paracetamol 500mg',
  kode_obat: 'PCM001',
  jenis: 'Analgesik',
  stok_awal: 100,
  ambang_batas: 20
};

const testObat2: CreateObatInput = {
  nama_obat: 'Amoxicillin 250mg',
  kode_obat: 'AMX001', 
  jenis: 'Antibiotik',
  stok_awal: 50,
  ambang_batas: 10
};

const testObat3: CreateObatInput = {
  nama_obat: 'Ibuprofen 400mg',
  kode_obat: 'IBU001',
  jenis: 'Analgesik',
  stok_awal: 30,
  ambang_batas: 15
};

describe('getObat', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all obat when no filter is provided', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: testObat1.stok_awal },
      { ...testObat2, stok_tersedia: testObat2.stok_awal },
      { ...testObat3, stok_tersedia: testObat3.stok_awal }
    ]).execute();

    const results = await getObat();

    expect(results).toHaveLength(3);
    expect(results[0].nama_obat).toBeDefined();
    expect(results[0].kode_obat).toBeDefined();
    expect(results[0].jenis).toBeDefined();
    expect(results[0].stok_awal).toBeDefined();
    expect(results[0].stok_tersedia).toBeDefined();
    expect(results[0].ambang_batas).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(results[0].updated_at).toBeInstanceOf(Date);
  });

  it('should filter by nama_obat', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: testObat1.stok_awal },
      { ...testObat2, stok_tersedia: testObat2.stok_awal }
    ]).execute();

    const filter: FilterObatInput = {
      nama_obat: 'Paracetamol'
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Paracetamol 500mg');
    expect(results[0].kode_obat).toEqual('PCM001');
  });

  it('should filter by jenis', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: testObat1.stok_awal },
      { ...testObat2, stok_tersedia: testObat2.stok_awal },
      { ...testObat3, stok_tersedia: testObat3.stok_awal }
    ]).execute();

    const filter: FilterObatInput = {
      jenis: 'Analgesik'
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(2);
    results.forEach(obat => {
      expect(obat.jenis).toEqual('Analgesik');
    });
  });

  it('should filter by stok_rendah when true', async () => {
    // Create test data with low stock
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: 15 }, // Below ambang_batas (20)
      { ...testObat2, stok_tersedia: 5 },  // Below ambang_batas (10)
      { ...testObat3, stok_tersedia: 25 }  // Above ambang_batas (15)
    ]).execute();

    const filter: FilterObatInput = {
      stok_rendah: true
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(2);
    results.forEach(obat => {
      expect(obat.stok_tersedia).toBeLessThanOrEqual(obat.ambang_batas);
    });
  });

  it('should not filter when stok_rendah is false', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: 15 }, // Below ambang_batas
      { ...testObat2, stok_tersedia: 25 }  // Above ambang_batas
    ]).execute();

    const filter: FilterObatInput = {
      stok_rendah: false
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(2); // Should return all, no filtering applied
  });

  it('should combine multiple filters', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: 15 }, // Analgesik, low stock
      { ...testObat2, stok_tersedia: 5 },  // Antibiotik, low stock
      { ...testObat3, stok_tersedia: 10 }  // Analgesik, low stock
    ]).execute();

    const filter: FilterObatInput = {
      jenis: 'Analgesik',
      stok_rendah: true
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(2);
    results.forEach(obat => {
      expect(obat.jenis).toEqual('Analgesik');
      expect(obat.stok_tersedia).toBeLessThanOrEqual(obat.ambang_batas);
    });
  });

  it('should return empty array when no matches found', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: testObat1.stok_awal }
    ]).execute();

    const filter: FilterObatInput = {
      nama_obat: 'NonExistentMedicine'
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(0);
  });

  it('should perform case-insensitive search', async () => {
    // Create test data
    await db.insert(obatTable).values([
      { ...testObat1, stok_tersedia: testObat1.stok_awal }
    ]).execute();

    const filter: FilterObatInput = {
      nama_obat: 'paracetamol' // lowercase
    };

    const results = await getObat(filter);

    expect(results).toHaveLength(1);
    expect(results[0].nama_obat).toEqual('Paracetamol 500mg');
  });
});
