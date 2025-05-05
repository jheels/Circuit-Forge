import { useSimulatorContext } from "@/context/SimulatorContext";
import { DIPSwitchComponent } from "@/definitions/components/dipswitch";
import { BaseComponent } from "../base/BaseComponent";
import { Rect, Group, Text } from "react-konva";
import { ComponentProps } from "@/definitions/general";
import Konva from "konva";

/**
 * 
 * @param componentID - The ID of the component to be rendered.
 * @returns {JSX.Element} - The rendered DIP switch component.
 */
export const DipSwitch: React.FC<ComponentProps> = ({ componentID }) => {
    const { components, selectedComponent, updateComponent } = useSimulatorContext();
    const component = components[componentID] as DIPSwitchComponent;

    if (!component) {
        console.error(`Component with ID ${componentID} not found.`);
        return null;
    }

    const { dimensions, switchStates } = component;

    const bodyColour = '#4A90E2';
    const sliderWidth = 10;
    const sliderHeight = 4;
    const sliderOffsetX = 5;
    const sliderOffsetY = 0.5;
    const sliderSpacingY = 5;

    // flip the switch state based on the current state
    const handleToggle = (index: number, e: Konva.KonvaEventObject<MouseEvent>) => {
        e.cancelBubble = true;
        const newSwitchStates = [...switchStates];
        newSwitchStates[index] = !newSwitchStates[index];
        // update the component mode
        updateComponent(componentID, { ...component, switchStates: newSwitchStates } as Partial<DIPSwitchComponent>);
    };

    return (
        <BaseComponent componentID={componentID}>
            {/* Draw the body of the DIP switch */}
            <Rect
                width={dimensions.width}
                height={dimensions.height}
                fill={bodyColour}
                stroke={'#2C3E50'}
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
            {/* create toggle switches with switch number below it */}
            {Array.from({ length: switchStates.length }).map((_, index) => (
                <Group key={index}>
                    <Text
                        x={sliderHeight - 0.5}
                        y={index * sliderSpacingY + sliderOffsetY + 4 / 3}
                        text={`${index + 1}`}
                        fontSize={2.5}
                        fill="white"
                        rotation={90}
                    />
                    <Group
                        onMouseEnter={() => document.body.style.cursor = 'pointer'}
                        onMouseLeave={() => document.body.style.cursor = 'default'}
                    >
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
                        {/* change button position based on current state */}
                        <Rect
                            x={switchStates[index] ? sliderWidth + sliderOffsetX - sliderHeight : sliderOffsetX}
                            y={index * sliderSpacingY + sliderOffsetY}
                            width={sliderHeight}
                            height={sliderHeight}
                            fill='white' // Grey color for the toggle button
                            stroke='#95A5A6' // Slightly lighter grey stroke
                            strokeWidth={0.25}
                            onClick={(event) => handleToggle(index, event)}
                        />
                    </Group>
                </Group>
            ))}
        </BaseComponent>
    )
};