"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle
} from "@/components/ui/drawer"

const SelectContext = React.createContext(null)

const Select = ({ value, defaultValue, onValueChange, open: openProp, onOpenChange, defaultOpen, children, ...props }) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isControlledOpen = openProp !== undefined
  const open = isControlledOpen ? openProp : internalOpen
  const setOpen = React.useCallback((next) => {
    if (!isControlledOpen) setInternalOpen(next)
    onOpenChange?.(next)
  }, [isControlledOpen, onOpenChange])

  const [items, setItems] = React.useState([])
  const registerItem = React.useCallback((item) => {
    setItems(prev => prev.some(i => i.value === item.value) ? prev : [...prev, item])
  }, [])

  const ctx = React.useMemo(() => ({
    open, setOpen, value, onValueChange, items, registerItem
  }), [open, setOpen, value, onValueChange, items, registerItem])

  return (
    <SelectContext.Provider value={ctx}>
      <SelectPrimitive.Root
        open={open}
        onOpenChange={setOpen}
        value={value}
        defaultValue={defaultValue}
        onValueChange={onValueChange}
        defaultOpen={defaultOpen}
        {...props}
      >
        {children}
      </SelectPrimitive.Root>
    </SelectContext.Provider>
  )
}
Select.displayName = "Select"

const SelectGroup = SelectPrimitive.Group

const SelectValue = ({ placeholder, ...props }) => {
  const ctx = React.useContext(SelectContext)
  const isMobile = useIsMobile()
  if (isMobile && ctx) {
    const selected = ctx.items.find(i => i.value === ctx.value)
    return (
      <span className={cn("truncate", !selected && "text-muted-foreground")} {...props}>
        {selected ? selected.label : placeholder}
      </span>
    )
  }
  return <SelectPrimitive.Value placeholder={placeholder} {...props} />
}

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
      className
    )}
    {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn("flex cursor-default items-center justify-center py-1", className)}
    {...props}>
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef(({ className, children, position = "popper", ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  const isMobile = useIsMobile()

  if (isMobile && ctx) {
    return (
      <>
        {/* Mantém os itens registrados mesmo com o Drawer fechado */}
        <div className="hidden" aria-hidden="true">{children}</div>
        <Drawer open={ctx.open} onOpenChange={ctx.setOpen} shouldScaleBackground={false}>
          <DrawerContent className="max-h-[75vh]">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-sm text-muted-foreground">Selecione uma opção</DrawerTitle>
            </DrawerHeader>
            <div className="overflow-y-auto px-2 pb-6 max-h-[55vh]">
              {ctx.items.map(it => {
                const selected = ctx.value === it.value
                return (
                  <button
                    key={it.value}
                    type="button"
                    disabled={it.disabled}
                    onClick={() => { ctx.onValueChange?.(it.value); ctx.setOpen(false) }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-4 py-3 text-sm transition-colors touch-target disabled:opacity-50",
                      selected ? "bg-blue-500/15 text-blue-400" : "hover:bg-muted/50"
                    )}
                  >
                    <span className="truncate">{it.label}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </DrawerContent>
        </Drawer>
      </>
    )
  }

  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        ref={ref}
        className={cn(
          "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
          position === "popper" &&
            "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
          className
        )}
        position={position}
        {...props}>
        <SelectScrollUpButton />
        <SelectPrimitive.Viewport
          className={cn("p-1", position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]")}>
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  )
})
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("px-2 py-1.5 text-sm font-semibold", className)}
    {...props} />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef(({ value, children, disabled, className, ...props }, ref) => {
  const ctx = React.useContext(SelectContext)
  const isMobile = useIsMobile()
  const label = typeof children === "string" ? children
    : typeof children === "number" ? String(children)
    : React.Children.toArray(children).filter(React.isValidElement).length ? ""
    : ""

  React.useEffect(() => {
    if (isMobile && ctx && value !== undefined && label) {
      ctx.registerItem({ value, label, disabled })
    }
  }, [isMobile, ctx, value, label, disabled])

  if (isMobile && ctx) {
    // No mobile os botões são renderizados pelo Drawer a partir do registro;
    // aqui retornamos nulo (o item oculto em SelectContent garante o registro).
    return null
  }

  return (
    <SelectPrimitive.Item
      ref={ref}
      disabled={disabled}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className
      )}
      {...props}>
      <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-muted", className)}
    {...props} />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
