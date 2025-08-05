
import { db } from '../db';
import { obatTable } from '../db/schema';
import { type CreateObatInput, type Obat } from '../schema';

export const createObat = async (input: CreateObatInput): Promise<Obat> => {
  try {
    // Insert obat record with stok_tersedia equal to stok_awal initially
    const result = await db.insert(obatTable)
      .values({
        nama_obat: input.nama_obat,
        kode_obat: input.kode_obat,
        jenis: input.jenis,
        stok_awal: input.stok_awal,
        stok_tersedia: input.stok_awal, // Initially available stock equals initial stock
        ambang_batas: input.ambang_batas
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Obat creation failed:', error);
    throw error;
  }
};
