import { Toaster as SonnerToaster } from "sonner"

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-center"
      toastOptions={{
        classNames: {
          toast: "dark:bg-card dark:text-foreground",
        },
      }}
    />
  )
}
