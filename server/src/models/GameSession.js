import mongoose from 'mongoose';

const { Schema } = mongoose;

const accusationSchema = new Schema({
  suspectId: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
  submittedAt: { type: Date, required: true },
}, { _id: false });

const gameSessionSchema = new Schema({
  caseId: { type: Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  sessionTokenHash: { type: String, required: true, unique: true, select: false },
  status: { type: String, enum: ['in_progress', 'resolved'], default: 'in_progress', required: true },
  viewedEvidenceIds: { type: [String], default: [] },
  hintsUsed: { type: Number, default: 0, min: 0 },
  accusation: { type: accusationSchema, default: undefined },
  expiresAt: { type: Date, default: undefined },
}, { timestamps: true, collection: 'gameSessions' });

gameSessionSchema.index({ caseId: 1, createdAt: -1 });
gameSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

export const GameSessionModel = mongoose.models.GameSession || mongoose.model('GameSession', gameSessionSchema);
