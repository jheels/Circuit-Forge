/**
 * TODO:
 * - Remove magic numbers
 * - centralise configuration values
 * - add documentation
 * - add wire on click of pin
 */

import React, { useState } from 'react';
import { Rect, Group, Text } from 'react-konva';
// Constants for breadboard dimensions and styling

const PIN_SIZE = 4;
const PIN_SPACING = 6; // Space between two pins is 6-4=2
const PINS_PER_STRIP = 5;
const SECTION_SPACING = PIN_SPACING * 2; // Space for IC placement between sections
const BOARD_ROWS = 64; // Number of horizontal strips on the breadboard

// Types for pin positions within a strip
type PinPosition = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h' | 'i' | 'j';

interface Point {
  x: number;
  y: number;
}

interface PinProps {
  position: Point;
  type: 'regular' | 'power' | 'ground';
  isOccupied: boolean;
  stripId: string;
  pinPosition: PinPosition;
  onPinClick?: (stripId: string, pinPosition: PinPosition) => void;
  isStripHovered: boolean;
}

interface StripProps {
  stripId: string;
  startPoint: Point;
  onPinClick?: (stripId: string, pinPosition: PinPosition) => void;
}

interface BreadboardSectionProps {
  sectionId: string;
  startPoint: Point;
  numStrips: number; // Number of horizontal strips in the section
  onPinClick?: (stripId: string, pinPosition: PinPosition) => void;
}

