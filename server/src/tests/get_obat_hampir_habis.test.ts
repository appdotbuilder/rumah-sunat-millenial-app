
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type CreateObatInput } from '../schema';
import { getObatHampirHabis } from '../handlers/get_obat_hampir_habis';

// Test data for medicines with different stock levels
const obatNormal: CreateObatInput = {
  nama_obat: 'Paracetamol',
  kode_obat: 'PCM001',
  jenis: 'Tablet',
  stok_awal: 100,
  ambang_batas: 10
};

const obatHampirHabis: CreateObatInput = {
  nama_obat: 'Amoxicillin',
  kode_obat: 'AMX001',
  jenis: 'Kapsul',
  stok_awal: 50,
  ambang_batas: 15
};

const obatHabis: CreateObatInput = {
  nama_obat: 'Ibuprofen',
  kode_obat: 'IBU001',
  jenis: 'Tablet',
  stok_awal: 30,
  ambang_batas: 20
};

describe('getObatHampirHabis', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no medicines have low stock', async () => {
    // Create medicine with normal stock (stok_tersedia = stok_awal, which is > ambang_batas)
    await db.insert(obatTable)
      .values({
        ...obatNormal,
        stok_tersedia: obatNormal.stok_awal // 100 > 10 (ambang_batas)
      })
      .execute();

    const result = await getObatHampirHabis();

    expect(result).toHaveLength(0);
  });

  it('should return medicines with stock equal to threshold', async () => {
    // Create medicine with stock exactly at threshold
    await db.insert(obatTable)
      .values({
        ...obatHampirHabis,
        stok_tersedia: obatHampirHabis.ambang_batas // 15 = 15 (ambang_batas)
      })
      .execute();

    const result = await getObatHampirHabis();

    expect(result).toHaveLength(1);
    expect(result[0].nama_obat).toEqual('Amoxicillin');
    expect(result[0].stok_tersedia).toEqual(15);
    expect(result[0].ambang_batas).toEqual(15);
  });

  it('should return medicines with stock below threshold', async () => {
    // Create medicine with stock below threshold
    await db.insert(obatTable)
      .values({
        ...obatHabis,
        stok_tersedia: 5 // 5 < 20 (ambang_batas)
      })
      .execute();

    const result = await getObatHampirHabis();

    expect(result).toHaveLength(1);
    expect(result[0].nama_obat).toEqual('Ibuprofen');
    expect(result[0].stok_tersedia).toEqual(5);
    expect(result[0].ambang_batas).toEqual(20);
  });

  it('should return multiple medicines with low stock', async () => {
    // Create multiple medicines with different stock levels
    await db.insert(obatTable)
      .values([
        {
          ...obatNormal,
          stok_tersedia: obatNormal.stok_awal // Normal stock: 100 > 10
        },
        {
          ...obatHampirHabis,
          stok_tersedia: 10 // Low stock: 10 < 15
        },
        {
          ...obatHabis,
          stok_tersedia: obatHabis.ambang_batas // At threshold: 20 = 20
        }
      ])
      .execute();

    const result = await getObatHampirHabis();

    expect(result).toHaveLength(2);
    
    // Should include both medicines with low stock
    const namaObat = result.map(obat => obat.nama_obat).sort();
    expect(namaObat).toEqual(['Amoxicillin', 'Ibuprofen']);

    // Verify stock levels
    const amoxicillin = result.find(obat => obat.nama_obat === 'Amoxicillin');
    const ibuprofen = result.find(obat => obat.nama_obat === 'Ibuprofen');

    expect(amoxicillin?.stok_tersedia).toEqual(10);
    expect(amoxicillin?.ambang_batas).toEqual(15);
    expect(ibuprofen?.stok_tersedia).toEqual(20);
    expect(ibuprofen?.ambang_batas).toEqual(20);
  });

  it('should return medicines with complete field data', async () => {
    await db.insert(obatTable)
      .values({
        ...obatHampirHabis,
        stok_tersedia: 5 // Below threshold
      })
      .execute();

    const result = await getObatHampirHabis();

    expect(result).toHaveLength(1);
    const obat = result[0];

    // Verify all required fields are present
    expect(obat.id).toBeDefined();
    expect(obat.nama_obat).toEqual('Amoxicillin');
    expect(obat.kode_obat).toEqual('AMX001');
    expect(obat.jenis).toEqual('Kapsul');
    expect(obat.stok_awal).toEqual(50);
    expect(obat.stok_tersedia).toEqual(5);
    expect(obat.ambang_batas).toEqual(15);
    expect(obat.created_at).toBeInstanceOf(Date);
    expect(obat.updated_at).toBeInstanceOf(Date);
  });
});
