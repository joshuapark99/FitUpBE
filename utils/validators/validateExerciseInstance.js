const mongoose = require('mongoose');
const exerciseInstanceSchema = require('../../models/Workout').schema.path('exercises').schema;

const validateExercise = async (exercise) => {
  try {
    const ExerciseInstance = mongoose.model('ExerciseInstance', exerciseInstanceSchema);
    const exerciseDoc = new ExerciseInstance(exercise);
    await exerciseDoc.validate();
    return null; // No errors
  } catch (error) {
    return error;
  }
};

module.exports = validateExercise;