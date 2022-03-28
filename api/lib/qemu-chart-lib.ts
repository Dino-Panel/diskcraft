const { exec } = require("child_process");

function createChart(uuid) {
  return new Promise((res) => {
    const ls = exec(
      "node ./lib/qemu-chart.js " + uuid,
      function (error, stdout, stderr) {
        res(stdout);
      }
    );
  });
}

export { createChart };
