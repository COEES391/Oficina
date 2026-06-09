'use server';
/**
 * @fileOverview Agente de IA para la Mesa de Ayuda COEES.
 *
 * - chatWithHelpDesk - Función principal para interactuar con el chatbot técnico.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const HelpDeskInputSchema = z.object({
  message: z.string().describe('El mensaje o duda técnica del usuario.'),
});

const HelpDeskOutputSchema = z.object({
  response: z.string().describe('La respuesta técnica del asistente.'),
});

export async function chatWithHelpDesk(input: z.infer<typeof HelpDeskInputSchema>) {
  return helpDeskFlow(input);
}

const helpDeskFlow = ai.defineFlow(
  {
    name: 'helpDeskFlow',
    inputSchema: HelpDeskInputSchema,
    outputSchema: HelpDeskOutputSchema,
  },
  async (input) => {
    const { output } = await ai.generate({
      prompt: `Eres el "Asistente Técnico Virtual COEES" del Estado de México. 
      Tu misión es ayudar a docentes y coordinadores con problemas técnicos en:
      1. ATRES (Sistema de Seguimiento).
      2. Cuentas Institucionales (@desysa.edu.mx).
      3. Red Edusat, Red Local y Teleplanteles.
      
      IMPORTANTE: Si el usuario presenta una duda técnica que requiere revisión o soporte, debes indicarle que siga los pasos de la columna de "Apoyo Remoto" (ubicada a la izquierda de la pantalla):
      1. Descargar AnyDesk en su equipo.
      2. Localizar y copiar su ID personal de 9 dígitos.
      3. Pegar el ID en el campo blanco de la columna izquierda ("ID ANYDESK / TEAMVIEWER").
      4. Hacer clic en el botón "SOLICITAR SOPORTE" y esperar a que un analista se conecte.
      
      Instrucciones de estilo:
      - Sé profesional, amable e institucional.
      - Usa términos técnicos pero fáciles de entender.
      - Si necesitan apoyo remoto, menciona explícitamente los pasos de la columna izquierda para que el usuario sepa qué hacer.
      
      Mensaje del usuario: ${input.message}`,
      output: { schema: HelpDeskOutputSchema }
    });
    return output!;
  }
);
