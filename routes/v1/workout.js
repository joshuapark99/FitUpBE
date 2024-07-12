const express = require('express');

const workoutController = require('../../controllers/workoutController');

const authenticateToken  = require('../../middleware/authenticateToken');



const router = express.Router();

router.get('/:id', authenticateToken, workoutController.getOneWorkout);

router.delete('/:id', authenticateToken, workoutController.deleteWorkout);

router.get('/', authenticateToken, workoutController.getWorkouts)

router.post('/', authenticateToken, workoutController.createWorkout);


module.exports = router;
