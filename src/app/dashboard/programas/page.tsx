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
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { programsData, type ProgramStatus, type ProgramAssistant } from "@/lib/planning-data"
import { schoolsDirectory } from "@/lib/schools-directory"
import * as XLSX from 'xlsx'
import { 
  PlusCircle, 
  FileText, 
  Image as ImageIcon, 
  X, 
  Circle, 
  Search, 
  Pencil, 
  ExternalLink, 
  School, 
  Settings2, 
  Zap,
  Calendar,
  MonitorCheck,
  History,
  Users,
  Trash2,
  Plus,
  Layers,
  Star,
  Mail,
  FileUp,
  Table as TableIcon,
  Eraser,
  Check,
  Map as MapIcon,
  Navigation,
  Globe,
  Filter,
  Activity,
  LocateFixed
} from "lucide-react"
import { format } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import Image from 'next/image'
import { cn } from '@/lib/utils'

const TOTAL_UNIVERSE = 830; 

const PROGRAM_RUBROS = [
  'Biblioteca Digital',
  'Cuentas Institucionales (@desysa.gob.mx, @desysa.edu.mx, @coees.edu.mx)',
  'Geoposición',
  'Conoce mi Escuela',
  'Mesa de Ayuda Técnica'
];

export default function ProgramsPage() {
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<ProgramStatus[]>([])
  const [activeTab, setActiveTab] = useState(PROGRAM_RUBROS[0])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [editingRowId, setEditingRowId] = useState<string | null>(null)
  const [inlineFormData, setInlineFormData] = useState<any>(null)
  
  const [mapValleFilter, setMapValleFilter] = useState('all')
  const [mapModalidadFilter, setMapModalidadFilter] = useState('all')

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initialAssistant: ProgramAssistant = {
    paterno: '', materno: '', nombres: '', rfc: '', genero: '', funcion: '', email: '', cct: '', nombreCT: '', ze: '', sector: '', modalidad: '', municipio: '', region: '', valle: '', departamento: ''
  };

  const initialFormState: ProgramStatus = {
    id: '',
    name: '',
    progress: 0,
    status: 'planeacion',
    date: '',
    cct: '',
    schoolName: '',
    zonaEscolar: '',
    sector: '',
    modalidad: '',
    municipio: '',
    region: '',
    valle: '',
    numeroEquipos: 0,
    descripcionEquipo: '',
    fechaEntrada: '',
    fechaSalida: '',
    responsables: ['', '', ''],
    numeroOficio: '',
    setes: 'N',
    observaciones: '',
    reportPdf: '',
    evidencePhotos: [],
    capacitacion: 'N',
    totalParticipantes: 0,
    asistentes: [initialAssistant]
  }

  const [formData, setFormData] = useState<ProgramStatus>(initialFormState)

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('programs_full') || '[]')
    if (stored.length > 0) {
      setRecords(stored)
    } else {
      setRecords(programsData)
    }
  }, [])

  useEffect(() => {
    setFormData(prev => ({ 
      ...prev, 
      name: activeTab,
      date: format(new Date(), 'yyyy-MM-dd'),
      fechaEntrada: format(new Date(), 'yyyy-MM-dd')
    }))
  }, [activeTab])

  const rubroStats = useMemo(() => {
    return PROGRAM_RUBROS.map(name => {
      const rubroRecords = records.filter(r => r.name === name || (name.startsWith('Cuentas') && (r.id.startsWith('IMP-') || r.id.startsWith('PROG-CI'))));
      const uniqueSchools = new Set(rubroRecords.map(r => r.cct).filter(Boolean)).size;
      const progress = Math.min(100, Math.round((uniqueSchools / TOTAL_UNIVERSE) * 100));
      const lastUpdate = rubroRecords.length > 0 
        ? rubroRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date 
        : format(new Date(), 'yyyy-MM-dd');
      
      let status: 'planeacion' | 'activo' | 'concluido' = 'planeacion';
      if (progress > 0) status = 'activo';
      if (progress >= 100) status = 'concluido';

      const totalEquiposRehabilitados = rubroRecords.reduce((acc, curr) => acc + (curr.numeroEquipos || 0), 0);

      return { name, progress, status, lastUpdate, count: uniqueSchools, totalEquipos: totalEquiposRehabilitados, records: rubroRecords };
    });
  }, [records]);

  const isLibraryTab = activeTab === 'Biblioteca Digital';
  const isCuentasTab = activeTab.startsWith('Cuentas Institucionales');
  const isGeoTab = activeTab === 'Geoposición';
  
  const currentStats = useMemo(() => rubroStats.find(s => s.name === activeTab), [rubroStats, activeTab]);

  const geoSchools = useMemo(() => {
    if (!isGeoTab) return [];
    return schoolsDirectory.filter(s => {
      const matchValle = mapValleFilter === 'all' || s.valle === mapValleFilter;
      const matchModalidad = mapModalidadFilter === 'all' || 
        (mapModalidadFilter === 'GENERAL' && s.modalidad === 'DES') ||
        (mapModalidadFilter === 'TECNICA' && s.modalidad === 'DST') ||
        (mapModalidadFilter === 'TELESECUNDARIA' && s.modalidad === 'DTV');
      return matchValle && matchModalidad;
    });
  }, [isGeoTab, mapValleFilter, mapModalidadFilter]);

  const geoStats = useMemo(() => {
    const total = geoSchools.length;
    const toluca = geoSchools.filter(s => s.valle === 'TOLUCA').length;
    const mexico = geoSchools.filter(s => s.valle === 'MEXICO').length;
    const generales = geoSchools.filter(s => s.modalidad === 'DES').length;
    const tecnicas = geoSchools.filter(s => s.modalidad === 'DST').length;
    const teles = geoSchools.filter(s => s.modalidad === 'DTV').length;
    return { total, toluca, mexico, generales, tecnicas, teles };
  }, [geoSchools]);

  const accountsData = useMemo(() => {
    if (!isCuentasTab) return [];
    
    return records.filter(r => 
      r.name.startsWith('Cuentas Institucionales') || 
      r.id.startsWith('PROG-CI') || 
      r.id.startsWith('IMP-')
    ).map(rec => {
      const ast = (rec.asistentes && rec.asistentes.length > 0) ? rec.asistentes[0] : initialAssistant;
      return {
        id: rec.id,
        email: ast.email || '-',
        cct: ast.cct || rec.cct || '-',
        sector: ast.sector || rec.sector || '-',
        zona: ast.ze || rec.zonaEscolar || '-',
        valle: ast.valle || rec.valle || '-',
        dominio: (ast.email && ast.email.includes('@')) ? `@${ast.email.split('@')[1]}` : '-',
        status: (rec.status === 'activo' || rec.status === 'inactivo') ? rec.status : 'activo',
        originalRecord: rec
      };
    });
  }, [records, isCuentasTab, initialAssistant]);

  const handleClearAccounts = () => {
    if (window.confirm('¿Está seguro de borrar TODOS los registros importados de Cuentas Institucionales? Esta acción no se puede deshacer.')) {
      const filtered = records.filter(r => 
        !r.name.startsWith('Cuentas Institucionales') && 
        !r.id.startsWith('IMP-') && 
        !r.id.startsWith('PROG-CI')
      );
      setRecords(filtered);
      localStorage.setItem('programs_full', JSON.stringify(filtered));
      toast({ title: "Auditoría Limpiada", description: "Se han removido todos los registros de cuentas." });
    }
  };

  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const bstr = event.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet) as any[];

        const findKey = (obj: any, variants: string[]) => {
          const keys = Object.keys(obj);
          for (const v of variants) {
            const found = keys.find(k => k.toLowerCase().trim().replace(/[^a-z0-9]/g, '').includes(v.toLowerCase().replace(/[^a-z0-9]/g, '')));
            if (found) return obj[found];
          }
          return undefined;
        };

        const newRecords: ProgramStatus[] = data.map((row, idx) => {
          const cct = String(findKey(row, ['cct', 'centro', 'clave', 'ct', 'trabajo']) || '').toUpperCase();
          const email = String(findKey(row, ['correo', 'email', 'cuenta', 'user', 'usuario', 'mail']) || '').toLowerCase().trim();
          const statusVal = String(findKey(row, ['estatus', 'status', 'estado']) || 'activo').toLowerCase();
          const finalStatus = (statusVal === 'inactivo' || statusVal === 'desactivado') ? 'inactivo' : 'activo';
          
          const school = schoolsDirectory.find(s => s.cct === cct);
          
          const assistant: ProgramAssistant = {
            paterno: String(findKey(row, ['paterno', 'apellidop']) || ''),
            materno: String(findKey(row, ['materno', 'apellidom']) || ''),
            nombres: String(findKey(row, ['nombre', 'nom']) || ''),
            rfc: String(findKey(row, ['rfc', 'curp']) || '').toUpperCase(),
            genero: (String(findKey(row, ['genero', 'sexo', 'g']) || '').toUpperCase().startsWith('M')) ? 'MASCULINO' : 'FEMENINO',
            funcion: String(findKey(row, ['funcion', 'cargo', 'puesto']) || 'DOCENTE'),
            email: email,
            cct: cct,
            nombreCT: school?.nombre || String(findKey(row, ['escuela', 'nombrect', 'plantel']) || ''),
            ze: String(findKey(row, ['zona', 'ze', 'z', 'escolar']) || school?.zonaEscolar || ''),
            sector: String(findKey(row, ['sector', 's']) || school?.sector || ''),
            modalidad: String(findKey(row, ['modalidad', 'nivel', 'mod']) || school?.modalidad || ''),
            municipio: String(findKey(row, ['municipio', 'mun']) || school?.municipio || ''),
            region: String(findKey(row, ['region', 'reg']) || school?.region || ''),
            valle: String(findKey(row, ['valle', 'v']) || school?.valle || ''),
            departamento: String(findKey(row, ['departamento', 'depto', 'area', 'oficina']) || 'TECNICO')
          };

          return {
            ...initialFormState,
            id: `IMP-${Date.now()}-${idx}`,
            name: PROGRAM_RUBROS[1],
            status: finalStatus as any,
            date: format(new Date(), 'yyyy-MM-dd'),
            asistentes: [assistant],
            totalParticipantes: 1,
            capacitacion: 'S',
            cct: assistant.cct,
            schoolName: assistant.nombreCT,
            zonaEscolar: assistant.ze,
            sector: assistant.sector,
            modalidad: assistant.modalidad,
            municipio: assistant.municipio,
            region: assistant.region,
            valle: assistant.valle,
            observaciones: 'Importación individual desde Excel para auditoría de cuentas.'
          };
        });

        if (newRecords.length > 0) {
          const updated = [...newRecords, ...records];
          setRecords(updated);
          localStorage.setItem('programs_full', JSON.stringify(updated));
          toast({ title: "Importación Exitosa", description: `Se han cargado ${newRecords.length} cuentas institucionales.` });
        }
      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: "Error al leer archivo", description: "Asegúrate de que el archivo sea un Excel válido." });
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSelectSchool = (cct: string) => {
    const school = schoolsDirectory.find(s => s.cct === cct);
    if (school) {
      setFormData(prev => ({
        ...prev,
        cct: school.cct,
        schoolName: school.nombre,
        zonaEscolar: school.zonaEscolar,
        sector: school.sector,
        modalidad: school.modalidad,
        municipio: school.municipio,
        region: school.region,
        valle: school.valle
      }));
    }
  }

  const handleAddAssistant = () => setFormData(prev => ({ ...prev, asistentes: [...(prev.asistentes || []), initialAssistant] }))
  const handleRemoveAssistant = (index: number) => setFormData(prev => ({ ...prev, asistentes: prev.asistentes?.filter((_, i) => i !== index) }))

  const updateAssistant = (index: number, field: keyof ProgramAssistant, value: string) => {
    const newAsistentes = [...(formData.asistentes || [])]
    newAsistentes[index] = { ...newAsistentes[index], [field]: value }
    if (field === 'cct' && value.length === 10) {
      const school = schoolsDirectory.find(s => s.cct.toUpperCase() === value.toUpperCase())
      if (school) {
        newAsistentes[index] = { ...newAsistentes[index], nombreCT: school.nombre, ze: school.zonaEscolar, sector: school.sector, modalidad: school.modalidad, municipio: school.municipio, region: school.region, valle: school.valle }
      }
    }
    setFormData(prev => ({ ...prev, asistentes: newAsistentes, totalParticipantes: newAsistentes.filter(a => a.rfc).length }))
  }

  const handleSave = () => {
    if (!formData.id || (!formData.cct && !formData.name?.startsWith('Cuentas'))) { toast({ variant: "destructive", title: "Datos incompletos" }); return; }
    const updated = editingId ? records.map(r => r.id === editingId ? formData : r) : [formData, ...records];
    setRecords(updated)
    localStorage.setItem('programs_full', JSON.stringify(updated))
    setIsDialogOpen(false)
    resetForm()
    toast({ title: "Registro guardado" })
  }

  const resetForm = () => {
    setFormData({ ...initialFormState, name: activeTab, date: format(new Date(), 'yyyy-MM-dd'), fechaEntrada: format(new Date(), 'yyyy-MM-dd') })
    setEditingId(null)
  }

  const startInlineEdit = (acc: any) => {
    setEditingRowId(acc.id);
    setInlineFormData({ ...acc });
  }

  const cancelInlineEdit = () => {
    setEditingRowId(null);
    setInlineFormData(null);
  }

  const saveInlineEdit = () => {
    if (!inlineFormData) return;
    
    const updatedRecords = records.map(r => {
      if (r.id === inlineFormData.id) {
        const updatedAsistentes = [...(r.asistentes || [])];
        if (updatedAsistentes.length > 0) {
          updatedAsistentes[0] = {
            ...updatedAsistentes[0],
            email: inlineFormData.email,
            cct: inlineFormData.cct,
            ze: inlineFormData.zona,
            sector: inlineFormData.sector,
            valle: inlineFormData.valle
          };
        }
        return { 
          ...r, 
          status: inlineFormData.status, 
          asistentes: updatedAsistentes,
          cct: inlineFormData.cct,
          zonaEscolar: inlineFormData.zona,
          sector: inlineFormData.sector,
          valle: inlineFormData.valle
        };
      }
      return r;
    });

    setRecords(updatedRecords);
    localStorage.setItem('programs_full', JSON.stringify(updatedRecords));
    setEditingRowId(null);
    setInlineFormData(null);
    toast({ title: "Cambios guardados exitosamente" });
  }

  if (!mounted) return null

  const isCuentasInDialog = formData.name?.startsWith('Cuentas');

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-2">
          <h2 className="text-4xl font-black tracking-tighter text-primary uppercase leading-none">Gestión de Programas</h2>
          <div className="flex items-center gap-3">
             <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
             <p className="text-muted-foreground font-black text-[11px] uppercase tracking-[0.3em]">Seguimiento Estratégico Oficina de Planeación</p>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-10">
        <TabsList className="w-full h-auto flex flex-wrap bg-slate-100/50 p-1.5 rounded-3xl shadow-inner border border-primary/5">
          {PROGRAM_RUBROS.map(rubro => (
            <TabsTrigger 
              key={rubro} 
              value={rubro}
              className="flex-1 min-w-[200px] h-14 text-[10px] font-black uppercase tracking-[0.1em] rounded-2xl data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-xl transition-all"
            >
              {rubro.includes('(') ? rubro.split('(')[0] : rubro}
            </TabsTrigger>
          ))}
        </TabsList>

        {currentStats && (
          <TabsContent value={activeTab} className="space-y-10 animate-in zoom-in-95 duration-500">
            <Card className="executive-card p-10 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10 relative z-10">
                  <div className="flex items-center gap-8">
                     <div className="h-24 w-24 rounded-3xl bg-primary/5 flex items-center justify-center border-2 border-primary/5 shadow-inner">
                        {isLibraryTab ? <MonitorCheck className="h-12 w-12 text-primary" /> : isCuentasTab ? <Mail className="h-12 w-12 text-primary" /> : isGeoTab ? <MapIcon className="h-12 w-12 text-primary" /> : <Layers className="h-12 w-12 text-primary" />}
                     </div>
                     <div className="space-y-2">
                        <div className="flex items-center gap-4">
                           <h3 className="text-3xl font-black uppercase tracking-tight text-slate-800 leading-none">
                             {isCuentasTab ? "Cuentas Institucionales" : activeTab}
                           </h3>
                           <Badge className="bg-accent/10 text-accent border-none uppercase font-black text-[9px] px-4 py-1.5 rounded-full tracking-widest">{currentStats.status}</Badge>
                        </div>
                        
                        {!isCuentasTab && !isGeoTab && (
                          <div className="flex flex-wrap items-center gap-8 pt-3">
                            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400">
                                <Calendar className="h-4 w-4 text-primary" /> Act: {currentStats.lastUpdate ?? ''}
                            </div>
                            <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-slate-400">
                                <School className="h-4 w-4 text-primary" /> Planteles: <span className="text-primary">{currentStats.count}</span> {(!isLibraryTab && !isCuentasTab) && `/ ${TOTAL_UNIVERSE}`}
                            </div>
                            {isLibraryTab && (
                              <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
                                  <MonitorCheck className="h-4 w-4" /> Equipos: {currentStats.totalEquipos}
                              </div>
                            )}
                          </div>
                        )}

                        {isGeoTab && (
                          <div className="flex flex-wrap items-center gap-6 pt-3">
                             <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border border-primary/5 shadow-sm">
                               <Navigation className="h-3.5 w-3.5 text-primary" />
                               <span className="text-[10px] font-black uppercase text-slate-500">Valle México: <span className="text-primary">{geoStats.mexico}</span></span>
                             </div>
                             <div className="flex items-center gap-2 bg-white px-4 py-1.5 rounded-xl border border-primary/5 shadow-sm">
                               <Navigation className="h-3.5 w-3.5 text-primary" />
                               <span className="text-[10px] font-black uppercase text-slate-500">Valle Toluca: <span className="text-primary">{geoStats.toluca}</span></span>
                             </div>
                             <div className="flex items-center gap-2 bg-emerald-50 px-4 py-1.5 rounded-xl border border-emerald-100 shadow-sm">
                               <Globe className="h-3.5 w-3.5 text-emerald-600" />
                               <span className="text-[10px] font-black uppercase text-emerald-700">Total Federal SEIEM: <span className="text-emerald-900">{geoStats.total}</span></span>
                             </div>
                          </div>
                        )}

                        {isCuentasTab && (
                          <div className="space-y-4 pt-3">
                             <div className="flex flex-wrap items-center gap-4">
                                <div className="flex items-center gap-2.5 text-[11px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-100">
                                    <Mail className="h-4 w-4" /> Cuentas Activas: {accountsData.length}
                                </div>
                             </div>
                          </div>
                        )}
                     </div>
                  </div>

                  {(!isLibraryTab && !isCuentasTab && !isGeoTab) && (
                    <div className="text-right bg-slate-50 p-8 rounded-[2rem] border-2 border-white shadow-inner min-w-[220px]">
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">Avance Global</p>
                      <p className="text-6xl font-black text-primary leading-none tracking-tighter">{currentStats.progress}<span className="text-2xl text-accent ml-1">%</span></p>
                    </div>
                  )}

                  {isGeoTab && (
                    <div className="flex flex-col gap-2 min-w-[250px]">
                       <div className="p-4 bg-slate-50 rounded-2xl border-2 border-white shadow-inner">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Modalidades Federales</p>
                          <div className="space-y-2">
                             <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-600">S. Generales</span> <Badge className="bg-primary text-white text-[9px]">{geoStats.generales}</Badge></div>
                             <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-600">S. Técnicas</span> <Badge className="bg-accent text-white text-[9px]">{geoStats.tecnicas}</Badge></div>
                             <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-slate-600">Telesecundarias</span> <Badge className="bg-slate-700 text-white text-[9px]">{geoStats.teles}</Badge></div>
                          </div>
                       </div>
                    </div>
                  )}
               </div>

               {isGeoTab && (
                 <div className="mt-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white p-6 rounded-[2rem] border-2 border-primary/5 shadow-lg">
                       <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Filter className="h-5 w-5" /></div>
                          <span className="text-[11px] font-black uppercase text-primary tracking-widest">Filtros Operativos Regionales:</span>
                       </div>
                       <div className="flex flex-wrap gap-4 flex-1 justify-end">
                          <Select value={mapValleFilter} onValueChange={setMapValleFilter}>
                            <SelectTrigger className="h-12 w-48 rounded-xl font-black text-[10px] uppercase border-slate-200"><SelectValue placeholder="VALLE" /></SelectTrigger>
                            <SelectContent className="font-black">
                               <SelectItem value="all">TODOS LOS VALLES</SelectItem>
                               <SelectItem value="MEXICO">VALLE DE MÉXICO</SelectItem>
                               <SelectItem value="TOLUCA">VALLE DE TOLUCA</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={mapModalidadFilter} onValueChange={setMapModalidadFilter}>
                            <SelectTrigger className="h-12 w-48 rounded-xl font-black text-[10px] uppercase border-slate-200"><SelectValue placeholder="MODALIDAD" /></SelectTrigger>
                            <SelectContent className="font-black">
                               <SelectItem value="all">TODAS LAS MODALIDADES</SelectItem>
                               <SelectItem value="GENERAL">S. GENERALES</SelectItem>
                               <SelectItem value="TECNICA">S. TÉCNICAS</SelectItem>
                               <SelectItem value="TELESECUNDARIA">TELESECUNDARIAS</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button variant="outline" size="icon" className="h-12 w-12 rounded-xl text-slate-400 hover:text-primary" onClick={() => { setMapValleFilter('all'); setMapModalidadFilter('all'); }}>
                            <History className="h-5 w-5" />
                          </Button>
                       </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                       <Card className="lg:col-span-2 h-[800px] rounded-[3rem] border-4 border-white shadow-2xl overflow-hidden bg-slate-50 relative group">
                          <div className="absolute inset-0 p-8 flex items-center justify-center">
                             <div className="relative w-full h-full max-w-[700px] flex items-center justify-center">
                                {/* Mapa Geográfico Oficial del Estado de México (SVG) */}
                                <svg 
                                  viewBox="0 0 1000 1000" 
                                  className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-all duration-1000"
                                >
                                  {/* Trazado Real del Estado de México con CDMX en medio */}
                                  <path 
                                    d="M508.8,111.9c-8.9-3.5-17.7-7-26.6-10.5c-9.5-3.8-19.1-7.5-28.6-11.3c-2.4-0.9-4.8-1.4-7.4-1.1c-13.4,1.4-26.8,2.7-40.2,4.1 c-1.2,0.1-2.4,0.1-3.6,0c-11.2-0.8-22.3-1.6-33.5-2.4c-4.4-0.3-7,1.8-8.2,5.9c-2,6.7-3.9,13.3-5.9,20c-1,3.4,0.2,5.2,3.3,6.7 c5.7,2.7,11.3,5.4,17,8.1c3.1,1.5,4,3.7,2.8,6.8c-2,5-4,10-5.9,15.1c-1,2.6-2.6,3.6-5.3,3c-5.7-1.3-11.3-2.6-17-3.9 c-3.1-0.7-4.5,0.4-5.2,3.4c-1.3,5.6-2.5,11.2-3.8,16.7c-0.6,2.6,0.3,4.1,2.4,5.4c6.7,4.3,13.4,8.5,20,12.8c3,1.9,3.5,3.9,2.1,7.2 c-2.3,5.3-4.5,10.6-6.8,15.9c-1,2.4-2.4,3.2-4.9,2.5c-6.8-1.9-13.5-3.8-20.3-5.7c-3.1-0.9-4.3,0.3-5,3.2c-1.3,5.6-2.5,11.3-3.8,16.9 c-0.6,2.7,0.2,4.3,2.3,5.6c6.8,4.3,13.6,8.5,20.5,12.8c2.9,1.8,3.3,3.7,2.1,6.8c-2.3,5.8-4.7,11.6-7,17.4c-0.8,2.1-2,2.8-4.2,2.2 c-7.3-1.9-14.7-3.8-22-5.7c-3.1-0.8-4.5,0.4-5.2,3.4c-1.3,5.6-2.6,11.3-3.9,16.9c-0.6,2.6,0.3,4,2.3,5.5c6.7,4.7,13.5,9.4,20.2,14.1 c3,2.1,3.2,4.2,1.9,7.5c-2.1,5.3-4.2,10.6-6.3,15.9c-0.9,2.6-2.2,3.5-4.9,2.8c-6.7-1.7-13.4-3.5-20.1-5.2c-3.1-0.8-4.5,0.4-5.2,3.4 c-1.3,5.6-2.6,11.3-3.9,16.9c-0.7,2.9,0.3,4.7,2.8,6.1c6,3.4,12.1,6.8,18.1,10.1c3.1,1.7,3.6,3.8,2.3,7c-2,5-4.1,10.1-6.1,15.1 c-0.9,2.3-2.1,3-4.4,2.4c-7.3-1.9-14.6-3.8-21.9-5.7c-3-0.8-4.3,0.4-5,3.3c-1.3,5.6-2.5,11.3-3.8,16.9c-0.6,2.7,0.3,4.1,2.4,5.4 c6.8,4.3,13.6,8.6,20.3,12.9c3,1.9,3.5,3.9,2.2,7.2c-2.3,5.4-4.6,10.8-6.9,16.2c-0.9,2.1-2.2,2.8-4.4,2.2c-6.7-1.7-13.5-3.5-20.2-5.2 c-3.2-0.8-4.6,0.4-5.3,3.5c-1.3,5.6-2.6,11.2-3.8,16.9c-0.6,2.6,0.3,4,2.4,5.4c6.7,4.4,13.3,8.7,20,13.1c2.9,1.9,3.4,3.8,2.1,7 c-2.4,5.6-4.7,11.2-7.1,16.8c-0.9,2.1-2.1,2.8-4.2,2.3c-7.3-1.8-14.6-3.7-21.9-5.5c-3.2-0.8-4.6,0.5-5.3,3.6 c-1.3,5.6-2.5,11.1-3.8,16.7c-0.6,2.6,0.3,4.2,2.4,5.4c6.7,4.3,13.5,8.6,20.2,12.9c3.1,2,3.4,4,2,7.4c-2.2,5.2-4.4,10.5-6.6,15.7 c-0.9,2.2-2.1,2.9-4.3,2.4c-6.8-1.7-13.6-3.4-20.4-5.1c-3.1-0.8-4.5,0.4-5.2,3.4c-1.3,5.6-2.6,11.3-3.9,16.9 c-0.6,2.6,0.3,4.1,2.4,5.4c6.8,4.3,13.6,8.6,20.4,12.9c2.9,1.8,3.3,3.7,2.1,6.8c-2.3,5.8-4.6,11.5-6.9,17.3c-0.8,2.1-2,2.8-4.2,2.2 c-7.3-1.8-14.6-3.7-21.9-5.5c-3.2-0.8-4.6,0.5-5.3,3.6c-1.3,5.5-2.5,11-3.8,16.6c-0.6,2.6,0.3,4.2,2.5,5.6c6.7,4.1,13.3,8.3,20,12.4 c3.2,1.9,3.7,3.9,2.4,7.4c-2,5.1-4,10.1-6,15.2c-0.9,2.3-2.1,3.1-4.4,2.5c-7.2-1.9-14.4-3.7-21.6-5.6c-3.1-0.8-4.5,0.4-5.2,3.4 c-1.3,5.5-2.6,11-3.9,16.5c-0.6,2.6,0.3,4.1,2.5,5.5c6.7,4.2,13.4,8.4,20,12.6c3.2,2.1,3.6,4.2,2.2,7.6c-2.1,5.2-4.3,10.3-6.4,15.5 c-0.8,2.1-2,2.8-4.1,2.3c-7.3-1.8-14.6-3.6-21.9-5.4c-3.2-0.8-4.6,0.5-5.3,3.6c-1.2,5.2-2.3,10.3-3.5,15.5c-0.3,1.3,0.3,2.4,1.2,3.4 c6.1,6.8,12.2,13.6,18.3,20.4c1.2,1.4,2.8,1.9,4.6,1.4c6.7-1.7,13.3-3.4,20-5c3.3-0.8,5.1,0.3,6.6,3.3c2.7,5.6,5.3,11.2,8,16.9 c1.5,3.1,3.7,4,6.8,2.7c5.1-2,10.1-4,15.2-6.1c2.4-1,4.3,0.1,5.8,2.2c3.5,4.7,6.9,9.4,10.4,14.2c1.9,2.6,4.1,3.2,7.1,1.9 c12.9-5.6,25.8-11.2,38.6-16.8c3.2-1.4,4.4-0.1,5.8,2.5c2.3,4.1,4.6,8.1,6.9,12.2c1.7,3.1,3.8,3.5,7,1.8c5.4-2.8,10.7-5.5,16.1-8.3 c2.6-1.4,4.3-0.4,5.6,2.1c1.9,3.5,3.7,7,5.6,10.5c1.4,2.5,3.3,3,5.8,1.8c7.5-3.6,15.1-7.1,22.6-10.7c2.6-1.2,4.4-0.3,5.8,2.1 c1.9,3.4,3.8,6.8,5.7,10.3c1.4,2.6,3.2,3.1,5.8,1.9c7.3-3.3,14.6-6.7,21.9-10c2.7-1.3,4.6-0.3,6,2.2c1.8,3.3,3.7,6.6,5.5,9.9 c1.4,2.5,3.3,3.1,5.9,1.9c7.2-3.4,14.5-6.7,21.7-10.1c2.7-1.3,4.6-0.3,6,2.3c1.8,3.2,3.6,6.5,5.3,9.7c1.3,2.4,3.1,2.9,5.5,1.9 c7.5-3.3,15.1-6.6,22.6-9.9c2.8-1.2,4.8-0.3,6.2,2.4c1.7,3.1,3.5,6.2,5.2,9.3c1.3,2.4,3,2.9,5.4,1.8c7.6-3.3,15.1-6.6,22.7-9.8 c2.8-1.2,4.8-0.2,6.3,2.5c1.6,3,3.2,6.1,4.8,9.1c1.2,2.4,3,2.9,5.3,1.9c7.6-3.2,15.2-6.5,22.8-9.7c2.9-1.2,5-0.1,6.5,2.6 c1.5,2.8,3,5.6,4.5,8.4c1.2,2.3,2.9,2.8,5.3,1.7c7.8-3.4,15.5-6.8,23.3-10.2c2.8-1.2,4.8-0.2,6.3,2.5c1.6,3,3.2,6.1,4.7,9.1 c1.2,2.3,2.9,2.8,5.2,1.7c7.8-3.6,15.5-7.1,23.3-10.7c2.5-1.2,4.4-0.2,5.7,2.3c1.9,3.5,3.8,6.9,5.7,10.4c1.4,2.5,3.4,3,5.9,1.7 c12.9-6.7,25.9-13.3,38.8-20c3.1-1.6,5.1-1,7,1.8c2.4,3.7,4.8,7.3,7.2,11c1.8,2.7,3.9,3.2,7.1,1.8c11.6-5.1,23.3-10.2,34.9-15.3 c2.6-1.1,4.4-0.1,5.8,2.4c1.9,3.4,3.8,6.8,5.7,10.2c1.4,2.5,3.4,3,5.9,1.7c7.3-3.8,14.6-7.5,21.9-11.3c2.5-1.3,4.4-0.4,5.7,2.1 c1.9,3.5,3.8,7.1,5.8,10.6c1.3,2.4,3.2,2.9,5.6,1.7c7.8-4,15.5-7.9,23.3-11.9c2.4-1.2,4.2-0.3,5.6,2.1c2,3.4,4,6.9,6,10.3 c1.4,2.5,3.3,3.1,5.8,1.8c7.5-3.8,15-7.7,22.5-11.5c2.6-1.3,4.6-0.3,6,2.4c1.7,3.1,3.4,6.3,5.1,9.4c1.4,2.5,3.3,3,5.9,1.7 c12.6-6.4,25.3-12.7,37.9-19.1c3.1-1.5,5.1-0.9,7,1.9c2.4,3.6,4.7,7.2,7.1,10.9c1.9,2.7,4,3.3,7.2,1.8c11.6-5.1,23.2-10.2,34.8-15.3 c2.6-1.2,4.4-0.1,5.8,2.4c1.9,3.3,3.8,6.6,5.6,10c1.4,2.5,3.3,3.1,5.9,1.8c7.5-3.8,15-7.7,22.5-11.5c2.6-1.3,4.6-0.4,6.1,2.2 c1.8,3.2,3.6,6.4,5.4,9.6c1.3,2.4,3.1,3,5.5,1.8c7.8-4.2,15.6-8.4,23.4-12.6c2.3-1.2,4.1-0.3,5.5,2.1c1.9,3.4,3.8,6.8,5.7,10.2 c1.4,2.4,3.2,3,5.6,1.8c7.8-3.9,15.6-7.8,23.4-11.7c2.4-1.2,4.3-0.3,5.7,2.2c1.9,3.3,3.8,6.7,5.7,10c1.4,2.4,3.2,3,5.6,1.8 c7.9-3.9,15.7-7.9,23.6-11.8c2.4-1.2,4.2-0.3,5.6,2.1c2,3.4,3.9,6.8,5.9,10.3c1.4,2.5,3.3,3.1,5.8,1.9c7.6-3.6,15.2-7.3,22.8-10.9 c2.7-1.3,4.6-0.3,6,2.4c1.7,3.1,3.4,6.2,5.1,9.2c1.4,2.5,3.3,3,5.9,1.7c13.1-6.5,26.2-13.1,39.3-19.6c3.1-1.5,5.1-0.8,7,2 c2.4,3.5,4.7,7,7.1,10.6c1.9,2.8,4.1,3.4,7.4,1.9c11.3-5.3,22.6-10.6,33.9-15.9c2.6-1.2,4.4-0.2,5.8,2.2c1.9,3.3,3.8,6.7,5.8,10 c1.4,2.5,3.4,3.1,6,1.7c7.6-4.1,15.1-8.1,22.7-12.2c2.4-1.3,4.2-0.3,5.6,2.2c1.9,3.3,3.8,6.7,5.7,10c1.4,2.4,3.2,3,5.6,1.8 c7.8-4.2,15.6-8.4,23.4-12.6c2.4-1.3,4.2-0.3,5.6,2.2c1.9,3.3,3.8,6.7,5.7,10c1.4,2.4,3.2,3,5.6,1.8Z" 
                                    fill="white" 
                                    stroke="#e2e8f0" 
                                    strokeWidth="2"
                                    className="drop-shadow-sm"
                                  />
                                  <defs>
                                    <linearGradient id="gradientMap" x1="0%" y1="0%" x2="100%" y2="100%">
                                      <stop offset="0%" stopColor="#621132" />
                                      <stop offset="100%" stopColor="#B38E5D" />
                                    </linearGradient>
                                  </defs>
                                </svg>
                                
                                {/* Distribución de Puntos por CCT en Valle de México */}
                                <div className={cn("absolute top-[15%] right-[10%] w-[45%] h-[60%] border border-dashed rounded-[3rem] transition-all duration-700", mapValleFilter === 'MEXICO' ? 'border-primary/60 bg-primary/[0.05] scale-105 z-20 shadow-2xl' : 'border-slate-100')}>
                                   <div className="absolute top-4 right-10 text-[8px] font-black text-primary/40 uppercase tracking-[0.5em]">VALLE DE MÉXICO (ORIENTE)</div>
                                   <div className="w-full h-full p-6 flex flex-wrap gap-2 items-center justify-center content-center overflow-hidden">
                                      {geoSchools.filter(s => s.valle === 'MEXICO').map((s, i) => (
                                         <div 
                                          key={i} 
                                          className={cn(
                                            "h-3 w-3 rounded-full shadow-lg transition-all hover:scale-[5] cursor-pointer animate-in zoom-in duration-300 border-2 border-white",
                                            s.modalidad === 'DTV' ? 'bg-slate-400' : s.modalidad === 'DST' ? 'bg-accent' : 'bg-primary'
                                          )} 
                                          title={`CCT: ${s.cct}\n${s.municipio}\n${s.nombre}`} 
                                        />
                                      ))}
                                   </div>
                                </div>

                                {/* Distribución de Puntos por CCT en Valle de Toluca */}
                                <div className={cn("absolute bottom-[10%] left-[8%] w-[42%] h-[65%] border border-dashed rounded-[3rem] transition-all duration-700", mapValleFilter === 'TOLUCA' ? 'border-accent/60 bg-accent/[0.05] scale-105 z-20 shadow-2xl' : 'border-slate-100')}>
                                   <div className="absolute bottom-4 left-10 text-[8px] font-black text-accent/40 uppercase tracking-[0.5em]">VALLE DE TOLUCA (PONIENTE)</div>
                                   <div className="w-full h-full p-6 flex flex-wrap gap-3 items-center justify-center content-center overflow-hidden">
                                      {geoSchools.filter(s => s.valle === 'TOLUCA').map((s, i) => (
                                         <div 
                                          key={i} 
                                          className={cn(
                                            "h-3 w-3 rounded-full shadow-lg transition-all hover:scale-[5] cursor-pointer animate-in zoom-in duration-300 border-2 border-white",
                                            s.modalidad === 'DTV' ? 'bg-slate-400' : s.modalidad === 'DST' ? 'bg-accent' : 'bg-primary'
                                          )} 
                                          title={`CCT: ${s.cct}\n${s.municipio}\n${s.nombre}`} 
                                        />
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </div>

                          {/* Overlay de Título y Capas */}
                          <div className="absolute top-10 left-10 flex flex-col gap-4">
                             <Badge className="bg-primary text-white border-none font-black text-[14px] uppercase px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3">
                               <LocateFixed className="h-6 w-6" /> Mapa de Cobertura Estatal (CCT SEIEM)
                             </Badge>
                             <div className="bg-white/95 backdrop-blur-xl px-6 py-3 rounded-2xl border shadow-lg w-fit text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] flex items-center gap-3">
                               <Activity className="h-4 w-4 text-emerald-500" /> Auditoría de Centros de Trabajo Federales
                             </div>
                          </div>

                          {/* Leyenda de Modalidades */}
                          <div className="absolute bottom-12 right-12 flex flex-col gap-6 bg-white/95 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border border-primary/5 min-w-[280px]">
                             <p className="text-[11px] font-black text-primary uppercase tracking-[0.3em] mb-2 border-b pb-4 border-slate-100">Leyenda por Servicio</p>
                             <div className="space-y-4">
                                <div className="flex items-center gap-5 group cursor-default">
                                   <div className="h-4 w-10 rounded-full bg-primary shadow-lg shadow-primary/20 transition-transform group-hover:scale-110" /> 
                                   <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">S. Generales</span>
                                </div>
                                <div className="flex items-center gap-5 group cursor-default">
                                   <div className="h-4 w-10 rounded-full bg-accent shadow-lg shadow-accent/20 transition-transform group-hover:scale-110" /> 
                                   <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">S. Técnicas</span>
                                </div>
                                <div className="flex items-center gap-5 group cursor-default">
                                   <div className="h-4 w-10 rounded-full bg-slate-400 shadow-lg shadow-slate-200 transition-transform group-hover:scale-110" /> 
                                   <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Telesecundarias</span>
                                </div>
                             </div>
                             <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex flex-col">
                                   <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-tight">Estado:</span>
                                   <span className="text-[11px] font-black text-emerald-600 uppercase tracking-tighter">Sincronizado</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-black border-primary/20 text-primary bg-primary/5 py-1">Directorio SIP</Badge>
                             </div>
                          </div>
                       </Card>

                       {/* Tablero de Municipios Identificados */}
                       <Card className="rounded-[3rem] border-none shadow-2xl bg-white overflow-hidden flex flex-col">
                          <CardHeader className="p-8 border-b bg-slate-50/50">
                             <div className="flex items-center gap-4 mb-1">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner"><Activity className="h-5 w-5" /></div>
                                <CardTitle className="text-sm font-black uppercase text-primary tracking-widest">Impacto Municipal</CardTitle>
                             </div>
                             <CardDescription className="text-[10px] font-bold uppercase text-slate-400 pl-14">Centros de Trabajo Localizados</CardDescription>
                          </CardHeader>
                          <div className="flex-1 overflow-hidden">
                             <ScrollArea className="h-[650px]">
                                <div className="p-8 space-y-4">
                                   {Array.from(new Set(geoSchools.map(s => s.municipio))).sort().map((mun, i) => {
                                      const munSchools = geoSchools.filter(s => s.municipio === mun);
                                      return (
                                        <div key={i} className="p-5 bg-slate-50/50 rounded-2xl border border-primary/5 hover:bg-white hover:shadow-xl transition-all group">
                                           <div className="flex justify-between items-center mb-3">
                                              <span className="text-[11px] font-black text-slate-700 uppercase group-hover:text-primary transition-colors">{mun}</span>
                                              <Badge className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-xl shadow-lg">{munSchools.length}</Badge>
                                           </div>
                                           <div className="flex gap-2 flex-wrap">
                                              {munSchools.slice(0, 15).map((s, idx) => (
                                                 <div 
                                                  key={idx} 
                                                  className={cn("h-1.5 w-4 rounded-full shadow-sm", s.modalidad === 'DTV' ? 'bg-slate-300' : s.modalidad === 'DST' ? 'bg-accent/60' : 'bg-primary/60')} 
                                                  title={`${s.cct} - ${s.modalidad}`}
                                                />
                                              ))}
                                              {munSchools.length > 15 && <span className="text-[9px] font-black text-slate-300 ml-1">+{munSchools.length - 15}</span>}
                                           </div>
                                        </div>
                                      );
                                   })}
                                </div>
                             </ScrollArea>
                          </div>
                       </Card>
                    </div>
                 </div>
               )}

               {isLibraryTab && (
                 <div className="mt-12 space-y-8">
                    <div className="flex items-center justify-between border-b-2 border-slate-50 pb-6">
                       <h4 className="text-[12px] font-black uppercase text-slate-500 flex items-center gap-3 tracking-[0.2em]">
                          <History className="h-5 w-5" /> Detalle Operativo por Modalidad
                       </h4>
                       <div className="flex items-center gap-4">
                          <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm" className="h-10 px-6 rounded-xl font-black uppercase text-[10px] gap-2 shadow-md">
                             <PlusCircle className="h-4 w-4" /> Nueva Ficha
                          </Button>
                          <Badge className="bg-primary/5 text-primary border-none text-[10px] font-black uppercase px-6 py-2 rounded-xl shadow-inner">Auditoría Institucional</Badge>
                       </div>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/50 overflow-x-auto shadow-sm">
                       <Table className="min-w-[1000px]">
                          <TableHeader className="bg-white/80">
                             <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase py-6 pl-10">Folio / Oficio</TableHead>
                                <TableHead className="text-[10px] font-black uppercase">Centro de Trabajo (CCT)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center">ZE/SEC</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center">Género (M/F)</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-right">Equipos</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-right pr-10">Acción</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {currentStats.records.map((rec, idx) => (
                               <TableRow key={idx} className="hover:bg-white transition-all border-slate-100 group">
                                  <TableCell className="py-6 pl-10">
                                     <div className="flex flex-col">
                                        <span className="text-xs font-black text-primary">{rec.id}</span>
                                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{rec.numeroOficio || '-'}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell>
                                     <div className="flex flex-col">
                                        <span className="text-xs font-black text-slate-700">{rec.cct}</span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[150px]">{rec.schoolName}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                     <div className="text-[10px] font-black text-slate-600 bg-white px-2 py-1 rounded-lg border shadow-sm">ZE:{rec.zonaEscolar} / S:{rec.sector}</div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                     {rec.capacitacion === 'S' ? (
                                       <div className="flex items-center justify-center gap-2">
                                          <Badge className="bg-blue-500 text-white border-none text-[8px] font-black rounded-lg h-5 w-8 flex items-center justify-center">M:{rec.asistentes?.filter(a => a.genero === 'MASCULINO').length}</Badge>
                                          <Badge className="bg-pink-500 text-white border-none text-[8px] font-black rounded-lg h-5 w-8 flex items-center justify-center">F:{rec.asistentes?.filter(a => a.genero === 'FEMENINO').length}</Badge>
                                       </div>
                                     ) : <span className="text-[9px] font-black text-slate-300">-</span>}
                                  </TableCell>
                                  <TableCell className="text-center">
                                     <div className="flex items-center justify-center gap-2 bg-white px-4 py-1.5 rounded-2xl border shadow-sm w-fit mx-auto">
                                        <Circle className={cn("h-2.5 w-2.5 fill-current", rec.status === 'concluido' ? 'text-emerald-500' : rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500')} />
                                        <span className="text-[9px] font-black uppercase text-slate-500">{rec.status}</span>
                                     </div>
                                  </TableCell>
                                  <TableCell className="text-right text-xs font-black text-emerald-600 pr-4">
                                     {rec.numeroEquipos} <MonitorCheck className="h-3 w-3 inline ml-1" />
                                  </TableCell>
                                  <TableCell className="text-right pr-10">
                                     <div className="flex justify-end gap-2">
                                        <button className="h-10 w-10 bg-white shadow-sm border border-slate-100 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                                           <Pencil className="h-4 w-4" />
                                        </button>
                                        <button className="h-10 w-10 bg-white shadow-sm border border-slate-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { if(window.confirm('¿Eliminar registro institucional de Biblioteca Digital?')) { const up = records.filter(r => r.id !== rec.id); setRecords(up); localStorage.setItem('programs_full', JSON.stringify(up)); toast({title:"Registro Eliminado"}); } }}>
                                           <Trash2 className="h-4 w-4" />
                                        </button>
                                     </div>
                                  </TableCell>
                               </TableRow>
                             ))}
                             {currentStats.records.length === 0 && (
                               <TableRow><TableCell colSpan={7} className="text-center py-10 text-[10px] font-black uppercase text-slate-300">Sin registros en este rubro</TableCell></TableRow>
                             )}
                          </TableBody>
                       </Table>
                    </div>
                 </div>
               )}

               {isCuentasTab && (
                 <div className="mt-12 space-y-8">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b-2 border-slate-50 pb-6 gap-4">
                       <h4 className="text-[12px] font-black uppercase text-slate-500 flex items-center gap-3 tracking-[0.2em]">
                          <Mail className="h-5 w-5" /> Progreso de Cobertura Institucional (Cuentas)
                       </h4>
                       <div className="flex flex-wrap gap-4">
                          <input type="file" className="hidden" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleExcelUpload} />
                          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-10 px-6 rounded-xl font-black uppercase text-[9px] border-primary/20 text-primary hover:bg-primary/5 gap-2 shadow-sm">
                             <FileUp className="h-4 w-4" /> Importar Auditoría Excel
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleClearAccounts} className="h-10 px-6 rounded-xl font-black uppercase text-[9px] border-rose-200 text-rose-600 hover:bg-rose-50 gap-2 shadow-sm">
                             <Eraser className="h-4 w-4" /> Limpiar Auditoría
                          </Button>
                       </div>
                    </div>
                    <div className="rounded-3xl border border-slate-100 bg-slate-50/50 overflow-x-auto shadow-sm relative">
                       <Table className="min-w-[950px]">
                          <TableHeader className="bg-white/80 sticky top-0 z-20">
                             <TableRow className="border-none">
                                <TableHead className="text-[10px] font-black uppercase py-6 pl-10 min-w-[280px]">Correo Institucional</TableHead>
                                <TableHead className="text-[10px] font-black uppercase min-w-[140px]">CCT</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center min-w-[140px]">Sector / ZE</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center min-w-[120px]">Valle</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-center min-w-[140px]">Estatus</TableHead>
                                <TableHead className="text-[10px] font-black uppercase text-right pr-10 min-w-[140px] sticky right-0 bg-white/95 backdrop-blur-md shadow-[-10px_0_15px_rgba(0,0,0,0.03)] border-l z-30">Acción</TableHead>
                             </TableRow>
                          </TableHeader>
                          <TableBody>
                             {accountsData.map((acc, idx) => {
                               const isEditing = editingRowId === acc.id;
                               
                               return (
                               <TableRow key={idx} className={cn("transition-all border-slate-100 group relative", isEditing ? "bg-primary/[0.02]" : "hover:bg-white")}>
                                  <TableCell className="py-6 pl-10">
                                     {isEditing ? (
                                       <Input 
                                          className="h-9 text-xs font-black lowercase text-primary w-full bg-white border-primary/20" 
                                          value={inlineFormData?.email ?? ''} 
                                          onChange={e => setInlineFormData({...inlineFormData, email: e.target.value})} 
                                        />
                                     ) : (
                                       <div className="flex flex-col">
                                          <span className="text-xs font-black text-primary lowercase">{acc.email}</span>
                                          <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[8px] w-fit mt-1">{acc.dominio}</Badge>
                                       </div>
                                     )}
                                  </TableCell>
                                  <TableCell>
                                     {isEditing ? (
                                       <Input 
                                          className="h-9 text-xs font-black uppercase w-full bg-white border-primary/20" 
                                          value={inlineFormData?.cct ?? ''} 
                                          onChange={e => setInlineFormData({...inlineFormData, cct: e.target.value.toUpperCase()})} 
                                          maxLength={10}
                                        />
                                     ) : (
                                       <span className="text-xs font-black text-slate-700 uppercase">{acc.cct}</span>
                                     )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                     {isEditing ? (
                                       <div className="flex gap-2 justify-center">
                                          <Input className="h-9 text-[10px] font-black w-14 bg-white text-center border-primary/20" value={inlineFormData?.sector ?? ''} onChange={e => setInlineFormData({...inlineFormData, sector: e.target.value})} placeholder="S" />
                                          <Input className="h-9 text-[10px] font-black w-14 bg-white text-center border-primary/20" value={inlineFormData?.zona ?? ''} onChange={e => setInlineFormData({...inlineFormData, zona: e.target.value})} placeholder="ZE" />
                                       </div>
                                     ) : (
                                       <span className="text-[10px] font-black text-slate-600 bg-white px-2 py-1 rounded-lg border shadow-sm">S:{acc.sector} / ZE:{acc.zona}</span>
                                     )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                     {isEditing ? (
                                       <Input 
                                          className="h-9 text-[10px] font-black uppercase w-full bg-white text-center border-primary/20" 
                                          value={inlineFormData?.valle ?? ''} 
                                          onChange={e => setInlineFormData({...inlineFormData, valle: e.target.value.toUpperCase()})} 
                                        />
                                     ) : (
                                       <Badge className="bg-slate-200 text-slate-700 border-none font-black text-[9px] uppercase">{acc.valle}</Badge>
                                     )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                     {isEditing ? (
                                       <Select value={inlineFormData?.status ?? 'activo'} onValueChange={val => setInlineFormData({...inlineFormData, status: val})}>
                                          <SelectTrigger className="h-9 w-full text-[10px] font-black uppercase bg-white border-primary/20">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent className="font-black">
                                            <SelectItem value="activo">ACTIVO</SelectItem>
                                            <SelectItem value="inactivo">INACTIVO</SelectItem>
                                          </SelectContent>
                                       </Select>
                                     ) : (
                                       <div className="flex items-center justify-center gap-2 bg-white px-4 py-1.5 rounded-2xl border shadow-sm w-fit mx-auto">
                                          <Circle className={cn("h-2 w-2 fill-current", acc.status === 'activo' ? 'text-emerald-500' : 'text-rose-500')} />
                                          <span className="text-[9px] font-black uppercase text-slate-500">{acc.status}</span>
                                       </div>
                                     )}
                                  </TableCell>
                                  <TableCell className="text-right pr-10 sticky right-0 z-30 bg-white/95 backdrop-blur-md shadow-[-10px_0_15px_rgba(0,0,0,0.03)] border-l">
                                     <div className="flex justify-end gap-2">
                                        {isEditing ? (
                                          <>
                                            <button className="h-9 w-9 bg-emerald-50 text-emerald-600 border border-emerald-100 hover:bg-emerald-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={saveInlineEdit}>
                                              <Check className="h-4 w-4" />
                                            </button>
                                            <button className="h-9 w-9 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={cancelInlineEdit}>
                                              <X className="h-4 w-4" />
                                            </button>
                                          </>
                                        ) : (
                                          <>
                                            <button className="h-9 w-9 bg-white shadow-sm border border-slate-100 text-primary hover:bg-primary hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => startInlineEdit(acc)}>
                                               <Pencil className="h-4 w-4" />
                                            </button>
                                            <button className="h-9 w-9 bg-white shadow-sm border border-slate-100 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all flex items-center justify-center" onClick={() => { if(window.confirm('¿Eliminar registro técnico de cuenta institucional?')) { const up = records.filter(r => r.id !== acc.id); setRecords(up); localStorage.setItem('programs_full', JSON.stringify(up)); toast({title:"Registro Eliminar"}); } }}>
                                               <Trash2 className="h-4 w-4" />
                                            </button>
                                          </>
                                        )}
                                     </div>
                                  </TableCell>
                               </TableRow>
                             )})}
                             {accountsData.length === 0 && (
                               <TableRow><TableCell colSpan={6} className="text-center py-10 text-[10px] font-black uppercase text-slate-300">No se han registrado cuentas institucionales aún</TableCell></TableRow>
                             )}
                          </TableBody>
                       </Table>
                    </div>
                 </div>
               )}

               {(!isLibraryTab && !isCuentasTab && !isGeoTab) && (
                 <div className="mt-12 space-y-6 bg-slate-50 p-10 rounded-[3rem] border border-white shadow-inner">
                    <div className="flex justify-between items-end">
                       <span className="text-[11px] font-black uppercase text-slate-400 tracking-[0.3em]">Progreso de Cobertura Institucional</span>
                       <span className="text-sm font-black text-primary uppercase tracking-tighter">{currentStats.count} Escuelas <span className="text-slate-300 font-bold mx-2">/</span> {TOTAL_UNIVERSE}</span>
                    </div>
                    <div className="relative h-6 w-full bg-white rounded-full overflow-hidden shadow-inner border-2 border-white p-1">
                       <div className="absolute inset-y-1 left-1 bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-1000 ease-out shadow-lg shadow-primary/20" style={{ width: `calc(${currentStats.progress}% - 8px)` }} />
                    </div>
                    <div className="flex justify-between text-[10px] font-black text-slate-300 uppercase tracking-[0.25em] pt-2">
                       <span>Inicio 0%</span>
                       <div className="flex items-center gap-2"><div className="h-1.5 w-1.5 rounded-full bg-accent" /> Proceso 50%</div>
                       <span>Meta 100%</span>
                    </div>
                 </div>
               )}
            </Card>

            {(!isLibraryTab && !isCuentasTab && !isGeoTab) && (
               <Card className="executive-card">
                  <CardHeader className="p-8 border-b border-slate-50">
                    <CardTitle className="text-lg font-black uppercase text-primary flex items-center gap-3">
                      <History className="h-6 w-6" /> Historial de Intervenciones: {activeTab}
                    </CardTitle>
                    <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Auditoría pormenorizada de registros técnicos en centros de trabajo</CardDescription>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table className="min-w-[900px]">
                        <TableHeader className="bg-slate-50/50">
                          <TableRow className="border-none">
                            <TableHead className="text-[10px] font-black uppercase py-6 pl-10">Folio</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Centro de Trabajo (CCT)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase">Municipio / Modalidad</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-center">Estatus</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right">Impacto (Eq)</TableHead>
                            <TableHead className="text-[10px] font-black uppercase text-right pr-10">Acción</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentStats.records.map((rec, idx) => (
                            <TableRow key={idx} className="hover:bg-slate-50/50 transition-all border-slate-50 group">
                              <TableCell className="py-6 pl-10 text-xs font-black text-primary">{rec.id}</TableCell>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="text-xs font-black text-slate-700">{rec.cct}</span>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase truncate max-w-[200px]">{rec.schoolName}</span>
                                 </div>
                              </TableCell>
                              <TableCell>
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase text-slate-600">{rec.municipio}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase">{rec.modalidad}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-center">
                                 <div className="flex items-center justify-center gap-2">
                                    <Circle className={cn("h-2 w-2 fill-current", rec.status === 'concluido' ? 'text-emerald-500' : rec.status === 'activo' ? 'text-amber-500' : 'text-rose-500')} />
                                    <span className="text-[10px] font-black uppercase text-slate-500">{rec.status}</span>
                                 </div>
                              </TableCell>
                              <TableCell className="text-right text-xs font-black text-slate-700">{rec.numeroEquipos}</TableCell>
                              <TableCell className="text-right pr-10">
                                 <div className="flex justify-end gap-2">
                                    <button className="h-8 w-8 text-primary hover:bg-primary/5 rounded-lg flex items-center justify-center" onClick={() => { setFormData(rec); setEditingId(rec.id); setIsDialogOpen(true); }}>
                                       <Pencil className="h-4 w-4" />
                                    </button>
                                    <button className="h-8 w-8 text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center" onClick={() => { if(window.confirm('¿Eliminar registro?')) { const up = records.filter(r => r.id !== rec.id); setRecords(up); localStorage.setItem('programs_full', JSON.stringify(up)); toast({title:"Registro Eliminar"}); } }}>
                                       <Trash2 className="h-4 w-4" />
                                    </button>
                                 </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
               </Card>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[1200px] h-[95vh] flex flex-col p-0 border-none shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden">
          <DialogHeader className="p-10 pb-6 bg-slate-50 border-b relative">
            <div className="absolute right-12 top-10 h-16 w-16 bg-white rounded-3xl flex items-center justify-center border shadow-xl border-primary/5">
               <Settings2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="uppercase font-black text-primary text-4xl tracking-tighter flex items-center gap-6 leading-none">
              Ficha Técnica <br /> <span className="text-xl text-slate-400 font-bold">{formData.name || activeTab}</span>
            </DialogTitle>
            <DialogDescription className="font-black text-[11px] uppercase text-slate-400 tracking-[0.4em] mt-3">Expediente de Registro Técnico Administrativo</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-10">
            <div className="grid gap-12 py-12 pb-20">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3 col-span-2">
                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Folio de Registro (Oficial)</Label>
                  <Input value={formData.id ?? ''} onChange={e => setFormData({...formData, id: e.target.value.toUpperCase()})} placeholder="P-001" className="h-16 rounded-[1.5rem] font-black text-lg border-primary/10 bg-slate-50/50 shadow-inner px-8" disabled={!!editingId} />
                </div>
              </div>

              {!isCuentasInDialog && (
                <div className="p-10 bg-primary/[0.03] rounded-[3rem] space-y-8 border-4 border-white shadow-xl shadow-slate-100">
                  <div className="flex items-center gap-4 border-b border-primary/5 pb-6">
                     <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><Search className="h-6 w-6" /></div>
                     <h3 className="text-sm font-black uppercase text-primary tracking-[0.2em]">Geolocalización del Centro de Trabajo</h3>
                  </div>
                  <div className="relative">
                    <Input 
                      placeholder="ESCRIBE CCT O NOMBRE PARA IDENTIFICAR PLANTEL..." 
                      className="bg-white h-16 font-black uppercase px-8 rounded-2xl border-primary/10 shadow-lg text-lg placeholder:text-slate-300" 
                      value={searchTerm ?? ''} 
                      onChange={e => setSearchTerm(e.target.value)} 
                    />
                    {searchTerm.length > 2 && (
                      <div className="absolute z-50 w-full mt-4 bg-white/90 backdrop-blur-xl border border-primary/5 rounded-[2rem] shadow-[0_32px_64px_rgba(0,0,0,0.15)] max-h-80 overflow-auto p-4 animate-in zoom-in-95 duration-200">
                        {schoolsDirectory.filter(s => s.cct.includes(searchTerm.toUpperCase()) || s.nombre.includes(searchTerm.toUpperCase())).slice(0, 10).map(s => (
                          <div key={s.cct} className="p-5 hover:bg-primary/5 cursor-pointer rounded-2xl border-b last:border-0 border-slate-50 transition-all flex justify-between items-center group" onClick={() => { handleSelectSchool(s.cct); setSearchTerm('') }}>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-primary font-black text-base group-hover:scale-105 transition-transform">{s.cct}</span>
                              <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">{s.nombre}</span>
                            </div>
                            <Badge className="bg-accent/10 text-accent font-black uppercase text-[9px] px-4 py-1.5 rounded-full">{s.valle}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {formData.cct && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6 pt-4 animate-in slide-in-from-top-4 duration-500">
                      <div className="col-span-2 md:col-span-3 p-6 bg-white rounded-3xl border border-primary/5 flex items-center gap-6 shadow-sm">
                         <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner"><School className="h-8 w-8" /></div>
                         <div className="flex-1 overflow-hidden">
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">Nombre del Centro de Trabajo</p>
                            <p className="text-lg font-black text-slate-800 uppercase truncate">{formData.schoolName ?? ''}</p>
                         </div>
                      </div>
                      {[
                        { l: 'ZONA (ZE)', v: formData.zonaEscolar },
                        { l: 'SECTOR', v: formData.sector },
                        { l: 'MUNICIPIO', v: formData.municipio },
                        { l: 'MODALIDAD', v: formData.modalidad },
                        { l: 'VALLE', v: formData.valle }
                      ].map((item, i) => (
                        <div key={i} className="p-6 bg-white rounded-3xl border border-primary/5 shadow-sm">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1.5">{item.l}</p>
                          <p className="text-sm font-black text-slate-800 uppercase">{item.v ?? ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {!isCuentasInDialog && (
                <div className="space-y-8">
                  <div className="flex items-center gap-4 border-b border-primary/5 pb-6">
                     <div className="h-12 w-12 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg"><Zap className="h-6 w-6" /></div>
                     <h3 className="text-sm font-black uppercase text-primary tracking-[0.2em]">Especificaciones Técnicas y Operativas</h3>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                     <div className="space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Equipos</Label><Input type="number" value={formData.numeroEquipos ?? 0} onChange={e => setFormData({...formData, numeroEquipos: parseInt(e.target.value) || 0})} className="h-14 rounded-2xl font-black bg-slate-50/50" /></div>
                     <div className="col-span-3 space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Descripción del Equipamiento</Label><Input value={formData.descripcionEquipo ?? ''} onChange={e => setFormData({...formData, descripcionEquipo: e.target.value})} placeholder="EJ: SERVIDOR, 20 LAPTOPS, ROUTER..." className="h-14 rounded-2xl font-black bg-slate-50/50 px-8" /></div>
                     <div className="space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Entrada</Label><Input type="date" value={formData.fechaEntrada ?? ''} onChange={e => setFormData({...formData, fechaEntrada: e.target.value})} className="h-14 rounded-2xl font-black bg-slate-50/50" /></div>
                     <div className="space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Salida</Label><Input type="date" value={formData.fechaSalida ?? ''} onChange={e => setFormData({...formData, fechaSalida: e.target.value})} className="h-14 rounded-2xl font-black bg-slate-50/50" /></div>
                  </div>
                </div>
              )}

              {(isLibraryTab || isCuentasInDialog) && (
                <div className={cn("space-y-10 p-10 rounded-[3rem] border-4 border-white shadow-xl", isLibraryTab ? "bg-emerald-50/30 shadow-emerald-50" : "bg-blue-50/30 shadow-blue-50")}>
                   <div className={cn("flex items-center justify-between border-b pb-8", isLibraryTab ? "border-emerald-100" : "border-blue-100")}>
                      <div className="flex items-center gap-4">
                         <div className={cn("h-12 w-12 rounded-2xl text-white flex items-center justify-center shadow-lg", isLibraryTab ? "bg-emerald-600 shadow-emerald-200" : "bg-blue-600 shadow-blue-200")}><Users className="h-6 w-6" /></div>
                         <h3 className={cn("text-sm font-black uppercase tracking-[0.2em]", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>
                           {isCuentasInDialog ? "Registro de Cuentas Institucionales" : "Seguimiento Pedagógico: Capacitación"}
                         </h3>
                      </div>
                      <div className="space-y-1 text-right">
                         <Label className={cn("text-[11px] font-black uppercase tracking-widest", isLibraryTab ? "text-emerald-600" : "text-blue-600")}>
                           {isCuentasInDialog ? "¿Registrar Cuentas?" : "¿Capacitación?"}
                         </Label>
                         <Select value={formData.capacitacion || 'N'} onValueChange={(val: any) => setFormData({...formData, capacitacion: val})}>
                           <SelectTrigger className={cn("h-12 w-64 rounded-2xl font-black bg-white shadow-sm", isLibraryTab ? "border-emerald-200" : "border-blue-200")}><SelectValue /></SelectTrigger>
                           <SelectContent className="rounded-2xl border-none shadow-2xl font-black"><SelectItem value="S">SÍ, BRINDADA</SelectItem><SelectItem value="N">NO BRINDADA</SelectItem></SelectContent>
                         </Select>
                      </div>
                   </div>

                   {formData.capacitacion === 'S' && (
                      <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-4">
                             <Star className={cn("h-5 w-5 fill-current", isLibraryTab ? "text-emerald-600" : "text-blue-600")} />
                             <h4 className={cn("text-[12px] font-black uppercase tracking-widest", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>
                               {isCuentasInDialog ? "Datos Maestros del Usuario" : "Registro de Asistentes y RFC"}
                             </h4>
                          </div>
                          {!isCuentasInDialog && (
                            <Button variant="outline" size="sm" onClick={handleAddAssistant} className={cn("h-12 px-8 rounded-2xl font-black uppercase text-[10px] bg-white shadow-sm gap-3 transition-all", isLibraryTab ? "border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white" : "border-blue-300 text-blue-700 hover:bg-blue-600 hover:text-white")}>
                              <Plus className="h-4 w-4" /> Añadir Registro
                            </Button>
                          )}
                        </div>

                        <div className={cn("rounded-[2.5rem] border-2 overflow-hidden bg-white shadow-2xl", isLibraryTab ? "border-emerald-100" : "border-blue-100")}>
                           <ScrollArea className="w-full">
                              <Table>
                                <TableHeader className={isLibraryTab ? "bg-emerald-50/50" : "bg-blue-50/50"}>
                                  <TableRow className="border-none">
                                    <TableHead className={cn("w-12 text-[10px] font-black uppercase py-6 pl-10", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>#</TableHead>
                                    <TableHead className={cn("min-w-[180px] text-[10px] font-black uppercase", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>Paterno / Materno / Nombre</TableHead>
                                    <TableHead className={cn("min-w-[150px] text-[10px] font-black uppercase", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>RFC (13)</TableHead>
                                    <TableHead className={cn("min-w-[200px] text-[10px] font-black uppercase", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>Correo / Usuario</TableHead>
                                    <TableHead className={cn("min-w-[120px] text-[10px] font-black uppercase", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>Valle</TableHead>
                                    <TableHead className={cn("min-w-[120px] text-[10px] font-black uppercase", isLibraryTab ? "text-emerald-800" : "text-blue-800")}>Género</TableHead>
                                    {!isCuentasInDialog && <TableHead className={cn("w-12 sticky right-0 bg-white/95", isLibraryTab ? "border-emerald-50" : "border-blue-50")}></TableHead>}
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {formData.asistentes?.map((ast, idx) => (
                                    <TableRow key={idx} className={cn("transition-colors border-b", isLibraryTab ? "hover:bg-emerald-50/20 border-emerald-50" : "hover:bg-blue-50/20 border-blue-50")}>
                                      <TableCell className={cn("text-center font-black text-xs pl-10", isLibraryTab ? "text-emerald-300" : "text-blue-300")}>{idx + 1}</TableCell>
                                      <TableCell className="p-4">
                                         <div className="flex gap-2">
                                            <Input className="h-10 text-[10px] font-bold rounded-xl bg-slate-50 border-slate-200 uppercase" value={ast.paterno ?? ''} onChange={e => updateAssistant(idx, 'paterno', e.target.value.toUpperCase())} placeholder="PAT." />
                                            <Input className="h-10 text-[10px] font-bold rounded-xl bg-slate-50 border-slate-200 uppercase" value={ast.materno ?? ''} onChange={e => updateAssistant(idx, 'materno', e.target.value.toUpperCase())} placeholder="MAT." />
                                            <Input className="h-10 text-[10px] font-black rounded-xl bg-slate-50 border-slate-200 uppercase" value={ast.nombres ?? ''} onChange={e => updateAssistant(idx, 'nombres', e.target.value.toUpperCase())} placeholder="NOM." />
                                         </div>
                                      </TableCell>
                                      <TableCell className="p-4"><Input className="h-10 text-[11px] font-mono font-black rounded-xl bg-white border-slate-300 text-primary uppercase" value={ast.rfc ?? ''} onChange={e => updateAssistant(idx, 'rfc', e.target.value.toUpperCase())} maxLength={13} /></TableCell>
                                      <TableCell className="p-4"><Input className="h-10 text-[11px] font-bold rounded-xl bg-white border-slate-300 text-blue-600 lowercase" value={ast.email ?? ''} onChange={e => updateAssistant(idx, 'email', e.target.value.toLowerCase())} placeholder="correo@desysa.edu.mx" /></TableCell>
                                      <TableCell className="p-4"><Input className="h-10 text-[10px] font-black rounded-xl bg-white border-slate-200 uppercase" value={ast.valle ?? ''} onChange={e => updateAssistant(idx, 'valle', e.target.value.toUpperCase())} placeholder="VALLE" /></TableCell>
                                      <TableCell className="p-4">
                                        <Select value={ast.genero || ''} onValueChange={v => updateAssistant(idx, 'genero', v as any)}>
                                          <SelectTrigger className="h-10 text-[10px] font-black rounded-xl bg-white border-slate-200 shadow-sm"><SelectValue /></SelectTrigger>
                                          <SelectContent className="font-black"><SelectItem value="MASCULINO">MASC</SelectItem><SelectItem value="FEMENINO">FEM</SelectItem></SelectContent>
                                        </Select>
                                      </TableCell>
                                      {!isCuentasInDialog && (
                                        <TableCell className="p-4 sticky right-0 bg-white/95 backdrop-blur-sm">
                                          <button className="h-10 w-10 text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center transition-colors" onClick={() => handleRemoveAssistant(idx)} disabled={formData.asistentes?.length === 1}><Trash2 className="h-4 w-4" /></button>
                                        </TableCell>
                                      )}
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                              <ScrollBar orientation="horizontal" />
                           </ScrollArea>
                        </div>
                      </div>
                   )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {!isCuentasInDialog && (
                   <div className="space-y-3"><Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">No. de Oficio Oficial</Label><Input value={formData.numeroOficio ?? ''} onChange={e => setFormData({...formData, numeroOficio: e.target.value.toUpperCase()})} placeholder="EJ: DESYSA/PL/2024/001" className="h-16 rounded-[1.5rem] font-black bg-slate-50/50" /></div>
                )}
                {!isCuentasInDialog && (
                  <div className="space-y-3">
                    <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">¿Semana SETES?</Label>
                    <Select value={formData.setes || 'N'} onValueChange={v => setFormData({...formData, setes: v as any})}>
                      <SelectTrigger className="h-16 rounded-[1.5rem] font-black bg-white border-purple-200 shadow-lg shadow-purple-50"><SelectValue /></SelectTrigger>
                      <SelectContent className="font-black rounded-2xl"><SelectItem value="S">SÍ, SEMANA SETES</SelectItem><SelectItem value="N">NO, ATENCIÓN REGULAR</SelectItem></SelectContent>
                    </Select>
                  </div>
                )}
                <div className={cn("space-y-3", isCuentasInDialog ? "col-span-3" : "")}>
                  <Label className="text-[11px] font-black text-slate-400 uppercase tracking-widest pl-2">Estatus Ejecutivo</Label>
                  <Select value={formData.status || 'planeacion'} onValueChange={v => setFormData({...formData, status: v as any})}>
                    <SelectTrigger className="h-16 rounded-[1.5rem] font-black shadow-lg bg-white"><SelectValue /></SelectTrigger>
                    <SelectContent className="font-black rounded-2xl">
                      <SelectItem value="planeacion" className="text-rose-600">PLANEACIÓN / INICIO</SelectItem>
                      <SelectItem value="activo" className="text-amber-600">EN PROCESO TÉCNICO</SelectItem>
                      <SelectItem value="concluido" className="text-emerald-600">CONCLUIDO / CERRADO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {!isCuentasInDialog && (
                <div className="space-y-4">
                  <Label className="text-[11px] font-black uppercase text-primary tracking-widest pl-2">Bitácora de Observaciones Operativas</Label>
                  <Textarea className="min-h-[200px] rounded-[2.5rem] p-10 bg-slate-50 border-slate-200 focus:bg-white focus:border-primary shadow-inner font-bold text-slate-600 text-base" value={formData.observaciones ?? ''} onChange={e => setFormData({...formData, observaciones: e.target.value})} placeholder="ESCRIBE AQUÍ DETALLES RELEVANTES DE LA INTERVENCIÓN..." />
                </div>
              )}
            </div>
          </ScrollArea>
          
          <DialogFooter className="p-10 bg-slate-50/80 backdrop-blur-md border-t flex justify-end gap-6">
             <Button variant="outline" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="h-16 px-12 rounded-2xl font-black uppercase text-[11px] tracking-widest border-slate-300 bg-white">Cancelar</Button>
             <Button onClick={handleSave} className="h-16 px-16 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] bg-primary hover:bg-primary/90 text-white shadow-[0_20px_40px_rgba(98,17,50,0.3)] transition-all hover:scale-105 active:scale-95">Finalizar y Sincronizar Registro</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
