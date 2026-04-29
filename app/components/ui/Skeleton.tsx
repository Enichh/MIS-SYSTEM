import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted/20", className)}
      style={{
        backgroundColor: "var(--border-dark)",
        opacity: 0.5,
        animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
      }}
      {...props}
    />
  )
}

export { Skeleton }
