
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type UpdatePasienInput, type Pasien } from '../schema';
import { eq } from 'drizzle-orm';

export const updatePasien = async (input: UpdatePasienInput): Promise<Pasien> => {
  try {
    // Build update object with only provided fields
    const updateData: any = {};
    
    if (input.nama !== undefined) updateData.nama = input.nama;
    if (input.umur !== undefined) updateData.umur = input.umur;
    if (input.jenis_kelamin !== undefined) updateData.jenis_kelamin = input.jenis_kelamin;
    if (input.alamat !== undefined) updateData.alamat = input.alamat;
    if (input.kontak !== undefined) updateData.kontak = input.kontak;
    if (input.tanggal_tindakan !== undefined) updateData.tanggal_tindakan = input.tanggal_tindakan;
    if (input.catatan_medis !== undefined) updateData.catatan_medis = input.catatan_medis;
    if (input.biaya !== undefined) updateData.biaya = input.biaya.toString(); // Convert number to string for numeric column
    if (input.status_pembayaran !== undefined) updateData.status_pembayaran = input.status_pembayaran;

    // Always update the updated_at timestamp
    updateData.updated_at = new Date();

    // Update patient record
    const result = await db.update(pasienTable)
      .set(updateData)
      .where(eq(pasienTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Patient with id ${input.id} not found`);
    }

    // Convert numeric fields back to numbers before returning
    const pasien = result[0];
    return {
      ...pasien,
      biaya: parseFloat(pasien.biaya) // Convert string back to number
    };
  } catch (error) {
    console.error('Patient update failed:', error);
    throw error;
  }
};
