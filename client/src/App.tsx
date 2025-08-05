
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, Plus, Search, Users, Package, Activity, Receipt, Bell } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { 
  DashboardStats, 
  Obat, 
  Pasien, 
  PenggunaanObat,
  CreateObatInput,
  CreatePasienInput,
  CreatePenggunaanObatInput,
  FilterObatInput,
  FilterPasienInput,
  FilterPenggunaanInput
} from '../../server/src/schema';

function App() {
  // Dashboard stats
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    total_obat: 0,
    total_pasien: 0,
    obat_hampir_habis: 0,
    total_penggunaan_hari_ini: 0
  });

  // State for data
  const [obatList, setObatList] = useState<Obat[]>([]);
  const [pasienList, setPasienList] = useState<Pasien[]>([]);
  const [penggunaanList, setPenggunaanList] = useState<PenggunaanObat[]>([]);
  const [lowStockObat, setLowStockObat] = useState<Obat[]>([]);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Form states
  const [obatForm, setObatForm] = useState<CreateObatInput>({
    nama_obat: '',
    kode_obat: '',
    jenis: '',
    stok_awal: 0,
    ambang_batas: 10
  });

  const [pasienForm, setPasienForm] = useState<CreatePasienInput>({
    nama: '',
    umur: 0,
    jenis_kelamin: 'L',
    alamat: '',
    kontak: '',
    tanggal_tindakan: new Date(),
    catatan_medis: null,
    biaya: 0,
    status_pembayaran: 'BELUM_LUNAS'
  });

  const [penggunaanForm, setPenggunaanForm] = useState<CreatePenggunaanObatInput>({
    id_obat: 0,
    tanggal: new Date(),
    jumlah_dipakai: 0,
    catatan: null
  });

  // Filter states
  const [obatFilter, setObatFilter] = useState<FilterObatInput>({});
  const [pasienFilter, setPasienFilter] = useState<FilterPasienInput>({});
  const [penggunaanFilter, setPenggunaanFilter] = useState<FilterPenggunaanInput>({});

  // Load dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const stats = await trpc.getDashboardStats.query();
      setDashboardStats(stats);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  }, []);

  // Load obat data
  const loadObat = useCallback(async () => {
    try {
      const obat = await trpc.getObat.query(obatFilter);
      setObatList(obat);
      
      const lowStock = await trpc.getObatHampirHabis.query();
      setLowStockObat(lowStock);
    } catch (error) {
      console.error('Failed to load obat:', error);
    }
  }, [obatFilter]);

  // Load pasien data
  const loadPasien = useCallback(async () => {
    try {
      const pasien = await trpc.getPasien.query(pasienFilter);
      setPasienList(pasien);
    } catch (error) {
      console.error('Failed to load pasien:', error);
    }
  }, [pasienFilter]);

  // Load penggunaan data
  const loadPenggunaan = useCallback(async () => {
    try {
      const penggunaan = await trpc.getPenggunaanObat.query(penggunaanFilter);
      setPenggunaanList(penggunaan);
    } catch (error) {
      console.error('Failed to load penggunaan:', error);
    }
  }, [penggunaanFilter]);

  useEffect(() => {
    loadDashboard();
    loadObat();
    loadPasien();
    loadPenggunaan();
  }, [loadDashboard, loadObat, loadPasien, loadPenggunaan]);

  // Handle form submissions
  const handleCreateObat = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createObat.mutate(obatForm);
      setObatForm({
        nama_obat: '',
        kode_obat: '',
        jenis: '',
        stok_awal: 0,
        ambang_batas: 10
      });
      await loadObat();
      await loadDashboard();
    } catch (error) {
      console.error('Failed to create obat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePasien = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createPasien.mutate(pasienForm);
      setPasienForm({
        nama: '',
        umur: 0,
        jenis_kelamin: 'L',
        alamat: '',
        kontak: '',
        tanggal_tindakan: new Date(),
        catatan_medis: null,
        biaya: 0,
        status_pembayaran: 'BELUM_LUNAS'
      });
      await loadPasien();
      await loadDashboard();
    } catch (error) {
      console.error('Failed to create pasien:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePenggunaan = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await trpc.createPenggunaanObat.mutate(penggunaanForm);
      setPenggunaanForm({
        id_obat: 0,
        tanggal: new Date(),
        jumlah_dipakai: 0,
        catatan: null
      });
      await loadPenggunaan();
      await loadObat();
      await loadDashboard();
    } catch (error) {
      console.error('Failed to create penggunaan:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateKwitansi = async (pasienId: number) => {
    try {
      await trpc.generateKwitansi.mutate(pasienId);
      // In a real app, this would open/download the receipt
      alert('Kwitansi berhasil dibuat!');
    } catch (error) {
      console.error('Failed to generate kwitansi:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-100">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-900">Rumah Sunat Millenial</h1>
                <p className="text-sm text-blue-600">Sistem Manajemen Klinik</p>
              </div>
            </div>
            
            {/* Notification badge for low stock */}
            {lowStockObat.length > 0 && (
              <div className="flex items-center space-x-2 bg-red-50 px-3 py-2 rounded-lg">
                <Bell className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-700 font-medium">
                  {lowStockObat.length} Obat Hampir Habis
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="obat" className="flex items-center space-x-2">
              <Package className="w-4 h-4" />
              <span className="hidden sm:inline">Obat</span>
            </TabsTrigger>
            <TabsTrigger value="penggunaan" className="flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Penggunaan</span>
            </TabsTrigger>
            <TabsTrigger value="pasien" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Pasien</span>
            </TabsTrigger>
            <TabsTrigger value="kwitansi" className="flex items-center space-x-2">
              <Receipt className="w-4 h-4" />
              <span className="hidden sm:inline">Kwitansi</span>
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Obat</CardTitle>
                  <Package className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.total_obat}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Pasien</CardTitle>
                  <Users className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.total_pasien}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Obat Hampir Habis</CardTitle>
                  <AlertTriangle className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.obat_hampir_habis}</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Penggunaan Hari Ini</CardTitle>
                  <Activity className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{dashboardStats.total_penggunaan_hari_ini}</div>
                </CardContent>
              </Card>
            </div>

            {/* Low Stock Alerts */}
            {lowStockObat.length > 0 && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="text-red-800 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5" />
                    <span>Peringatan Stok Rendah</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {lowStockObat.map((obat: Obat) => (
                      <div key={obat.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-red-200">
                        <div>
                          <p className="font-medium text-red-900">{obat.nama_obat}</p>
                          <p className="text-sm text-red-600">Kode: {obat.kode_obat}</p>
                        </div>
                        <Badge variant="destructive">
                          Sisa: {obat.stok_tersedia}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Obat Management Tab */}
          <TabsContent value="obat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Obat Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Tambah Obat Baru</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateObat} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama_obat">Nama Obat</Label>
                      <Input
                        id="nama_obat"
                        value={obatForm.nama_obat}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setObatForm((prev: CreateObatInput) => ({ ...prev, nama_obat: e.target.value }))
                        }
                        placeholder="Masukkan nama obat"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kode_obat">Kode Obat</Label>
                      <Input
                        id="kode_obat"
                        value={obatForm.kode_obat}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setObatForm((prev: CreateObatInput) => ({ ...prev, kode_obat: e.target.value }))
                        }
                        placeholder="Masukkan kode obat"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jenis">Jenis Obat</Label>
                      <Input
                        id="jenis"
                        value={obatForm.jenis}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setObatForm((prev: CreateObatInput) => ({ ...prev, jenis: e.target.value }))
                        }
                        placeholder="Antiseptik, Analgesik, dll"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="stok_awal">Stok Awal</Label>
                        <Input
                          id="stok_awal"
                          type="number"
                          value={obatForm.stok_awal}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setObatForm((prev: CreateObatInput) => ({ ...prev, stok_awal: parseInt(e.target.value) || 0 }))
                          }
                          min="0"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ambang_batas">Ambang Batas</Label>
                        <Input
                          id="ambang_batas"
                          type="number"
                          value={obatForm.ambang_batas}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setObatForm((prev: CreateObatInput) => ({ ...prev, ambang_batas: parseInt(e.target.value) || 10 }))
                          }
                          min="0"
                          required
                        />
                      </div>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-700">
                      {isLoading ? 'Menyimpan...' : 'Simpan Obat'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Obat Filter */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Search className="w-5 h-5" />
                    <span>Filter Obat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Cari nama obat..."
                    value={obatFilter.nama_obat || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setObatFilter((prev: FilterObatInput) => ({ ...prev, nama_obat: e.target.value || undefined }))
                    }
                  />
                  <Input
                    placeholder="Filter jenis obat..."
                    value={obatFilter.jenis || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setObatFilter((prev: FilterObatInput) => ({ ...prev, jenis: e.target.value || undefined }))
                    }
                  />
                  <Button onClick={loadObat} className="w-full">
                    Terapkan Filter
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Obat List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Obat</CardTitle>
              </CardHeader>
              <CardContent>
                {obatList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada data obat</p>
                ) : (
                  <div className="grid gap-4">
                    {obatList.map((obat: Obat) => (
                      <div
                        key={obat.id}
                        className={`p-4 border rounded-lg ${
                          obat.stok_tersedia <= obat.ambang_batas
                            ? 'border-red-300 bg-red-50'
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-lg">{obat.nama_obat}</h3>
                            <p className="text-sm text-gray-600">Kode: {obat.kode_obat}</p>
                            <p className="text-sm text-gray-600">Jenis: {obat.jenis}</p>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={obat.stok_tersedia <= obat.ambang_batas ? 'destructive' : 'secondary'}
                            >
                              Stok: {obat.stok_tersedia}
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Ambang batas: {obat.ambang_batas}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Penggunaan Obat Tab */}
          <TabsContent value="penggunaan" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Penggunaan Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Catat Penggunaan Obat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePenggunaan} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="id_obat">Pilih Obat</Label>
                      <Select
                        value={penggunaanForm.id_obat.toString()}
                        onValueChange={(value) =>
                          setPenggunaanForm((prev: CreatePenggunaanObatInput) => ({ ...prev, id_obat: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih obat" />
                        </SelectTrigger>
                        <SelectContent>
                          {obatList.map((obat: Obat) => (
                            <SelectItem key={obat.id} value={obat.id.toString()}>
                              {obat.nama_obat} (Stok: {obat.stok_tersedia})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tanggal_penggunaan">Tanggal Penggunaan</Label>
                      <Input
                        id="tanggal_penggunaan"
                        type="date"
                        value={penggunaanForm.tanggal.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPenggunaanForm((prev: CreatePenggunaanObatInput) => ({ 
                            ...prev, 
                            tanggal: new Date(e.target.value) 
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jumlah_dipakai">Jumlah Dipakai</Label>
                      <Input
                        id="jumlah_dipakai"
                        type="number"
                        value={penggunaanForm.jumlah_dipakai}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPenggunaanForm((prev: CreatePenggunaanObatInput) => ({ 
                            ...prev, 
                            jumlah_dipakai: parseInt(e.target.value) || 0 
                          }))
                        }
                        min="1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="catatan_penggunaan">Catatan (Opsional)</Label>
                      <Textarea
                        id="catatan_penggunaan"
                        value={penggunaanForm.catatan || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setPenggunaanForm((prev: CreatePenggunaanObatInput) => ({ 
                            ...prev, 
                            catatan: e.target.value || null 
                          }))
                        }
                        placeholder="Catatan penggunaan obat"
                      />
                    </div>

                    <Button type="submit" disabled={isLoading || penggunaanForm.id_obat === 0} className="w-full bg-green-600 hover:bg-green-700">
                      {isLoading ? 'Menyimpan...' : 'Catat Penggunaan'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Penggunaan Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Riwayat Penggunaan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filter Obat</Label>
                    <Select
                      value={penggunaanFilter.id_obat?.toString() || 'all'}
                      onValueChange={(value) =>
                        setPenggunaanFilter((prev: FilterPenggunaanInput) => ({ 
                          ...prev, 
                          id_obat: value === 'all' ? undefined : parseInt(value) 
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua obat" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Obat</SelectItem>
                        {obatList.map((obat: Obat) => (
                          <SelectItem key={obat.id} value={obat.id.toString()}>
                            {obat.nama_obat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Tanggal Mulai</Label>
                      <Input
                        type="date"
                        value={penggunaanFilter.tanggal_mulai?.toISOString().split('T')[0] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPenggunaanFilter((prev: FilterPenggunaanInput) => ({ 
                            ...prev, 
                            tanggal_mulai: e.target.value ? new Date(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tanggal Akhir</Label>
                      <Input
                        type="date"
                        value={penggunaanFilter.tanggal_akhir?.toISOString().split('T')[0] || ''}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPenggunaanFilter((prev: FilterPenggunaanInput) => ({ 
                            ...prev, 
                            tanggal_akhir: e.target.value ? new Date(e.target.value) : undefined 
                          }))
                        }
                      />
                    </div>
                  </div>

                  <Button onClick={loadPenggunaan} className="w-full">
                    Terapkan Filter
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Penggunaan List */}
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Penggunaan Obat</CardTitle>
              </CardHeader>
              <CardContent>
                {penggunaanList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada riwayat penggunaan</p>
                ) : (
                  <div className="space-y-4">
                    {penggunaanList.map((penggunaan: PenggunaanObat) => (
                      <div key={penggunaan.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">ID Obat: {penggunaan.id_obat}</p>
                            <p className="text-sm text-gray-600">
                              Tanggal: {penggunaan.tanggal.toLocaleDateString('id-ID')}
                            </p>
                            {penggunaan.catatan && (
                              <p className="text-sm text-gray-600 mt-1">{penggunaan.catatan}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <Badge variant="outline">
                              Jumlah: {penggunaan.jumlah_dipakai}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Pasien Tab */}
          <TabsContent value="pasien" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Add Pasien Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Daftar Pasien Baru</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreatePasien} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="nama_pasien">Nama Lengkap</Label>
                      <Input
                        id="nama_pasien"
                        value={pasienForm.nama}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPasienForm((prev: CreatePasienInput) => ({ ...prev, nama: e.target.value }))
                        }
                        placeholder="Masukkan nama lengkap"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="umur">Umur</Label>
                        <Input
                          id="umur"
                          type="number"
                          value={pasienForm.umur}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                            setPasienForm((prev: CreatePasienInput) => ({ ...prev, umur: parseInt(e.target.value) || 0 }))
                          }
                          min="1"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
                        <Select
                          value={pasienForm.jenis_kelamin}
                          onValueChange={(value: 'L' | 'P') =>
                            setPasienForm((prev: CreatePasienInput) => ({ ...prev, jenis_kelamin: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="L">Laki-laki</SelectItem>
                            <SelectItem value="P">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="alamat">Alamat</Label>
                      <Textarea
                        id="alamat"
                        value={pasienForm.alamat}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setPasienForm((prev: CreatePasienInput) => ({ ...prev, alamat: e.target.value }))
                        }
                        placeholder="Alamat lengkap"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="kontak">Kontak</Label>
                      <Input
                        id="kontak"
                        value={pasienForm.kontak}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPasienForm((prev: CreatePasienInput) => ({ ...prev, kontak: e.target.value }))
                        }
                        placeholder="Nomor telepon/WhatsApp"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tanggal_tindakan">Tanggal Tindakan</Label>
                      <Input
                        id="tanggal_tindakan"
                        type="date"
                        value={pasienForm.tanggal_tindakan.toISOString().split('T')[0]}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPasienForm((prev: CreatePasienInput) => ({ 
                            ...prev, 
                            tanggal_tindakan: new Date(e.target.value) 
                          }))
                        }
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="biaya">Biaya Tindakan</Label>
                      <Input
                        id="biaya"
                        type="number"
                        value={pasienForm.biaya}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setPasienForm((prev: CreatePasienInput) => ({ ...prev, biaya: parseFloat(e.target.value) || 0 }))
                        }
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status_pembayaran">Status Pembayaran</Label>
                      <Select
                        value={pasienForm.status_pembayaran}
                        onValueChange={(value: 'LUNAS' | 'BELUM_LUNAS') =>
                          setPasienForm((prev: CreatePasienInput) => ({ ...prev, status_pembayaran: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BELUM_LUNAS">Belum Lunas</SelectItem>
                          <SelectItem value="LUNAS">Lunas</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="catatan_medis">Catatan Medis (Opsional)</Label>
                      <Textarea
                        id="catatan_medis"
                        value={pasienForm.catatan_medis || ''}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                          setPasienForm((prev: CreatePasienInput) => ({ 
                            ...prev, 
                            catatan_medis: e.target.value || null 
                          }))
                        }
                        placeholder="Catatan khusus untuk pasien"
                      />
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-purple-600 hover:bg-purple-700">
                      {isLoading ? 'Menyimpan...' : 'Daftar Pasien'}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Pasien Filter */}
              <Card>
                <CardHeader>
                  <CardTitle>Filter Pasien</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    placeholder="Cari nama pasien..."
                    value={pasienFilter.nama || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPasienFilter((prev: FilterPasienInput) => ({ ...prev, nama: e.target.value || undefined }))
                    }
                  />

                  <div className="space-y-2">
                    <Label>Jenis Kelamin</Label>
                    <Select
                      value={pasienFilter.jenis_kelamin || 'all'}
                      onValueChange={(value) =>
                        setPasienFilter((prev: FilterPasienInput) => ({ 
                          ...prev, 
                          jenis_kelamin: value === 'all' ? undefined : value as 'L' | 'P'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="L">Laki-laki</SelectItem>
                        <SelectItem value="P">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Status Pembayaran</Label>
                    <Select
                      value={pasienFilter.status_pembayaran || 'all'}
                      onValueChange={(value) =>
                        setPasienFilter((prev: FilterPasienInput) => ({ 
                          ...prev, 
                          status_pembayaran: value === 'all' ? undefined : value as 'LUNAS' | 'BELUM_LUNAS'
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Semua status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="LUNAS">Lunas</SelectItem>
                        <SelectItem value="BELUM_LUNAS">Belum Lunas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={loadPasien} className="w-full">
                    Terapkan Filter
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Pasien List */}
            <Card>
              <CardHeader>
                <CardTitle>Daftar Pasien</CardTitle>
              </CardHeader>
              <CardContent>
                {pasienList.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Belum ada data pasien</p>
                ) : (
                  <div className="grid gap-4">
                    {pasienList.map((pasien: Pasien) => (
                      <div key={pasien.id} className="p-4 border rounded-lg bg-white">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{pasien.nama}</h3>
                            <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                              <div>
                                <p>Umur: {pasien.umur} tahun</p>
                                <p>Jenis Kelamin: {pasien.jenis_kelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                <p>Kontak: {pasien.kontak}</p>
                              </div>
                              <div>
                                <p>Tanggal Tindakan: {pasien.tanggal_tindakan.toLocaleDateString('id-ID')}</p>
                                <p>Biaya: Rp {pasien.biaya.toLocaleString('id-ID')}</p>
                              </div>
                            </div>
                            {pasien.catatan_medis && (
                              <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                                Catatan: {pasien.catatan_medis}
                              </p>
                            )}
                          </div>
                          <div className="text-right space-y-2">
                            <Badge
                              variant={pasien.status_pembayaran === 'LUNAS' ? 'default' : 'destructive'}
                            >
                              {pasien.status_pembayaran === 'LUNAS' ? '✅ Lunas' : '❌ Belum Lunas'}
                            </Badge>
                            <div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleGenerateKwitansi(pasien.id)}
                                className="w-full"
                              >
                                <Receipt className="w-4 h-4 mr-1" />
                                Kwitansi
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kwitansi Tab */}
          <TabsContent value="kwitansi" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Receipt className="w-5 h-5" />
                  <span>Cetak Kwitansi Pembayaran</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Pilih pasien dari daftar pasien untuk mencetak kwitansi pembayaran.
                  Kwitansi akan berisi detail pasien, biaya tindakan, dan nomor kwitansi unik.
                </p>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Cara Cetak Kwitansi:</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Buka tab "Pasien"</li>
                    <li>2. Cari pasien yang ingin dicetak kwitansinya</li>
                    <li>3. Klik tombol "Kwitansi" pada kartu pasien</li>
                    <li>4. Kwitansi akan otomatis dibuat dan dapat diunduh</li>
                  </ol>
                </div>

                {/* Recent patients for quick kwitansi generation */}
                <div className="mt-6">
                  <h4 className="font-medium mb-3">Pasien Terbaru (Cetak Cepat)</h4>
                  {pasienList.slice(0, 5).length === 0 ? (
                    <p className="text-gray-500 text-center py-4">Belum ada data pasien</p>
                  ) : (
                    <div className="space-y-2">
                      {pasienList.slice(0, 5).map((pasien: Pasien) => (
                        <div key={pasien.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <p className="font-medium">{pasien.nama}</p>
                            <p className="text-sm text-gray-600">
                              {pasien.tanggal_tindakan.toLocaleDateString('id-ID')} - 
                              Rp {pasien.biaya.toLocaleString('id-ID')}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleGenerateKwitansi(pasien.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Receipt className="w-4 h-4 mr-1" />
                            Cetak
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
