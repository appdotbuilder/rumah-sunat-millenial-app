
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type CreatePasienInput } from '../schema';
import { createPasien } from '../handlers/create_pasien';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreatePasienInput = {
  nama: 'John Doe',
  umur: 35,
  jenis_kelamin: 'L',
  alamat: 'Jl. Sudirman No. 123, Jakarta',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan_medis: 'Pemeriksaan rutin',
  biaya: 150000.50,
  status_pembayaran: 'LUNAS'
};

describe('createPasien', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a patient with all fields', async () => {
    const result = await createPasien(testInput);

    // Validate all returned fields
    expect(result.nama).toEqual('John Doe');
    expect(result.umur).toEqual(35);
    expect(result.jenis_kelamin).toEqual('L');
    expect(result.alamat).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(result.kontak).toEqual('081234567890');
    expect(result.tanggal_tindakan).toEqual(new Date('2024-01-15'));
    expect(result.catatan_medis).toEqual('Pemeriksaan rutin');
    expect(result.biaya).toEqual(150000.50);
    expect(result.status_pembayaran).toEqual('LUNAS');
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save patient to database correctly', async () => {
    const result = await createPasien(testInput);

    // Query database to verify saved data
    const patients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, result.id))
      .execute();

    expect(patients).toHaveLength(1);
    const savedPatient = patients[0];
    
    expect(savedPatient.nama).toEqual('John Doe');
    expect(savedPatient.umur).toEqual(35);
    expect(savedPatient.jenis_kelamin).toEqual('L');
    expect(savedPatient.alamat).toEqual('Jl. Sudirman No. 123, Jakarta');
    expect(savedPatient.kontak).toEqual('081234567890');
    expect(savedPatient.tanggal_tindakan).toEqual(new Date('2024-01-15'));
    expect(savedPatient.catatan_medis).toEqual('Pemeriksaan rutin');
    expect(parseFloat(savedPatient.biaya)).toEqual(150000.50); // Verify numeric conversion
    expect(savedPatient.status_pembayaran).toEqual('LUNAS');
    expect(savedPatient.created_at).toBeInstanceOf(Date);
    expect(savedPatient.updated_at).toBeInstanceOf(Date);
  });

  it('should handle patient with null catatan_medis', async () => {
    const inputWithoutCatatan: CreatePasienInput = {
      ...testInput,
      catatan_medis: null
    };

    const result = await createPasien(inputWithoutCatatan);

    expect(result.catatan_medis).toBeNull();
    expect(result.nama).toEqual('John Doe');
    expect(result.biaya).toEqual(150000.50);
    expect(typeof result.biaya).toEqual('number');
  });

  it('should handle female patient correctly', async () => {
    const femalePatientInput: CreatePasienInput = {
      ...testInput,
      nama: 'Jane Smith',
      jenis_kelamin: 'P',
      status_pembayaran: 'BELUM_LUNAS'
    };

    const result = await createPasien(femalePatientInput);

    expect(result.nama).toEqual('Jane Smith');
    expect(result.jenis_kelamin).toEqual('P');
    expect(result.status_pembayaran).toEqual('BELUM_LUNAS');
    expect(result.biaya).toEqual(150000.50);
    expect(typeof result.biaya).toEqual('number');
  });

  it('should handle precise decimal values', async () => {
    const preciseInput: CreatePasienInput = {
      ...testInput,
      biaya: 99999.99
    };

    const result = await createPasien(preciseInput);

    expect(result.biaya).toEqual(99999.99);
    expect(typeof result.biaya).toEqual('number');

    // Verify in database
    const patients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, result.id))
      .execute();

    expect(parseFloat(patients[0].biaya)).toEqual(99999.99);
  });
});
