import { demoCase } from '../data/demo-case.public.js';
import { demoCaseSolution } from '../data/demo-case.solution.js';

export function serializeResult(session) {
  const culprit = demoCase.suspects.find(({ id }) => id === demoCaseSolution.culpritId);

  return {
    isCorrect: session.accusation.isCorrect,
    score: session.accusation.isCorrect ? 100 : 0,
    submittedSuspectId: session.accusation.suspectId,
    attemptsUsed: 1,
    status: 'resolved',
    culprit: { id: culprit.id, name: culprit.name },
    explanation: demoCaseSolution.explanation,
    motive: demoCaseSolution.motive,
    method: demoCaseSolution.method,
    evidenceChain: demoCaseSolution.evidenceChain.map((entry) => ({
      ...entry,
      title: demoCase.evidence.find(({ id }) => id === entry.evidenceId)?.title,
    })),
    suspectClearance: demoCaseSolution.suspectClearance.map((entry) => ({
      ...entry,
      name: demoCase.suspects.find(({ id }) => id === entry.suspectId)?.name,
    })),
    timelineReconstruction: demoCaseSolution.timelineReconstruction,
  };
}
