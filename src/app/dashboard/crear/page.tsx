"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { camposFormativos, ejesArticuladores, momentosProyecto } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

const planeacionSchema = z.object({
  nombreProyecto: z.string().min(5, "El nombre debe tener al menos 5 caracteres."),
  problematica: z.string().min(10, "Describe la problemática brevemente."),
  campoFormativo: z.string({ required_error: "Selecciona un campo formativo." }),
  ejesArticuladores: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "Debes seleccionar al menos un eje articulador.",
  }),
  productoFinal: z.string().min(5, "El producto final es requerido."),
  planeacionMomento: z.string().min(10, "Describe las actividades de planeación."),
  accionMomento: z.string().min(10, "Describe las actividades de acción."),
  intervencionMomento: z.string().min(10, "Describe las actividades de intervención."),
});

type PlaneacionFormValues = z.infer<typeof planeacionSchema>;

export default function CrearPlaneacionPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<PlaneacionFormValues>({
    resolver: zodResolver(planeacionSchema),
    defaultValues: {
      nombreProyecto: "",
      problematica: "",
      ejesArticuladores: [],
      productoFinal: "",
      planeacionMomento: "",
      accionMomento: "",
      intervencionMomento: "",
    },
  });

  function onSubmit(data: PlaneacionFormValues) {
    console.log(data);
    toast({
      title: "Planeación Guardada",
      description: `El proyecto "${data.nombreProyecto}" ha sido guardado con éxito.`,
    });
    router.push("/dashboard");
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Crear Nueva Planeación Didáctica</CardTitle>
            <CardDescription>
              Completa los siguientes campos para estructurar tu proyecto basado en la NEM.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>1. Datos Generales del Proyecto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="nombreProyecto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Proyecto</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Las maravillas de la energía solar" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="problematica"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problemática o Tema de Interés</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe la situación o problema del contexto que abordará el proyecto."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="productoFinal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Producto Final</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Creación de un calentador solar casero" {...field} />
                  </FormControl>
                  <FormDescription>El entregable tangible que resulta del proyecto.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Vinculación Curricular (NEM)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="campoFormativo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Campo Formativo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un campo formativo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {camposFormativos.map((campo) => (
                        <SelectItem key={campo} value={campo}>{campo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="ejesArticuladores"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Ejes Articuladores</FormLabel>
                    <FormDescription>
                      Selecciona los ejes que se trabajarán en el proyecto.
                    </FormDescription>
                  </div>
                  {ejesArticuladores.map((item) => (
                    <FormField
                      key={item}
                      control={form.control}
                      name="ejesArticuladores"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={item}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(item)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([...field.value, item])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== item
                                        )
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal">
                              {item}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>3. Momentos del Proyecto (Metodología ABP)</CardTitle>
                <CardDescription>Describe las actividades para cada momento del proyecto.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="planeacionMomento"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{momentosProyecto[0].nombre}</FormLabel>
                        <FormControl>
                            <Textarea placeholder={`Detalla las actividades para la fase de ${momentosProyecto[0].nombre.toLowerCase()}.`} {...field} />
                        </FormControl>
                         <FormDescription>{momentosProyecto[0].descripcion}</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="accionMomento"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{momentosProyecto[1].nombre}</FormLabel>
                        <FormControl>
                            <Textarea placeholder={`Detalla las actividades para la fase de ${momentosProyecto[1].nombre.toLowerCase()}.`} {...field} />
                        </FormControl>
                         <FormDescription>{momentosProyecto[1].descripcion}</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="intervencionMomento"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{momentosProyecto[2].nombre}</FormLabel>
                        <FormControl>
                            <Textarea placeholder={`Detalla las actividades para la fase de ${momentosProyecto[2].nombre.toLowerCase()}.`} {...field} />
                        </FormControl>
                        <FormDescription>{momentosProyecto[2].descripcion}</FormDescription>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>


        <div className="flex justify-end">
            <Button type="submit">Guardar Planeación</Button>
        </div>
      </form>
    </Form>
  );
}
