const mongoose = require('mongoose');

const exerciseTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['Cardio', 'Olympic Weightlifting', 'Plyometrics', 'Powerlifting', 'Strength', 'Stretching', 'Strongman']
  },
  equipment: {
    type: String,
    enum: ['Bands', 'Barbell', 'Body Only', 'Cable', 'Dumbbell', 'E-Z Curl Bar', 'Exercise Ball', 'Foam Roll', 'Kettlebells', 'Machine', 'Medicine Ball', 'None', 'Other']
  }
});

module.exports = mongoose.model('ExerciseTemplate', exerciseTemplateSchema);