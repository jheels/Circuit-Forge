import { LucideIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"

interface TooltipButtonProps {
    icon: LucideIcon
    tooltip: string
    isSelected?: boolean
    onClick?: () => void
}

export function TooltipButton({ icon: Icon, tooltip, isSelected, onClick }: TooltipButtonProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button aria-label={tooltip + 'button'} data-testid={tooltip} variant="ghost" size="icon" className={isSelected ? "bg-white text-black" : ""} onClick={onClick}>
                        <Icon className="h-7 w-7" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}