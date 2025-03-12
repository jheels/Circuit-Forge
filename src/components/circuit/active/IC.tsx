import { useSimulatorContext } from "@/context/SimulatorContext";
import { ICComponent } from "@/types/components/ic";
import { BaseComponent } from "../base/BaseComponent";
import { Rect, Group, Arc, Text, Circle } from "react-konva";

interface ICProps {
    componentID: string;
}

export const IC: React.FC<ICProps> = ({ componentID }) => {
    const { components, selectedComponent } = useSimulatorContext();
    const component = components[componentID] as ICComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, icType } = component;

    // Function to render pins aligned with connector positions
    const renderPins = () => {
        const pins: JSX.Element[] = [];
        const pinWidth = 2;
        const pinHeight = 2;
        
        // Render a pin for each connector
        Object.values(component.connectors).forEach(connector => {
            const y = connector.offset.y * dimensions.height;
            
            // Determine if the pin is on the left or right side
            const isLeftSide = connector.offset.x < 0.5;
            pins.push(
                <Rect
                    key={`pin-${connector.id}`}
                    width={pinWidth}
                    height={pinHeight}
                    fill={connector.type === 'positive' ? '#ff9999' : connector.type === 'negative' ? '#99ccff' : '#888888'}
                    x={isLeftSide ? -pinWidth * 0.5 : dimensions.width - pinWidth * 0.5}
                    y={y - pinHeight / 2}
                    cornerRadius={0.25}
                />
            );
        });

        return pins;
    };

    return (
        <BaseComponent componentID={componentID}>
            {/* Render all pins */}
            <Group>
                {renderPins()}
            </Group>
            {/* IC Body */}
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill="#222222" // Dark gray color for the chip body
                stroke={'rgba(143,217,251, 0.5)'}
                strokeEnabled={selectedComponent === componentID}
                strokeWidth={0.75}
                cornerRadius={1}
            />
            {/* Notch at the top to indicate pin 1 (typical on real ICs) */}
            <Arc
                x={dimensions.width / 2}
                y={0}
                innerRadius={0}
                outerRadius={dimensions.width / 5}
                angle={180}
                fill="gray"
            />
            {/* IC Type Label */}
            <Text
                text={icType}
                fontSize={4}
                fill="white"
                x={dimensions.width / 2 + 2}
                y={dimensions.height / 3}
                rotation={90}
            />
            {/* Pin 1 indicator (small dot near pin 1) */}
            <Circle
                x={dimensions.width / 8}
                y={dimensions.height / 14}
                radius={0.5}
                fill="white"
            />
        </BaseComponent>
    );
};