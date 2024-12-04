import React from 'react';
import { Rect, Group } from 'react-konva';

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
  onPinClick 
}) => {
  return (
    <Rect 
      x={position.x}
      y={position.y}
      width={PIN_SIZE}
      height={PIN_SIZE}
      fill={isOccupied ? '#808080' : type === 'power' ? '#ff9999' : type === 'ground' ? '#99ccff' : '#e0e0e0'}

      onClick={() => onPinClick?.(stripId, pinPosition)}
    />
  );
};

// Horizontal Strip Component - Creates a row of 5 electrically connected pins
const Strip: React.FC<StripProps> = ({ stripId, startPoint, onPinClick }) => {
  // Define the pin positions in order
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
      />
    );
  });

  return (
    <Group>
      {pins}
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

// Complete Breadboard Regular Sections Component
const BreadboardRegularSections: React.FC<{
  onPinClick?: (stripId: string, pinPosition: PinPosition) => void;
}> = ({ onPinClick }) => {
  // Create two sections with appropriate spacing
  const leftSection = {
    x: 0,
    y: 0
  };
  
  const rightSection = {
    x: PINS_PER_STRIP * PIN_SPACING + SECTION_SPACING,
    y: 0
  };

  // Define the dimensions for the rectangles
  const sectionWidth = 2 * PINS_PER_STRIP * PIN_SPACING + SECTION_SPACING + 2;
  const sectionHeight = BOARD_ROWS * PIN_SPACING + 2;
  const indentWidth = SECTION_SPACING - 2;
  const indentHeight = BOARD_ROWS * PIN_SPACING - 2;
  
  return (
    <Group>
      <Rect
        x={leftSection.x - 2}
        y={leftSection.y - 2}
        width={sectionWidth}
        height={sectionHeight}
        fill="lightgrey" // Adjust the color as needed
      />
      <Rect
        x={rightSection.x - SECTION_SPACING}
        y={rightSection.y}
        width={indentWidth}
        height={indentHeight}
        fill="darkgrey" // Adjust the color as needed
      />
      {/* Rectangle for the indent between sections */}
      <BreadboardSection
        sectionId="left"
        startPoint={leftSection}
        numStrips={BOARD_ROWS}
        onPinClick={onPinClick}
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

export default BreadboardRegularSections;