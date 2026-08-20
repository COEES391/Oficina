'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supportData, type SupportTicket } from "@/lib/planning-data"
import { schoolsDirectory, type SchoolInfo } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  LifeBuoy, 
  FileText, 
  ImageIcon, 
  X, 
  Search, 
  Eye, 
  Pencil, 
  Trash2,
  School, 
  Monitor, 
  CalendarDays, 
  Archive, 
  Package,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ClipboardList,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Clock,
  Download,
  Printer,
  UserCog,
  Building2,
  MapPin,
  CheckCircle2,
  Phone,
  LayoutGrid,
  Info
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'
import * as XLSX from 'xlsx'

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const WAREHOUSE_LOCATIONS = [
  "TOLUCA",
  "ECATEPEC",
  "NEZAHUALCÓYOTL",
  "TULTITLAN",
  "NAUCALPAN"
];

type InventoryItem = {
  id: number;
  name: string;
  qty: number;
  unit: string;
  minStock: number;
  category: string;
  locations: string[];
};

type WarehouseMovement = {
  id: string;
  type: 'entrada' | 'salida';
  itemId: number;
  itemName: string;
  qty: number;
  date: string;
  recipient?: string;
  folio?: string;
  observations?: string;
};

const INITIAL_INVENTORY: InventoryItem[] = [
  { id: 1, name: 'Cable UTP Categoría 6', qty: 4, unit: 'Bobina (305m)', minStock: 2, category: 'REDES', locations: ['TOLUCA'] },
  { id: 2, name: 'Conectores RJ45 (Bolsa)', qty: 2, unit: 'Bolsa 100pzs', minStock: 5, category: 'REDES', locations: ['ECATEPEC'] },
  { id: 3, name: 'Pasta Térmica Jeringa', qty: 15, unit: 'Pieza', minStock: 10, category: 'MTTO', locations: ['TOLUCA'] },
  { id: 4, name: 'Limpiador de Contactos (Spray)', qty: 10, unit: 'Pieza', minStock: 5, category: 'MTTO', locations: ['NEZAHUALCÓYOTL'] },
  { id: 5, name: 'Aire Comprimido', qty: 18, unit: 'Pieza', minStock: 10, category: 'MTTO', locations: ['NAUCALPAN'] },
  { id: 6, name: 'Canaleta PVC 20x10', qty: 40, unit: 'Tramo 2m', minStock: 20, category: 'REDES', locations: ['TULTITLAN'] },
  { id: 7, name: 'Rosetas RJ45 Dobles', qty: 25, unit: 'Pieza', minStock: 10, category: 'REDES', locations: ['TOLUCA'] },
  { id: 8, name: 'Patch Cord 1.5m / 3m', qty: 45, unit: 'Pieza', minStock: 15, category: 'REDES', locations: ['ECATEPEC'] },
  { id: 9, name: 'Switch de 8 Puertos Giga', qty: 3, unit: 'Pieza', minStock: 5, category: 'EQUIPOS', locations: ['TULTITLAN'] },
  { id: 10, name: 'Kit de Herramientas de Red', qty: 5, unit: 'Set', minStock: 2, category: 'HERRAMIENTA', locations: ['NAUCALPAN'] },
];

