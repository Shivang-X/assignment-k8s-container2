const express = require("express");
const path = require("path");
const csvParser = require("csv-parser");
const fs = require("fs");
const dotenv = require("dotenv");

const app = express();

app.use(express.json());
dotenv.config();

const PORT = Number(process.env.PORT) || 2000;
const FILE_DIRECTORY = process.env.FILE_DIRECTORY || "../";

console.log("test")
console.log("test")

app.post("/parser", async (req, res) => {
  const { file, product } = req.body;
  const results = [];

  const validateCSV = (filePath) => {
    const expectedColumns = ["product", "amount"];
    return new Promise((resolve, reject) => {
      let valid = true;
      fs.createReadStream(filePath)
        .pipe(csvParser())
        .on("data", (row) => {
          if (!valid) return;
          const rowKeys = Object.keys(row);
          const rowVals = Object.values(row);
          console.log("row", {row})
          console.log("row"+rowKeys)
          console.log("row"+rowVals)
          console.log("row"+row["amount"])

          if (
            row["product"].toString().indexOf(" ") >= 0 ||
            row["amount"].toString().indexOf(" ") >= 0
          ) {
            valid = false;
          }
          if (
            rowKeys.length !== expectedColumns.length ||
            rowKeys.some((key) => !expectedColumns.includes(key))
          ) {
            valid = false;
          }
          results.push(row);
        })
        .on("end", () => resolve(valid))
        .on("error", (err) => reject(err));
    });
  };

  const filePath = path.join(FILE_DIRECTORY, file);
  const fileExtension = path.extname(file);

  try {
    const isValid = await validateCSV(filePath);
    const total = results.reduce((sum, row) => {
      if (row.product === product) {
        return sum + Number(row.amount);
      }
      return sum;
    }, 0);
    if (fileExtension === ".yml" && total == 0) {
      console.log("The file is not a CSV.");
      return res.send({
        file,
        error: "Input file not in CSV format.",
      });
    }
    if (isValid) {
      console.log("The file is a valid CSV.");
      res.status(200).send({ file, sum: total });
    } else {
      console.log("The file is not a valid CSV.");
      res.send({ file, error: "Input file not in CSV format." });
    }
  } catch (err) {
    console.error("Error checking CSV format:", err);
    res.status(500).send({ error: "Error checking CSV format." });
  }
});

app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}...!`);
});
