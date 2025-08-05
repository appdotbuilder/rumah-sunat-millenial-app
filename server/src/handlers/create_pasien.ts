
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type CreatePasienInput, type Pasien } from '../schema';

export const createPasien = async (input: CreatePasienInput): Promise<Pasien> => {
  try {
    // Insert pasien record
    const result = await db.insert(pasienTable)
      .values({
        nama: input.nama,
        umur: input.umur,
        jenis_kelamin: input.jenis_kelamin,
        alamat: input.alamat,
        kontak: input.kontak,
        tanggal_tindakan: input.tanggal_tindakan,
        catatan_medis: input.catatan_medis,
        biaya: input.biaya.toString(), // Convert number to string for numeric column
        status_pembayaran: input.status_pembayaran
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const pasien = result[0];
    return {
      ...pasien,
      biaya: parseFloat(pasien.biaya) // Convert string back to number
    };
  } catch (error) {
    console.error('Patient creation failed:', error);
    throw error;
  }
};
