export const demoCaseSolution = Object.freeze({
  culpritId: 'suspect-rowan',
  explanation: 'Rowan Pike took the tide bell through the rear service hatch during the blackout. The key register places the hatch key with Rowan, the visitor and fictional camera transcript put a wrapped object on the route to the keeper’s stair, and fresh lamp-maintenance grease marks the rear latch. His stated lantern-room alibi conflicts with that route. Oren’s independently logged radio calls and Mina’s room register make their accounts more consistent with the evidence.',
  motive: 'Rowan feared that budget cuts would cost him the keeper’s cottage.',
  method: 'He used the checked-out service key to open the rear hatch and carried the bell through the maintenance passage while the gallery lights were out.',
  evidenceChain: [
    { evidenceId: 'evidence-key-slip', deduction: 'Rowan had the only key that opened the rear service hatch during the incident window.', strength: 'supporting' },
    { evidenceId: 'evidence-witness', deduction: 'A person carried a long wrapped object from the gallery toward the keeper’s stair during the blackout.', strength: 'supporting' },
    { evidenceId: 'evidence-latch', deduction: 'Fresh lamp-maintenance grease at the rear hatch supports use of the service route.', strength: 'supporting' },
    { evidenceId: 'evidence-radio-log', deduction: 'Oren’s independently logged calls place him on the harbor radio during the relevant window.', strength: 'context' },
    { evidenceId: 'evidence-lab-register', deduction: 'Mina’s register supports her account of being in the conservation room.', strength: 'context' },
  ],
  suspectClearance: [
    { suspectId: 'suspect-mina', explanation: 'The room register supports Mina’s account, and it does not place her near the rear hatch.' },
    { suspectId: 'suspect-oren', explanation: 'The harbor operator independently logged Oren’s storm calls across the incident window.' },
  ],
  timelineReconstruction: [
    { timestamp: '20:55', description: 'Rowan checks out the service hatch key.' },
    { timestamp: '21:02', description: 'A brief storm-related power interruption gives cover in the gallery.' },
    { timestamp: '21:08', description: 'The bell is carried from the gallery toward the keeper’s stair.' },
    { timestamp: '21:22', description: 'The missing bell is discovered and the rear latch is inspected.' },
  ],
});
