import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { EditorComponent, Point } from "@/types/general"
import { isPointInConnector } from "@/types/connector"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export const findConnectorIDAtPoint = (point: Point, components: Record<string, EditorComponent>) => {
    for (const component of Object.values(components)) {
        const { position, dimensions, connectors } = component;

        for (const connectorKey in connectors) {
            const connector = connectors[connectorKey];
            if (isPointInConnector(point, connector, position, dimensions)) {
                return connector.id;
            }
        }
    }

    return null;
}