// Individual Pin Component
const Pin: React.FC<PinProps> = ({
  position,
  type,
  isOccupied,
  stripId,
  pinPosition,
  onPinClick,
  isStripHovered
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const outerColor = isOccupied ? '#808080' : type === 'power' ? '#ff9999' : type === 'ground' ? '#99ccff' : '#e0e0e0';
  const innerColor = isOccupied ? '#707070' : type === 'power' ? '#dd7777' : type === 'ground' ? '#77aadd' : '#c0c0c0';

  return (
    <Group
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Rect
        x={position.x}
        y={position.y}
        width={PIN_SIZE}
        height={PIN_SIZE}
        fill={outerColor}
        stroke={isStripHovered ? isHovered ? 'red' : 'yellow' : 'transparent'}
        strokeWidth={isHovered ? 1 : 0.5}
        onClick={() => onPinClick?.(stripId, pinPosition)}
      />
      <Rect
        x={position.x + 1}
        y={position.y + 1}
        width={PIN_SIZE - 2}
        height={PIN_SIZE - 2}
        fill={innerColor}
        onClick={() => onPinClick?.(stripId, pinPosition)}
      />
    </Group>
  );
};

// Horizontal Strip Component - Creates a row of 5 electrically connected pins
const Strip: React.FC<StripProps> = ({ stripId, startPoint, onPinClick }) => {
  const [isHovered, setIsHovered] = useState(false);
  const pinPositions: PinPosition[] = ['a', 'b', 'c', 'd', 'e'];

  // Create array of 5 pins that share the same stripId
  const pins = pinPositions.map((position, index) => {
    const pinPoint = {
      x: startPoint.x + (index * PIN_SPACING),
      y: startPoint.y
    };
  

    return (
      <Pin
        key={`${stripId}-${position}`}
        position={pinPoint}
        type="regular"
        isOccupied={false}
        stripId={stripId}
        pinPosition={position}
        onPinClick={onPinClick}
        isStripHovered={isHovered}
      />
    );
  });

  return (
    <Group
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {pins}
    </Group>
  );
};

interface PowerRailProps {
  railId: string;
  startPoint: Point;
  numGroups?: number;
  onPinClick?: (stripId: string, pinPosition: PinPosition) => void;
}


const PowerRail: React.FC<PowerRailProps> = ({
  railId,
  startPoint,
  numGroups = 10,
  onPinClick
}) => {
  // Background for the entire power rail section
  const railBackground = (
    <Rect
      x={startPoint.x - 2}
      y={startPoint.y - 2}
      width={SECTION_SPACING + 2}
      height={BOARD_ROWS * PIN_SPACING + 2}
      fill="lightgrey"
    />
  );

  // Create pin groups for both ground and power
  const pinGroups = Array.from({ length: numGroups }).map((_, groupIdx) => {
    let extraGap = 0;
    if (groupIdx >= 5) {
      // add an extra pin worth of space between the two groups
      extraGap = 1;
    }
    const groupStartY = startPoint.y + PIN_SPACING * (2 + extraGap) +
      (groupIdx * (PINS_PER_STRIP * PIN_SPACING)) +
      (groupIdx * PIN_SPACING);

    // Create pins for ground (left) and power (right)
    const pins = Array.from({ length: PINS_PER_STRIP }).map((_, pinIndex) => {
      // Ground pin (left column)
      const groundPin = (
        <Pin
          key={`${railId}-ground-${groupIdx}-${pinIndex}`}
          position={{
            x: startPoint.x,
            y: groupStartY + (pinIndex * PIN_SPACING)
          }}
          type="ground"
          isOccupied={false}
          stripId={`${railId}-ground`} // All ground pins share same stripId
          pinPosition={'a'}
          onPinClick={onPinClick}
        />
      );

      // Power pin (right column)
      const powerPin = (
        <Pin
          key={`${railId}-power-${groupIdx}-${pinIndex}`}
          position={{
            x: startPoint.x + PIN_SPACING,
            y: groupStartY + (pinIndex * PIN_SPACING)
          }}
          type="power"
          isOccupied={false}
          stripId={`${railId}-power`} // All power pins share same stripId
          pinPosition={'b'}
          onPinClick={onPinClick}
        />
      );

      return [groundPin, powerPin];
    });

    return (
      <Group key={`${railId}-group-${groupIdx}`}>
        {pins}
      </Group>
    );
  });

  return (
    <Group>
      {railBackground}
      {pinGroups}
    </Group>
  );
};

// Breadboard Section Component - Creates a section of horizontal strips
const BreadboardSection: React.FC<BreadboardSectionProps> = ({
  sectionId,
  startPoint,
  numStrips,
  onPinClick
}) => {
  // Create the specified number of horizontal strips
  const strips = Array.from({ length: numStrips }).map((_, index) => {
    const stripStartPoint = {
      x: startPoint.x,
      y: startPoint.y + (index * PIN_SPACING)
    };

    return (
      <Strip
        key={`${sectionId}-strip-${index}`}
        stripId={`${sectionId}-strip-${index}`}
        startPoint={stripStartPoint}
        onPinClick={onPinClick}
      />
    );
  });

  return (
    <Group>
      {strips}
    </Group>
  );
};

interface ColumnLabelsProps {
  startPoint: Point;
  labels: string[];
}

const ColumnLabels: React.FC<ColumnLabelsProps> = ({ startPoint, labels }) => {
  return (
    <Group>
      {labels.map((label, index) => (
        <Text
          key={`label-${index}`}
          x={startPoint.x + (index * PIN_SPACING)}
          y={startPoint.y - 5} // Offset above the pins
          text={label}
          fontSize={4}
          fill="grey"
          align="center"
          width={PIN_SIZE} // Ensure label aligns with pin
        />
      ))}
    </Group>
  );
};

// Complete Breadboard Regular Sections Component
const BreadboardRegularSections: React.FC<{
  xOffset?: number;
  onPinClick?: (stripId: string, pinPosition: PinPosition) => void;
}> = ({ xOffset = 0, onPinClick }) => {
  // Create two sections with appropriate spacing
  const leftSection = {
    x: xOffset,
    y: 0
  };

  const rightSection = {
    x: xOffset + PINS_PER_STRIP * PIN_SPACING + SECTION_SPACING,
    y: 0
  };

  // Define the dimensions for the rectangles
  const sectionWidth = 2 * PINS_PER_STRIP * PIN_SPACING + SECTION_SPACING;
  const sectionHeight = BOARD_ROWS * PIN_SPACING;
  const indentWidth = SECTION_SPACING - 2;
  const indentHeight = BOARD_ROWS * PIN_SPACING - 2;

  return (
    <Group>
      <Rect
        x={leftSection.x - 2}
        y={leftSection.y - 2}
        width={sectionWidth + 2}
        height={sectionHeight + 2}
        fill="lightgrey" // Adjust the color as needed
      />
      <Rect
        x={rightSection.x - SECTION_SPACING}
        y={rightSection.y}
        width={indentWidth}
        height={indentHeight}
        fill="#C8C8C8" // Adjust the color as needed
      />
      {/* Rectangle for the indent between sections */}
      <ColumnLabels
        startPoint={{ x: leftSection.x, y: leftSection.y }}
        labels={['A', 'B', 'C', 'D', 'E']}
      />
      <BreadboardSection
        sectionId="left"
        startPoint={leftSection}
        numStrips={BOARD_ROWS}
        onPinClick={onPinClick}
      />
      <ColumnLabels
        startPoint={{ x: rightSection.x, y: rightSection.y }}
        labels={['F', 'G', 'H', 'I', 'J']}
      />
      <BreadboardSection
        sectionId="right"
        startPoint={rightSection}
        numStrips={BOARD_ROWS}
        onPinClick={onPinClick}
      />
    </Group>
  );
};

interface BreadboardProps {
  x: number;
  y: number;
}

const Breadboard: React.FC<BreadboardProps> = ({ x, y }) => {

  function onPinClick(stripId: string, pinPosition: PinPosition) {
    console.log(`Pin ${pinPosition} on strip ${stripId} clicked`);
  }

  const powerRailWidth = SECTION_SPACING + 2;
  const BreadboardRegularSectionWidth = 2 * PINS_PER_STRIP * PIN_SPACING + SECTION_SPACING + 2;
  return (
    <Group x={x} y={y} draggable>
      <PowerRail railId="left" startPoint={{ x: 0, y: 0 }} onPinClick={onPinClick} />
      <BreadboardRegularSections xOffset={powerRailWidth} onPinClick={onPinClick} />
      <PowerRail railId="centre-left" startPoint={{ x: BreadboardRegularSectionWidth + powerRailWidth, y: 0 }} onPinClick={onPinClick} />
      <BreadboardRegularSections xOffset={BreadboardRegularSectionWidth + 2 * powerRailWidth} onPinClick={onPinClick} />
      <PowerRail railId="centre-right" startPoint={{ x: 2 * BreadboardRegularSectionWidth + 2 * powerRailWidth, y: 0 }} onPinClick={onPinClick} />
      <BreadboardRegularSections xOffset={2 * BreadboardRegularSectionWidth + 3 * powerRailWidth} onPinClick={onPinClick} />
      <PowerRail railId="right" startPoint={{ x: 3 * BreadboardRegularSectionWidth + 3 * powerRailWidth, y: 0 }} onPinClick={onPinClick} />
    </Group>
  );
}

export default Breadboard;