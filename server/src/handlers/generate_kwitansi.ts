
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type Kwitansi } from '../schema';

export async function generateKwitansi(pasienId: number): Promise<Kwitansi> {
  try {
    // Fetch patient data
    const patients = await db.select()
      .from(pasienTable)
      .where(eq(pasienTable.id, pasienId))
      .execute();

    if (patients.length === 0) {
      throw new Error(`Patient with id ${pasienId} not found`);
    }

    const patient = patients[0];

    // Convert numeric field back to number
    const pasien = {
      ...patient,
      biaya: parseFloat(patient.biaya)
    };

    // Generate unique receipt number using timestamp and patient ID
    const timestamp = Date.now();
    const nomor_kwitansi = `KWT-${pasienId.toString().padStart(4, '0')}-${timestamp}`;

    return {
      pasien,
      nomor_kwitansi,
      tanggal_cetak: new Date()
    };
  } catch (error) {
    console.error('Receipt generation failed:', error);
    throw error;
  }
}
