require("dotenv").config();

const uri = process.env.TEST_MONGO_URI;
if (!uri) {
  console.error("Set TEST_MONGO_URI in backend/.env before starting the test server.");
  process.exit(1);
}

let databaseName;
try {
  databaseName = decodeURIComponent(new URL(uri).pathname.replace(/^\//, "").split("/")[0]);
} catch {
  console.error("TEST_MONGO_URI is not a valid MongoDB connection string.");
  process.exit(1);
}
if (!databaseName || !databaseName.toLowerCase().includes("test")) {
  console.error("Safety check: TEST_MONGO_URI database name must include 'test' (for example, localhelp_test).");
  process.exit(1);
}

process.env.MONGO_URI = uri;
console.log(`Starting LocalHelp against separate test database: ${databaseName}`);
require("../server");
