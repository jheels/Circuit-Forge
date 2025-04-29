import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCircuitDetection } from '@/hooks/simulation/useCircuitDetection';
import * as SimulatorContext from '@/context/SimulatorContext';
import * as PowerDistribution from '@/hooks/simulation/useFindPowerDistribution';
import * as CircuitDetection from '@/simulation/circuit/circuitDetection';
import * as Validation from '@/simulation/validation';
import * as Utils from '@/lib/utils';

describe('useCircuitDetection', () => {
    let mockSendErrorToast: MockInstance<(message: string, id?: string | undefined) => void>;
    let mockSendSuccessToast:MockInstance<(message: string, id?: string | undefined) => void>;
    let mockSendWarningToast:MockInstance<(message: string, id?: string | undefined) => void>;

    beforeEach(() => {
        mockSendErrorToast = vi.spyOn(Utils, 'sendErrorToast').mockImplementation(() => {});
        mockSendSuccessToast = vi.spyOn(Utils, 'sendSuccessToast').mockImplementation(() => {});
        mockSendWarningToast = vi.spyOn(Utils, 'sendWarningToast').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    function setupContextAndPowerDist({
        components = {},
        connections = [],
        powerSupply = {},
        breadboard = {},
        powerDistribution = { sourceNode: 'src', poweredRails: new Set(['p']), groundedRails: new Set(['g']) },
        getConnectorConnection = vi.fn(),
    } = {}) {
        vi.spyOn(SimulatorContext, 'useSimulatorContext').mockReturnValue({
            components,
            connections,
            getConnectorConnection,
        });
        vi.spyOn(PowerDistribution, 'useFindPowerDistribution').mockReturnValue({
            powerDistribution,
            powerSupply,
            breadboard,
        });
    }

    it('returns null circuitGraph if no powerSupply or breadboard', () => {
        setupContextAndPowerDist({ powerSupply: null, breadboard: null });
        const { result } = renderHook(() => useCircuitDetection());
        expect(result.current.circuitGraph).toBeNull();
        expect(mockSendErrorToast).not.toHaveBeenCalled();
    });

    it('sends error toast if components exist but no powerSupply or breadboard', () => {
        setupContextAndPowerDist({ components: {a: {}}, powerSupply: null, breadboard: null });
        renderHook(() => useCircuitDetection());
        expect(mockSendErrorToast).toHaveBeenCalledOnce();
    });

    it('returns null circuitGraph if powerDistribution is incomplete', () => {
        setupContextAndPowerDist({
            powerDistribution: { sourceNode: '', poweredRails: new Set(), groundedRails: new Set() }
        });
        const { result } = renderHook(() => useCircuitDetection());
        expect(result.current.circuitGraph).toBeNull();
    });

    it('sets circuitGraph and sends success toast if validation passes', () => {
        const fakeGraph = { nodes: [], edges: [] };
        setupContextAndPowerDist();
        vi.spyOn(CircuitDetection, 'initialiseCircuitGraph').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'initialisePowerDistribution').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'initialiseActiveRegularStrips').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'createEdgesFromConnections').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'findConnectedCircuit').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'removeDisconnectedPaths').mockReturnValue(fakeGraph as any);
        vi.spyOn(Validation, 'validateCircuit').mockReturnValue({ issues: [], hasErrors: false });

        const { result } = renderHook(() => useCircuitDetection());
        expect(result.current.circuitGraph).toBe(fakeGraph);
        expect(mockSendSuccessToast).toHaveBeenCalledWith('Detected circuit', 'detected-circuit-toast');
    });

    it('sends error and warning toasts for validation issues', () => {
        setupContextAndPowerDist();
        const fakeGraph = {};
        vi.spyOn(CircuitDetection, 'initialiseCircuitGraph').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'initialisePowerDistribution').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'initialiseActiveRegularStrips').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'createEdgesFromConnections').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'findConnectedCircuit').mockReturnValue(fakeGraph as any);
        vi.spyOn(Validation, 'validateCircuit').mockReturnValue({
            issues: [
                { severity: 'error', message: 'err', suggestedFix: 'fix1' },
                { severity: 'warning', message: 'warn', suggestedFix: 'fix2' }
            ],
            hasErrors: true
        });

        renderHook(() => useCircuitDetection());
        expect(mockSendErrorToast).toHaveBeenCalledWith('err', 'err');
        expect(mockSendErrorToast).toHaveBeenCalledWith('fix1', 'fix1');
        expect(mockSendWarningToast).toHaveBeenCalledWith('warn', 'warn');
        expect(mockSendWarningToast).toHaveBeenCalledWith('fix2', 'fix2');
    });

    it('sets circuitGraph to null if validation fails', () => {
        setupContextAndPowerDist();
        const fakeGraph = {};
        vi.spyOn(CircuitDetection, 'initialiseCircuitGraph').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'initialisePowerDistribution').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'initialiseActiveRegularStrips').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'createEdgesFromConnections').mockReturnValue(fakeGraph as any);
        vi.spyOn(CircuitDetection, 'findConnectedCircuit').mockReturnValue(fakeGraph as any);
        vi.spyOn(Validation, 'validateCircuit').mockReturnValue({
            issues: [{ severity: 'error', message: 'err', suggestedFix: undefined }],
            hasErrors: true
        });

        const { result } = renderHook(() => useCircuitDetection());
        expect(result.current.circuitGraph).toBeNull();
    });
});