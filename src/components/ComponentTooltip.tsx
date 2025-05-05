import React from 'react';
import { Group, Rect, Text } from 'react-konva';
import { EditorComponent } from '@/definitions/general';

interface ComponentTooltipProps {
  componentId: string;
  componentElectricalValues: Record<string, Record<number, { voltage: number, current: number }>>;
  component: EditorComponent;
  visible: boolean;
}

// Format current to use mA when appropriate
const formatCurrent = (current: number): string => {
  if (Math.abs(current) < 1) {
    return `${(current * 1000).toFixed(2)} mA`;
  }
  return `${current.toFixed(2)} A`;
};

const formatVoltage = (voltage: number): string => {
  return `${voltage.toFixed(2)} V`;
};

/**
 * 
 * @param {ComponentTooltipProps} props - The properties for the ComponentTooltip component
 * @param {string} props.componentId - The ID of the component
 * @param {Record<string, Record<number, { voltage: number, current: number }>>} props.componentElectricalValues - The electrical values of the component
 * @param {EditorComponent} props.component - The component object
 * @param {boolean} props.visible - Whether the tooltip is visible or not
 * @description - A tooltip component that displays the electrical values of a component in the simulator.
 * It uses the Konva library to render the tooltip and its contents.
 * The tooltip is positioned above the component and contains the component name, voltage, and current values.
 * @returns {JSX.Element | null} - The ComponentTooltip component
 */
export const ComponentTooltip: React.FC<ComponentTooltipProps> = ({
  componentId,
  componentElectricalValues,
  component,
  visible
}) => {
  // Excludes power supply and breadboard
  if (!visible) return null;

  // Get electrical values for this component
  const electricalValues = componentElectricalValues[componentId] || {};

  // Helper to get name based on component type and index
  const getValueName = (component: EditorComponent, index: number): string => {
    if (component.type === 'dip-switch') {
      return `SW ${index + 1}`;
    } else if (component.type === 'ic') {
      return `G ${index}`;
    } else {
      return '';
    }
  };

  // Calculate tooltip dimensions and content
  const tooltipEntries: Array<{ label: string, value: string }> = [];
  const componentName = (component.properties.name as string).length > 10
    ? (component.properties.name as string).substring(0, 10) + '...'
    : (component.properties.name as string);

  // If no values, show N/A
  if (Object.keys(electricalValues).length === 0) {
    tooltipEntries.push(
      { label: 'Vᵈ:', value: 'N/A' },
      { label: 'I:', value: 'N/A' }
    );
  } else {
    // Create entries for each value
    Object.entries(electricalValues).forEach(([indexStr, values]) => {
      const index = parseInt(indexStr);
      const name = getValueName(component, index);

      if (name) {
        tooltipEntries.push({ label: name, value: '' });
      }

      tooltipEntries.push(
        { label: 'Vᵈ', value: formatVoltage(values.voltage) },
        { label: 'I', value: formatCurrent(values.current) }
      );

      // Add separator if not the last entry e.g multi terminal components
      if (index < Object.keys(electricalValues).length - 1) {
        tooltipEntries.push({ label: '---', value: '---' });
      }
    });
  }

  const padding = 1.8;
  const lineHeight = 2.8;
  const tooltipWidth = 20;
  const tooltipHeight = padding * 2 + (tooltipEntries.length + 1) * lineHeight; //
  const verticalOffset = 6;

  return (
    <Group>
      {/* Tooltip background */}
      <Rect

        y={-tooltipHeight - verticalOffset} // Position further above the component
        width={tooltipWidth}
        height={tooltipHeight}
        fill="white"
        stroke="#cccccc"
        strokeWidth={0.25}
        cornerRadius={1}
        shadowColor="rgba(0,0,0,0.2)"
        shadowBlur={1}
        shadowOffsetY={0.5}
        shadowOpacity={0.5}
      />

      {/* Title */}
      <Text
        x={padding}
        y={-tooltipHeight - verticalOffset + padding}
        text={componentName}
        fontSize={2.2}
        fontStyle="bold"
        fontFamily="Arial"
        fill="#333333"
        width={tooltipWidth - padding * 2}
        align="center"
      />

      {/* Values */}
      {tooltipEntries.map((entry, i) => {
        const isHeader = entry.value === '' && entry.label !== '---';
        const isSeparator = entry.label === '---';

        if (isSeparator) {
          return (
            <Rect
              key={`separator-${i}`}
              x={padding}
              y={-tooltipHeight - verticalOffset + padding + (i + 1) * lineHeight + lineHeight / 2}
              width={tooltipWidth - padding * 2}
              height={0.25}
              fill="#eeeeee"
            />
          );
        }

        return (
          <React.Fragment key={`entry-${i}`}>
            <Text
              x={padding}
              y={-tooltipHeight - verticalOffset + padding + (i + 1) * lineHeight}
              text={entry.label}
              fontSize={isHeader ? 2.2 : 2}
              fontStyle={isHeader ? "bold" : "normal"}
              fontFamily="Arial"
              fill="#333333"
              width={(tooltipWidth - padding * 2) / 2.5}
            />
            <Text
              x={padding + (tooltipWidth - padding * 2) / 2.8}
              y={-tooltipHeight - verticalOffset + padding + (i + 1) * lineHeight}
              text={entry.value}
              fontSize={2}
              fontStyle="bold"
              fontFamily="Arial"
              fill="#333333"
              width={(tooltipWidth - padding * 2) / 1.7}
              align="right"
            />
          </React.Fragment>
        );
      })}
    </Group>
  );
};