import mongoose from 'mongoose';

const RsvpSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name.'],
    maxlength: [60, 'Name cannot be more than 60 characters'],
  },
  attending: {
    type: String,
    enum: ['yes', 'no'],
    required: [true, 'Please specify if you are attending.'],
  },
  guestsCount: {
    type: String,
    default: '1',
  },
  genderGuess: {
    type: String,
    enum: ['Boy', 'Girl', 'Surprise', ''],
    default: '',
  },
  excitedFor: {
    type: String,
    default: '',
  },
  message: {
    type: String,
    maxlength: [500, 'Message cannot exceed 500 characters'],
    default: '',
  },
  imageUrl: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.Rsvp || mongoose.model('Rsvp', RsvpSchema);
