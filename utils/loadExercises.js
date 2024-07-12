const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const ExerciseTemplate = require("../models/ExerciseTemplate");

const csvFilePath = path.join(__dirname, "../public/megaGymDataset.csv");

const loadExercises = async (options) => {
  try {
    if (options?.load) await ExerciseTemplate.deleteMany({});
  } catch (err) {
    throw { source: "deleteExercises", err: err };
  }

  const promises = [];
  let count = 0;

  // Create a Promise to handle the stream
  const processCSV = new Promise((resolve, reject) => {
    if (!options?.load) {
      resolve();
      return;
    }
    fs.createReadStream(csvFilePath)
      .pipe(csv())
      .on("data", (row) => {
        // Wrap the entire row processing in a try-catch block
        try {
          const exercise = {
            Name: row.Title.toString(),
            Desc: row.Desc.toString(),
            Category: row.Type.toString(),
            BodyPart: row.BodyPart.toString(),
            Equipment: row.Equipment.toString(),
          };

          // Create a promise for each row processing and save operation
          const saveExercise = async () => {
            try {
              const dbExercise = new ExerciseTemplate({
                name: exercise.Name,
                description: exercise.Desc,
                category: exercise.Category,
                bodyPart: exercise.BodyPart,
                equipment: exercise.Equipment,
              });

              await dbExercise.save();
              count += 1;
            } catch (err) {
              if (err.code === 11000) {
                console.warn(
                  `Duplicate entry for exercise: ${exercise.Name}. Skipping...`
                );
              } else {
                console.warn(
                  `Error saving exercise ${exercise?.Name} to database: ${err}`
                );
              }
            }
          };

          promises.push(saveExercise());
        } catch (err) {
          console.error("Error processing row:", err);
        }
      })
      .on("end", async () => {
        try {
          await Promise.all(promises);
          resolve();
        } catch (err) {
          reject(err); // If there's an error in Promise.all, reject the processCSV promise
        }
      })
      .on("error", (err) => {
        reject({ source: "csv", Error: err }); // If there's an error reading the CSV, reject the processCSV promise
      });
  });

  try {
    await processCSV; // Wait for the processCSV promise to resolve
    console.log(`${count} exercises loaded`);
  } catch (err) {
    console.error("Error processing CSV:", err);
  }
};

module.exports = loadExercises;
