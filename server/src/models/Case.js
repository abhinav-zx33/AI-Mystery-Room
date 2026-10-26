import mongoose from 'mongoose';

const { Schema } = mongoose;

const caseSchema = new Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  premise: { type: String, required: true },
  summary: { type: String, required: true },
  incidentType: { type: String, required: true },
  setting: { type: String, required: true },
  incidentTime: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  tone: { type: String, enum: ['classic_detective', 'suspense', 'lighthearted', 'noir'], required: true },
  playTimeMinutes: { type: Number, enum: [5, 10, 15, 20], required: true },
  status: { type: String, enum: ['ready', 'archived'], default: 'ready', required: true },
  suspects: { type: [Schema.Types.Mixed], required: true },
  evidence: { type: [Schema.Types.Mixed], required: true },
  timeline: { type: [Schema.Types.Mixed], required: true },
  generation: {
    provider: { type: String, enum: ['demo', 'gemini'], required: true },
    model: { type: String, default: '' },
    schemaVersion: { type: String, default: '1.0' },
    createdAt: { type: Date, default: Date.now },
  },
}, { timestamps: true, collection: 'cases' });

caseSchema.index({ status: 1, createdAt: -1 });

export const CaseModel = mongoose.models.Case || mongoose.model('Case', caseSchema);
