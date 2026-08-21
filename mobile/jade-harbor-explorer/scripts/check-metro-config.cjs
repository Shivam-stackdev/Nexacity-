try {
  require("../metro.config.js");
  console.log("Metro configuration loaded successfully.");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
