/**
 * Need to add check for connecting directly to bidirectional strips (not allowed).
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { EditorComponent } from '@/definitions/general';
import { Connection, isWireConnection } from '@/definitions/connection';
import {  BreadboardComponent, Strip } from '@/definitions/components/breadboard';
import { PowerSupplyComponent } from '@/definitions/components/powerSupply';

export interface PowerDistribution {
    sourceNode: string;
    powerNode: string;
    groundNode: string;
    poweredRails: Set<string>;
    groundedRails: Set<string>;
}

/**
 * Custom hook to determine the power distribution in a circuit simulation.
 * It identifies the powered and grounded rails on a breadboard based on the
 * connections and components provided.
 *
 * @param components - A record of all components in the circuit, keyed by their IDs.
 * @param connections - A record of all connections in the circuit, keyed by their IDs.
 * 
 * @returns An object containing:
 * - `powerDistribution`: The calculated power distribution, including source node, power node,
 *   ground node, powered rails, and grounded rails.
 * - `powerSupply`: The power supply component identified from the components.
 * - `breadboard`: The breadboard component identified from the components.
 */
export const useFindPowerDistribution = (
    components: Record<string, EditorComponent>,
    connections: Record<string, Connection>
) => {
    const [powerDistribution, setPowerDistribution] = useState<PowerDistribution>({
        sourceNode: '',
        powerNode: '',
        groundNode: '',
        poweredRails: new Set<string>(),
        groundedRails: new Set<string>(),
    });

    const powerSupply = useMemo(() => {
        return Object.values(components).find(component => component.type === 'power-supply') as PowerSupplyComponent;
    }, [components]);

    const breadboard = useMemo(() => {
        return Object.values(components).find(component => component.type === 'breadboard') as BreadboardComponent;
    }, [components]);

    const findStripConnections = useCallback((strip: Strip, visitedConnections: Set<string>) => {
        return Object.values(connections).filter(connection => {
            if (visitedConnections.has(connection.id)) return false;
            if (!isWireConnection(connection)) return false;
            const sourceStripId = connection.metadata.stripID;
            const targetStripId = connection.metadata.targetStripID;

            return (sourceStripId === strip.id || targetStripId === strip.id);
        });
    }, [connections]);

    const processRailConnections = useCallback((
        strip: Strip,
        rails: Set<string>,
        isPositive: boolean,
        visitedConnections: Set<string>
    ) => {
        if (rails.has(strip.id) || rails.size >= 4) return;

        rails.add(strip.id);

        const relevantConnections = findStripConnections(strip, visitedConnections);

        relevantConnections.forEach(connection => {
            visitedConnections.add(connection.id);
            const sourceStripId = connection.metadata.stripID;
            const targetStripId = connection.metadata.targetStripID;
            const nextStripId = sourceStripId === strip.id ? targetStripId : sourceStripId;

            if (!nextStripId) return;

            const nextStrip = breadboard.stripMapping.strips[nextStripId];
            if (!nextStrip) return;

            const nextStripType = nextStrip.type;
            if ((isPositive && nextStripType === 'positive') ||
                (!isPositive && nextStripType === 'negative')) {
                processRailConnections(nextStrip, rails, isPositive, visitedConnections);
            }
        });
    }, [findStripConnections]);

    useEffect(() => {
        if (!breadboard || !powerSupply) return;
        
        const poweredRails = new Set<string>();
        const groundedRails = new Set<string>();
        const visitedConnections = new Set<string>();

        const powerConnections = Object.values(connections).filter(connection => {
            const sourceComponentId = connection.sourceConnector.componentID;
            const targetComponentId = connection.targetConnector.componentID;
            return sourceComponentId === powerSupply.editorID || targetComponentId === powerSupply.editorID;
        });

        powerConnections.forEach(connection => {
            const stripId = connection.metadata.stripID;
            const strip = breadboard.stripMapping.strips[stripId];

            if (strip.type === 'bidirectional') return;

            if (strip.type === 'positive') {
                processRailConnections(strip, poweredRails, true, visitedConnections);
            } else {
                processRailConnections(strip, groundedRails, false, visitedConnections);
            }
        });

        setPowerDistribution({
            sourceNode: powerSupply.editorID,
            powerNode: 'unified-power',
            groundNode: 'unified-ground',
            poweredRails,
            groundedRails,
        });

    }, [breadboard, powerSupply, connections, processRailConnections]);

    return {powerDistribution, powerSupply, breadboard};
};