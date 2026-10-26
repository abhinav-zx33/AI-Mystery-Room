import { demoCase } from '../data/demo-case.public.js';
import { demoCaseSolution } from '../data/demo-case.solution.js';
import { CaseModel } from '../models/Case.js';
import { CaseSolutionModel } from '../models/CaseSolution.js';

export async function ensureDemoCaseSeeded() {
  const { id, title, summary, incidentType, setting, incidentTime, difficulty, playTimeMinutes, status, suspects, evidence, timeline } = demoCase;
  const caseRecord = await CaseModel.findOneAndUpdate(
    { id },
    {
      $setOnInsert: {
        id,
        title,
        premise: summary,
        summary,
        incidentType,
        setting,
        incidentTime,
        difficulty,
        tone: 'classic_detective',
        playTimeMinutes,
        status,
        suspects,
        evidence,
        timeline,
        generation: { provider: 'demo', model: 'fixed-sample', schemaVersion: '1.0' },
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await CaseSolutionModel.updateOne(
    { caseId: caseRecord._id },
    { $setOnInsert: { ...demoCaseSolution, caseId: caseRecord._id } },
    { upsert: true, setDefaultsOnInsert: true },
  );
}
