
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type CreatePasienInput, type UpdatePasienInput } from '../schema';
import { updatePasien } from '../handlers/update_pasien';
import { eq } from 'drizzle-orm';

// Test input for creating a patient
const createTestInput: CreatePasienInput = {
  nama: 'John Doe',
  umur: 30,
  jenis_kelamin: 'L',
  alamat: 'Jl. Test No. 123',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan_medis: 'Checkup rutin',
  biaya: 150000,
  status_pembayaran: 'BELUM_LUNAS'
};

// Helper function to create a test patient
const createTestPasien = async () => {
  const result = await db.insert(pasienTable)
    .values({
      nama: createTestInput.nama,
      umur: createTestInput.umur,
      jenis_kelamin: createTestInput.jenis_kelamin,
      alamat: createTestInput.alamat,
      kontak: createTestInput.kontak,
      tanggal_tindakan: createTestInput.tanggal_tindakan,
      catatan_medis: createTestInput.catatan_medis,
      biaya: createTestInput.biaya.toString(),
      status_pembayaran: createTestInput.status_pembayaran
    })
    .returning()
    .execute();

  return {
    ...result[0],
    biaya: parseFloat(result[0].biaya)
  };
};

describe('updatePasien', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update patient name and verify changes', async () => {
    // Create test patient
    const patient = await createTestPasien();
    
    const updateInput: UpdatePasienInput = {
      id: patient.id,
      nama: 'Jane Doe Updated'
    };

    const result = await updatePasien(updateInput);

    // Verify updated fields
    expect(result.nama).toEqual('Jane Doe Updated');
    expect(result.id).toEqual(patient.id);
    
    // Verify unchanged fields remain the same
    expect(result.umur).toEqual(30);
    expect(result.jenis_kelamin).toEqual('L');
    expect(result.alamat).toEqual('Jl. Test No. 123');
    expect(result.biaya).toEqual(150000);
    expect(typeof result.biaya).toEqual('number');
    
    // Verify updated_at was changed
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > patient.updated_at).toBe(true);
  });

  it('should update multiple fields including numeric biaya', async () => {
    // Create test patient
    const patient = await createTestPasien();
    
    const updateInput: UpdatePasienInput = {
      id: patient.id,
      nama: 'Updated Name',
      umur: 35,
      biaya: 200000,
      status_pembayaran: 'LUNAS'
    };

    const result = await updatePasien(updateInput);

    // Verify all updated fields
    expect(result.nama).toEqual('Updated Name');
    expect(result.umur).toEqual(35);
    expect(result.biaya).toEqual(200000);
    expect(typeof result.biaya).toEqual('number');
    expect(result.status_pembayaran).toEqual('LUNAS');
    
    // Verify unchanged fields
    expect(result.jenis_kelamin).toEqual('L');
    expect(result.alamat).toEqual('Jl. Test No. 123');
    expect(result.kontak).toEqual('081234567890');
  });

  it('should save changes to database correctly', async () => {
    // Create test patient
    const patient = await createTestPasien();
    
    const updateInput: UpdatePasienInput = {
      id: patient.id,
      nama: 'Database Test',
      biaya: 300000
    };

    await updatePasien(updateInput);

    // Query database directly to verify changes
    const patients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, patient.id))
      .execute();

    expect(patients).toHaveLength(1);
    expect(patients[0].nama).toEqual('Database Test');
    expect(parseFloat(patients[0].biaya)).toEqual(300000);
    expect(patients[0].updated_at).toBeInstanceOf(Date);
    expect(patients[0].updated_at > patient.updated_at).toBe(true);
  });

  it('should update nullable catatan_medis field', async () => {
    // Create test patient
    const patient = await createTestPasien();
    
    const updateInput: UpdatePasienInput = {
      id: patient.id,
      catatan_medis: 'Updated medical notes'
    };

    const result = await updatePasien(updateInput);

    expect(result.catatan_medis).toEqual('Updated medical notes');
    
    // Test setting to null
    const nullUpdateInput: UpdatePasienInput = {
      id: patient.id,
      catatan_medis: null
    };

    const nullResult = await updatePasien(nullUpdateInput);
    expect(nullResult.catatan_medis).toBeNull();
  });

  it('should throw error when patient not found', async () => {
    const updateInput: UpdatePasienInput = {
      id: 99999,
      nama: 'Non-existent Patient'
    };

    expect(updatePasien(updateInput)).rejects.toThrow(/Patient with id 99999 not found/i);
  });

  it('should update date fields correctly', async () => {
    // Create test patient
    const patient = await createTestPasien();
    
    const newDate = new Date('2024-02-20');
    const updateInput: UpdatePasienInput = {
      id: patient.id,
      tanggal_tindakan: newDate
    };

    const result = await updatePasien(updateInput);

    expect(result.tanggal_tindakan).toBeInstanceOf(Date);
    expect(result.tanggal_tindakan.getTime()).toEqual(newDate.getTime());
  });
});
