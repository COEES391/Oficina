
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { History, Search, FileSpreadsheet, Building2, CheckCircle2, UserCheck, Calendar } from "lucide-react"
import { type BitacoraEntry } from '@/lib/planning-data'
import * as XLSX from 'xlsx'

export default function BitacoraAtresPage() {
  const [mounted, setMounted] = useState(false)
  const [records, setRecords] = useState<BitacoraEntry[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    setMounted(true)
    const stored = JSON.parse(localStorage.getItem('atres_bitacora') || '[]')
    setRecords(stored)
  }, [])

  const filteredRecords = useMemo(() => {
    if (!searchTerm) return records;
    const term = searchTerm.toUpperCase();
    return records.filter(r => 
      (r.cct || '').toUpperCase().includes(term) ||
      (r.schoolName || '').toUpperCase().includes(term) ||
      (r.folio || '').toUpperCase().includes(term) ||
      (r.tecnico || '').toUpperCase().includes(term)
    );
  }, [searchTerm, records]);

  const downloadExcel = () => {
    const dataToExport = filteredRecords.map(r => ({
      Folio: r.folio,
      Fecha: r.fecha,
      CCT: r.cct,
      Plantel: r.schoolName,
      Servicio: r.servicio,
      Técnico: r.tecnico,
      Oficina: r.oficina,
      Tipo: r.tipo
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bitácora ATRES");
    XLSX.writeFile(workbook, `Bitacora_ATRES_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary uppercase leading-none">Bitácora de Solicitudes</h2>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-[0.2em] flex items-center gap-2 mt-1">
            <History className="h-4 w-4 text-accent" /> Control Histórico de Atención Final ATRES
          </p>
        </div>
        
        <Button onClick={downloadExcel} variant="outline" className="h-12 px-8 rounded-xl border-emerald-200 text-emerald-700 font-black uppercase text-[10px] gap-2 hover:bg-emerald-50 shadow-md">
          <FileSpreadsheet className="h-5 w-5" /> Exportar a Excel
        </Button>
      </div>

      <Card className="executive-card p-6 bg-white/80 border-none shadow-lg">
        <div className="flex flex-col md:flex-row items-center gap-6">
           <div className="flex items-center gap-3 w-full md:w-auto">
              <Search className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Buscador Operativo:</span>
           </div>
           
           <div className="relative flex-1 w-full">
              <Input 
                placeholder="BUSCAR POR CCT, PLANTEL, TÉCNICO O FOLIO..." 
                className="h-12 rounded-xl bg-slate-50 border-primary/10 pl-12 text-sm font-bold uppercase shadow-inner focus:bg-white transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-4 top-3.5 h-4 w-4 text-slate-300" />
           </div>

           <Badge variant="outline" className="h-12 px-6 rounded-xl border-primary/20 text-primary font-black text-[10px] uppercase">
             Total Atenciones: {filteredRecords.length}
           </Badge>
        </div>
      </Card>

      <Card className="executive-card p-0 shadow-2xl border-none overflow-hidden bg-white">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-slate-50 border-b">
              <TableRow className="h-14">
                <TableHead className="w-24 text-[10px] font-black uppercase text-center pl-6">Folio</TableHead>
                <TableHead className="min-w-[150px] text-[10px] font-black uppercase">Fecha / Hora</TableHead>
                <TableHead className="min-w-[200px] text-[10px] font-black uppercase">Identificación del Plantel</TableHead>
                <TableHead className="min-w-[250px] text-[10px] font-black uppercase">Resumen Operativo del Servicio</TableHead>
                <TableHead className="min-w-[150px] text-[10px] font-black uppercase">Analista Técnico</TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase pr-10">Estatus</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.length > 0 ? filteredRecords.map((r) => (
                <TableRow key={r.id} className="hover:bg-slate-50 transition-colors border-b border-slate-50 h-20 group">
                  <TableCell className="pl-6 text-center">
                    <span className="font-mono font-black text-xs text-primary">{r.folio}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <Calendar className="h-3 w-3 text-accent" />
                       <span className="text-[10px] font-bold text-slate-500">{r.fecha}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-slate-700 uppercase leading-none">{r.schoolName}</span>
                      <div className="flex items-center gap-2 mt-1.5">
                         <Badge variant="secondary" className="bg-primary/5 text-primary text-[8px] font-black border-primary/10">{r.cct}</Badge>
                         <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{r.oficina.replace("Oficina de ", "")}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-[10px] font-semibold text-slate-600 leading-relaxed line-clamp-2 max-w-[400px]">
                      {r.servicio}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                       <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                       <span className="text-[10px] font-black text-slate-700 uppercase">{r.tecnico}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-10">
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-black text-[9px] uppercase px-4 h-6">
                      <CheckCircle2 className="h-3 w-3 mr-1.5" /> CONCLUIDO
                    </Badge>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-28 opacity-30">
                    <div className="flex flex-col items-center gap-4">
                      <History className="h-12 w-12 text-slate-300" />
                      <p className="text-sm font-black uppercase tracking-widest text-slate-400">Sin registros en bitácora para mostrar</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex items-center gap-3 p-4 bg-accent/5 border border-accent/10 rounded-2xl animate-pulse">
         <UserCheck className="h-5 w-5 text-accent" />
         <p className="text-[10px] font-black uppercase tracking-[0.15em] text-accent">
            Histórico consolidado de atenciones técnicas. Los datos aquí mostrados son auditables y permanentes para el reporte de actividades COEES 2026.
         </p>
      </div>
    </div>
  );
}
