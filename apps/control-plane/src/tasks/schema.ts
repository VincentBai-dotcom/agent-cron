import { z } from 'zod'

const jsonObjectSchema = z.record(z.string(), z.unknown())

export const actionModeSchema = z.enum(['observe', 'draft', 'publish'])

export const createTaskSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1).nullable().optional(),
  enabled: z.boolean(),
  scheduleExpr: z.string().trim().min(1),
  taskPrompt: z.string().trim().min(1),
  actionMode: actionModeSchema,
  outputSchema: jsonObjectSchema
})

export const updateTaskSchema = createTaskSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  {
    message: 'At least one field is required'
  }
)

export type CreateTaskInput = z.infer<typeof createTaskSchema>
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>
