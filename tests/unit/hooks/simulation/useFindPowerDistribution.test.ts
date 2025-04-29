import { renderHook} from '@testing-library/react';
import { useFindPowerDistribution } from '@/hooks/simulation/useFindPowerDistribution';
import { EditorComponent } from '@/definitions/general';
import { Connection } from '@/definitions/connection';
import { BreadboardComponent, Strip } from '@/definitions/components/breadboard';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';
import { describe, it, expect } from 'vitest';

function createMockStrip(id: string, type: 'positive' | 'negative' | 'bidirectional'): Strip {
    return {
        id,
        type,
        // other properties can be added as needed
    } as Strip;
}

function createMockBreadboard(strips: Strip[]): BreadboardComponent {
    const mapping: Record<string, Strip> = {};
    strips.forEach(strip => mapping[strip.id] = strip);
    return {
        type: 'breadboard',
        editorID: 'breadboard-1',
        stripMapping: {
            strips: mapping,
        },
    } as BreadboardComponent;
}

function createMockPowerSupply(): PowerSupplyComponent {
    return {
        type: 'power-supply',
        editorID: 'ps-1',
    } as PowerSupplyComponent;
}

function createMockWireConnection(
    id: string,
    sourceComponentID: string,
    targetComponentID: string,
    stripID: string,
    targetStripID: string
): Connection {
    return {
        id,
        type: 'wire',
        sourceConnector: { componentID: sourceComponentID },
        targetConnector: { componentID: targetComponentID },
        metadata: { stripID, targetStripID },
    } as Connection;
}

describe('useFindPowerDistribution', () => {
    it('returns empty distribution if no components', () => {
        const { result } = renderHook(() =>
            useFindPowerDistribution({}, {})
        );
        expect(result.current.powerDistribution.poweredRails.size).toBe(0);
        expect(result.current.powerDistribution.groundedRails.size).toBe(0);
        expect(result.current.powerDistribution.sourceNode).toBe('');
    });

    it('finds powered and grounded rails for simple connection', () => {
        const positiveStrip = createMockStrip('strip-pos', 'positive');
        const negativeStrip = createMockStrip('strip-neg', 'negative');
        const breadboard = createMockBreadboard([positiveStrip, negativeStrip]);
        const powerSupply = createMockPowerSupply();

        const components: Record<string, EditorComponent> = {
            [breadboard.editorID]: breadboard,
            [powerSupply.editorID]: powerSupply,
        };

        const connections: Record<string, Connection> = {
            'c1': createMockWireConnection('c1', powerSupply.editorID, breadboard.editorID, 'strip-pos', ''),
            'c2': createMockWireConnection('c2', powerSupply.editorID, breadboard.editorID, 'strip-neg', ''),
        };

        const { result } = renderHook(() =>
            useFindPowerDistribution(components, connections)
        );

        expect(result.current.powerDistribution.poweredRails.has('strip-pos')).toBe(true);
        expect(result.current.powerDistribution.groundedRails.has('strip-neg')).toBe(true);
        expect(result.current.powerDistribution.sourceNode).toBe(powerSupply.editorID);
    });

    it('does not power bidirectional strips', () => {
        const bidirStrip = createMockStrip('strip-bidir', 'bidirectional');
        const breadboard = createMockBreadboard([bidirStrip]);
        const powerSupply = createMockPowerSupply();

        const components: Record<string, EditorComponent> = {
            [breadboard.editorID]: breadboard,
            [powerSupply.editorID]: powerSupply,
        };

        const connections: Record<string, Connection> = {
            'c1': createMockWireConnection('c1', powerSupply.editorID, breadboard.editorID, 'strip-bidir', ''),
        };

        const { result } = renderHook(() =>
            useFindPowerDistribution(components, connections)
        );

        expect(result.current.powerDistribution.poweredRails.size).toBe(0);
        expect(result.current.powerDistribution.groundedRails.size).toBe(0);
    });

    it('recursively finds connected rails of the same type', () => {
        const pos1 = createMockStrip('pos1', 'positive');
        const pos2 = createMockStrip('pos2', 'positive');
        const neg1 = createMockStrip('neg1', 'negative');
        const neg2 = createMockStrip('neg2', 'negative');
        const breadboard = createMockBreadboard([pos1, pos2, neg1, neg2]);
        const powerSupply = createMockPowerSupply();

        const components: Record<string, EditorComponent> = {
            [breadboard.editorID]: breadboard,
            [powerSupply.editorID]: powerSupply,
        };

        const connections: Record<string, Connection> = {
            // Power supply to pos1 and neg1
            'c1': createMockWireConnection('c1', powerSupply.editorID, breadboard.editorID, 'pos1', ''),
            'c2': createMockWireConnection('c2', powerSupply.editorID, breadboard.editorID, 'neg1', ''),
            // pos1 <-> pos2, neg1 <-> neg2
            'c3': createMockWireConnection('c3', breadboard.editorID, breadboard.editorID, 'pos1', 'pos2'),
            'c4': createMockWireConnection('c4', breadboard.editorID, breadboard.editorID, 'neg1', 'neg2'),
        };

        const { result } = renderHook(() =>
            useFindPowerDistribution(components, connections)
        );

        expect(result.current.powerDistribution.poweredRails.has('pos1')).toBe(true);
        expect(result.current.powerDistribution.poweredRails.has('pos2')).toBe(true);
        expect(result.current.powerDistribution.groundedRails.has('neg1')).toBe(true);
        expect(result.current.powerDistribution.groundedRails.has('neg2')).toBe(true);
    });

    it('does not exceed max rails (4)', () => {
        const strips = [
            createMockStrip('pos1', 'positive'),
            createMockStrip('pos2', 'positive'),
            createMockStrip('pos3', 'positive'),
            createMockStrip('pos4', 'positive'),
            createMockStrip('pos5', 'positive'),
        ];
        const breadboard = createMockBreadboard(strips);
        const powerSupply = createMockPowerSupply();

        const components: Record<string, EditorComponent> = {
            [breadboard.editorID]: breadboard,
            [powerSupply.editorID]: powerSupply,
        };

        const connections: Record<string, Connection> = {
            'c1': createMockWireConnection('c1', powerSupply.editorID, breadboard.editorID, 'pos1', ''),
            'c2': createMockWireConnection('c2', breadboard.editorID, breadboard.editorID, 'pos1', 'pos2'),
            'c3': createMockWireConnection('c3', breadboard.editorID, breadboard.editorID, 'pos2', 'pos3'),
            'c4': createMockWireConnection('c4', breadboard.editorID, breadboard.editorID, 'pos3', 'pos4'),
            'c5': createMockWireConnection('c5', breadboard.editorID, breadboard.editorID, 'pos4', 'pos5'),
        };

        const { result } = renderHook(() =>
            useFindPowerDistribution(components, connections)
        );

        // Only 4 rails should be powered due to the limit in processRailConnections
        expect(result.current.powerDistribution.poweredRails.size).toBe(4);
    });
});