import type { CategoryKey } from '../theme/tokens';

// Simple keyword classifier ported from the prototype (LifeHQ Prototype.dc.html).
// In production this maps to the real AI task parser (docs/06_AI_SYSTEM_SPEC.md).
export function categorizeText(text: string): CategoryKey {
  const lower = text.toLowerCase();
  if (/oisin|nursery|swim|toddler|childcare|health check/.test(lower)) return 'oisin';
  if (/insurance|council|tax|bill|tv licence/.test(lower)) return 'bills';
  if (/boiler|home|house|rent|garden|repair|recycling|bin/.test(lower)) return 'house';
  return 'admin';
}
