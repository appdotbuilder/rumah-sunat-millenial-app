
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type CreatePasienInput } from '../schema';
import { generateKwitansi } from '../handlers/generate_kwitansi';

// Test patient data
const testPatient: CreatePasienInput = {
  nama: 'John Doe',
  umur: 35,
  jenis_kelamin: 'L',
  alamat: 'Jl. Test No. 123',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan_medis: 'Pemeriksaan rutin',
  biaya: 150000,
  status_pembayaran: 'LUNAS'
};

describe('generateKwitansi', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should generate kwitansi for existing patient', async () => {
    // Create test patient
    const insertResult = await db.insert(pasienTable)
      .values({
        ...testPatient,
        biaya: testPatient.biaya.toString()
      })
      .returning()
      .execute();

    const patientId = insertResult[0].id;

    // Generate kwitansi
    const result = await generateKwitansi(patientId);

    // Verify kwitansi structure
    expect(result.pasien.id).toEqual(patientId);
    expect(result.pasien.nama).toEqual('John Doe');
    expect(result.pasien.umur).toEqual(35);
    expect(result.pasien.jenis_kelamin).toEqual('L');
    expect(result.pasien.alamat).toEqual('Jl. Test No. 123');
    expect(result.pasien.kontak).toEqual('081234567890');
    expect(result.pasien.biaya).toEqual(150000);
    expect(typeof result.pasien.biaya).toEqual('number');
    expect(result.pasien.status_pembayaran).toEqual('LUNAS');
    expect(result.pasien.created_at).toBeInstanceOf(Date);
    expect(result.pasien.updated_at).toBeInstanceOf(Date);

    // Verify receipt number format
    expect(result.nomor_kwitansi).toMatch(/^KWT-\d{4}-\d+$/);
    expect(result.nomor_kwitansi).toContain(`KWT-${patientId.toString().padStart(4, '0')}`);

    // Verify tanggal_cetak is recent
    expect(result.tanggal_cetak).toBeInstanceOf(Date);
    const now = new Date();
    const timeDiff = Math.abs(now.getTime() - result.tanggal_cetak.getTime());
    expect(timeDiff).toBeLessThan(1000); // Within 1 second
  });

  it('should generate unique receipt numbers', async () => {
    // Create test patient
    const insertResult = await db.insert(pasienTable)
      .values({
        ...testPatient,
        biaya: testPatient.biaya.toString()
      })
      .returning()
      .execute();

    const patientId = insertResult[0].id;

    // Generate multiple kwitansi
    const kwitansi1 = await generateKwitansi(patientId);
    const kwitansi2 = await generateKwitansi(patientId);

    // Receipt numbers should be different
    expect(kwitansi1.nomor_kwitansi).not.toEqual(kwitansi2.nomor_kwitansi);
    
    // Both should have the same patient ID in the receipt number
    expect(kwitansi1.nomor_kwitansi).toContain(`KWT-${patientId.toString().padStart(4, '0')}`);
    expect(kwitansi2.nomor_kwitansi).toContain(`KWT-${patientId.toString().padStart(4, '0')}`);
  });

  it('should throw error for non-existent patient', async () => {
    const nonExistentId = 99999;
    
    await expect(generateKwitansi(nonExistentId))
      .rejects
      .toThrow(/Patient with id 99999 not found/i);
  });

  it('should handle patient with null catatan_medis', async () => {
    // Create patient without medical notes
    const patientWithoutNotes = {
      ...testPatient,
      catatan_medis: null
    };

    const insertResult = await db.insert(pasienTable)
      .values({
        ...patientWithoutNotes,
        biaya: patientWithoutNotes.biaya.toString()
      })
      .returning()
      .execute();

    const patientId = insertResult[0].id;

    // Generate kwitansi
    const result = await generateKwitansi(patientId);

    expect(result.pasien.catatan_medis).toBeNull();
    expect(result.nomor_kwitansi).toBeDefined();
    expect(result.tanggal_cetak).toBeInstanceOf(Date);
  });
});
