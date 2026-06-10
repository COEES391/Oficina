
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supportData, type SupportTicket } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import { 
  PlusCircle, 
  LifeBuoy, 
  FileText, 
  ImageIcon, 
  X, 
  Circle, 
  Search, 
  Eye, 
  Pencil, 
  School, 
  Tv, 
  Radio, 
  Activity, 
  UserCog, 
  Network, 
  Info, 
  MapPin, 
  Zap, 
  Monitor, 
  CalendarDays, 
  Building2, 
  Archive, 
  Package,
  TrendingDown,
  TrendingUp,
  History,
  AlertTriangle,
  ClipboardList,
  UserPlus
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { VisitSchedulerDialog } from '@/components/VisitSchedulerDialog'

const REGIONAL_OFFICES = [
  "Oficina de Tecnóloga Educativa Ecatepec",
  "Oficina de Tecnóloga Educativa Naucalpan",
  "Oficina de Tecnóloga Educativa Nezahualcóyotl",
  "Oficina de Tecnóloga Educativa Toluca",
  "Oficina de COEES Tultitlan"
];

const MAINTENANCE_CHECKLIST = [
  "SUSTITUCIÓN DE CONECTORES",
  "SUSTITUCIÓN DE CORDONES DE PARCHEO",
  "SUSTITUCIÓN DE CABLE UTP",
  "SUSTITUCIÓN DE ROSETAS",
  "SUSTITUCIÓN DE CANALETAS",
  "CONFIGURACIÓN DE RED"
];

const EDUSAT_MICROPAK = ['REVISIÓN', 'POLARIZACIÓN', 'PRUEBA', 'CAMBIO'];
const EDUSAT_ANTENA = ['ORIENTACIÓN', 'REPARACIÓN', 'REUBICACIÓN', 'CAMBIO'];
const EDUSAT_DECO_ACCIONES = ['CONFIGURACIÓN', 'REUBICACIÓN', 'CAMBIO'];
const EDUSAT_CABLEADO = ['CAMBIO DE CAMPANAS', 'CAMBIO DE DIVISOR', 'CAMBIO DE CABLE'];
const EDUSAT_PREVENTIVO = ['REVISIÓN GENERAL', 'LIMPIEZA GENERAL', 'CUIDADO PREVENTIVO'];

type InventoryItem = {
  id: number;
  name: string;
  qty: number;
  unit: string;
  minStock: number;
  category: string;
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
  { id: 1, name: 'Cable UTP Categoría 6', qty: 4, unit: 'Bobina (305m)', minStock: 2, category: 'REDES' },
  { id: 2, name: 'Conectores RJ45 (Bolsa)', qty: 2, unit: 'Bolsa 100pzs', minStock: 5, category: 'REDES' },
  { id: 3, name: 'Pasta Térmica Jeringa', qty: 15, unit: 'Pieza', minStock: 10, category: 'MTTO' },
  { id: 4, name: 'Limpiador de Contactos (Spray)', qty: 10, unit: 'Pieza', minStock: 5, category: 'MTTO' },
  { id: 5, name: 'Aire Comprimido', qty: 18, unit: 'Pieza', minStock: 10, category: 'MTTO' },
  { id: 6, name: 'Canaleta PVC 20x10', qty: 40, unit: 'Tramo 2m', minStock: 20, category: 'REDES' },
  { id: 7, name: 'Rosetas RJ45 Dobles', qty: 25, unit: 'Pieza', minStock: 10, category: 'REDES' },
  { id: 8, name: 'Patch Cord 1.5m / 3m', qty: 45, unit: 'Pieza', minStock: 15, category: 'REDES' },
  { id: 9, name: 'Switch de 8 Puertos Giga', qty: 3, unit: 'Pieza', minStock: 5, category: 'EQUIPOS' },
  { id: 10, name: 'Kit de Herramientas de Red', qty: 5, unit: 'Set', minStock: 2, category: 'HERRAMIENTA' },
];

export default function SupportPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  
  // Almacén State
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(false)
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<WarehouseMovement[]>([])
  const [warehouseActiveTab, setWarehouseActiveTab] = useState('resumen')
  const [movementForm, setMovementForm] = useState({
    type: 'salida' as 'entrada' | 'salida',
    itemId: '',
    qty: 0,
    recipient: '',
    folio: '',
    observations: ''
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

    // Load Warehouse
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

  const getNextFolio = (currentTickets: SupportTicket[]) => {
    const numericIds = currentTickets
      .map(t => {
        const match = t.id.match(/\d+/);
        return match ? parseInt(match[0], 10) : null;
      })
      .filter((id): id is number => id !== null);
    
    if (numericIds.length === 0) return "100";
    const maxId = Math.max(...numericIds);
    return (maxId + 1).toString();
  };

  const handleSelectSchool = (cct: string, turno: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct && s.turno === turno);
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

  const handleMantenimientoToggle = (item: string) => {
    const current = formData.mantenimientoChecklist || [];
    const exists = current.includes(item);
    if (exists) {
      setFormData({ ...formData, mantenimientoChecklist: current.filter(i => i !== item) });
    } else {
      setFormData({ ...formData, mantenimientoChecklist: [...current, item] });
    }
  }

  const handleEdusatChecklistToggle = (category: keyof NonNullable<SupportTicket['edusatDetalle']>, item: string) => {
    const current = (formData.edusatDetalle?.[category] as string[]) || [];
    const exists = current.includes(item);
    const updated = exists ? current.filter(i => i !== item) : [...current, item];
    setFormData({
      ...formData,
      edusatDetalle: {
        ...formData.edusatDetalle!,
        [category]: updated
      }
    });
  }

  const handleEdusatMaterialChange = (index: number, field: string, value: string) => {
    const current = formData.edusatDetalle || initialFormState.edusatDetalle!;
    const newMaterials = [...current.materiales];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({
      ...formData,
      edusatDetalle: { ...current, materiales: newMaterials }
    });
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'pdf' | 'photo' | 'contrato') => {
    const files = e.target.files
    if (!files) return

    if (type === 'pdf') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, reportPdf: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else if (type === 'contrato') {
      const file = files[0]
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({ ...formData, contratoFile: reader.result as string })
      }
      reader.readAsDataURL(file)
    } else {
      const newPhotos = Array.from(files)
      if ((formData.evidencePhotos?.length || 0) + newPhotos.length > 5) {
        toast({ variant: "destructive", title: "Límite", description: "Máximo 5 fotos." })
        return
      }
      newPhotos.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            evidencePhotos: [...(prev.evidencePhotos || []), reader.result as string]
          }))
        }
        reader.readAsDataURL(file)
      })
    }
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
      }
      updated = [newTicket, ...tickets]
    }

    setTickets(updated)
    localStorage.setItem('support_tickets_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    setEditingTicketId(null)
    toast({ title: "Cambios guardados con éxito" })
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

  // WAREHOUSE LOGIC
  const handleRegisterMovement = () => {
    const { itemId, qty, type, recipient, folio, observations } = movementForm;
    if (!itemId || qty <= 0) {
      toast({ variant: "destructive", title: "Datos incompletos", description: "Seleccione un material y cantidad válida." })
      return;
    }

    const item = inventory.find(i => i.id === parseInt(itemId));
    if (!item) return;

    if (type === 'salida' && item.qty < qty) {
      toast({ variant: "destructive", title: "Stock insuficiente", description: `Solo hay ${item.qty} ${item.unit} disponibles.` })
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
    toast({ title: "Movimiento registrado", description: `Se ha actualizado el stock de ${item.name}.` });
  }

  const lowStockItems = useMemo(() => inventory.filter(i => i.qty <= i.minStock), [inventory]);

  if (!mounted) return null

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
              const nextId = getNextFolio(tickets);
              setFormData({
                ...initialFormState,
                id: nextId,
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

        {/* Modal de Almacén Integral */}
        <Dialog open={isWarehouseOpen} onOpenChange={setIsWarehouseOpen}>
          <DialogContent className="sm:max-w-[1100px] rounded-[2.5rem] h-[92vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl">
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
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Requieren reabastecimiento urgente</p>
                    </Card>

                    <Card className="executive-card p-6 bg-accent/5 border-accent/10 border-l-8 border-l-accent">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-accent/60 tracking-widest">Movimientos Mes</p>
                          <h3 className="text-4xl font-black text-accent mt-1">{movements.length}</h3>
                        </div>
                        <TrendingUp className="h-10 w-10 text-accent opacity-20" />
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Registro de entradas y salidas</p>
                    </Card>

                    <Card className="executive-card p-6 bg-emerald-50 border-emerald-100 border-l-8 border-l-emerald-500">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black uppercase text-emerald-600/60 tracking-widest">Stock Operativo</p>
                          <h3 className="text-4xl font-black text-emerald-600 mt-1">{inventory.length}</h3>
                        </div>
                        <ClipboardList className="h-10 w-10 text-emerald-500 opacity-20" />
                      </div>
                      <p className="text-[9px] font-bold text-slate-500 uppercase mt-4">Tipos de materiales activos</p>
                    </Card>
                  </div>

                  {lowStockItems.length > 0 && (
                    <div className="p-6 bg-rose-50 rounded-2xl border-2 border-rose-100 animate-pulse">
                      <h4 className="text-xs font-black text-rose-700 uppercase mb-4 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" /> Alerta de Inventario Crítico
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {lowStockItems.map(item => (
                          <div key={item.id} className="bg-white p-3 rounded-xl shadow-sm border border-rose-100">
                            <p className="text-[10px] font-black text-slate-700 uppercase leading-none mb-1">{item.name}</p>
                            <div className="flex justify-between items-center mt-2">
                              <span className="text-rose-600 font-black text-sm">{item.qty} {item.unit.split(' ')[0]}</span>
                              <Badge className="bg-rose-100 text-rose-700 text-[8px]">BAJO</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="inventario" className="h-full m-0 overflow-hidden">
                  <div className="border-2 border-slate-100 rounded-[2rem] bg-white overflow-hidden shadow-inner h-full flex flex-col">
                    <ScrollArea className="flex-1">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[10px] pl-6 py-4">Insumo Técnico</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Stock Actual</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Unidad</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-center">Min. Sugerido</TableHead>
                            <TableHead className="font-black uppercase text-[10px] text-right pr-6">Estado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {inventory.map(item => (
                            <TableRow key={item.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 h-16">
                              <TableCell className="font-black text-slate-700 text-xs uppercase pl-6 py-4">{item.name}</TableCell>
                              <TableCell className="text-center">
                                <span className={cn(
                                  "inline-flex items-center justify-center h-9 w-14 rounded-xl text-sm font-black border transition-all shadow-sm",
                                  item.qty <= item.minStock ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-primary/5 text-primary border-primary/10"
                                )}>
                                  {item.qty}
                                </span>
                              </TableCell>
                              <TableCell className="text-center text-[10px] font-bold text-slate-500 uppercase">{item.unit}</TableCell>
                              <TableCell className="text-center text-[10px] font-mono font-black text-slate-400">{item.minStock}</TableCell>
                              <TableCell className="text-right pr-6">
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase px-4 py-1.5 rounded-full shadow-sm",
                                  item.qty <= item.minStock ? 'bg-rose-600 text-white' : 'bg-emerald-500 text-white'
                                )}>
                                  {item.qty <= item.minStock ? 'Reabastecer' : 'Óptimo'}
                                </Badge>
                              </TableCell>
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
                      <h4 className="text-sm font-black uppercase text-accent mb-6 flex items-center gap-3">
                         <TrendingDown className="h-5 w-5" /> Registro de Salida de Material
                      </h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Seleccionar Insumo</Label>
                          <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val, type: 'salida'})}>
                            <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 text-xs font-bold uppercase"><SelectValue placeholder="ELIGE MATERIAL..." /></SelectTrigger>
                            <SelectContent>
                              {inventory.map(i => <SelectItem key={i.id} value={i.id.toString()} className="text-[10px] font-bold uppercase">{i.name} (Stock: {i.qty})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Cantidad</Label>
                            <Input type="number" className="h-12 bg-white rounded-xl text-center font-black text-lg" value={movementForm.qty} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Folio Servicio (Opcional)</Label>
                            <Input className="h-12 bg-white rounded-xl uppercase font-mono text-xs" placeholder="FOL-XXX" value={movementForm.folio} onChange={e => setMovementForm({...movementForm, folio: e.target.value.toUpperCase()})} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Técnico / Beneficiario</Label>
                          <Input className="h-12 bg-white rounded-xl uppercase font-bold text-xs" placeholder="NOMBRE DEL RESPONSABLE..." value={movementForm.recipient} onChange={e => setMovementForm({...movementForm, recipient: e.target.value.toUpperCase()})} />
                        </div>
                        <Button onClick={handleRegisterMovement} className="w-full btn-institutional h-14 text-[11px]">Registrar Salida Oficial</Button>
                      </div>
                    </Card>

                    <Card className="executive-card p-8 border-t-8 border-t-primary bg-slate-50/50">
                      <h4 className="text-sm font-black uppercase text-primary mb-6 flex items-center gap-3">
                         <TrendingUp className="h-5 w-5" /> Entrada por Reabastecimiento
                      </h4>
                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Seleccionar Insumo</Label>
                          <Select value={movementForm.itemId} onValueChange={(val) => setMovementForm({...movementForm, itemId: val, type: 'entrada'})}>
                            <SelectTrigger className="h-12 bg-white rounded-xl border-slate-200 text-xs font-bold uppercase"><SelectValue placeholder="ELIGE MATERIAL..." /></SelectTrigger>
                            <SelectContent>
                              {inventory.map(i => <SelectItem key={i.id} value={i.id.toString()} className="text-[10px] font-bold uppercase">{i.name}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Cantidad Entrante</Label>
                          <Input type="number" className="h-12 bg-white rounded-xl text-center font-black text-lg" value={movementForm.qty} onChange={e => setMovementForm({...movementForm, qty: parseInt(e.target.value) || 0})} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-slate-400 pl-1">Observaciones / Proveedor</Label>
                          <Textarea className="h-24 bg-white rounded-xl uppercase font-bold text-xs p-4" placeholder="NOTAS DE LA ENTREGA..." value={movementForm.observations} onChange={e => setMovementForm({...movementForm, observations: e.target.value.toUpperCase()})} />
                        </div>
                        <Button onClick={handleRegisterMovement} className="w-full bg-primary text-white h-14 rounded-xl shadow-lg font-black uppercase text-[11px] hover:bg-primary/95">Registrar Entrada al Almacén</Button>
                      </div>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="historial" className="h-full m-0 overflow-hidden">
                  <div className="border rounded-[2rem] bg-white overflow-hidden shadow-inner h-full">
                    <ScrollArea className="h-full">
                      <Table>
                        <TableHeader className="bg-slate-50 sticky top-0 z-10 border-b">
                          <TableRow>
                            <TableHead className="font-black uppercase text-[9px] pl-6 h-12">Fecha / Hora</TableHead>
                            <TableHead className="font-black uppercase text-[9px] h-12">Tipo</TableHead>
                            <TableHead className="font-black uppercase text-[9px] h-12">Material</TableHead>
                            <TableHead className="font-black uppercase text-[9px] h-12 text-center">Qty</TableHead>
                            <TableHead className="font-black uppercase text-[9px] h-12">Beneficiario / Técnico</TableHead>
                            <TableHead className="font-black uppercase text-[9px] h-12 text-right pr-6">Referencia</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {movements.map(mov => (
                            <TableRow key={mov.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50">
                              <TableCell className="font-mono text-[10px] font-bold text-slate-400 pl-6 py-4">{mov.date}</TableCell>
                              <TableCell>
                                <Badge className={cn(
                                  "text-[8px] font-black uppercase",
                                  mov.type === 'entrada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                                )}>
                                  {mov.type}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-black text-slate-700 text-[10px] uppercase">{mov.itemName}</TableCell>
                              <TableCell className="text-center font-black text-primary text-xs">{mov.qty}</TableCell>
                              <TableCell className="text-[10px] font-bold text-slate-500 uppercase">{mov.recipient || '-'}</TableCell>
                              <TableCell className="text-right pr-6 font-mono text-[9px] font-black text-accent">{mov.folio || 'N/A'}</TableCell>
                            </TableRow>
                          ))}
                          {movements.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-24 opacity-30">
                                <History className="h-10 w-10 mx-auto mb-4" />
                                <p className="text-[10px] font-black uppercase">Sin registros de movimientos disponibles</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </div>
            </Tabs>

            <DialogFooter className="p-6 bg-slate-100 border-t flex justify-between items-center shrink-0">
              <div className="flex gap-4">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="text-[9px] font-black uppercase text-slate-500">Stock Seguro</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase text-slate-500">Alerta de Stock</span>
                 </div>
              </div>
              <Button variant="outline" onClick={() => setIsWarehouseOpen(false)} className="rounded-xl h-12 px-10 text-[10px] font-black uppercase border-slate-300 hover:bg-white shadow-sm">
                Cerrar Panel Operativo
              </Button>
            </DialogFooter>
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
              <DialogDescription className="font-bold text-[11px] uppercase tracking-[0.2em]">
                Capture los datos del servicio y asocie las evidencias digitales correspondientes.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 px-8">
              <div className="grid gap-8 py-6">
                <div className="p-6 bg-slate-50 rounded-[2rem] border border-primary/10 space-y-6 shadow-inner">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                      <Search className="h-4 w-4" /> Localizador Institucional CCT
                    </Label>
                    <Input 
                      placeholder="Teclear CCT o Nombre del Plantel para autocompletar..." 
                      className="h-14 rounded-2xl bg-white border-primary/10 font-bold uppercase shadow-sm focus:ring-2 focus:ring-primary/20" 
                      value={searchTerm} 
                      onChange={(e) => setSearchTerm(e.target.value)} 
                    />
                  </div>
                  
                  {searchTerm && (
                    <div className="max-h-60 overflow-auto bg-white border border-primary/5 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200 divide-y divide-slate-50">
                      {schoolsDirectory.filter(s => 
                        (s.nombre || '').toUpperCase().includes(searchTerm.toUpperCase()) || 
                        (s.cct || '').toUpperCase().includes(searchTerm.toUpperCase())
                      ).slice(0, 10).map(s => (
                        <div 
                          key={`${s.cct}-${s.turno}`} 
                          className="p-4 hover:bg-primary/5 cursor-pointer transition-colors flex justify-between items-center group" 
                          onClick={() => { handleSelectSchool(s.cct, s.turno); setSearchTerm('') }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                               <School className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                               <span className="text-xs font-black text-slate-800">{s.nombre}</span>
                               <span className="text-[10px] font-mono text-muted-foreground">{s.cct} • {s.turno}</span>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/10">{s.municipio}</Badge>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.cct && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 animate-in slide-in-from-top-4">
                      <div className="md:col-span-3 flex items-center gap-4 p-5 bg-white rounded-2xl border shadow-sm border-emerald-100">
                        <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                          <School className="h-7 w-7" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">CCT Identificado</p>
                          <h4 className="text-sm font-black text-slate-800 uppercase leading-none">{formData.schoolName}</h4>
                          <p className="text-[10px] font-mono text-muted-foreground mt-1">{formData.cct} • {formData.municipio} • {formData.region}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-2"># Solicitud (Folio)</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-black uppercase" value={formData.id} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="FOLIO..." />
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

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2 pl-2">
                    <UserCog className="h-4 w-4" /> Nombre(s) del Técnico(s) Responsable(s)
                  </Label>
                  <Input 
                    className="h-14 rounded-2xl bg-slate-50 border-primary/10 font-bold uppercase" 
                    placeholder="INGRESAR NOMBRES DE LOS TÉCNICOS..." 
                    value={formData.tecnicos} 
                    onChange={e => setFormData({...formData, tecnicos: e.target.value.toUpperCase()})} 
                  />
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
                          <div key={opt} className="flex items-center space-x-2">
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
                        {formData.mantenimientoDetalle?.equipoTecnologico === 'OTRO' && (
                          <Input 
                            className="h-9 w-48 bg-slate-50 text-[10px]" 
                            placeholder="ESPECIFICAR..." 
                            value={formData.mantenimientoDetalle?.equipoTecnologicoOtro} 
                            onChange={e => setFormData({
                              ...formData,
                              mantenimientoDetalle: { ...formData.mantenimientoDetalle!, equipoTecnologicoOtro: e.target.value.toUpperCase() }
                            })} 
                          />
                        )}
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
                            <TableRow key={idx} className="hover:bg-slate-50/50">
                              <TableCell className="text-center font-bold text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="p-1">
                                <Input className="h-8 text-[10px] uppercase border-none focus:ring-1" value={formData.mantenimientoDetalle?.equipos[idx]?.equipo || ''} onChange={e => handleMantenimientoTableChange(idx, 'equipo', e.target.value.toUpperCase())} />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input className="h-8 text-[10px] uppercase border-none focus:ring-1" value={formData.mantenimientoDetalle?.equipos[idx]?.marca || ''} onChange={e => handleMantenimientoTableChange(idx, 'marca', e.target.value.toUpperCase())} />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input className="h-8 text-[10px] uppercase border-none focus:ring-1" value={formData.mantenimientoDetalle?.equipos[idx]?.serie || ''} onChange={e => handleMantenimientoTableChange(idx, 'serie', e.target.value.toUpperCase())} />
                              </TableCell>
                              <TableCell className="p-1">
                                <Input className="h-8 text-[10px] uppercase border-none focus:ring-1" value={formData.mantenimientoDetalle?.equipos[idx]?.censal || ''} onChange={e => handleMantenimientoTableChange(idx, 'censal', e.target.value.toUpperCase())} />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary pl-1">Falla Identificada:</Label>
                        <Input className="h-11 bg-white border-slate-200" value={formData.mantenimientoDetalle?.fallaIdentificada} onChange={e => setFormData({...formData, mantenimientoDetalle: {...formData.mantenimientoDetalle!, fallaIdentificada: e.target.value.toUpperCase()}})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-primary pl-1">Servicio Realizado:</Label>
                        <Input className="h-11 bg-white border-slate-200" value={formData.mantenimientoDetalle?.servicioRealizado} onChange={e => setFormData({...formData, mantenimientoDetalle: {...formData.mantenimientoDetalle!, servicioRealizado: e.target.value.toUpperCase()}})} />
                      </div>
                    </div>
                  </div>
                )}

                {formData.tipoIncidencia === 'red local' && (
                  <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border-2 border-indigo-100 space-y-8 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 border-b border-indigo-100 pb-3">
                       <div className="h-10 w-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                          <Network className="h-6 w-6" />
                       </div>
                       <h3 className="text-sm font-black uppercase text-indigo-900 tracking-wider">Módulo Técnico de RED Local</h3>
                    </div>

                    <div className="space-y-4">
                       <Label className="text-[10px] font-black uppercase text-indigo-700 pl-1">Donde se brinda el servicio:</Label>
                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {['TALLER DE CÓMPUTO', 'AULA DE MEDIOS', 'HDT', 'OFIMÁTICA', 'ÁREA ADMINISTRATIVA', 'OTRO'].map(lugar => (
                            <div key={lugar} className="flex items-center space-x-2 bg-white/50 p-2 rounded-lg border border-indigo-50">
                               <Checkbox 
                                id={`lugar-${lugar}`} 
                                checked={formData.lugarServicio === lugar}
                                onCheckedChange={() => setFormData({...formData, lugarServicio: lugar})}
                                className="border-indigo-300"
                               />
                               <label htmlFor={`lugar-${lugar}`} className="text-[9px] font-bold uppercase text-indigo-900 cursor-pointer">{lugar}</label>
                            </div>
                          ))}
                       </div>
                       {formData.lugarServicio === 'OTRO' && (
                         <Input className="h-10 bg-white" placeholder="ESPECIFICAR OTRO..." value={formData.lugarServicioOtro} onChange={e => setFormData({...formData, lugarServicioOtro: e.target.value.toUpperCase()})} />
                       )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <Label className="text-[10px] font-black uppercase text-indigo-700 pl-1">Diagnóstico:</Label>
                          <RadioGroup value={formData.diagnosticoRed} onValueChange={(val: any) => setFormData({...formData, diagnosticoRed: val})} className="grid grid-cols-1 gap-2">
                             <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-indigo-100">
                                <RadioGroupItem value="ampliacion" id="diag-ampli" />
                                <Label htmlFor="diag-ampli" className="text-[10px] font-black uppercase">Ampliación</Label>
                             </div>
                             <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-indigo-100">
                                <RadioGroupItem value="mantenimiento" id="diag-mante" />
                                <Label htmlFor="diag-mante" className="text-[10px] font-black uppercase">Mantenimiento</Label>
                             </div>
                             <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-indigo-100">
                                <RadioGroupItem value="nueva red" id="diag-nueva" />
                                <Label htmlFor="diag-nueva" className="text-[10px] font-black uppercase">Instalación de nueva red</Label>
                             </div>
                          </RadioGroup>

                          <div className="space-y-3 pt-4 border-t border-indigo-100">
                             <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-indigo-50">
                                <span className="text-[10px] font-bold uppercase text-indigo-900">¿Cuenta con red local?</span>
                                <div className="flex gap-4">
                                   <div className="flex items-center gap-2"><Checkbox checked={formData.cuentaRedLocal === 'S'} onCheckedChange={() => setFormData({...formData, cuentaRedLocal: 'S'})} /><span className="text-[10px] font-bold">SÍ</span></div>
                                   <div className="flex items-center gap-2"><Checkbox checked={formData.cuentaRedLocal === 'N'} onCheckedChange={() => setFormData({...formData, cuentaRedLocal: 'N'})} /><span className="text-[10px] font-bold">NO</span></div>
                                </div>
                             </div>
                             <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-indigo-50">
                                <span className="text-[10px] font-bold uppercase text-indigo-900">Instalación eléctrica adecuada</span>
                                <div className="flex gap-4">
                                   <div className="flex items-center gap-2"><Checkbox checked={formData.electricaAdecuada === 'S'} onCheckedChange={() => setFormData({...formData, electricaAdecuada: 'S'})} /><span className="text-[10px] font-bold">SÍ</span></div>
                                   <div className="flex items-center gap-2"><Checkbox checked={formData.electricaAdecuada === 'N'} onCheckedChange={() => setFormData({...formData, electricaAdecuada: 'N'})} /><span className="text-[10px] font-bold">NO</span></div>
                                </div>
                             </div>
                             <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-indigo-50">
                                <span className="text-[10px] font-bold uppercase text-indigo-900">¿Cuenta con internet?</span>
                                <div className="flex gap-4">
                                   <div className="flex items-center gap-2"><Checkbox checked={formData.cuentaInternet === 'S'} onCheckedChange={() => setFormData({...formData, cuentaInternet: 'S'})} /><span className="text-[10px] font-bold">SÍ</span></div>
                                   <div className="flex items-center gap-2"><Checkbox checked={formData.cuentaInternet === 'N'} onCheckedChange={() => setFormData({...formData, cuentaInternet: 'N'})} /><span className="text-[10px] font-bold">NO</span></div>
                                </div>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-indigo-400">Proveedor de Internet:</Label>
                                <Select value={formData.proveedorInternet} onValueChange={(val) => setFormData({...formData, proveedorInternet: val})}>
                                   <SelectTrigger className="h-9 bg-white text-[10px] font-bold"><SelectValue placeholder="SELECCIONAR..." /></SelectTrigger>
                                   <SelectContent>
                                      {['TOTALPLAY', 'TELMEX', 'MEGACABLE', 'IZZY', 'WIX', 'OTRO'].map(p => <SelectItem key={p} value={p} className="text-[10px] font-bold">{p}</SelectItem>)}
                                   </SelectContent>
                                </Select>
                             </div>
                             <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase text-indigo-400">¿Cuál es el ancho de banda?</Label>
                                <Input className="h-9 bg-white font-black" value={formData.anchoBanda} onChange={e => setFormData({...formData, anchoBanda: e.target.value})} placeholder="EJ: 100 MBPS" />
                             </div>
                          </div>
                       </div>

                       <div className="space-y-6">
                          <div className="bg-white p-5 rounded-[1.5rem] border-2 border-indigo-100 shadow-sm">
                             <Label className="text-[10px] font-black uppercase text-indigo-600 block mb-2">Número de Nodos:</Label>
                             <Input type="number" className="h-12 text-2xl font-black text-center border-indigo-200" value={formData.numNodos} onChange={e => setFormData({...formData, numNodos: parseInt(e.target.value) || 0})} />
                          </div>

                          <div className="space-y-3">
                             <Label className="text-[10px] font-black uppercase text-indigo-700 pl-1">Mantenimiento Preventivo y/o Correctivo:</Label>
                             <div className="grid grid-cols-1 gap-2 bg-white/40 p-4 rounded-2xl border border-indigo-50">
                                {MAINTENANCE_CHECKLIST.map(item => (
                                  <div key={item} className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-indigo-100 shadow-sm">
                                     <Checkbox 
                                      id={`mante-${item}`} 
                                      checked={(formData.mantenimientoChecklist || []).includes(item)}
                                      onCheckedChange={() => handleMantenimientoToggle(item)}
                                      className="border-indigo-400 data-[state=checked]:bg-indigo-600"
                                     />
                                     <label htmlFor={`mante-${item}`} className="text-[9px] font-black uppercase text-slate-700 cursor-pointer">{item}</label>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                )}

                {formData.tipoIncidencia === 'red edusat' && (
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-primary/20 space-y-8 animate-in zoom-in-95 duration-300 shadow-xl">
                    <div className="flex items-center gap-4 border-b border-primary/10 pb-4">
                       <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg">
                          <Radio className="h-7 w-7" />
                       </div>
                       <div>
                         <h3 className="text-lg font-black uppercase text-primary tracking-wider leading-none">Módulo Técnico RED Edusat Avanzado</h3>
                         <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Diagnóstico Institucional por Componentes</p>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                       <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">MICROPAK (LNB)</Label>
                          {EDUSAT_MICROPAK.map(item => (
                            <div key={item} className="flex items-center space-x-2">
                               <Checkbox id={`lnb-${item}`} checked={(formData.edusatDetalle?.micropak || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('micropak', item)} />
                               <label htmlFor={`lnb-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                            </div>
                          ))}
                       </div>
                       <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">ANT. PARABÓLICA</Label>
                          {EDUSAT_ANTENA.map(item => (
                            <div key={item} className="flex items-center space-x-2">
                               <Checkbox id={`ant-${item}`} checked={(formData.edusatDetalle?.antena || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('antena', item)} />
                               <label htmlFor={`ant-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                            </div>
                          ))}
                       </div>
                       <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">DECODIFICADOR</Label>
                          {EDUSAT_DECO_ACCIONES.map(item => (
                            <div key={item} className="flex items-center space-x-2">
                               <Checkbox id={`deco-acc-${item}`} checked={(formData.edusatDetalle?.decodificadorAcciones || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('decodificadorAcciones', item)} />
                               <label htmlFor={`deco-acc-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                            </div>
                          ))}
                       </div>
                       <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">CABLEADO</Label>
                          {EDUSAT_CABLEADO.map(item => (
                            <div key={item} className="flex items-center space-x-2">
                               <Checkbox id={`cab-${item}`} checked={(formData.edusatDetalle?.cableado || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('cableado', item)} />
                               <label htmlFor={`cab-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                            </div>
                          ))}
                       </div>
                       <div className="space-y-3 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                          <Label className="text-[9px] font-black uppercase text-primary border-b pb-1 block">M. PREVENTIVO</Label>
                          {EDUSAT_PREVENTIVO.map(item => (
                            <div key={item} className="flex items-center space-x-2">
                               <Checkbox id={`prev-${item}`} checked={(formData.edusatDetalle?.preventivo || []).includes(item)} onCheckedChange={() => handleEdusatChecklistToggle('preventivo', item)} />
                               <label htmlFor={`prev-${item}`} className="text-[8px] font-bold uppercase leading-none cursor-pointer">{item}</label>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Número Censal:</Label>
                          <Input className="h-10 bg-white border-primary/20 font-mono font-black" value={formData.edusatDetalle?.numCensal} onChange={e => setFormData({...formData, edusatDetalle: {...formData.edusatDetalle!, numCensal: e.target.value.toUpperCase()}})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Número de Serie:</Label>
                          <Input className="h-10 bg-white border-primary/20 font-mono font-black" value={formData.numSerie} onChange={e => setFormData({...formData, edusatDetalle: {...formData.edusatDetalle!, numSerie: e.target.value.toUpperCase()}})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[9px] font-black uppercase text-primary tracking-widest pl-1">Calidad de la Señal:</Label>
                          <Select value={formData.edusatDetalle?.calidadSeñal} onValueChange={val => setFormData({...formData, edusatDetalle: {...formData.edusatDetalle!, calidadSeñal: val}})}>
                            <SelectTrigger className="h-10 bg-white font-black uppercase text-[10px] border-primary/20"><SelectValue placeholder="CALIDAD..." /></SelectTrigger>
                            <SelectContent>
                               <SelectItem value="nulo" className="text-[10px] font-black text-rose-600">NULO</SelectItem>
                               <SelectItem value="bajo" className="text-[10px] font-black text-amber-600">BAJO</SelectItem>
                               <SelectItem value="óptimo" className="text-[10px] font-black text-emerald-600">ÓPTIMO</SelectItem>
                               <SelectItem value="excelente" className="text-[10px] font-black text-primary">EXCELENTE</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                        <Monitor className="h-4 w-4" /> Materiales Utilizados y Actividades por la Brigada
                      </Label>
                      <div className="border rounded-2xl overflow-hidden shadow-md bg-white">
                        <Table>
                          <TableHeader className="bg-slate-100">
                            <TableRow>
                              <TableHead className="w-12 text-[9px] font-black uppercase text-center">#</TableHead>
                              <TableHead className="text-[9px] font-black uppercase min-w-[200px]">Material Utilizado</TableHead>
                              <TableHead className="text-[9px] font-black uppercase w-[100px]">Cantidad</TableHead>
                              <TableHead className="text-[9px] font-black uppercase">Actividades Realizadas por la Brigada</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {Array.from({ length: 8 }).map((_, idx) => (
                              <TableRow key={idx} className="hover:bg-slate-50/50">
                                <TableCell className="text-center font-bold text-[10px] text-muted-foreground">{idx + 1}</TableCell>
                                <TableCell className="p-1">
                                  <Input className="h-9 text-[10px] uppercase border-none focus:ring-1" value={formData.edusatDetalle?.materiales[idx]?.material || ''} onChange={e => handleEdusatMaterialChange(idx, 'material', e.target.value.toUpperCase())} />
                                </TableCell>
                                <TableCell className="p-1">
                                  <Input className="h-9 text-[10px] uppercase border-none focus:ring-1 text-center font-black" value={formData.edusatDetalle?.materiales[idx]?.cantidad || ''} onChange={e => handleEdusatMaterialChange(idx, 'cantidad', e.target.value)} />
                                </TableCell>
                                <TableCell className="p-1">
                                  <Input className="h-9 text-[10px] uppercase border-none focus:ring-1" value={formData.edusatDetalle?.materiales[idx]?.actividades || ''} onChange={e => handleEdusatMaterialChange(idx, 'actividades', e.target.value.toUpperCase())} />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {formData.tipoIncidencia === 'teleplanteles' && (
                  <div className="p-8 bg-pink-50/50 rounded-[2.5rem] border-2 border-pink-100 space-y-6 animate-in zoom-in-95 duration-300">
                    <div className="flex items-center gap-3 border-pink-100 pb-3">
                       <div className="h-10 w-10 rounded-xl bg-pink-600 text-white flex items-center justify-center shadow-lg">
                          <Tv className="h-6 w-6" />
                       </div>
                       <h3 className="text-sm font-black uppercase text-pink-900 tracking-wider">Módulo Técnico de Teleplanteles</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-pink-700 pl-1"># Decodificadores</Label>
                          <Input type="number" className="bg-white border-pink-200 rounded-xl h-11" value={formData.numDecodificadores} onChange={e => setFormData({...formData, numDecodificadores: parseInt(e.target.value) || 0})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-pink-700 pl-1">Número de Serie</Label>
                          <Input className="bg-white border-pink-200 rounded-xl h-11 font-mono uppercase" placeholder="SERIE-XXXX" value={formData.numSerie} onChange={e => setFormData({...formData, numSerie: e.target.value.toUpperCase()})} />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-pink-700 pl-1">Estatus de la Señal</Label>
                          <Select value={formData.estatusSeñal} onValueChange={(val: any) => setFormData({...formData, estatusSeñal: val})}>
                            <SelectTrigger className="bg-white border-pink-200 rounded-xl h-11 uppercase font-bold text-[10px]">
                               <SelectValue placeholder="SELECCIONAR..." />
                            </SelectTrigger>
                            <SelectContent>
                               <SelectItem value="débil" className="text-[10px] font-black text-rose-600 uppercase">DÉBIL</SelectItem>
                               <SelectItem value="estable" className="text-[10px] font-black text-amber-600 uppercase">ESTABLE</SelectItem>
                               <SelectItem value="excelente" className="text-[10px] font-black text-emerald-600 uppercase">EXCELENTE</SelectItem>
                            </SelectContent>
                          </Select>
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-pink-700 pl-1"># Reportes</Label>
                          <Input type="number" className="bg-white border-pink-200 rounded-xl h-11" value={formData.numReportes} onChange={e => setFormData({...formData, numReportes: parseInt(e.target.value) || 0})} />
                       </div>
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
                          <SelectItem key={off} value={off} className="text-[11px] uppercase font-bold">{off.replace("Oficina de ", "")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase text-primary pl-2">Número de Oficio COEES</Label>
                    <Input className="h-12 rounded-xl bg-slate-50 border-primary/10 font-mono uppercase" value={formData.numeroOficio} onChange={e => setFormData({...formData, numeroOficio: e.target.value})} placeholder="COEES/PL/..." />
                  </div>
                </div>

                {formData.tipoIncidencia !== 'teleplanteles' && (
                  <div className={cn("grid gap-6", (formData.tipoIncidencia === 'red edusat' || formData.tipoIncidencia === 'red local' || formData.tipoIncidencia === 'cuenta institucional') ? "grid-cols-2" : "grid-cols-2 md:grid-cols-4")}>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Ben. Alumnos</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.alumnosBeneficiados} onChange={e => setFormData({...formData, alumnosBeneficiados: parseInt(e.target.value) || 0})} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Ben. Docentes</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.docentesBeneficiados} onChange={e => setFormData({...formData, docentesBeneficiados: parseInt(e.target.value) || 0})} /></div>
                    {formData.tipoIncidencia !== 'red edusat' && formData.tipoIncidencia !== 'red local' && formData.tipoIncidencia !== 'cuenta institucional' && (
                      <>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Serv. M.C.</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.serviciosMC} onChange={e => setFormData({...formData, serviciosMC: parseInt(e.target.value) || 0})} /></div>
                        <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Serv. M.P.</Label><Input type="number" className="h-12 rounded-xl text-center font-black" value={formData.serviciosMP} onChange={e => setFormData({...formData, serviciosMP: parseInt(e.target.value) || 0})} /></div>
                      </>
                    )}
                  </div>
                )}

                <div className="space-y-6 pt-6 border-t border-slate-100">
                  <h3 className="text-[11px] font-black uppercase text-accent tracking-[0.2em] border-b border-accent/20 pb-2">Archivo Digital y Evidencias</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3 p-6 border border-dashed rounded-[2rem] bg-slate-50/50 hover:bg-white transition-colors duration-300">
                      <Label className="flex items-center gap-3 text-[10px] font-black uppercase text-primary">
                        <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
                          <FileText className="h-4 w-4" />
                        </div>
                        Reporte Oficial (Formato PDF)
                      </Label>
                      <Input type="file" accept=".pdf" className="bg-white rounded-xl h-10" onChange={e => handleFileChange(e, 'pdf')} />
                      {formData.reportPdf && <p className="text-[9px] text-emerald-600 font-black flex items-center gap-1 mt-2">✓ ARCHIVO CONFIGURADO</p>}
                    </div>
                    <div className="space-y-3 p-6 border border-dashed rounded-[2rem] bg-slate-50/50 hover:bg-white transition-colors duration-300">
                      <Label className="flex items-center gap-3 text-[10px] font-black uppercase text-primary">
                        <div className="h-8 w-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center shadow-sm">
                          <ImageIcon className="h-4 w-4" />
                        </div>
                        Evidencias de Sitio (Máx 5)
                      </Label>
                      <Input type="file" multiple accept="image/*" className="bg-white rounded-xl h-10" onChange={e => handleFileChange(e, 'photo')} disabled={(formData.evidencePhotos?.length || 0) >= 5} />
                      <div className="flex gap-3 flex-wrap mt-3">
                        {formData.evidencePhotos?.map((p, i) => (
                          <div key={i} className="relative h-14 w-14 border-4 border-white rounded-xl shadow-md overflow-hidden group">
                            <Image src={p} alt="ev" fill className="object-cover" />
                            <button className="absolute inset-0 bg-rose-600/80 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center" onClick={() => setFormData(prev => ({ ...prev, evidencePhotos: prev.evidencePhotos?.filter((_, idx) => idx !== i) }))}>
                               <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="text-[10px] font-black uppercase text-primary tracking-widest pl-2">Observaciones Técnicas del Servicio</Label>
                  <Textarea className="min-h-[120px] rounded-[1.5rem] p-5 bg-slate-50 border-primary/10 focus:bg-white transition-all shadow-inner" value={formData.observaciones} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="Detalle técnico, hallazgos y trabajos realizados en el plantel..." />
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="p-8 border-t bg-slate-50/50">
              <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); setEditingTicketId(null); }} className="rounded-xl h-14 px-10 text-[10px] font-black uppercase">Cancelar</Button>
              <Button onClick={handleSave} className="btn-institutional h-14 px-16 text-[10px]">
                {editingTicketId ? "Actualizar Registro" : "Guardar Servicio Técnico"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Operativo:</span>
           </div>
           
           <div className="relative flex-1 w-full">
              <Input 
                placeholder="FILTRAR POR CCT, PLANTEL, TÉCNICO O FOLIO..." 
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
                <SelectContent className="rounded-xl border-slate-200">
                  <SelectItem value="all" className="text-[10px] font-black uppercase">Todas las Oficinas</SelectItem>
                  {REGIONAL_OFFICES.map(off => (
                    <SelectItem key={off} value={off} className="text-[10px] font-black uppercase">{off.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "")}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="h-12 px-6 border-primary/20 text-primary font-black uppercase text-[10px] gap-2 rounded-xl hover:bg-primary/5 shadow-sm" onClick={() => setIsSchedulerOpen(true)}>
                <CalendarDays className="h-5 w-5" /> Agenda de Visitas
              </Button>
           </div>
        </div>
      </Card>

      <Card className="executive-card p-0 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50/50">
            <TableRow>
              <TableHead className="font-black text-[10px] uppercase w-[100px] text-center">Folio</TableHead>
              <TableHead className="font-black text-[10px] uppercase min-w-[200px]">CCT / Nombre del Plantel</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Tipo de Servicio</TableHead>
              <TableHead className="font-black text-[10px] uppercase">Estatus Operativo</TableHead>
              <TableHead className="font-black text-[10px] uppercase text-center">Evidencias</TableHead>
              <TableHead className="text-right font-black text-[10px] uppercase pr-8">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTickets.map(t => (
              <TableRow key={t.id} className="hover:bg-slate-50 transition-colors group">
                <TableCell className="font-black text-primary text-sm text-center">{t.id}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-black text-slate-700">{t.cct}</span>
                    <span className="text-[10px] text-muted-foreground font-bold truncate max-w-[250px] uppercase">{t.schoolName}</span>
                    <div className="flex items-center gap-2 mt-1">
                      {t.oficinaRegionalAtencion && (
                        <Badge variant="secondary" className="text-[7px] font-black uppercase bg-primary/5 text-primary border-primary/10">
                          {t.oficinaRegionalAtencion.replace("Oficina de Tecnóloga Educativa ", "").replace("Oficina de ", "")}
                        </Badge>
                      )}
                      {t.tecnicos && <span className="text-[8px] text-accent font-black uppercase">TÉC: {t.tecnicos}</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="capitalize text-[10px] font-black text-slate-500">
                  <Badge variant="outline" className={cn("text-[9px] font-black uppercase", 
                    t.tipoIncidencia === 'teleplanteles' ? "border-pink-300 text-pink-600 bg-pink-50" : 
                    t.tipoIncidencia === 'red edusat' ? "border-blue-300 text-blue-600 bg-blue-50" :
                    t.tipoIncidencia === 'red local' ? "border-indigo-300 text-indigo-600 bg-indigo-50" :
                    t.tipoIncidencia === 'cuenta institucional' ? "border-emerald-300 text-emerald-600 bg-emerald-50" :
                    "border-primary/20 text-primary"
                  )}>
                    {t.tipoIncidencia}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select defaultValue={t.status} onValueChange={(val) => updateTicketStatus(t.id, val)}>
                    <SelectTrigger className={cn(
                      "h-8 w-40 text-[9px] font-black uppercase border-2 rounded-xl transition-all",
                      t.status === 'atendido' ? 'border-emerald-500/30 text-emerald-700 bg-emerald-50' : 
                      t.status === 'en proceso' ? 'border-amber-500/30 text-amber-700 bg-amber-50' : 
                      'border-rose-500/30 text-rose-700 bg-rose-50'
                    )}>
                      <div className="flex items-center gap-2">
                        <Circle className={cn("h-2 w-2 fill-current", 
                          t.status === 'atendido' ? 'text-emerald-500' : 
                          t.status === 'en proceso' ? 'text-amber-500' : 
                          'text-rose-500'
                        )} />
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="pendiente" className="text-[10px] font-black text-rose-600">PENDIENTE</SelectItem>
                      <SelectItem value="en proceso" className="text-[10px] font-black text-amber-600">EN PROCESO</SelectItem>
                      <SelectItem value="atendido" className="text-[10px] font-black text-emerald-600">ATENDIDO</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex justify-center gap-3">
                    {(t.reportPdf || t.contratoFile) && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm" onClick={() => setEvidenceToView({ type: 'pdf', data: (t.contratoFile || t.reportPdf)!, title: `Folio ${t.id} - Documentación` })}>
                        <FileText className="h-4 w-4" />
                      </Button>
                    )}
                    {t.evidencePhotos && t.evidencePhotos.length > 0 && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-pink-600 hover:bg-pink-50 rounded-lg shadow-sm" onClick={() => setEvidenceToView({ type: 'gallery', data: t.evidencePhotos!, title: `Folio ${t.id} - Galería de Sitio` })}>
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all" onClick={() => handleEdit(t)}>
                     <Pencil className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredTickets.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-20 opacity-30">
                  <div className="flex flex-col items-center gap-2">
                    <Search className="h-8 w-8" />
                    <p className="text-[10px] font-black uppercase">No se encontraron reportes con los criterios de búsqueda.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Visitas Scheduler Modal */}
      <VisitSchedulerDialog 
        open={isSchedulerOpen} 
        onOpenChange={setIsSchedulerOpen} 
        areaId="soporte" 
        areaName="Soporte Técnico" 
      />

      <Dialog open={!!evidenceToView} onOpenChange={() => setEvidenceToView(null)}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden rounded-[2.5rem]">
          <DialogHeader className="p-8 pb-4 border-b bg-slate-50">
            <DialogTitle className="uppercase font-black text-primary text-xl flex items-center gap-4">
              {evidenceToView?.type === 'pdf' ? <FileText className="h-6 w-6 text-blue-600" /> : <ImageIcon className="h-6 w-6 text-pink-600" />}
              {evidenceToView?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden bg-slate-100 relative">
             {evidenceToView?.type === 'pdf' ? (
                <iframe src={evidenceToView.data as string} className="w-full h-full border-none" />
             ) : (
                <ScrollArea className="h-full w-full p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(evidenceToView?.data as string[])?.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-3xl overflow-hidden border-8 border-white shadow-2xl group cursor-zoom-in">
                        <Image src={img} alt={`Evidencia ${idx}`} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                           <Eye className="h-10 w-10 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
             )}
          </div>
          <div className="p-6 border-t bg-white flex justify-end">
            <Button variant="secondary" onClick={() => setEvidenceToView(null)} className="font-black uppercase text-[10px] h-12 px-8 rounded-xl shadow-lg">Cerrar Visor Operativo</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
