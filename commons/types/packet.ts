import { z } from "zod";
import { MdateSchema, MdateTzSchema, UnixSchema } from "../utils/mdate";

const ValueSchema: z.ZodSchema = z.lazy(()=>z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
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
  t: z.enum([
    "s",  // string
    "nm",  // number
    "b", // boolean
    "d",    // date
    "m",   // mdate
    "mt",  //mdateTz
    "a",   // array
    "o",  // object
    "nl",  // null
  ]),
  d: ValueSchema
});
export type PacketSerializedDataType = z.infer<typeof PacketSerializedDataSchema>;
export const PacketDataSchema: z.ZodSchema = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.date(),
    MdateSchema,
    MdateTzSchema,
    z.null(),
    z.array(PacketDataSchema),
    z.record(PacketDataSchema)
  ])
);
export type PacketDataType = z.infer<typeof PacketDataSchema>;
export const PacketSerializedSchema = z.object({
  e: z.instanceof(Error).optional(),
  d: PacketSerializedDataSchema.optional(),
  v: z.number().optional()
});
export type PacketSerializedType = z.infer<typeof PacketSerializedSchema>;
export const PacketSchema = z.object({
  error: z.instanceof(Error).optional(),
  data: PacketDataSchema.optional(),
  version: z.number().optional()
})
export type PacketType = z.infer<typeof PacketSchema>;