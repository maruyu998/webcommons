export type ToastType = {
  id: string,
  title: string|null,
  message: string|null,
  variant: "info"|"success"|"loading"|"warning"|"error"
  deleteAt: Date
}
