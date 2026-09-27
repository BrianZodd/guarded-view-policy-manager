import type { RestrictionType } from './supabase'

// The nine viewing restriction types from U.S. Patent 11,055,437 B2,
// using the same identifiers as the Guarded View design documents.
export type RestrictionDef = {
  type: RestrictionType
  label: string
  help: string
  input: 'number' | 'text' | 'none'
  placeholder?: string
  note?: string
}

export const RESTRICTIONS: RestrictionDef[] = [
  {
    type: 'NUM_VIEWERS',
    label: 'Exact number of viewers',
    help: 'Content shows only when exactly this many people are in front of the screen.',
    input: 'number',
    placeholder: '1',
  },
  {
    type: 'MAX_VIEWERS',
    label: 'Maximum number of viewers',
    help: 'Content hides as soon as more than this many people are watching.',
    input: 'number',
    placeholder: '2',
  },
  {
    type: 'ALLOW_PEOPLE',
    label: 'Only these people',
    help: 'Only the listed people may view it.',
    input: 'text',
    placeholder: 'Alice, Bob',
  },
  {
    type: 'DENY_PEOPLE',
    label: 'Never these people',
    help: 'Content hides if any listed person is present.',
    input: 'text',
    placeholder: 'Eve',
  },
  {
    type: 'VIEW_TOGETHER',
    label: 'Must view together',
    help: 'Everyone listed has to be present at the same time.',
    input: 'text',
    placeholder: 'Alice, Bob',
  },
  {
    type: 'ALLOWED_LOCATION',
    label: 'Allowed location',
    help: 'Content opens only at this place.',
    input: 'text',
    placeholder: 'Home, FAU Boca Raton campus',
  },
  {
    type: 'NO_EXT_RECORDING',
    label: 'No external recording',
    help: 'The recipient is asked not to record the content with another device.',
    input: 'none',
    note: 'Advisory only, a web page cannot detect a second camera pointed at the screen.',
  },
  {
    type: 'NO_EXT_DISPLAY',
    label: 'No external display',
    help: 'Content hides if the device is mirrored or extended to another screen.',
    input: 'none',
  },
  {
    type: 'RECORD_SA',
    label: 'Record situational awareness',
    help: 'Keep the camera assessment data so the sender can review who was present.',
    input: 'none',
    note: 'This is the only restriction that keeps sensor data instead of discarding it, the recipient has to consent.',
  },
]

export const RESTRICTION_BY_TYPE = Object.fromEntries(RESTRICTIONS.map((r) => [r.type, r])) as Record<
  RestrictionType,
  RestrictionDef
>

export function describeRestriction(type: RestrictionType, value: string): string {
  const def = RESTRICTION_BY_TYPE[type]
  return def.input === 'none' || !value ? def.label : `${def.label}: ${value}`
}
