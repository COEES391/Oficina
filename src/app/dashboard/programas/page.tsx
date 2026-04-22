'use client'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { programsData } from "@/lib/planning-data"

export default function ProgramsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Programas de Desarrollo Educativo</CardTitle>
          <CardDescription>Seguimiento al cumplimiento de metas programáticas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {programsData.map((program) => (
            <div key={program.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-lg">{program.name}</span>
                  <Badge className="ml-2 uppercase text-[10px]" variant={program.status === 'concluido' ? 'default' : 'outline'}>
                    {program.status}
                  </Badge>
                </div>
                <span className="text-sm font-medium">{program.progress}%</span>
              </div>
              <Progress value={program.progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
