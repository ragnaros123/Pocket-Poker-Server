// Loads the configuration from config.env to process.env
require("dotenv").config({ path: "./config.env" });
const express = require("express");
const cors = require("cors");
// get MongoDB driver connection
const dbo = require("./db/conn");

const PORT = 3000;
const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(require("./routes/record"));
// Global error handling

// perform a database connection when the server starts
dbo.connectToServer(function (err) {
  if (err) {
    console.error(err);
    process.exit();
  }

  // start the Express server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running on port: ${PORT}`);
  });
});
