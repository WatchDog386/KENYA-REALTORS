import * as React from "react"
import { cn } from "@/lib/utils"

// Define proper props interface for Tabs component
interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
  defaultValue?: string
}

// Create context for Tabs state management
interface TabsContextType {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextType | undefined>(undefined)

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, value, defaultValue, onValueChange, children, ...props }, ref) => {
    const [localValue, setLocalValue] = React.useState(defaultValue || "")
    
    const handleValueChange = (newValue: string) => {
      setLocalValue(newValue)
      if (onValueChange) {
        onValueChange(newValue)
      }
    }
    
    // Use controlled or uncontrolled value
    const currentValue = value !== undefined ? value : localValue
    
    return (
      <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
        <div 
          ref={ref} 
          className={cn("", className)} 
          {...props}
          data-value={currentValue}
        >
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("inline-flex h-10 items-center justify-center rounded-lg bg-gray-100 p-1", className)}
      {...props}
    />
  )
)
TabsList.displayName = "TabsList"

// Update TabsTrigger to handle active state based on parent value
interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, ...props }, ref) => {
    const parentTabs = React.useContext(TabsContext)
    
    const isActive = parentTabs?.value === value
    
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (onClick) {
        onClick(e)
      }
      parentTabs?.onValueChange?.(value)
    }
    
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm",
          isActive && "bg-white text-gray-900 shadow-sm",
          className
        )}
        data-state={isActive ? "active" : "inactive"}
        data-value={value}
        onClick={handleClick}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, ...props }, ref) => {
    const context = React.useContext(TabsContext)
    
    // Only render if the value matches the current active tab
    if (value && context && context.value !== value) {
      return null
    }
    
    return (
      <div
        ref={ref}
        className={cn("mt-2", className)}
        {...props}
      >
        {props.children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

// Export components
export { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent
}