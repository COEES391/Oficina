
'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  Building2,
  MapPin,
  CheckCircle2,
  Upload,
  Layers,
  History,
  Save,
  ArrowRightCircle
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

const FILE_SIZE_LIMIT = 2 * 1024 * 1024;

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
];

export default function SupportPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false)
  
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)

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
  const [evidenceToView, setEvidenceToView] = useState<{ 
    type: 'pdf' | 'gallery' | 'both', 
    pdfData?: string, 
    images?: string[], 
    title: string 
  } | null>(null)

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
    fechaEntrada: '',
    fechaSalida: '',
    serviciosMC: 0,
    serviciosMP: 0,
    reportPdf: '',
    evidencePhotos: [],
    mantenimientoDetalle: {
      equipoTecnologico: '',
      equipoTecnologicoOtro: '',
      equipos: Array(10).fill({ equipo: '', marca: '', serie: '', censal: '' }),
      fallaIdentificada: '',
      servicioRealizado: ''
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

    const storedSchools = JSON.parse(localStorage.getItem('schools_master_full_v21') || '[]')
    if (storedSchools.length > 0) {
      setAllSchools(storedSchools)
    } else {
      setAllSchools(schoolsDirectory)
    }

    const storedInv = JSON.parse(localStorage.getItem('coees_inventory_v1') || '[]')
    if (storedInv.length === 0) {
      setInventory(INITIAL_INVENTORY)
      localStorage.setItem('coees_inventory_v1', JSON.stringify(INITIAL_INVENTORY))
    } else {
      setInventory(storedInv)
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
      toast({ title: "Plantel Identificado", description: `${school.nombre} cargado.` });
    }
  }

  const handleQuickAddCct = () => {
    if (!quickAddForm.cct || !quickAddForm.nombre || !quickAddForm.municipio) {
      toast({ variant: "destructive", title: "Faltan datos" }); return;
    }
    const newSchool = { ...quickAddForm, cct: quickAddForm.cct.toUpperCase(), nombre: quickAddForm.nombre.toUpperCase(), municipio: quickAddForm.municipio.toUpperCase(), domicilio: quickAddForm.domicilio.toUpperCase(), localidad: quickAddForm.localidad.toUpperCase(), sector: quickAddForm.sector.toUpperCase(), zonaEscolar: quickAddForm.zonaEscolar.toUpperCase(), modalidad: quickAddForm.modalidad.toUpperCase() };
    const updated = [newSchool, ...allSchools];
    setAllSchools(updated);
    localStorage.setItem('schools_master_full_v21', JSON.stringify(updated));
    handleSelectSchool(newSchool.cct, newSchool.turno);
    setIsQuickAddOpen(false);
    setSearchTerm('');
  }

  const handleSave = () => {
    if (!formData.id || !formData.cct) {
      toast({ variant: "destructive", title: "Faltan datos obligatorios" }); return;
    }

    let updated: SupportTicket[];
    if (editingTicketId) {
      updated = tickets.map(t => t.id === editingTicketId ? { ...formData, status: t.status } as SupportTicket : t);
    } else {
      updated = [{ ...formData, status: 'pendiente' } as SupportTicket, ...tickets];
    }

    try {
      localStorage.setItem('support_tickets_full', JSON.stringify(updated));
      setTickets(updated);
      setIsDialogOpen(false);
      resetForm();
      setEditingTicketId(null);
      toast({ title: "Reporte Guardado" });
    } catch (e) {
      toast({ variant: "destructive", title: "Error de Memoria", description: "Intente reducir el tamaño de las evidencias." })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'image') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > FILE_SIZE_LIMIT) {
      toast({ variant: "destructive", title: "Archivo demasiado grande" })
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string
      if (type === 'pdf') {
        setFormData(prev => ({ ...prev, reportPdf: base64 }))
      } else {
        setFormData(prev => ({ ...prev, evidencePhotos: [...(prev.evidencePhotos || []), base64] }))
      }
      toast({ title: "Evidencia añadida" })
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidencePhotos: (prev.evidencePhotos || []).filter((_, i) => i !== index)
    }))
  }

  const resetForm = () => {
    setFormData({ ...initialFormState, id: '', fechaEntrada: format(new Date(), 'yyyy-MM-dd') })
  }

  const handleEdit = (ticket: SupportTicket) => {
    setFormData({ ...ticket });
    setEditingTicketId(ticket.id);
    setIsDialogOpen(true);
  }

  const handleDeleteTicket = (id: string) => {
    const updated = tickets.filter(t => t.id !== id);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
    toast({ title: "Registro eliminado" });
  }

  const updateTicketStatus = (id: string, newStatus: any) => {
    const updated = tickets.map(t => t.id === id ? { ...t, status: newStatus } : t);
    setTickets(updated);
    localStorage.setItem('support_tickets_full', JSON.stringify(updated));
  }

  const handleMantenimientoTableChange = (index: number, field: string, value: string) => {
    const current = formData.mantenimientoDetalle || initialFormState.mantenimientoDetalle!;
    const newEquipos = [...current.equipos];
    newEquipos[index] = { ...newEquipos[index], [field]: value };
    setFormData({ ...formData, mantenimientoDetalle: { ...current, equipos: newEquipos } });
  }

  const filteredTickets = tickets.filter(t => {
    const matchSearch = (t.cct || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.schoolName || '').toUpperCase().includes(listSearchTerm.toUpperCase()) ||
      (t.id || '').toUpperCase().includes(listSearchTerm.toUpperCase());
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
    const { itemId, qty, type, recipient, folio } = movementForm;
    if (!itemId || qty <= 0) {
      toast({ variant: "destructive", title: "Incompleto", description: "Elegir insumo y cantidad válida." });
      return;
    }
    const item = inventory.find(i => i.id === parseInt(itemId));
    if (!item) return;
    if (type === 'salida' && item.qty < qty) { toast({ variant: "destructive", title: "Stock insuficiente" }); return; }
    
    const newQty = type === 'entrada' ? item.qty + qty : item.qty - qty;
    const updatedInventory = inventory.map(i => i.id === item.id ? { ...i, qty: newQty } : i);
    const newMovement: WarehouseMovement = { 
      id: `MOV-${Date.now()}`, 
      type, 
      itemId: item.id, 
      itemName: item.name, 
      qty, 
      date: format(new Date(), 'dd/MM/yyyy HH:mm'), 
      recipient, 
      folio 
    };
    
    setInventory(updatedInventory);
    const updatedMovements = [newMovement, ...movements];
    setMovements(updatedMovements);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    localStorage.setItem('coees_movements_v1', JSON.stringify(updatedMovements));
    setMovementForm({ type: 'salida', itemId: '', qty: 0, recipient: '', folio: '', observations: '' });
    toast({ title: "Movimiento registrado con éxito" });
  }

  const handleEditInventoryItem = (item: InventoryItem) => { setEditingItem(item); setIsEditItemOpen(true); }
  const handleAddNewItem = () => { setEditingItem({ id: 0, name: '', qty: 0, unit: 'Pieza', minStock: 5, category: 'GENERAL', locations: ['TOLUCA'] }); setIsEditItemOpen(true); }
  const handleDeleteInventoryItem = (id: number) => { const updated = inventory.filter(i => i.id !== id); setInventory(updated); localStorage.setItem('coees_inventory_v1', JSON.stringify(updated)); }
  
  const handleSaveEditedItem = () => {
    if (!editingItem || !editingItem.name) return;
    let updatedInventory;
    if (editingItem.id === 0) {
      updatedInventory = [...inventory, { ...editingItem, id: Date.now() }];
    } else {
      updatedInventory = inventory.map(i => i.id === editingItem.id ? editingItem : i);
    }
    setInventory(updatedInventory);
    localStorage.setItem('coees_inventory_v1', JSON.stringify(updatedInventory));
    setIsEditItemOpen(false);
  }

  const downloadInventoryExcel = () => {
    const ws = XLSX.utils.json_to_sheet(inventory);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Inventario");
    XLSX.writeFile(wb, "Inventario_COEES.xlsx");
  }

  const lowStockItems = useMemo(() => inventory.filter(i => i.qty <= i.minStock), [inventory]);

  const openEvidenceViewer = (ticket: SupportTicket) => {
    const hasPdf = !!ticket.reportPdf;
    const hasImages = ticket.evidencePhotos && ticket.evidencePhotos.length > 0;
    if (!hasPdf && !hasImages) { toast({ title: "Sin evidencias" }); return; }
    setEvidenceToView({ type: (hasPdf && hasImages) ? 'both' : (hasPdf ? 'pdf' : 'gallery'), pdfData: ticket.reportPdf, images: ticket.evidencePhotos, title: `Evidencia Técnica: ${ticket.schoolName}` });
  }

  const printFile = (data: string) => { const win = window.open(); if (!win) return; win.document.write(`<iframe src="${data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`); }

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
          <Button onClick={() => setIsWarehouseOpen(true)} variant="outline" className="h-12 px-8 rounded-xl border-primary/20 text-primary font-black uppercase text-[10px] gap-2 hover:bg-primary/5 shadow-md">
            <Archive className="h-5 w-5" /> Almacén
          </Button>
          <Button onClick={() => { resetForm(); setEditingTicketId(null); setIsDialogOpen(true); setSearchTerm(''); }} className="btn-institutional h-12 px-10 rounded-xl shadow-lg">
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
              <Input placeholder="BUSCAR POR CCT, PLANTEL, FOLIO O TÉCNICO..." className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all" value={listSearchTerm} onChange={(e) => setListSearchTerm(e.target.value)} />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
           </div>
           <div className="flex items-center gap-4 w-full md:w-auto">
              <Select value={officeFilter} onValueChange={setOfficeFilter}>
                <SelectTrigger className="h-12 w-full md:w-[240px] rounded-xl border-primary/10 bg-white text-[10px] font-black uppercase shadow-sm">
                   <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><SelectValue placeholder="OFICINA DE ATENCIÓN..." /></div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
                  {REGIONAL_OFFICES.map(off => (<SelectItem key={`filter-off-${off}`} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de ", "")}</SelectItem>))}
                </SelectContent>
              </Select>
              <Button variant="outline" className="h-12 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl" onClick={() => setIsSchedulerOpen(true)}><CalendarDays className="h-4 w-4" /> Agenda</Button>
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
                  <TableCell><div className="flex flex-col"><span className="text-[11px] font-black text-slate-700 uppercase leading-none">{ticket.schoolName}</span><span className="text-[9px] font-bold text-muted-foreground mt-1">{ticket.cct} • {ticket.municipio}</span></div></TableCell>
                  <TableCell><button onClick={() => openEvidenceViewer(ticket)} className="hover:scale-105 transition-transform"><Badge variant="outline" className={cn("text-[9px] font-black uppercase border-slate-200", (ticket.reportPdf || (ticket.evidencePhotos && ticket.evidencePhotos.length > 0)) ? "bg-primary/5 text-primary border-primary/20" : "bg-white")}>{ticket.tipoIncidencia}</Badge></button></TableCell>
                  <TableCell><span className="text-[10px] font-bold text-slate-500">{ticket.fechaEntrada}</span></TableCell>
                  <TableCell className="text-center">
                    <Select value={ticket.status} onValueChange={(val) => updateTicketStatus(ticket.id, val)}>
                      <SelectTrigger className={cn("h-7 w-28 text-[8px] font-black uppercase border-2 rounded-full mx-auto", ticket.status === 'atendido' ? 'bg-emerald-50 text-emerald-700 border-emerald-500/30' : ticket.status === 'en proceso' ? 'bg-amber-50 text-amber-700 border-amber-500/30' : 'bg-rose-50 text-rose-700 border-rose-500/30')}><SelectValue /></SelectTrigger>
                      <SelectContent className="rounded-xl"><SelectItem value="pendiente" className="text-[10px] font-black">🔴 PENDIENTE</SelectItem><SelectItem value="en proceso" className="text-[10px] font-black">🟡 EN PROCESO</SelectItem><SelectItem value="atendido" className="text-[10px] font-black">🟢 ATENDIDO</SelectItem></SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell><span className="text-[10px] font-black text-slate-600 uppercase">{ticket.tecnicos || 'SIN ASIGNAR'}</span></TableCell>
                  <TableCell className="text-right pr-8"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg" onClick={() => handleEdit(ticket)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg" onClick={() => handleDeleteTicket(ticket.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell>
                </TableRow>
              )) : (<TableRow><TableCell colSpan={7} className="text-center py-32 opacity-30 flex flex-col items-center gap-4"><LifeBuoy className="h-16 w-16 text-slate-300" /><p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Sin registros operativos</p></TableCell></TableRow>)}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Modal de Almacén Integral */}
      <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
          <DialogContent className="sm:max-w-[1200px] rounded-[2.5rem] h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
            <DialogHeader className="p-6 bg-primary text-white shrink-0 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10"><Archive className="h-40 w-40" /></div>
              <DialogTitle className="uppercase font-black text-white text-2xl flex items-center gap-4 relative z-10"><Package className="h-8 w-8 text-accent" /> Control de Almacén Técnico COEES</DialogTitle>
              <DialogDescription className="text-white/60 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 relative z-10">Sistema Integral de Entradas, Salidas y Stock Crítico</DialogDescription>
            </DialogHeader>
            <Tabs value={warehouseActiveTab} onValueChange={setWarehouseActiveTab} className="flex-1 flex flex-col overflow-hidden">
              <div className="px-8 border-b bg-slate-50/50">
                <TabsList className="bg-transparent h-14 p-0 gap-8">
                  <TabsTrigger value="resumen" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Dashboard</TabsTrigger>
                  <TabsTrigger value="inventario" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Inventario Actual</TabsTrigger>
                  <TabsTrigger value="movimientos" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider">Registro de Flujo</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 overflow-hidden p-6 bg-white">
                <TabsContent value="resumen" className="h-full m-0 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="executive-card p-6 bg-primary/5 border-l-8 border-l-primary flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-primary/60">Insumos Críticos</p><h3 className="text-4xl font-black text-primary mt-1">{lowStockItems.length}</h3></div><AlertTriangle className="h-10 w-10 text-primary opacity-20" /></Card>
                    <Card className="executive-card p-6 bg-accent/5 border-l-8 border-l-accent flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-accent/60">Movimientos Mes</p><h3 className="text-4xl font-black text-accent mt-1">{movements.length}</h3></div><TrendingUp className="h-10 w-10 text-accent opacity-20" /></Card>
                    <Card className="executive-card p-6 bg-emerald-50 border-l-8 border-l-emerald-500 flex justify-between items-start"><div><p className="text-[10px] font-black uppercase text-emerald-600/60">Stock Operativo</p><h3 className="text-4xl font-black text-emerald-600 mt-1">{inventory.length}</h3></div><ClipboardList className="h-10 w-10 text-emerald-500 opacity-20" /></Card>
                  </div>
                  <div className="pt-4"><h4 className="text-[11px] font-black uppercase text-slate-400 mb-4 pl-2">Insumos con Bajo Stock:</h4><div className="grid grid-cols-1 md:grid-cols-3 gap-4">{lowStockItems.map(item => (<div key={`low-${item.id}`} className="bg-rose-50 p-4 rounded-2xl border border-rose-100 flex items-center justify-between shadow-sm animate-pulse"><div><p className="text-[10px] font-black text-rose-800 uppercase">{item.name}</p><p className="text-[8px] font-bold text-rose-600/60 uppercase">Actual: {item.qty} {item.unit}</p></div><Badge className="bg-rose-600 text-white font-black text-[10px]">REURGENTE</Badge></div>))}{lowStockItems.length === 0 && <p className="text-xs font-black uppercase text-slate-300 italic pl-2">Sin alertas críticas.</p>}</div></div>
                </TabsContent>
                <TabsContent value="inventario" className="h-full m-0 overflow-hidden flex flex-col gap-4">
                  <div className="flex justify-end gap-3 pr-4"><Button onClick={downloadInventoryExcel} variant="outline" className="h-10 px-6 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] shadow-sm"><FileSpreadsheet className="h-4 w-4 mr-2" /> Exportar</Button><Button onClick={handleAddNewItem} className="btn-institutional h-10 px-6 text-[10px]"><PlusCircle className="h-4 w-4 mr-2" /> Añadir Insumo</Button></div>
                  <div className="border-2 border-slate-100 rounded-[2rem] bg-white overflow-hidden shadow-inner flex-1 flex flex-col"><ScrollArea className="flex-1"><Table><TableHeader className="bg-slate-50 sticky top-0 z-10 border-b"><TableRow><TableHead className="font-black uppercase text-[10px] pl-6 py-4">Insumo Técnico</TableHead><TableHead className="font-black uppercase text-[10px] text-center">Stock</TableHead><TableHead className="font-black uppercase text-[10px] text-center">Unidad</TableHead><TableHead className="font-black uppercase text-[10px] text-center">Resguardo</TableHead><TableHead className="text-right pr-6 font-black uppercase text-[10px]">Acción</TableHead></TableRow></TableHeader><TableBody>{inventory.map(item => (<TableRow key={`inv-${item.id}`} className="hover:bg-slate-50 border-b border-slate-50 h-16"><TableCell className="font-black text-slate-700 text-xs uppercase pl-6">{item.name}</TableCell><TableCell className="text-center"><span className={cn("inline-flex items-center justify-center h-9 w-14 rounded-xl text-sm font-black", item.qty <= item.minStock ? "bg-rose-50 text-rose-700 border border-rose-200" : "bg-primary/5 text-primary")}>{item.qty}</span></TableCell><TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">{item.unit}</TableCell><TableCell className="text-center"><div className="flex justify-center gap-1">{item.locations?.map(loc => (<Badge key={loc} variant="secondary" className="text-[8px] font-black uppercase">{loc}</Badge>))}</div></TableCell><TableCell className="text-right pr-6"><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleEditInventoryItem(item)}><Pencil className="h-4 w-4" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-rose-300" onClick={() => handleDeleteInventoryItem(item.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}</TableBody></Table></ScrollArea></div>
                </TabsContent>
                <TabsContent value="movimientos" className="h-full m-0 flex flex-col gap-6 overflow-hidden">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 shrink-0">
                      {/* Salida de Material */}
                      <Card className="executive-card p-8 border-t-8 border-t-accent bg-slate-50/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg"><TrendingDown className="h-6 w-6" /></div>
                           <h4 className="text-sm font-black uppercase text-accent tracking-wider">Salida de Material</h4>
                        </div>
                        <div className="space-y-4">
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Insumo a Retirar</Label>
                             <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val})}>
                               <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 shadow-sm font-bold uppercase text-[10px]">
                                 <SelectValue placeholder="ELIGE MATERIAL..." />
                               </SelectTrigger>
                               <SelectContent className="rounded-xl">
                                 {inventory.map(i => <SelectItem key={`sal-${i.id}`} value={i.id.toString()} className="text-[10px] font-bold uppercase">{i.name} (Disponible: {i.qty})</SelectItem>)}
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Cantidad</Label>
                                <Input type="number" placeholder="0" className="h-12 bg-white rounded-xl border-slate-200 text-center font-black text-lg" value={movementForm.qty || ''} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Folio / Ticket</Label>
                                <Input placeholder="SOL-..." className="h-12 bg-white rounded-xl border-slate-200 uppercase font-mono font-black" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value.toUpperCase()})} />
                              </div>
                           </div>
                           <Button onClick={() => { setMovementForm(prev => ({...prev, type: 'salida'})); handleRegisterMovement(); }} className="w-full btn-institutional h-14 bg-accent hover:bg-accent/90 shadow-accent/20">
                             <Save className="h-5 w-5 mr-2" /> Registrar Salida de Stock
                           </Button>
                        </div>
                      </Card>

                      {/* Entrada de Material */}
                      <Card className="executive-card p-8 border-t-8 border-t-primary bg-slate-50/50 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                           <div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><TrendingUp className="h-6 w-6" /></div>
                           <h4 className="text-sm font-black uppercase text-primary tracking-wider">Entrada de Material</h4>
                        </div>
                        <div className="space-y-4">
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Insumo a Ingresar</Label>
                             <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val})}>
                               <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 shadow-sm font-bold uppercase text-[10px]">
                                 <SelectValue placeholder="ELIGE MATERIAL..." />
                               </SelectTrigger>
                               <SelectContent className="rounded-xl">
                                 {inventory.map(i => <SelectItem key={`ent-${i.id}`} value={i.id.toString()} className="text-[10px] font-bold uppercase">{i.name}</SelectItem>)}
                               </SelectContent>
                             </Select>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Cantidad</Label>
                                <Input type="number" placeholder="0" className="h-12 bg-white rounded-xl border-slate-200 text-center font-black text-lg" value={movementForm.qty || ''} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Analista Receptor</Label>
                                <Input placeholder="NOMBRE..." className="h-12 bg-white rounded-xl border-slate-200 uppercase font-black text-[10px]" value={movementForm.recipient} onChange={e => setMovementForm({...movementForm, recipient: e.target.value.toUpperCase()})} />
                              </div>
                           </div>
                           <Button onClick={() => { setMovementForm(prev => ({...prev, type: 'entrada'})); handleRegisterMovement(); }} className="w-full bg-primary text-white h-14 rounded-xl shadow-lg font-black uppercase text-[11px] hover:scale-[1.02] transition-all">
                             <Save className="h-5 w-5 mr-2" /> Registrar Entrada a Almacén
                           </Button>
                        </div>
                      </Card>
                   </div>

                   {/* Historial de Movimientos */}
                   <div className="flex-1 flex flex-col min-h-0 border-2 border-slate-100 rounded-[2.5rem] bg-white overflow-hidden shadow-inner">
                      <div className="p-4 bg-slate-50 border-b flex items-center justify-between">
                         <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-slate-400" />
                            <span className="text-[10px] font-black uppercase text-slate-500">Historial de Registro de Flujo</span>
                         </div>
                         <Badge variant="outline" className="text-[8px] font-black uppercase">{movements.length} Movimientos</Badge>
                      </div>
                      <ScrollArea className="flex-1">
                        <Table>
                          <TableHeader className="bg-white sticky top-0 z-10 border-b">
                            <TableRow>
                              <TableHead className="text-[9px] font-black uppercase pl-8 py-4">Fecha y Hora</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Tipo</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Insumo Técnico</TableHead>
                              <TableHead className="text-[9px] font-black uppercase text-center">Cantidad</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Folio / Responsable</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {movements.map(mov => (
                              <TableRow key={mov.id} className="hover:bg-slate-50 border-b border-slate-50 h-14 group">
                                <TableCell className="pl-8 text-[9px] font-bold text-slate-400">{mov.date}</TableCell>
                                <TableCell>
                                   <Badge className={cn("text-[8px] font-black uppercase h-5 px-3 rounded-full", mov.type === 'entrada' ? "bg-emerald-500" : "bg-accent")}>
                                      {mov.type}
                                   </Badge>
                                </TableCell>
                                <TableCell className="text-[10px] font-black text-slate-700 uppercase">{mov.itemName}</TableCell>
                                <TableCell className="text-center font-black text-primary text-sm">{mov.qty}</TableCell>
                                <TableCell>
                                  <div className="flex flex-col">
                                     <span className="text-[9px] font-black text-primary leading-none">{mov.folio || '-'}</span>
                                     <span className="text-[8px] font-bold text-slate-400 uppercase mt-1 truncate max-w-[120px]">{mov.recipient || '-'}</span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                            {movements.length === 0 && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center py-20 opacity-30 text-xs font-black uppercase italic">Sin movimientos registrados</TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                   </div>
                </TabsContent>
              </div>
            </Tabs>
          </DialogContent>
      </Dialog>

      {/* Formato de Reporte Técnico */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { resetForm(); setEditingTicketId(null); setSearchTerm(''); } }}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-8 pb-4"><DialogTitle className="uppercase font-black text-primary text-2xl">{editingTicketId ? `Actualizar Reporte: ${editingTicketId}` : "Formato de Reporte Técnico"}</DialogTitle></DialogHeader>
          <ScrollArea className="flex-1 px-8">
            <div className="grid gap-8 py-6">
              <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 space-y-6 shadow-inner relative">
                <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2"><Search className="h-4 w-4 text-accent" /> Localizador CCT</Label>
                <Input placeholder="Buscar CCT o Nombre del Plantel..." className="h-14 rounded-2xl bg-white border-primary/10 font-bold uppercase shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                {searchTerm.length > 2 && (
                  <div className="max-h-60 overflow-auto bg-white border border-primary/5 rounded-2xl shadow-2xl absolute left-6 right-6 top-28 z-50 divide-y divide-slate-50">
                    {schoolSearchResults.map(s => (
                      <div key={`${s.cct}-${s.turno}`} className="p-4 hover:bg-primary/5 cursor-pointer flex justify-between items-center" onClick={() => { handleSelectSchool(s.cct, s.turno); setSearchTerm('') }}>
                        <div className="flex items-center gap-4"><div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary"><School className="h-5 w-5" /></div><div className="flex flex-col"><span className="text-xs font-black text-slate-800">{s.nombre}</span><span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.turno}</span></div></div>
                      </div>
                    ))}
                    {schoolSearchResults.length === 0 && (<div className="p-4 text-center"><Button size="sm" variant="outline" className="h-8 text-[9px] font-black uppercase" onClick={() => setIsQuickAddOpen(true)}><Plus className="h-3 w-3 mr-1" /> Alta Rápida de Plantel</Button></div>)}
                  </div>
                )}
                {formData.cct && (<div className="flex items-center gap-4 p-5 bg-white rounded-2xl border shadow-sm border-emerald-100 animate-in slide-in-from-top-4"><div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><School className="h-7 w-7" /></div><div><p className="text-[9px] font-black text-emerald-600 uppercase mb-1">CCT Identificado</p><h4 className="text-sm font-black text-slate-800 uppercase leading-none">{formData.schoolName}</h4><p className="text-[10px] font-mono text-muted-foreground mt-1">{formData.cct} • {formData.municipio}</p></div></div>)}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2"># Solicitud (Folio)</Label><Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-black uppercase" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2">Tipo de Incidencia</Label><Select value={formData.tipoIncidencia} onValueChange={(val: any) => setFormData({...formData, tipoIncidencia: val})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase text-[11px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="red edusat" className="text-[11px] uppercase font-bold">Red Edusat</SelectItem><SelectItem value="red local" className="text-[11px] uppercase font-bold">Red Local</SelectItem><SelectItem value="mantenimiento" className="text-[11px] uppercase font-bold">Mantenimiento</SelectItem><SelectItem value="teleplanteles" className="text-[11px] uppercase font-bold">Teleplanteles</SelectItem><SelectItem value="cuenta institucional" className="text-[11px] uppercase font-bold">Cuenta Institucional</SelectItem></SelectContent></Select></div>
              </div>

              {formData.tipoIncidencia === 'mantenimiento' && (
                <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-200 space-y-8 animate-in zoom-in-95 duration-300">
                  <div className="flex items-center gap-3 border-b border-slate-200 pb-4"><div className="h-10 w-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg"><Monitor className="h-6 w-6" /></div><h3 className="text-sm font-black uppercase text-primary tracking-wider">Módulo de Mantenimiento Detallado</h3></div>
                  <div className="space-y-4"><Label className="text-[10px] font-black uppercase text-primary pl-1">Equipo:</Label><div className="flex flex-wrap gap-6 items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">{['HDT', 'EQUIPO DE COMPUTO', 'OTRO'].map(opt => (<div key={opt} className="flex items-center space-x-2"><Checkbox id={`equipo-${opt}`} checked={formData.mantenimientoDetalle?.equipoTecnologico === opt} onCheckedChange={() => setFormData({...formData, mantenimientoDetalle: { ...formData.mantenimientoDetalle!, equipoTecnologico: opt as any }})} /><Label htmlFor={`equipo-${opt}`} className="text-[10px] font-black uppercase cursor-pointer">{opt}</Label></div>))}</div></div>
                  <div className="border rounded-xl overflow-hidden bg-white"><Table><TableHeader className="bg-slate-100"><TableRow><TableHead className="w-12 text-[9px] font-black uppercase text-center">N.P.</TableHead><TableHead className="text-[9px] font-black uppercase">Equipo</TableHead><TableHead className="text-[9px] font-black uppercase">Marca</TableHead><TableHead className="text-[9px] font-black uppercase">No. Serie</TableHead><TableHead className="text-[9px] font-black uppercase">No. Censal</TableHead></TableRow></TableHeader><TableBody>{Array.from({ length: 10 }).map((_, idx) => (<TableRow key={idx} className="hover:bg-slate-50/50"><TableCell className="text-center font-bold text-[10px] text-muted-foreground">{idx + 1}</TableCell><TableCell className="p-1"><Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.equipo || ''} onChange={e => handleMantenimientoTableChange(idx, 'equipo', e.target.value.toUpperCase())} /></TableCell><TableCell className="p-1"><Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.marca || ''} onChange={e => handleMantenimientoTableChange(idx, 'marca', e.target.value.toUpperCase())} /></TableCell><TableCell className="p-1"><Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.serie || ''} onChange={e => handleMantenimientoTableChange(idx, 'serie', e.target.value.toUpperCase())} /></TableCell><TableCell className="p-1"><Input className="h-8 text-[10px] uppercase border-none" value={formData.mantenimientoDetalle?.equipos[idx]?.censal || ''} onChange={e => handleMantenimientoTableChange(idx, 'censal', e.target.value.toUpperCase())} /></TableCell></TableRow>))}</TableBody></Table></div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2">Oficina de Atención</Label><Select value={formData.oficinaRegionalAtencion} onValueChange={(val) => setFormData({...formData, oficinaRegionalAtencion: val})}><SelectTrigger className="h-12 rounded-xl bg-slate-50 border-primary/10 font-bold uppercase text-[11px]"><SelectValue placeholder="Seleccionar..." /></SelectTrigger><SelectContent>{REGIONAL_OFFICES.map(off => (<SelectItem key={off} value={off} className="text-[11px] uppercase font-bold">{off.replace("Oficina de ", "")}</SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary pl-2">Número de Oficio</Label><Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-mono uppercase" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="COEES/PL/..." /></div>
              </div>

              <div className="space-y-2 pt-4"><Label className="text-[10px] font-black uppercase text-primary pl-2">Observaciones Técnicas</Label><Textarea className="min-h-[120px] rounded-[1.5rem] p-5 bg-slate-50 border-primary/10 focus:bg-white transition-all shadow-inner" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} /></div>

              <div className="space-y-6 pt-6 border-t-2 border-primary/5">
                <div className="flex items-center gap-3 border-b border-primary/10 pb-2"><div className="h-10 w-10 rounded-xl bg-accent text-white flex items-center justify-center shadow-lg"><Archive className="h-6 w-6" /></div><h3 className="text-sm font-black uppercase text-primary tracking-wider">Evidencia Digital</h3></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Reporte (PDF)</Label>
                      <div className={cn("p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all relative group", formData.reportPdf ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200 hover:border-primary/40")}>
                         {formData.reportPdf ? (
                           <div className="flex flex-col items-center gap-3">
                              <FileText className="h-8 w-8 text-emerald-600" />
                              <p className="text-[10px] font-black uppercase text-emerald-700">REPORTE CARGADO</p>
                              <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-8 w-8 text-rose-500 hover:bg-rose-100 rounded-full" onClick={() => setFormData(prev => ({...prev, reportPdf: ''}))}><X className="h-4 w-4" /></Button>
                           </div>
                         ) : (
                           <>
                              <Upload className="h-8 w-8 text-slate-300" />
                              <div className="text-center"><p className="text-[10px] font-black uppercase text-slate-700">Subir Formato PDF</p></div>
                              <Button variant="outline" size="sm" onClick={() => pdfInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase">Seleccionar</Button>
                           </>
                         )}
                         <input type="file" accept=".pdf" className="hidden" ref={pdfInputRef} onChange={(e) => handleFileChange(e, 'pdf')} />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-slate-400 pl-2">Capturas (PNG)</Label>
                      <div className="p-6 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center gap-3 group hover:border-primary/40 relative">
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                          <div className="text-center"><p className="text-[10px] font-black uppercase text-slate-700">Adjuntar Imágenes</p></div>
                          <Button variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} className="h-9 px-6 rounded-xl text-[9px] font-black uppercase">Añadir Imagen</Button>
                          <input type="file" accept=".png" className="hidden" ref={imageInputRef} onChange={(e) => handleFileChange(e, 'image')} />
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4">
                         {(formData.evidencePhotos || []).map((img, idx) => (
                           <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border-2 border-white shadow-md group">
                              <Image src={img} alt="Evidencia" fill className="object-cover" />
                              <button onClick={() => removeImage(idx)} className="absolute top-1 right-1 h-5 w-5 bg-rose-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 border-t bg-slate-50/50"><Button variant="outline" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-14 px-10 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[10px]">Guardar Servicio</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Alta Rápida de CCT */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-[800px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
          <DialogHeader className="p-6 bg-[#B38E5D] text-white shrink-0">
             <DialogTitle className="uppercase font-black text-lg flex items-center gap-3"><PlusCircle className="h-6 w-6" /> Registro Rápido de CCT</DialogTitle>
          </DialogHeader>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">CCT</Label><Input value={quickAddForm.cct} onChange={e => setQuickAddForm({...quickAddForm, cct: e.target.value.toUpperCase()})} maxLength={10} className="font-mono font-black" /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Nombre del Plantel</Label><Input value={quickAddForm.nombre} onChange={e => setQuickAddForm({...quickAddForm, nombre: e.target.value.toUpperCase()})} className="font-black" /></div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Municipio</Label><Input value={quickAddForm.municipio} onChange={e => setQuickAddForm({...quickAddForm, municipio: e.target.value.toUpperCase()})} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-primary">Valle</Label><Select value={quickAddForm.valle} onValueChange={v => setQuickAddForm({...quickAddForm, valle: v})}><SelectTrigger className="font-bold"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MEXICO">MÉXICO</SelectItem><SelectItem value="TOLUCA">TOLUCA</SelectItem></SelectContent></Select></div>
             </div>
          </div>
          <DialogFooter className="p-6 bg-slate-50 border-t flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="h-12 px-8 text-[10px] font-black uppercase">Cancelar</Button><Button onClick={handleQuickAddCct} className="bg-primary text-white h-12 px-12 rounded-xl text-[10px] font-black uppercase shadow-lg">Registrar</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!evidenceToView} onOpenChange={(open) => !open && setEvidenceToView(null)}>
        <DialogContent className="sm:max-w-[1000px] h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <DialogHeader className="p-6 bg-primary text-white shrink-0 flex flex-row justify-between items-center pr-12">
            <div className="space-y-1"><DialogTitle className="uppercase font-black text-white text-xl flex items-center gap-4"><Archive className="h-7 w-7 text-accent" /> {evidenceToView?.title}</DialogTitle></div>
            <div className="flex gap-4">{evidenceToView?.pdfData && <Button onClick={() => printFile(evidenceToView.pdfData!)} className="bg-white text-primary hover:bg-slate-100 font-black text-[10px] uppercase h-10 px-6 rounded-xl shadow-xl"><Printer className="h-4 w-4" /> Imprimir</Button>}<button onClick={() => setEvidenceToView(null)} className="h-10 w-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-all"><X className="h-5 w-5" /></button></div>
          </DialogHeader>
          <Tabs defaultValue={evidenceToView?.pdfData ? "pdf" : "gallery"} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-8 border-b bg-slate-50/50">
               <TabsList className="bg-transparent h-14 p-0 gap-8">
                  {evidenceToView?.pdfData && <TabsTrigger value="pdf" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider flex items-center gap-2"><FileText className="h-4 w-4" /> Reporte PDF</TabsTrigger>}
                  {evidenceToView?.images && evidenceToView.images.length > 0 && <TabsTrigger value="gallery" className="rounded-none border-b-4 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-2 py-4 text-[11px] font-black uppercase tracking-wider flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Galería ({evidenceToView.images.length})</TabsTrigger>}
               </TabsList>
            </div>
            <div className="flex-1 overflow-hidden bg-slate-100/50">
               <TabsContent value="pdf" className="h-full m-0 p-0">{evidenceToView?.pdfData ? <iframe src={evidenceToView.pdfData} className="w-full h-full border-none bg-white" title="PDF Viewer" /> : <div className="h-full flex items-center justify-center opacity-20"><FileText className="h-20 w-20" /></div>}</TabsContent>
               <TabsContent value="gallery" className="h-full m-0 overflow-hidden"><ScrollArea className="h-full p-8"><div className="grid grid-cols-1 md:grid-cols-3 gap-6">{evidenceToView?.images?.map((img, idx) => (<div key={idx} className="group relative aspect-video bg-white rounded-2xl overflow-hidden border-2 border-white shadow-lg transition-all hover:scale-[1.02]"><Image src={img} alt="Evidencia" fill className="object-cover" /><div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="h-8 w-8 text-white" /></div></div>))}</div></ScrollArea></TabsContent>
            </div>
          </Tabs>
          <DialogFooter className="p-4 bg-slate-50 border-t shrink-0"><Button variant="ghost" onClick={() => setEvidenceToView(null)} className="h-10 px-10 font-black uppercase text-[10px]">Cerrar Visor</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <VisitSchedulerDialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen} areaId="soporte" areaName="Soporte Técnico" />
    </div>
  );
}
