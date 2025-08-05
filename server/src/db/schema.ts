
import { serial, text, pgTable, timestamp, integer, numeric, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum definitions
export const jenisKelaminEnum = pgEnum('jenis_kelamin', ['L', 'P']);
export const statusPembayaranEnum = pgEnum('status_pembayaran', ['LUNAS', 'BELUM_LUNAS']);

// Obat table
export const obatTable = pgTable('obat', {
  id: serial('id').primaryKey(),
  nama_obat: text('nama_obat').notNull(),
  kode_obat: text('kode_obat').notNull().unique(),
  jenis: text('jenis').notNull(),
  stok_awal: integer('stok_awal').notNull(),
  stok_tersedia: integer('stok_tersedia').notNull(),
  ambang_batas: integer('ambang_batas').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Penggunaan Obat table
export const penggunaanObatTable = pgTable('penggunaan_obat', {
  id: serial('id').primaryKey(),
  id_obat: integer('id_obat').notNull().references(() => obatTable.id),
  tanggal: timestamp('tanggal').notNull(),
  jumlah_dipakai: integer('jumlah_dipakai').notNull(),
  catatan: text('catatan'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

// Pasien table
export const pasienTable = pgTable('pasien', {
  id: serial('id').primaryKey(),
  nama: text('nama').notNull(),
  umur: integer('umur').notNull(),
  jenis_kelamin: jenisKelaminEnum('jenis_kelamin').notNull(),
  alamat: text('alamat').notNull(),
  kontak: text('kontak').notNull(),
  tanggal_tindakan: timestamp('tanggal_tindakan').notNull(),
  catatan_medis: text('catatan_medis'),
  biaya: numeric('biaya', { precision: 10, scale: 2 }).notNull(),
  status_pembayaran: statusPembayaranEnum('status_pembayaran').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

// Relations
export const obatRelations = relations(obatTable, ({ many }) => ({
  penggunaan: many(penggunaanObatTable)
}));

export const penggunaanObatRelations = relations(penggunaanObatTable, ({ one }) => ({
  obat: one(obatTable, {
    fields: [penggunaanObatTable.id_obat],
    references: [obatTable.id]
  })
}));

// TypeScript types for the table schemas
export type Obat = typeof obatTable.$inferSelect;
export type NewObat = typeof obatTable.$inferInsert;
export type PenggunaanObat = typeof penggunaanObatTable.$inferSelect;
export type NewPenggunaanObat = typeof penggunaanObatTable.$inferInsert;
export type Pasien = typeof pasienTable.$inferSelect;
export type NewPasien = typeof pasienTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = { 
  obat: obatTable, 
  penggunaanObat: penggunaanObatTable, 
  pasien: pasienTable 
};
