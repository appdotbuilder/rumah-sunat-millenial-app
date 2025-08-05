
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type CreatePasienInput } from '../schema';
import { deletePasien } from '../handlers/delete_pasien';
import { eq } from 'drizzle-orm';

const testPatient: CreatePasienInput = {
  nama: 'John Doe',
  umur: 30,
  jenis_kelamin: 'L',
  alamat: 'Jl. Test No. 123',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan_medis: 'Pemeriksaan rutin',
  biaya: 150000,
  status_pembayaran: 'LUNAS'
};

describe('deletePasien', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should delete an existing patient', async () => {
    // Create a patient first
    const insertResult = await db.insert(pasienTable)
      .values({
        nama: testPatient.nama,
        umur: testPatient.umur,
        jenis_kelamin: testPatient.jenis_kelamin,
        alamat: testPatient.alamat,
        kontak: testPatient.kontak,
        tanggal_tindakan: testPatient.tanggal_tindakan,
        catatan_medis: testPatient.catatan_medis,
        biaya: testPatient.biaya.toString(),
        status_pembayaran: testPatient.status_pembayaran
      })
      .returning()
      .execute();

    const patientId = insertResult[0].id;

    // Delete the patient
    const result = await deletePasien(patientId);

    expect(result.success).toBe(true);

    // Verify patient is deleted from database
    const patients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, patientId))
      .execute();

    expect(patients).toHaveLength(0);
  });

  it('should return false when deleting non-existent patient', async () => {
    const nonExistentId = 999;

    const result = await deletePasien(nonExistentId);

    expect(result.success).toBe(false);
  });

  it('should not affect other patients when deleting one', async () => {
    // Create two patients
    const patient1Result = await db.insert(pasienTable)
      .values({
        nama: 'Patient 1',
        umur: 25,
        jenis_kelamin: 'L',
        alamat: 'Address 1',
        kontak: '081111111111',
        tanggal_tindakan: new Date('2024-01-10'),
        catatan_medis: null,
        biaya: '100000',
        status_pembayaran: 'LUNAS'
      })
      .returning()
      .execute();

    const patient2Result = await db.insert(pasienTable)
      .values({
        nama: 'Patient 2',
        umur: 30,
        jenis_kelamin: 'P',
        alamat: 'Address 2',
        kontak: '082222222222',
        tanggal_tindakan: new Date('2024-01-12'),
        catatan_medis: null,
        biaya: '200000',
        status_pembayaran: 'BELUM_LUNAS'
      })
      .returning()
      .execute();

    const patient1Id = patient1Result[0].id;
    const patient2Id = patient2Result[0].id;

    // Delete first patient
    const result = await deletePasien(patient1Id);

    expect(result.success).toBe(true);

    // Verify first patient is deleted
    const deletedPatients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, patient1Id))
      .execute();

    expect(deletedPatients).toHaveLength(0);

    // Verify second patient still exists
    const remainingPatients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, patient2Id))
      .execute();

    expect(remainingPatients).toHaveLength(1);
    expect(remainingPatients[0].nama).toEqual('Patient 2');
  });
});
