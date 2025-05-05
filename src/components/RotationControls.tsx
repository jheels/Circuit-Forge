import { RotateCcw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { rotatePoint } from '@/lib/utils';
import { updateWirePositions } from '@/hooks/ui/useWireUpdates';
import { Connector } from '@/definitions/connector';

/**
 * 
 * @returns {JSX.Element} - The RotationControls component
 * @description - A component that provides rotation controls for the selected component in the simulator.
 * It allows users to rotate the component clockwise or anticlockwise.
 * The component uses the SimulatorContext to get the selected component and its properties.
 * It also updates the wire positions based on the new rotation of the component.
 */
export const RotationControls = () => {
    const { 
        selectedComponent, 
        components,
        updateComponent,
        getConnectorConnection,
        connections,
        wires,
        updateWire
    } = useSimulatorContext();

    if (!selectedComponent || !components[selectedComponent]) return null;

    const component = components[selectedComponent];

    // Disable rotation for breadboard and IC components
    if (component.type === 'breadboard' || component.type === 'ic') return null;

    const handleRotate = (direction: 'clockwise' | 'anticlockwise') => {
        const currentRotation = component.rotation || 0;
        const rotationChange = direction === 'clockwise' ? 90 : -90;
        const newRotation = (currentRotation + rotationChange + 360) % 360;
        // Update the component's rotation and connectors
        const updatedConnectors = Object.values(component.connectors).reduce((acc: Record<string, Connector>, connector) => {
            const x = connector.offset.x * component.dimensions.width + component.position.x;
            const y = connector.offset.y * component.dimensions.height + component.position.y;
            const rotatedPoint = rotatePoint({ x, y }, component.position, rotationChange);
            const offsetX = (rotatedPoint.x - component.position.x) / component.dimensions.width;
            const offsetY = (rotatedPoint.y - component.position.y) / component.dimensions.height;

            acc[connector.id] = {
                ...connector,
                offset: { x: offsetX, y: offsetY },
                isConnected: false,
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
            getConnectorConnection,
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
