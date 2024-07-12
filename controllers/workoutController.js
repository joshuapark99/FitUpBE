const Workout = require('../models/Workout')
const validateExercise = require('../utils/validators/validateExerciseInstance')

exports.createWorkout = async (req, res) => {
    try {
        const userId = req.user_id;
        const { workoutName, dateCreated, timeStarted, timeElapsed, exercises } = req.body

        // validate that each exercise in exercises is a valid exerciseInstanceSchema

        for (const exercise of exercises) {
            const validationError = await validateExercise(exercise);
            if (validationError) {
                return res.status(400).json({ error: validationError.message })
            }
        }

        const workout = new Workout({ workoutName, dateCreated, timeElapsed, timeStarted, author: userId, exercises });
        await workout.save();

        res.status(201).json(workout);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.getOneWorkout = async (req, res) => {
    try {
        const userId = req.user_id;
        const workoutId = req.params.id;

        const workout = await Workout.findById(workoutId);
        if(workout) {        
            validateUserOwnsWorkout(userId, workout);

            await workout.populate('exercises.exercise')

            return res.status(200).json(workout);
        } else {
            return res.status(400).json({ error: "Workout could not be found"})
        }

    } catch (err) {
        if(err.name === "ValidationError") {
            return res.status(403).json({error: err.message})
        }
        res.status(500).json({ error: err.message });
    }
}

exports.getWorkouts = async (req, res) => {
    try {
        const userId = req.user_id;

        const workouts = await Workout.find({author: userId}).populate('exercises.exercise')

        if(!workouts) {
            return res.status(400).json({ error: `Error finding workouts for user`})
        }
        else {
            return res.status(200).json(workouts)
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

exports.deleteWorkout = async (req, res) => {
    try {
        const userId = req.user_id;
        const workoutId = req.params.id;

        const workout = await Workout.findById(workoutId); 

        if(workout) {
            validateUserOwnsWorkout(userId, workout);

            const deletedWorkout = await Workout.findByIdAndDelete(workoutId)
            if(deletedWorkout) {
                return res.status(200).json({"message": "Workout successfully deleted"})
            }
            throw {"name":"deletionError", "message": "Something went wrong with deleting workout"}
        }
    } catch (err) {
        if(err.name) {
            res.status(400).json({ error: err.message })
        }
        res.status(500).json({ error: err.message });
    }
}

function validateUserOwnsWorkout(userId, workoutObject) {
    if(userId.toString() === workoutObject.author.toString()) return;
    throw { "name": "ValidationError", "message": "User did not create this workout" }
}