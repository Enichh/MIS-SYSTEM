import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { getIcon } from "@/lib/utils/icon-utils"
import { IconName, IconProps, ICON_SIZES, DEFAULT_ICON_SIZE } from "@/lib/utils/icon-utils"

import { cn } from "@/lib/utils"

export type ButtonVariant = "primary" | "secondary" | "danger" | "ghost" | "outline"
export type ButtonSize = "sm" | "md" | "lg"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  icon?: IconName
  iconSize?: IconProps["size"]
  variant?: ButtonVariant
  size?: ButtonSize
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", asChild = false, icon, iconSize = DEFAULT_ICON_SIZE, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const IconComponent = icon ? getIcon(icon) : null
    
    return (
      <Comp
        className={cn("btn", `btn-${variant}`, `btn-${size}`, className)}
        ref={ref}
        {...props}
      >
        {IconComponent && <IconComponent size={iconSize} />}
        {children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button }