export default function SupportPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  
  // Almacén State
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [warehouseActiveTab, setWarehouseActiveTab] = useState('resumen')
  const [isEditItemOpen, setIsEditItemOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [movementForm, setMovementForm] = useState({
    type: 'salida' as 'entrada' | 'salida',
    itemId: '',
    qty: 0,
    recipient: '',
    folio: '',
    observations: ''
  })

  // CCT Dynamic Logic
  const [allSchools, setAllSchools] = useState<SchoolInfo[]>([])
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false)
  const [quickAddForm, setQuickAddForm] = useState<SchoolInfo>({
    region: '', valle: 'MEXICO', municipio: '', subsistema: 'FEDERALIZADO', control: 'OFICIAL',
    nivel: 'SECUNDARIA', servicioEducativo: 'SECUNDARIA GENERAL', cct: '', turno: 'MATUTINO',
    nombre: '', domicilio: '', localidad: '', telefono: '', zonaEscolar: '', sector: '',
    director: '', hombres: 0, mujeres: 0, alumnos: 0, grupos: 0, maestros: 0, administrativos: 0,
    aulasExistentes: 0, aulasEnUso: 0, modalidad: 'DES'
  })

  const [searchTerm, setSearchTerm] = useState('') 
  const [listSearchTerm, setListSearchTerm] = useState('') 
  const [officeFilter, setOfficeFilter] = useState('all') 
  const [editingTicketId, setEditingTicketId] = useState<string | null>(null)
  const [evidenceToView, setEvidenceToView] = useState<{ type: 'pdf' | 'gallery', data: string | string[], title: string } | null>(null)

  const initialFormState: Omit<SupportTicket, 'status'> = {
    id: '',
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    responsables: ['', '', ''],
    tecnicos: '',
    oficinaRegionalAtencion: '',
    numeroOficio: '',
    alumnosBeneficiados: 0,
    docentesBeneficiados: 0,
    numeroEquipos: 0,
    tipoIncidencia: 'mantenimiento',
    materialUtilizado: '',
    setes: 'N',
    observaciones: '',
    descripcionEquipo: '',
    fechaEntrada: '',
    fechaSalida: '',
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
    numDecodificadores: 0,
    numSerie: '',
    estatusSeñal: '',
    contratoFile: '',
    numReportes: 0,
    numCensal: '',
    serieDecodificador: '',
    calidadSeñal: '',
    materialesEdusat: [],
    numNodos: 0,
    switchModelo: '',
    materialesRedLocal: [],
    lugarServicio: '',
    lugarServicioOtro: '',
    diagnosticoRed: '',
    cuentaRedLocal: '',
    electricaAdecuada: '',
    cuentaInternet: '',
    proveedorInternet: '',
    anchoBanda: '',
    mantenimientoChecklist: [],
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
    },
    edusatDetalle: {
      micropak: [],
      antena: [],
      decodificadorAcciones: [],
      cableado: [],
      preventivo: [],
      numCensal: '',
      numSerie: '',
      calidadSeñal: '',
      materiales: Array(8).fill({ material: '', cantidad: '', actividades: '' })
    }
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('support_tickets_full') || '[]')
    if (stored.length === 0) {
      setTickets(supportData)
      localStorage.setItem('support_tickets_full', JSON.stringify(supportData))
    } else {
      setTickets(stored)
    }

    // Load Schools
    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (storedSchools.length > 0) {
      setAllSchools(storedSchools)
    } else {
      setAllSchools(schoolsDirectory)
    }

    // Load Warehouse
    const storedInv = JSON.parse(localStorage.getItem('coees_inventory_v1') || '[]')
    if (storedInv.length === 0) {
      setInventory(INITIAL_INVENTORY)
      localStorage.setItem('coees_inventory_v1', JSON.stringify(INITIAL_INVENTORY))
    } else {
      const migrated = storedInv.map((item: any) => ({
        ...item,
        locations: item.locations || (item.location ? [item.location] : ['TOLUCA'])
      }));
      setInventory(migrated)
      localStorage.setItem('coees_inventory_v1', JSON.stringify(migrated))
    }

    const storedMovs = JSON.parse(localStorage.getItem('coees_movements_v1') || '[]')
    setMovements(storedMovs)

    setFormData(prev => ({ ...prev, fechaEntrada: format(new Date(), 'yyyy-MM-dd') }))
  }, [])

  const handleSelectSchool = (cct: string, turno: string) => {
    const school = allSchools.find(s => s.cct === cct && s.turno === turno);
    if (school) {
      setFormData({
        ...formData,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        region: school.region,
        valle: school.valle
      });
      toast({
        title: "Plantel Identificado",
        description: `${school.nombre} (${school.turno}) cargado correctamente.`,
      });
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "CCT, Nombre y Municipio son obligatorios." });
      return
    }

    const newSchool: SchoolInfo = {
      ...quickAddForm,
      cct: quickAddForm.cct.toUpperCase(),
      nombre: quickAddForm.nombre.toUpperCase(),
      municipio: quickAddForm.municipio.toUpperCase(),
      domicilio: quickAddForm.domicilio.toUpperCase(),
      localidad: quickAddForm.localidad.toUpperCase(),
      sector: quickAddForm.sector.toUpperCase(),
      zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(),
      modalidad: quickAddForm.modalidad.toUpperCase()
    }

    const updatedSchools = [newSchool, ...allSchools]
    setAllSchools(updatedSchools)
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updatedSchools))
    
    handleSelectSchool(newSchool.cct, newSchool.turno)
    setIsQuickAddOpen(false)
    setSearchTerm('')
    toast({ title: "CCT Registrado", description: `${newSchool.cct} disponible en el sistema.` })
  }

  const handleSave = () => {
    if (!formData.id || !formData.cct || !formData.tipoIncidencia) {
      toast({ variant: "destructive", title: "Faltan datos", description: "El número de solicitud, CCT y Tipo de Servicio son obligatorios." })
      return
    }

    let updated: SupportTicket[];
    if (editingTicketId) {
      updated = tickets.map(t => t.id === editingTicketId ? { 
        ...formData, 
        responsables: formData.responsables.filter(r => r.trim() !== ''),
        status: t.status 
      } as SupportTicket : t);
    } else {
      const newTicket: SupportTicket = {
        ...formData,
        status: 'pendiente',
        responsables: formData.responsables.filter(r => r.trim() !== ''),
      } as SupportTicket;
      updated = [newTicket, ...tickets]
    }

    setTickets(updated)
    localStorage.setItem('support_tickets_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    setEditingTicketId(null)
    toast({ title: "Cambios guardados con éxito" })
  }

  const handleDeleteTicket = (id: string) => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Registro eliminado", description: "El reporte de soporte ha sido purgado." });
  }

  const resetForm = () => {
    setFormData({
      ...initialFormState,
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    })
  }

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({
      ...ticket,
      responsables: [...(ticket.responsables || []), '', '', ''].slice(0, 3) as string[],
      mantenimientoChecklist: ticket.mantenimientoChecklist || [],
      tecnicos: ticket.tecnicos || '',
      mantenimientoDetalle: ticket.mantenimientoDetalle || initialFormState.mantenimientoDetalle,
      edusatDetalle: ticket.edusatDetalle || initialFormState.edusatDetalle
    });
    setEditingTicketId(ticket.id);
    setIsDialogOpen(true);
  }

  const updateTicketStatus = (id: string, newStatus: any) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: `Estatus actualizado a ${newStatus.toUpperCase()}` });
  }

  const handleMantenimientoTableChange = (index: number, field: string, value: string) => {
    const current = formData.mantenimientoDetalle || initialFormState.mantenimientoDetalle!;
    const newEquipos = [...current.equipos];
    newEquipos[index] = { ...newEquipos[index], [field]: value };
    setFormData({
      ...formData,
      mantenimientoDetalle: { ...current, equipos: newEquipos }
    });
  }

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.tecnicos || '').toUpperCase().includes(listSearchTerm.toUpperCase());
    
    const matchOffice = officeFilter === 'all' || t.oficinaRegionalAtencion === officeFilter;
    
    return matchSearch && matchOffice;
  });

  const schoolSearchResults = useMemo(() => {
    if (!searchTerm || searchTerm.length < 3) return [];
    const term = searchTerm.toUpperCase();
    return allSchools.filter(s => s.cct.includes(term) || s.nombre.includes(term)).slice(0, 10);
  }, [allSchools, searchTerm]);

  // Almacén Logic
  const handleRegisterMovement = () => {
    const { itemId, qty, type, recipient, folio, observations } = movementForm;
    if (!itemId || qty <= 0) {
      toast({ variant: "destructive", title: "Datos incompletos" })
      return;
    }

    const item = inventory.find(i => i.id === parseInt(itemId));
    if (!item) return;

    if (type === 'salida' && item.qty < qty) {
      toast({ variant: "destructive", title: "Stock insuficiente" })
      return;
    }

    const newQty = type === 'entrada' ? item.qty + qty : item.qty - qty;
    const updatedInventory = inventory.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
    
    const newMovement: WarehouseMovement = {
      id: `MOV-${Date.now()}`,
      type,
      itemId: item.id,
      itemName: item.name,
      qty,
      date: format(new Date(), 'yyyy-MM-dd HH:mm'),
      recipient,
      folio,
      observations
    };

    const updatedMovements = [newMovement, ...movements];

    setInventory(updatedInventory);
    setMovements(updatedMovements);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    localStorage.setItem('coees_movements_v1', JSON.stringify(updatedMovements));

    setMovementForm({ type: 'salida', itemId: '', qty: 0, recipient: '', folio: '', observations: '' });
    toast({ title: "Movimiento registrado" });
  }

  const handleEditInventoryItem = (item: InventoryItem) => {
    setEditingItem(item);
    setIsEditItemOpen(true);
  }

  const handleAddNewItem = () => {
    setEditingItem({
      id: 0,
      name: '',
      qty: 0,
      unit: 'Pieza',
      minStock: 5,
      category: 'GENERAL',
      locations: ['TOLUCA']
    });
    setIsEditItemOpen(true);
  }

  const handleDeleteInventoryItem = (id: number) => {
    const updated = inventory.filter(i => i.id !== id);
    setInventory(updated);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updated));
    toast({ title: "Insumo eliminado" });
  }

  const handleSaveEditedItem = () => {
    if (!editingItem || !editingItem.name) {
      toast({ variant: "destructive", title: "Datos incompletos" });
      return;
    }

    let updatedInventory;
    if (editingItem.id === 0) {
      const newId = inventory.length > 0 ? Math.max(...inventory.map(i => i.id)) + 1 : 1;
      updatedInventory = [...inventory, { ...editingItem, id: newId }];
      toast({ title: "Insumo registrado" });
    } else {
      updatedInventory = inventory.map(i => i.id === editingItem.id ? editingItem : i);
      toast({ title: "Insumo actualizado" });
    }

    setInventory(updatedInventory);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    setIsEditItemOpen(false);
    setEditingItem(null);
  }

  const downloadInventoryExcel = () => {
    if (inventory.length === 0) {
      toast({ variant: "destructive", title: "Sin datos" })
      return
    }

    const dataToExport = inventory.map(item => ({
      'Insumo Técnico': item.name,
      'Stock Actual': item.qty,
      'Unidad': item.unit,
      'Min. Sugerido': item.minStock,
      'Categoría': item.category,
      'Lugares de Resguardo': item.locations.join(', '),
      'Estado': item.qty <= item.minStock ? 'Reabastecer' : 'Óptimo'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventario COEES");
    XLSX.writeFile(workbook, `Inventario_COEES_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast({ title: "Exportación Exitosa" });
  };

  const lowStockItems = useMemo(() => inventory.filter(i => i.qty <= i.minStock), [inventory]);

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Gestión de Soporte Técnico</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <LifeBuoy className="h-4 w-4 text-accent" /> Centro de Control Operativo COEES
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={() => setIsWarehouseOpen(true)}
            variant="outline"
            className="h-12 px-8 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] gap-2 hover:bg-primary/5 shadow-md transition-all active:scale-95"
          >
            <Archive className="h-5 w-5" /> Almacén
          </Button>

          <Button 
            onClick={() => {
              setFormData({
                ...initialFormState,
                id: '', // Empty for manual capture
                fechaEntrada: format(new Date(), 'yyyy-MM-dd')
              });
              setEditingTicketId(null);
              setIsDialogOpen(true);
              setSearchTerm('');
            }}
            className="btn-institutional h-12 px-10 rounded-xl shadow-lg whitespace-nowrap"
          >
            <PlusCircle className="h-5 w-5 mr-2" /> Nuevo Reporte
          </Button>
        </div>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Filtro Operativo:</span>
           </div>
           
           <div className="relative flex-1 w-full">
              <Input 
                placeholder="BUSCAR POR CCT, PLANTEL, FOLIO O TÉCNICO..." 
                className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
                value={listSearchTerm}
                onChange={(e) => setListSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
           </div>

           <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={officeFilter} onValueChange={setOfficeFilter}>
                <SelectTrigger className="h-12 w-full md:w-[240px] rounded-xl border-primary/10 bg-white text-[10px] font-black uppercase shadow-sm">
                   <div className="flex items-center gap-2">
                     <Building2 className="h-4 w-4 text-primary" />
                     <SelectValue placeholder="OFICINA DE ATENCIÓN..." />
                   </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
                  {REGIONAL_OFFICES.map(off => (
                    <SelectItem key={`filter-off-${off}`} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="h-12 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm" onClick={() => setIsSchedulerOpen(true)}>
                <CalendarDays className="h-4 w-4" /> Agenda
              </Button>
           </div>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-xl overflow-hidden border-t-8 border-t-primary">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
              <TableRow>
                <TableHead className="w-20 text-[10px] font-black uppercase text-center pl-6">Folio</TableHead>
                <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Centro de Trabajo</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Tipo de Servicio</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Fecha</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                <TableHead className="text-[10px] font-black uppercase">Analista Responsable</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.length > 0 ? filteredTickets.map((ticket, idx) => (
                <TableRow key={`${ticket.id}-${idx}`} className="hover:bg-slate-50 transition-colors group h-16">
                  <TableCell className="text-center pl-6"><span className="font-mono font-black text-xs text-primary">#{ticket.id}</span></TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700 uppercase leading-none">{ticket.schoolName}</span>
                      <span className="text-[9px] font-bold text-muted-foreground mt-1">{ticket.cct} • {ticket.municipio}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 bg-white">{ticket.tipoIncidencia}</Badge></TableCell>
                  <TableCell><span className="text-[10px] font-bold text-slate-500">{ticket.fechaEntrada}</span></TableCell>
                  <TableCell className="text-center">
                    <Select value={ticket.status} onValueChange={(val) => updateTicketStatus(ticket.id, val)}>
                      <SelectTrigger className={cn("h-7 w-28 text-[8px] font-black uppercase border-2 rounded-full mx-auto shadow-sm", ticket.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30' : ticket.status === 'en proceso' ? 'bg-amber-50 text-amber-700 border-amber-500/30' : 'bg-rose-50 text-rose-700 border-rose-500/30')}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="pendiente" className="text-[10px] font-black">🔴 PENDIENTE</SelectItem>
                        <SelectItem value="en proceso" className="text-[10px] font-black">🟡 EN PROCESO</SelectItem>
                        <SelectItem value="atendido" className="text-[10px] font-black">🟢 ATENDIDO</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><span className="text-[10px] font-black text-slate-600 uppercase">{ticket.tecnicos || 'SIN ASIGNAR'}</span></TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleEdit(ticket)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-32 opacity-30">
                    <div className="flex flex-col items-center gap-4">
                      <LifeBuoy className="h-16 w-16 text-slate-300" />
                      <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sin registros operativos en the sistema</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de Almacén Integral */}
      <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
          <DialogContent className="sm:max-w-[1200px] rounded-[2.5rem] h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Archive className="h-40 w-40" />
              </div>
              <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4 relative z-10">
                <Package className="h-8 w-8 text-accent" /> Control de Almacén Técnico COEES
              </DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 relative z-10">
                Sistema Integral de Entradas, Salidas y Stock Crítico
              </DialogDescription>
            </DialogHeader>

            <Tabs value={warehouseActiveTab} onValueChange={setWarehouseActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="resumen" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Dashboard</TabsTrigger>
                  <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Inventario Actual</TabsTrigger>
                  <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Registro de Flujo</TabsTrigger>
                  <TabsTrigger value="historial" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Bitácora Histórica</TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 overflow-hidden p-6 bg-white">
                <TabsContent value="resumen" className="h-full m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="executive-card p-6 bg-primary/5 border-primary/10 border-l-8 border-l-primary">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Insumos Críticos</p>
                          <h3 className="text-4xl font-black text-primary mt-1">{lowStockItems.length}</h3>
                        </div>
                        <AlertTriangle className="h-10 w-10 text-primary opacity-20" />
                      </div>
                    </Card>
                    <Card className="executive-card p-6 bg-accent/5 border-accent/10 border-l-8 border-l-accent">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-accent/60 tracking-widest">Movimientos Mes</p>
                          <h3 className="text-4xl font-black text-accent mt-1">{movements.length}</h3>
                        </div>
                        <TrendingUp className="h-10 w-10 text-accent opacity-20" />
                      </div>
                    </Card>
                    <Card className="executive-card p-6 bg-emerald-50 border-emerald-100 border-l-8 border-l-emerald-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Stock Operativo</p>
                          <h3 className="text-4xl font-black text-emerald-600 mt-1">{inventory.length}</h3>
                        </div>
                        <ClipboardList className="h-10 w-10 text-emerald-500 opacity-20" />
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="inventario" className="h-full m-0 overflow-hidden flex flex-col gap-4">
                  <div className="flex justify-end gap-3 pr-4">
                    <Button onClick={downloadInventoryExcel} variant="outline" className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 hover:bg-emerald-50 shadow-sm"><FileSpreadsheet className="h-4 w-4" /> Exportar Inventario</Button>
                    <Button onClick={handleAddNewItem} className="btn-institutional h-10 px-6 text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> Añadir Insumo al Catálogo</Button>
                  </div>
                  <div className="border-2 border-slate-100 rounded-[2rem] bg-white overflow-hidden shadow-inner flex-1 flex flex-col">
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[10px] pl-6 py-4">Insumo Técnico</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Stock Actual</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Unidad</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Lugares de Resguardo</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Min. Sugerido</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Estado</TableHead>
                            <TableHead className="text-right pr-6 font-black uppercase text-[10px]">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventory.map(item => (
                            <TableRow key={`inv-${item.id}`} className="hover:bg-slate-50 transition-colors border-b border-slate-50 h-16 group">
                              <TableCell className="font-black text-slate-700 text-xs uppercase pl-6 py-4">{item.name}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn("inline-flex items-center justify-center h-9 w-14 rounded-xl text-sm font-black border transition-all shadow-sm", item.qty <= item.minStock ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-primary/5 text-primary border-primary/10")}>{item.qty}</span>
                              </TableCell>
                              <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">{item.unit}</TableCell>
                              <TableCell className="text-center">
                                <div className="flex flex-wrap justify-center gap-1">
                                  {item.locations?.map((loc, lIdx) => (<Badge key={`loc-${item.id}-${lIdx}`} variant="secondary" className="bg-slate-100 text-slate-600 text-[8px] font-black uppercase border-slate-200"><MapPin className="h-2 w-2 mr-1 text-primary" /> {loc}</Badge>))}
                                </div>
                              </TableCell>
                              <TableCell className="text-center text-[10px] font-mono font-black text-slate-400">{item.minStock}</TableCell>
                              <TableCell className="text-center"><Badge className={cn("text-[8px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm", item.qty <= item.minStock ? 'bg-rose-600 text-white' : 'bg-emerald-50 text-white')}>{item.qty <= item.minStock ? 'Reabastecer' : 'Óptimo'}</Badge></TableCell>
                              <TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => handleEditInventoryItem(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all" onClick={() => handleDeleteInventoryItem(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </TabsContent>
                <TabsContent value="movimientos" className="h-full m-0 flex flex-col gap-6">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 flex-1">
                      <Card className="executive-card p-8 border-t-8 border-t-accent bg-slate-50/50">
                        <h4 className="text-sm font-black uppercase text-accent mb-6 flex items-center gap-3"><TrendingDown className="h-5 w-5" /> Salida de Material</h4>
                        <div className="space-y-6">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400">Insumo</Label>
                             <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val, type: 'salida'})}><SelectTrigger className="h-12 bg-white rounded-xl border-slate-200"><SelectValue placeholder="ELIGE MATERIAL..." /></SelectTrigger><SelectContent>{inventory.map(i => <SelectItem key={`sel-sal-${i.id}`} value={i.id.toString()} className="text-[10px] font-bold uppercase">{i.name} ({i.qty})</SelectItem>)}</SelectContent></Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Cant.</Label><Input type="number" className="h-12 bg-white rounded-xl" value={movementForm.qty} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} /></div>
                            <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Folio</Label><Input className="h-12 bg-white rounded-xl" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value.toUpperCase()})} /></div>
                          </div>
                          <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-14">Registrar Salida</Button>
                        </div>
                      </Card>
                      <Card className="executive-card p-8 border-t-8 border-t-primary bg-slate-50/50">
                        <h4 className="text-sm font-black uppercase text-primary mb-6 flex items-center gap-3"><TrendingUp className="h-5 w-5" /> Entrada de Material</h4>
                        <div className="space-y-6">
                          <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400">Insumo</Label>
                             <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val, type: 'entrada'})}><SelectTrigger className="h-12 bg-white rounded-xl border-slate-200"><SelectValue placeholder="ELIGE MATERIAL..." /></SelectTrigger><SelectContent>{inventory.map(i => <SelectItem key={`sel-ent-${i.id}`} value={i.id.toString()} className="text-[10px] font-bold uppercase">{i.name}</SelectItem>)}</SelectContent></Select>
                          </div>
                          <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-slate-400">Cant.</Label><Input type="number" className="h-12 bg-white rounded-xl" value={movementForm.qty} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} /></div>
                          <Button onClick={handleRegisterMovement} className="w-full bg-primary text-white h-14 rounded-xl shadow-lg font-black uppercase text-[11px]">Registrar Entrada</Button>
                        </div>
                      </Card>
                   </div>
                </TabsContent>
                <TabsContent value="historial" className="h-full m-0 overflow-hidden">
                   <ScrollArea className="h-full border rounded-[2rem] bg-white">
                      <Table>
                        <TableHeader className="bg-slate-50"><TableRow><TableHead className="font-black text-[9px] uppercase pl-6 h-10">Fecha</TableHead><TableHead className="font-black text-[9px] uppercase h-10">Tipo</TableHead><TableHead className="font-black text-[9px] uppercase h-10">Material</TableHead><TableHead className="font-black text-[9px] uppercase h-10 text-center">Cant</TableHead><TableHead className="font-black text-[9px] uppercase h-10">Responsable</TableHead></TableRow></TableHeader>
                        <TableBody>{movements.map((mov, idx) => (<TableRow key={`mov-${mov.id}-${idx}`} className="border-b border-slate-50"><TableCell className="font-mono text-[10px] text-slate-400 pl-6">{mov.date}</TableCell><TableCell><Badge className={cn("text-[8px] font-black uppercase", mov.type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{mov.type}</Badge></TableCell><TableCell className="font-black text-slate-700 text-[10px] uppercase">{mov.itemName}</TableCell><TableCell className="text-center font-black text-xs">{mov.qty}</TableCell><TableCell className="text-[10px] font-bold uppercase">{mov.recipient || '-'}</TableCell></TableRow>))}</TableBody>
                      </Table>
                   </ScrollArea>
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
      </Dialog>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
          setEditingTicketId(null);
          setSearchTerm('');
        }
      }}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="uppercase font-black text-primary text-2xl">
              {editingTicketId ? `Actualizar Reporte: ${editingTicketId}` : "Formato de Reporte Técnico"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 px-8">
            <div className="grid gap-8 py-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 space-y-6 shadow-inner relative"><Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2"><Search className="h-4 w-4 text-accent" /> Localizador Institucional CCT</Label>
                <Input placeholder="Teclear CCT o Nombre del Plantel para autocompletar..." className="h-14 rounded-2xl bg-white border-primary/10 font-bold uppercase shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm.length > 2 && (
                  <div className="max-h-60 overflow-auto bg-white border border-primary/5 rounded-2xl shadow-2xl absolute left-6 right-6 top-28 z-50 divide-y divide-slate-50">
                    {schoolSearchResults.map(s => (
                      <div key={`search-item-${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center group" onClick={() => { handleSelectSchool(s.cct, s.turno); setSearchTerm('') }}>
                        <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors"><School className="h-5 w-5" /></div><div className="flex flex-col"><span className="text-xs font-black text-slate-800">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.turno}</span></div></div>
                      </div>
                    ))}
                    {schoolSearchResults.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">CCT No Registrado</p>
                        <Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase border-primary/20 text-primary" onClick={() => { setQuickAddForm({...quickAddForm, cct: ''}); setIsQuickAddOpen(true); }}>
                          <Plus className="h-3 w-3 mr-1" /> Alta Rápida de Plantel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
                {formData.cct && (<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-top-4"><div className="md:col-span-3 flex items-center gap-4 p-5 bg-white rounded-2xl border shadow-sm border-emerald-100"><div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><School className="h-7 w-7" /></div><div><p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">CCT Identificado</p><h4 className="text-sm font-black text-slate-800 uppercase leading-none">{formData.schoolName}</h4><p className="text-[10px] font-mono text-muted-foreground mt-1">{formData.cct} • {formData.municipio} • {formData.region}</p></div></div></div>)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2"># Solicitud (Folio)</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-black uppercase" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Tipo de Incidencia</Label>
                  <Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="red edusat" className="text-[11px] uppercase font-bold">Red Edusat</SelectItem>
                      <SelectItem value="red local" className="text-[11px] uppercase font-bold">Red Local</SelectItem>
                      <SelectItem value="mantenimiento" className="text-[11px] uppercase font-bold">Mantenimiento</SelectItem>
                      <SelectItem value="teleplanteles" className="text-[11px] uppercase font-bold">Teleplanteles</SelectItem>
                      <SelectItem value="cuenta institucional" className="text-[11px] uppercase font-bold">Cuenta Institucional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.tipoIncidencia === 'mantenimiento' && (
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                     <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg">
                        <Monitor className="h-6 w-6" />
                     </div>
                     <h3 className="text-sm font-black uppercase text-primary tracking-wider">Módulo de Mantenimiento Detallado</h3>
                  </div>

                  <div className="space-y-4">
                    <Label className="text-[10px] font-black uppercase text-primary pl-1">Equipo Tecnológico:</Label>
                    <div className="flex flex-wrap gap-6 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                      {['HDT', 'EQUIPO DE COMPUTO', 'OTRO'].map(opt => (
                        <div key={`mto-eq-${opt}`} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`equipo-${opt}`}
                            checked={formData.mantenimientoDetalle?.equipoTecnologico === opt}
                            onCheckedChange={() => setFormData({
                              ...formData,
                              mantenimientoDetalle: { ...formData.mantenimientoDetalle!, equipoTecnologico: opt as any }
                            })}
                          />
                          <Label htmlFor={`equipo-${opt}`} className="text-[10px] font-black uppercase cursor-pointer">{opt}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border rounded-xl overflow-hidden shadow-sm bg-white">
                    <Table>
                      <TableHeader className="bg-slate-100">
                        <TableRow>
                          <TableHead className="w-12 text-[9px] font-black uppercase text-center">N.P.</TableHead>
                          <TableHead className="text-[9px] font-black uppercase">Equipo</TableHead>
                          <TableHead className="text-[9px] font-black uppercase">Marca</TableHead>
                          <TableHead className="text-[9px] font-black uppercase">No. Serie</TableHead>
                          <TableHead className="text-[9px] font-black uppercase">No. Censal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.from({ length: 10 }).map((_, idx) => (
                          <TableRow key={`mto-row-${idx}`} className="hover:bg-slate-50/50">
                            <TableCell className="text-center font-bold text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                            <TableCell className="p-1">
                              <Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.equipo || ''} onChange={e => handleMantenimientoTableChange(idx, 'equipo', e.target.value.toUpperCase())} />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.marca || ''} onChange={e => handleMantenimientoTableChange(idx, 'marca', e.target.value.toUpperCase())} />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.serie || ''} onChange={e => handleMantenimientoTableChange(idx, 'serie', e.target.value.toUpperCase())} />
                            </TableCell>
                            <TableCell className="p-1">
                              <Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.censal || ''} onChange={e => handleMantenimientoTableChange(idx, 'censal', e.target.value.toUpperCase())} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Oficina de Atención</Label>
                  <Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}>
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase text-[11px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {REGIONAL_OFFICES.map(off => (
                        <SelectItem key={`off-sel-${off}`} value={off} className="text-[11px] uppercase font-bold">{off.replace("Oficina de ", "")}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary pl-2">Número de Oficio COEES</Label>
                  <Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-mono uppercase" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="COEES/PL/..." />
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Observaciones Técnicas del Servicio</Label>
                <Textarea className="min-h-[120px] rounded-[1.5rem] p-5 bg-slate-50 border-primary/10 focus:bg-white transition-all shadow-inner" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 border-t bg-slate-50/50">
            <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingTicketId(null); }} className="rounded-xl h-14 px-10 text-[10px] font-black uppercase">Cancelar</Button>
            <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[10px]">Guardar Servicio</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white">
            <DialogTitle className="uppercase font-black text-lg flex items-center gap-3">
              <PlusCircle className="h-6 w-6" /> Registro de Nuevo CCT
            </DialogTitle>
            <DialogDescription className="text-white/80 text-[10px] font-bold uppercase mt-1">Sume un nuevo plantel a la base maestra.</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">CCT (10 Dígitos)</Label>
                  <Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label>
                  <Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Domicilio (Calle y Número)</Label>
                  <Input value={quickAddForm.domicilio} onChange={e => setQuickAddForm({...quickAddForm, domicilio: e.target.value})} className="font-bold border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Teléfono</Label>
                  <Input value={quickAddForm.telefono} onChange={e => setQuickAddForm({...quickAddForm, telefono: e.target.value})} className="font-mono font-black border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Localidad</Label>
                  <Input value={quickAddForm.localidad} onChange={e => setQuickAddForm({...quickAddForm, localidad: e.target.value})} className="font-bold border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Municipio</Label>
                  <Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} className="font-bold uppercase border-slate-200" />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Sector</Label>
                  <Input value={quickAddForm.sector} onChange={e => setQuickAddForm({...quickAddForm, sector: e.target.value})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Zona Escolar</Label>
                  <Input value={quickAddForm.zonaEscolar} onChange={e => setQuickAddForm({...quickAddForm, zonaEscolar: e.target.value})} className="font-black border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Modalidad</Label>
                  <Select value={quickAddForm.modalidad} onValueChange={v => setQuickAddForm({...quickAddForm, modalidad: v})}>
                    <SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DES" className="text-[10px] font-bold">DES (GENERAL)</SelectItem>
                      <SelectItem value="DST" className="text-[10px] font-bold">DST (TÉCNICA)</SelectItem>
                      <SelectItem value="DTV" className="text-[10px] font-bold">DTV (TELESECUNDARIA)</SelectItem>
                      <SelectItem value="ADG" className="text-[10px] font-bold">ADG (DEPARTAMENTO)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Turno</Label>
                  <Select value={quickAddForm.turno} onValueChange={v => setQuickAddForm({...quickAddForm, turno: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MATUTINO">MATUTINO</SelectItem><SelectItem value="VESPERTINO">VESPERTINO</SelectItem><SelectItem value="MIXTO">MIXTO</SelectItem></SelectContent></Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary">Valle</Label>
                  <Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="text-[10px] font-bold uppercase border-slate-200"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select>
                </div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar y Sumar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte Técnico" />

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-8 pb-4 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-4">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-6 w-6 text-blue-600" /> : <ImageIcon className="h-6 w-6 text-pink-600" />}
              {evidenceToView?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none" />
             ) : (
                <ScrollArea className="h-full w-full p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={`evidence-img-${idx}`} className="relative aspect-video rounded-3xl overflow-hidden border-8 border-white shadow-2xl"><Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover" /></div>
                    ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-6 border-t bg-white flex justify-end"><Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-lg">Cerrar</Button></div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
