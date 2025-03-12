import { useSimulatorContext } from "@/context/SimulatorContext";
import { DIPSwitchComponent } from "@/types/components/dipswitch";
import { BaseComponent } from "../base/BaseComponent";
import { Rect, Group, Text } from "react-konva";
import Konva from "konva";

interface DipSwitchProps {
    componentID: string
}

export const DipSwitch: React.FC<DipSwitchProps> = ({ componentID }) => {
    const { components, selectedComponent, updateComponent } = useSimulatorContext();
    const component = components[componentID] as DIPSwitchComponent;
    
    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, switchStates } = component;

    const bodyColour = '#4A90E2';
    const sliderWidth = 10;
    const sliderHeight = 4; // Adjusted height to 5 as per your requirement
    const sliderOffsetX = 5;
    const sliderOffsetY = 0.5;
    const sliderSpacingY = 5; // Adjusted spacing for better aesthetics

    const handleToggle = (index: number, e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        const newSwitchStates = [...switchStates];
        newSwitchStates[index] = !newSwitchStates[index];
        updateComponent(componentID, { ...component, switchStates: newSwitchStates } as Partial<DIPSwitchComponent>);
    };

    return (
        <BaseComponent componentID={componentID}>
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill={bodyColour}
                stroke={'#2C3E50'} // Darker stroke color for contrast
                strokeEnabled={selectedComponent === componentID}
                strokeWidth={0.25}
            />
            <Text
                x={dimensions.width}
                text="ON"
                fontSize={2.5}
                padding={0.5}
                fill="white"
                rotation={90}
            />
            {Array.from({ length: switchStates.length }).map((_, index) => (
                <Group key={index}>
                    <Text
                        x={sliderHeight - 0.5}
                        y={index * sliderSpacingY + sliderOffsetY + 4/3}
                        text={`${index + 1}`}
                        fontSize={2.5}
                        fill="white"
                        rotation={90}
                    />
                    <Rect
                        x={sliderOffsetX}
                        y={index * sliderSpacingY + sliderOffsetY}
                        width={sliderWidth}
                        height={sliderHeight}
                        fill='#F5F5F5' // Light grey color for the slider
                        stroke='#BDC3C7' // Slightly darker grey stroke
                        strokeWidth={0.25}
                        onClick={(event) => handleToggle(index, event)}
                    />
                    <Rect
                        x={switchStates[index] ? sliderWidth + sliderOffsetX -  sliderHeight : sliderOffsetX}
                        y={index * sliderSpacingY + sliderOffsetY}
                        width={sliderHeight}
                        height={sliderHeight}
                        fill='white' // Grey color for the toggle button
                        stroke='#95A5A6' // Slightly lighter grey stroke
                        strokeWidth={0.25}
                        onClick={(event) => handleToggle(index, event)}
                    />
                </Group>
            ))}
        </BaseComponent>
    )
};