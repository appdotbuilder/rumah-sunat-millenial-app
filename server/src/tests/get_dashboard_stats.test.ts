
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { obatTable, pasienTable, penggunaanObatTable } from '../db/schema';
import { getDashboardStats } from '../handlers/get_dashboard_stats';

describe('getDashboardStats', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return zero stats for empty database', async () => {
    const result = await getDashboardStats();

    expect(result.total_obat).toEqual(0);
    expect(result.total_pasien).toEqual(0);
    expect(result.obat_hampir_habis).toEqual(0);
    expect(result.total_penggunaan_hari_ini).toEqual(0);
  });

  it('should count total medicines and patients correctly', async () => {
    // Create test medicines
    await db.insert(obatTable).values([
      {
        nama_obat: 'Paracetamol',
        kode_obat: 'PCM001',
        jenis: 'Analgesik',
        stok_awal: 100,
        stok_tersedia: 50,
        ambang_batas: 20
      },
      {
        nama_obat: 'Amoxicillin',
        kode_obat: 'AMX001',
        jenis: 'Antibiotik',
        stok_awal: 80,
        stok_tersedia: 60,
        ambang_batas: 15
      }
    ]).execute();

    // Create test patients
    await db.insert(pasienTable).values([
      {
        nama: 'John Doe',
        umur: 30,
        jenis_kelamin: 'L',
        alamat: 'Jalan Test 123',
        kontak: '081234567890',
        tanggal_tindakan: new Date(),
        catatan_medis: 'Test catatan',
        biaya: '100000.00',
        status_pembayaran: 'LUNAS'
      },
      {
        nama: 'Jane Smith',
        umur: 25,
        jenis_kelamin: 'P',
        alamat: 'Jalan Test 456',
        kontak: '081234567891',
        tanggal_tindakan: new Date(),
        catatan_medis: null,
        biaya: '150000.00',
        status_pembayaran: 'BELUM_LUNAS'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.total_obat).toEqual(2);
    expect(result.total_pasien).toEqual(2);
  });

  it('should identify medicines with low stock correctly', async () => {
    // Create medicines - some with low stock, some with adequate stock
    await db.insert(obatTable).values([
      {
        nama_obat: 'Medicine Low Stock',
        kode_obat: 'LOW001',
        jenis: 'Test',
        stok_awal: 100,
        stok_tersedia: 10, // Below threshold of 20
        ambang_batas: 20
      },
      {
        nama_obat: 'Medicine Critical Stock',
        kode_obat: 'CRIT001',
        jenis: 'Test',
        stok_awal: 50,
        stok_tersedia: 5, // Equal to threshold
        ambang_batas: 5
      },
      {
        nama_obat: 'Medicine Good Stock',
        kode_obat: 'GOOD001',
        jenis: 'Test',
        stok_awal: 100,
        stok_tersedia: 80, // Above threshold of 20
        ambang_batas: 20
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.total_obat).toEqual(3);
    expect(result.obat_hampir_habis).toEqual(2); // Two medicines at or below threshold
  });

  it('should calculate today medicine usage correctly', async () => {
    // Create test medicine first
    const obatResult = await db.insert(obatTable).values({
      nama_obat: 'Test Medicine',
      kode_obat: 'TEST001',
      jenis: 'Test',
      stok_awal: 100,
      stok_tersedia: 80,
      ambang_batas: 20
    }).returning().execute();

    const obatId = obatResult[0].id;

    // Create usage records for today
    const today = new Date();
    await db.insert(penggunaanObatTable).values([
      {
        id_obat: obatId,
        tanggal: today,
        jumlah_dipakai: 10,
        catatan: 'Morning usage'
      },
      {
        id_obat: obatId,
        tanggal: today,
        jumlah_dipakai: 15,
        catatan: 'Afternoon usage'
      }
    ]).execute();

    // Create usage record for yesterday (should not be counted)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await db.insert(penggunaanObatTable).values({
      id_obat: obatId,
      tanggal: yesterday,
      jumlah_dipakai: 20,
      catatan: 'Yesterday usage'
    }).execute();

    const result = await getDashboardStats();

    expect(result.total_penggunaan_hari_ini).toEqual(25); // 10 + 15 from today only
  });

  it('should handle complete dashboard scenario', async () => {
    // Create medicines with various stock levels
    const obatResults = await db.insert(obatTable).values([
      {
        nama_obat: 'Medicine A',
        kode_obat: 'MED001',
        jenis: 'Type A',
        stok_awal: 100,
        stok_tersedia: 5, // Low stock
        ambang_batas: 10
      },
      {
        nama_obat: 'Medicine B',
        kode_obat: 'MED002',
        jenis: 'Type B',
        stok_awal: 50,
        stok_tersedia: 25, // Good stock
        ambang_batas: 10
      }
    ]).returning().execute();

    // Create patients
    await db.insert(pasienTable).values({
      nama: 'Test Patient',
      umur: 35,
      jenis_kelamin: 'L',
      alamat: 'Test Address',
      kontak: '081234567890',
      tanggal_tindakan: new Date(),
      catatan_medis: 'Test',
      biaya: '200000.00',
      status_pembayaran: 'LUNAS'
    }).execute();

    // Create today's usage
    const today = new Date();
    await db.insert(penggunaanObatTable).values([
      {
        id_obat: obatResults[0].id,
        tanggal: today,
        jumlah_dipakai: 8,
        catatan: 'Usage A'
      },
      {
        id_obat: obatResults[1].id,
        tanggal: today,
        jumlah_dipakai: 12,
        catatan: 'Usage B'
      }
    ]).execute();

    const result = await getDashboardStats();

    expect(result.total_obat).toEqual(2);
    expect(result.total_pasien).toEqual(1);
    expect(result.obat_hampir_habis).toEqual(1); // Only Medicine A has low stock
    expect(result.total_penggunaan_hari_ini).toEqual(20); // 8 + 12
  });
});
