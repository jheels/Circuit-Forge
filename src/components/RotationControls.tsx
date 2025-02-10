/**
 * Need to add rotation updates for snaps or something.
 */
import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { rotatePoint } from '@/lib/utils';
import { updateWirePositions  } from '@/hooks/useWireUpdates';

export const RotationControls = () => {
    const { 
        selectedComponent, 
        components,
        updateComponent,
        getConnectorConnections,
        connections,
        wires,
        updateWire
    } = useSimulatorContext();

    if (!selectedComponent || !components[selectedComponent]) return null;

    const component = components[selectedComponent];
    
    // Don't show rotation controls for breadboard
    if (component.type === 'breadboard') return null;

    const handleRotate = (direction: 'clockwise' | 'anticlockwise') => {
        const currentRotation = component.rotation || 0;
        const rotationChange = direction === 'clockwise' ? 45 : -45;
        const newRotation = (currentRotation + rotationChange + 360) % 360;

        const updatedConnectors = Object.values(component.connectors).reduce((acc, connector) => {
            const x = connector.offset.x * component.dimensions.width + component.position.x;
            const y = connector.offset.y * component.dimensions.height + component.position.y;
            const rotatedPoint = rotatePoint({ x, y }, component.position, rotationChange);
            const offsetX = (rotatedPoint.x - component.position.x) / component.dimensions.width;
            const offsetY = (rotatedPoint.y - component.position.y) / component.dimensions.height;

            acc[connector.id] = {
                ...connector,
                offset: { x: offsetX, y: offsetY }
            };
            return acc;
        }, {});

        updateComponent(selectedComponent, {
            rotation: newRotation,
            connectors: updatedConnectors,
        });

        updateWirePositions(
            updatedConnectors,
            component.dimensions,
            getConnectorConnections,
            connections,
            wires,
            updateWire,
            component.position
        );
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRotate('anticlockwise')}
                title="Rotate Anticlockwise (90°)"
            >
                <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRotate('clockwise')}
                title="Rotate Clockwise (90°)"
            >
                <RotateCw className="h-4 w-4" />
            </Button>
        </div>
    );
};
