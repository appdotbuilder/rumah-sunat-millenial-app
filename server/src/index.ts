
import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createObatInputSchema, 
  updateObatInputSchema, 
  filterObatInputSchema,
  createPenggunaanObatInputSchema,
  filterPenggunaanInputSchema,
  createPasienInputSchema,
  updatePasienInputSchema,
  filterPasienInputSchema
} from './schema';

// Import handlers
import { createObat } from './handlers/create_obat';
import { getObat } from './handlers/get_obat';
import { updateObat } from './handlers/update_obat';
import { deleteObat } from './handlers/delete_obat';
import { createPenggunaanObat } from './handlers/create_penggunaan_obat';
import { getPenggunaanObat } from './handlers/get_penggunaan_obat';
import { createPasien } from './handlers/create_pasien';
import { getPasien } from './handlers/get_pasien';
import { updatePasien } from './handlers/update_pasien';
import { deletePasien } from './handlers/delete_pasien';
import { getDashboardStats } from './handlers/get_dashboard_stats';
import { getObatHampirHabis } from './handlers/get_obat_hampir_habis';
import { generateKwitansi } from './handlers/generate_kwitansi';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Dashboard
  getDashboardStats: publicProcedure
    .query(() => getDashboardStats()),

  // Obat (Medicine) management
  createObat: publicProcedure
    .input(createObatInputSchema)
    .mutation(({ input }) => createObat(input)),
  
  getObat: publicProcedure
    .input(filterObatInputSchema.optional())
    .query(({ input }) => getObat(input)),
  
  updateObat: publicProcedure
    .input(updateObatInputSchema)
    .mutation(({ input }) => updateObat(input)),
  
  deleteObat: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deleteObat(input)),

  getObatHampirHabis: publicProcedure
    .query(() => getObatHampirHabis()),

  // Penggunaan Obat (Medicine Usage)
  createPenggunaanObat: publicProcedure
    .input(createPenggunaanObatInputSchema)
    .mutation(({ input }) => createPenggunaanObat(input)),
  
  getPenggunaanObat: publicProcedure
    .input(filterPenggunaanInputSchema.optional())
    .query(({ input }) => getPenggunaanObat(input)),

  // Pasien (Patient) management
  createPasien: publicProcedure
    .input(createPasienInputSchema)
    .mutation(({ input }) => createPasien(input)),
  
  getPasien: publicProcedure
    .input(filterPasienInputSchema.optional())
    .query(({ input }) => getPasien(input)),
  
  updatePasien: publicProcedure
    .input(updatePasienInputSchema)
    .mutation(({ input }) => updatePasien(input)),
  
  deletePasien: publicProcedure
    .input(z.number())
    .mutation(({ input }) => deletePasien(input)),

  // Kwitansi (Receipt)
  generateKwitansi: publicProcedure
    .input(z.number())
    .mutation(({ input }) => generateKwitansi(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();
