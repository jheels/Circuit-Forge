import { describe, it, expect, vi } from 'vitest';
import { createValidationIssue } from '@/simulation/validation/types';

// Mock uuidv4 to return a fixed value
vi.mock('uuid', () => ({
    v4: () => 'mock-uuid'
}));

describe('createValidationIssue', () => {
    it('creates a ValidationIssue with all fields provided', () => {
        const issue = createValidationIssue(
            'error',
            'Test message',
            ['comp1', 'comp2'],
            ['node1', 'node2'],
            'Try reconnecting'
        );
        expect(issue).toEqual({
            id: 'mock-uuid',
            severity: 'error',
            message: 'Test message',
            componentIDs: ['comp1', 'comp2'],
            affectedNodes: ['node1', 'node2'],
            suggestedFix: 'Try reconnecting'
        });
    });

    it('creates a ValidationIssue with default componentIDs and affectedNodes', () => {
        const issue = createValidationIssue('warning', 'Another message');
        expect(issue).toEqual({
            id: 'mock-uuid',
            severity: 'warning',
            message: 'Another message',
            componentIDs: [],
            affectedNodes: [],
            suggestedFix: undefined
        });
    });

    it('creates a ValidationIssue without suggestedFix', () => {
        const issue = createValidationIssue(
            'error',
            'No fix',
            ['compA'],
            ['nodeA']
        );
        expect(issue.suggestedFix).toBeUndefined();
    });

    it('assigns correct types to severity', () => {
        const errorIssue = createValidationIssue('error', 'Error');
        const warningIssue = createValidationIssue('warning', 'Warning');
        expect(errorIssue.severity).toBe('error');
        expect(warningIssue.severity).toBe('warning');
    });
});