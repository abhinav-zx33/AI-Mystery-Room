import mongoose from 'mongoose';

const { Schema } = mongoose;

const evidenceChainSchema = new Schema({
  evidenceId: { type: String, required: true },
  deduction: { type: String, required: true },
  strength: { type: String, enum: ['decisive', 'supporting', 'context'], required: true },
}, { _id: false });

const suspectClearanceSchema = new Schema({
  suspectId: { type: String, required: true },
  explanation: { type: String, required: true },
}, { _id: false });

const timelineReconstructionSchema = new Schema({
  timestamp: { type: String, required: true },
  description: { type: String, required: true },
}, { _id: false });

const caseSolutionSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true, unique: true },
  culpritId: { type: String, required: true },
  explanation: { type: String, required: true },
  motive: { type: String, required: true },
  opportunity: { type: String, default: '' },
  method: { type: String, required: true },
  evidenceChain: { type: [evidenceChainSchema], required: true },
  suspectClearance: { type: [suspectClearanceSchema], default: [] },
  timelineReconstruction: { type: [timelineReconstructionSchema], default: [] },
  internalConsistencyNotes: { type: [String], default: [] },
}, { timestamps: true, collection: 'caseSolutions' });

export const CaseSolutionModel = mongoose.models.CaseSolution || mongoose.model('CaseSolution', caseSolutionSchema);
