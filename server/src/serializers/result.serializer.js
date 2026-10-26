export function serializeResult(caseRecord, solution, session) {
  const culprit = caseRecord.suspects.find(({ id }) => id === solution.culpritId);

  return {
    isCorrect: session.accusation.isCorrect,
    score: session.accusation.isCorrect ? 100 : 0,
    submittedSuspectId: session.accusation.suspectId,
    attemptsUsed: 1,
    status: 'resolved',
    culprit: { id: culprit.id, name: culprit.name },
    explanation: solution.explanation,
    motive: solution.motive,
    method: solution.method,
    evidenceChain: solution.evidenceChain.map((entry) => ({
      ...entry,
      title: caseRecord.evidence.find(({ id }) => id === entry.evidenceId)?.title,
    })),
    suspectClearance: solution.suspectClearance.map((entry) => ({
      ...entry,
      name: caseRecord.suspects.find(({ id }) => id === entry.suspectId)?.name,
    })),
    timelineReconstruction: solution.timelineReconstruction,
  };
}
