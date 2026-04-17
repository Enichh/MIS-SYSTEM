import * as React from "react"
import { cn } from "@/lib/utils"

export type InputSize = "sm" | "md" | "lg"
export type InputState = "default" | "error"

export interface InputProps extends Omit<React.ComponentProps<"input">, "size"> {
  inputSize?: InputSize
  state?: InputState
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputSize = "md", state = "default", ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "input",
          `input-${inputSize}`,
          state === "error" && "input-error",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
