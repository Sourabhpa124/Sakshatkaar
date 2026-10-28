const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  candidateId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  questionPrompt: { 
    type: String, 
    required: true 
  },
  candidateResponse: { 
    type: String, 
    required: true 
  },
  aiEvaluation: {
    keywordDensity: { type: Number, required: true },
    logicalStructure: { type: Number, required: true },
    confidenceMarker: { type: Number, required: true },
    hireabilityIndex: { type: Number, required: true },
    feedback: { type: String, required: true }
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Session', SessionSchema);