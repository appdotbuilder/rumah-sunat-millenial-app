
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { pasienTable } from '../db/schema';
import { type CreatePasienInput, type FilterPasienInput } from '../schema';
import { getPasien } from '../handlers/get_pasien';

// Test pasien data
const testPasien1: CreatePasienInput = {
  nama: 'John Doe',
  umur: 30,
  jenis_kelamin: 'L',
  alamat: 'Jl. Test 123',
  kontak: '081234567890',
  tanggal_tindakan: new Date('2024-01-15'),
  catatan_medis: 'Demam tinggi',
  biaya: 150000.00,
  status_pembayaran: 'LUNAS'
};

const testPasien2: CreatePasienInput = {
  nama: 'Jane Smith',
  umur: 25,
  jenis_kelamin: 'P',
  alamat: 'Jl. Test 456',
  kontak: '081234567891',
  tanggal_tindakan: new Date('2024-01-20'),
  catatan_medis: null,
  biaya: 200000.00,
  status_pembayaran: 'BELUM_LUNAS'
};

const testPasien3: CreatePasienInput = {
  nama: 'Ahmad Johnson',
  umur: 45,
  jenis_kelamin: 'L',
  alamat: 'Jl. Test 789',
  kontak: '081234567892',
  tanggal_tindakan: new Date('2024-02-01'),
  catatan_medis: 'Kontrol rutin',
  biaya: 100000.00,
  status_pembayaran: 'LUNAS'
};

describe('getPasien', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all patients when no filter is provided', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      },
      {
        ...testPasien2,
        biaya: testPasien2.biaya.toString()
      }
    ]).execute();

    const result = await getPasien();

    expect(result).toHaveLength(2);
    expect(result[0].nama).toEqual('John Doe');
    expect(result[0].biaya).toEqual(150000.00);
    expect(typeof result[0].biaya).toEqual('number');
    expect(result[1].nama).toEqual('Jane Smith');
    expect(result[1].biaya).toEqual(200000.00);
  });

  it('should filter patients by name (case insensitive)', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      },
      {
        ...testPasien2,
        biaya: testPasien2.biaya.toString()
      }
    ]).execute();

    const filter: FilterPasienInput = {
      nama: 'john'
    };

    const result = await getPasien(filter);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('John Doe');
  });

  it('should filter patients by date range', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      },
      {
        ...testPasien2,
        biaya: testPasien2.biaya.toString()
      },
      {
        ...testPasien3,
        biaya: testPasien3.biaya.toString()
      }
    ]).execute();

    const filter: FilterPasienInput = {
      tanggal_mulai: new Date('2024-01-10'),
      tanggal_akhir: new Date('2024-01-25')
    };

    const result = await getPasien(filter);

    expect(result).toHaveLength(2);
    expect(result.map(p => p.nama)).toContain('John Doe');
    expect(result.map(p => p.nama)).toContain('Jane Smith');
    expect(result.map(p => p.nama)).not.toContain('Ahmad Johnson');
  });

  it('should filter patients by gender', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      },
      {
        ...testPasien2,
        biaya: testPasien2.biaya.toString()
      }
    ]).execute();

    const filter: FilterPasienInput = {
      jenis_kelamin: 'P'
    };

    const result = await getPasien(filter);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('Jane Smith');
    expect(result[0].jenis_kelamin).toEqual('P');
  });

  it('should filter patients by payment status', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      },
      {
        ...testPasien2,
        biaya: testPasien2.biaya.toString()
      }
    ]).execute();

    const filter: FilterPasienInput = {
      status_pembayaran: 'BELUM_LUNAS'
    };

    const result = await getPasien(filter);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('Jane Smith');
    expect(result[0].status_pembayaran).toEqual('BELUM_LUNAS');
  });

  it('should combine multiple filters correctly', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      },
      {
        ...testPasien2,
        biaya: testPasien2.biaya.toString()
      },
      {
        ...testPasien3,
        biaya: testPasien3.biaya.toString()
      }
    ]).execute();

    const filter: FilterPasienInput = {
      jenis_kelamin: 'L',
      status_pembayaran: 'LUNAS',
      tanggal_mulai: new Date('2024-01-01'),
      tanggal_akhir: new Date('2024-01-31')
    };

    const result = await getPasien(filter);

    expect(result).toHaveLength(1);
    expect(result[0].nama).toEqual('John Doe');
    expect(result[0].jenis_kelamin).toEqual('L');
    expect(result[0].status_pembayaran).toEqual('LUNAS');
  });

  it('should return empty array when no patients match filter', async () => {
    // Create test patients
    await db.insert(pasienTable).values([
      {
        ...testPasien1,
        biaya: testPasien1.biaya.toString()
      }
    ]).execute();

    const filter: FilterPasienInput = {
      nama: 'Nonexistent Patient'
    };

    const result = await getPasien(filter);

    expect(result).toHaveLength(0);
  });
});
