import { renderHook, act } from '@testing-library/react';
import { useSimulationExecution } from '@/hooks/simulation/useSimulationExecution';
import { useSimulatorContext } from '@/context/SimulatorContext';
import { useCircuitDetection } from '@/hooks/simulation/useCircuitDetection';
import { performDCAnalysis } from '@/simulation/core/DCAnalyser';
import { EditorComponent } from '@/definitions/general';
import { describe, beforeEach, it, expect, vi } from 'vitest';
import { c } from 'node_modules/vite/dist/node/types.d-aGj9QkWt';

// Mock dependencies
vi.mock('@/context/SimulatorContext');
vi.mock('@/hooks/simulation/useCircuitDetection');
vi.mock('@/simulation/core/DCAnalyser');

const mockUpdateComponentElectricalValues = vi.fn();

const mockComponents: Record<string, EditorComponent> = {
    'r1': { id: 'r1', type: 'resistor' } as EditorComponent,
    'v1': { id: 'v1', type: 'independent-voltage-source' } as EditorComponent,
};

const mockCircuitGraph = {
    nodes: { 'n1': {}, 'n2': {} },
    edges: {
        'e1': {
            id: 'e1',
            sourceId: 'n1',
            targetId: 'n2',
            connection: { type: 'component', id: 'r1' }
        }
    }
};

const mockAnalysisResult = {
    success: true,
    voltages: { 'n1': 5, 'n2': 0 },
    models: { 'e1': { type: 'resistor', conductance: 0.5 } }
};

describe('useSimulationExecution', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useSimulatorContext as vi.Mock).mockReturnValue({
            components: mockComponents,
            updateComponentElectricalValues: mockUpdateComponentElectricalValues,
        });
        (useCircuitDetection as vi.Mock).mockReturnValue({
            circuitGraph: mockCircuitGraph,
        });
        (performDCAnalysis as vi.Mock).mockReturnValue(mockAnalysisResult);
    });

    it('returns analysisResult and hasValidCircuit', () => {
        const { result } = renderHook(() => useSimulationExecution());
        expect(result.current.analysisResult).toEqual(mockAnalysisResult);
        expect(result.current.hasValidCircuit).toBe(true);
        expect(result.current.error).toBeNull();
    });

    it('calls performDCAnalysis on runAnalysis', () => {
        const { result } = renderHook(() => useSimulationExecution());
        act(() => {
            result.current.runAnalysis();
        });
        expect(performDCAnalysis).toHaveBeenCalled();
    });

    it('getNodeVoltages returns voltages if analysis is successful', () => {
        const { result } = renderHook(() => useSimulationExecution());
        expect(result.current.getNodeVoltages()).toEqual({ 'n1': 5, 'n2': 0 });
    });

    it('getNodeVoltages returns empty object if analysis fails', () => {
        (performDCAnalysis as vi.Mock).mockReturnValue({ success: false });
        const { result } = renderHook(() => useSimulationExecution());
        expect(result.current.getNodeVoltages()).toEqual({});
    });

    it('getCircuitValues returns correct structure', () => {
        const { result } = renderHook(() => useSimulationExecution());
        const values = result.current.getCircuitValues(mockAnalysisResult);
        expect(values).toHaveProperty('r1');
        expect(values['r1'][0]).toHaveProperty('voltage');
        expect(values['r1'][0]).toHaveProperty('current');
    });

    it('sets error if circuitGraph is null', () => {
        (useCircuitDetection as vi.Mock).mockReturnValue({ circuitGraph: null });
        const { result } = renderHook(() => useSimulationExecution());
        expect(result.current.error).toBe('No valid circuit detected');
        expect(result.current.hasValidCircuit).toBe(false);
    });

    it('catches error if DCAnalysis throws', () => {
        (performDCAnalysis as vi.Mock).mockReturnValue({ success: false, error: 'fail' });
        const { result } = renderHook(() => useSimulationExecution());
        act(() => {
            result.current.runAnalysis();
        });
;
        expect(result.current.error).toMatch(/fail/);
    });

    it('sets error if performDCAnalysis returns unsuccessful result', () => {
        (performDCAnalysis as vi.Mock).mockReturnValue({ success: false, error: 'bad circuit' });
        const { result } = renderHook(() => useSimulationExecution());
        act(() => {
            result.current.runAnalysis();
        });
        expect(result.current.error).toBe('bad circuit');
    });

    it('calls updateComponentElectricalValues with correct values', () => {
        renderHook(() => useSimulationExecution());
        expect(mockUpdateComponentElectricalValues).toHaveBeenCalled();
    });
});