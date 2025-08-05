
import { z } from 'zod';

// Obat (Medicine) schemas
export const obatSchema = z.object({
  id: z.number(),
  nama_obat: z.string(),
  kode_obat: z.string(),
  jenis: z.string(),
  stok_awal: z.number().int(),
  stok_tersedia: z.number().int(),
  ambang_batas: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Obat = z.infer<typeof obatSchema>;

export const createObatInputSchema = z.object({
  nama_obat: z.string().min(1, "Nama obat wajib diisi"),
  kode_obat: z.string().min(1, "Kode obat wajib diisi"),
  jenis: z.string().min(1, "Jenis obat wajib diisi"),
  stok_awal: z.number().int().nonnegative("Stok awal harus positif"),
  ambang_batas: z.number().int().nonnegative("Ambang batas harus positif")
});

export type CreateObatInput = z.infer<typeof createObatInputSchema>;

export const updateObatInputSchema = z.object({
  id: z.number(),
  nama_obat: z.string().min(1).optional(),
  kode_obat: z.string().min(1).optional(),
  jenis: z.string().min(1).optional(),
  stok_awal: z.number().int().nonnegative().optional(),
  ambang_batas: z.number().int().nonnegative().optional()
});

export type UpdateObatInput = z.infer<typeof updateObatInputSchema>;

// Penggunaan Obat (Medicine Usage) schemas
export const penggunaanObatSchema = z.object({
  id: z.number(),
  id_obat: z.number(),
  tanggal: z.coerce.date(),
  jumlah_dipakai: z.number().int(),
  catatan: z.string().nullable(),
  created_at: z.coerce.date()
});

export type PenggunaanObat = z.infer<typeof penggunaanObatSchema>;

export const createPenggunaanObatInputSchema = z.object({
  id_obat: z.number(),
  tanggal: z.coerce.date(),
  jumlah_dipakai: z.number().int().positive("Jumlah yang dipakai harus positif"),
  catatan: z.string().nullable()
});

export type CreatePenggunaanObatInput = z.infer<typeof createPenggunaanObatInputSchema>;

// Pasien (Patient) schemas
export const jenisKelaminEnum = z.enum(['L', 'P']);

export const pasienSchema = z.object({
  id: z.number(),
  nama: z.string(),
  umur: z.number().int(),
  jenis_kelamin: jenisKelaminEnum,
  alamat: z.string(),
  kontak: z.string(),
  tanggal_tindakan: z.coerce.date(),
  catatan_medis: z.string().nullable(),
  biaya: z.number(),
  status_pembayaran: z.enum(['LUNAS', 'BELUM_LUNAS']),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date()
});

export type Pasien = z.infer<typeof pasienSchema>;

export const createPasienInputSchema = z.object({
  nama: z.string().min(1, "Nama pasien wajib diisi"),
  umur: z.number().int().positive("Umur harus positif"),
  jenis_kelamin: jenisKelaminEnum,
  alamat: z.string().min(1, "Alamat wajib diisi"),
  kontak: z.string().min(1, "Kontak wajib diisi"),
  tanggal_tindakan: z.coerce.date(),
  catatan_medis: z.string().nullable(),
  biaya: z.number().positive("Biaya harus positif"),
  status_pembayaran: z.enum(['LUNAS', 'BELUM_LUNAS'])
});

export type CreatePasienInput = z.infer<typeof createPasienInputSchema>;

export const updatePasienInputSchema = z.object({
  id: z.number(),
  nama: z.string().min(1).optional(),
  umur: z.number().int().positive().optional(),
  jenis_kelamin: jenisKelaminEnum.optional(),
  alamat: z.string().min(1).optional(),
  kontak: z.string().min(1).optional(),
  tanggal_tindakan: z.coerce.date().optional(),
  catatan_medis: z.string().nullable().optional(),
  biaya: z.number().positive().optional(),
  status_pembayaran: z.enum(['LUNAS', 'BELUM_LUNAS']).optional()
});

export type UpdatePasienInput = z.infer<typeof updatePasienInputSchema>;

// Dashboard schemas
export const dashboardStatsSchema = z.object({
  total_obat: z.number(),
  total_pasien: z.number(),
  obat_hampir_habis: z.number(),
  total_penggunaan_hari_ini: z.number()
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;

// Filter schemas
export const filterObatInputSchema = z.object({
  nama_obat: z.string().optional(),
  jenis: z.string().optional(),
  stok_rendah: z.boolean().optional()
});

export type FilterObatInput = z.infer<typeof filterObatInputSchema>;

export const filterPasienInputSchema = z.object({
  nama: z.string().optional(),
  tanggal_mulai: z.coerce.date().optional(),
  tanggal_akhir: z.coerce.date().optional(),
  jenis_kelamin: jenisKelaminEnum.optional(),
  status_pembayaran: z.enum(['LUNAS', 'BELUM_LUNAS']).optional()
});

export type FilterPasienInput = z.infer<typeof filterPasienInputSchema>;

export const filterPenggunaanInputSchema = z.object({
  id_obat: z.number().optional(),
  tanggal_mulai: z.coerce.date().optional(),
  tanggal_akhir: z.coerce.date().optional()
});

export type FilterPenggunaanInput = z.infer<typeof filterPenggunaanInputSchema>;

// Kwitansi schema
export const kwitansiSchema = z.object({
  pasien: pasienSchema,
  nomor_kwitansi: z.string(),
  tanggal_cetak: z.coerce.date()
});

export type Kwitansi = z.infer<typeof kwitansiSchema>;
