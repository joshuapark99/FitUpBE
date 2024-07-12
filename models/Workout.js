const mongoose = require("mongoose");
const ExerciseTemplate = require("./ExerciseTemplate");

const detailSchema = new mongoose.Schema({
  value: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    default: 0
  }
}, { _id: false })

const exerciseInstanceSchema = new mongoose.Schema({
  exercise: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExerciseTemplate",
    required: true,
    validate: {
      validator: async function (value) {
        const exists = await ExerciseTemplate.exists({ _id: value });
        console.log(exists);
        return exists;
      },
    },
  },
  type: {
    type: String,
    enum: ["reps", "times"],
    required: true,
  },
  details: [detailSchema],
}, { _id: false });

const workoutSchema = new mongoose.Schema({
  workoutName: { type: String, required: true },
  timeElapsed: { type: Number, required: true },
  timeStarted: { type: Date, required: true },
  dateCreated: { type: Date, default: Date.now},
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  exercises: [exerciseInstanceSchema],
});

module.exports = mongoose.model("Workout", workoutSchema);
