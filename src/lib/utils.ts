import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { EditorComponent, Point } from "@/types/general"
import { isPointInConnector } from "@/types/connector"
import { toast } from 'react-hot-toast';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const findConnectorIDAtPoint = (point: Point, components: Record<string, EditorComponent>) => {
    let breadboard = null;
    
    for (const component of Object.values(components)) {
        if (component.type === 'breadboard') {
            breadboard = component;
            continue;
        }
        const { position, dimensions, connectors } = component;

        for (const connectorKey in connectors) {
            const connector = connectors[connectorKey];
            if (isPointInConnector(point, connector, position, dimensions)) {
                return connector.id;
            }
        }
    }

    if (breadboard) {
        const { position, dimensions, connectors } = breadboard;
        for (const connectorKey in connectors) {
            const connector = connectors[connectorKey];
            if (isPointInConnector(point, connector, position, dimensions)) {
                return connector.id;
            }
        }
    }

    return null;
}

export const calculateDistance = (point1: Point, point2: Point): number => {
    return Math.sqrt(
        Math.pow(point1.x - point2.x, 2) +
        Math.pow(point1.y - point2.y, 2)
    );
};

export const rotatePoint = (point: Point, origin: Point, angle: number): Point => {
    const radians = (angle * Math.PI) / 180;
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    
    const dx = point.x - origin.x;
    const dy = point.y - origin.y;
    
    return {
        x: origin.x + (dx * cos - dy * sin),
        y: origin.y + (dx * sin + dy * cos)
    };
};

export const getOS = () => {
    const platform = navigator.userAgent.toLowerCase();
    if (platform.includes("mac")) return "mac";
    if (platform.includes("linux")) return "linux";
    if (platform.includes("win")) return "windows";
    return "unknown";
};

export const isBreadboard = (component: EditorComponent): boolean => {
    return component.type === 'breadboard';
}

export const sendSuccessToast = (message: string, id?: string) => {
    toast.success(message, {
        id: id,
        style: {
            background: '#D1FAE5',
            color: '#065F46',
        },
    });
};

export const sendErrorToast = (message: string, id?: string) => {
    toast.error(message, {
        id: id,
        style: {
            background: '#FEE2E2',
            color: '#991B1B', 
        },
    });
}

export const sendWarningToast = (message: string, id?: string) => {
    toast(message, {
        icon: '⚠️',
        style: {
            background: '#FEF3C7', 
            color: '#92400E',
        },
        id: id,
    });
}