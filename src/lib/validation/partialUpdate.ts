// Build a partial-update schema from entity schemas that may use .refine().

import { z } from 'zod';

function innerObjectSchema(schema: z.ZodTypeAny): z.ZodObject | null {
  let current: z.ZodTypeAny = schema;
  for (let i = 0; i < 8; i++) {
    if (current instanceof z.ZodObject) return current;
    const next = (current as { _def?: { schema?: z.ZodTypeAny } })._def?.schema;
    if (!next || next === current) break;
    current = next;
  }
  return current instanceof z.ZodObject ? current : null;
}

export function schemaForPartialUpdate(schema: z.ZodTypeAny): z.ZodTypeAny {
  const objectSchema = innerObjectSchema(schema);
  if (objectSchema) {
    // Rebuild from shape so refinements on the original schema are not inherited.
    return z.object(objectSchema.shape as z.ZodRawShape).partial();
  }
  return schema;
}
