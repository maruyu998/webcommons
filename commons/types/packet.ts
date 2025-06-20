import { z } from "zod";
import { MdateSchema, MdateTzSchema, UnixSchema } from "../utils/mdate";

const ValueSchema = z.lazy(()=>z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.undefined(),
  z.object({
    cls: z.string(),         // "date" | "mdate" | "mdateTz"
    time: UnixSchema,        // Unix timestamp
    tz: z.number().optional() // MdateTzのみ
  }),
  z.array(ValueSchema),
  z.array(PacketSerializedDataSchema),
  z.record(PacketSerializedDataSchema)
]));
export const PacketSerializedDataSchema = z.object({
  type: z.enum([
    "string", "number", "boolean", "date", "mdate", "mdateTz",
    "array", "object", "null", "undefined"
  ]),
  data: ValueSchema
});
export type PacketSerializedDataType = z.infer<typeof PacketSerializedDataSchema>;
export const PacketDataSchema = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
    MdateSchema,
    MdateTzSchema,
    z.null(),
    z.undefined(),
    z.array(PacketDataSchema),
    z.record(PacketDataSchema)
  ])
);
export type PacketDataType = z.infer<typeof PacketDataSchema>;
export const PacketSerializedSchema = z.object({
  title: z.string(),
  message: z.string(),
  error: z.instanceof(Error).optional(),
  data: PacketSerializedDataSchema.optional(),
  version: z.number().optional()
});
export type PacketSerializedType = z.infer<typeof PacketSerializedSchema>;
export const PacketSchema = z.object({
  title: z.string(),
  message: z.string(),
  error: z.instanceof(Error).optional(),
  data: PacketDataSchema.optional(),
  version: z.number().optional()
})
export type PacketType = z.infer<typeof PacketSchema>;