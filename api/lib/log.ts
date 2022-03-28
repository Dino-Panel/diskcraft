import { mysqlQuery } from "./mysql";
function appendLog(
  eventType,
  eventData = null,
  affectedObjects,
  affectedObjectsNamesAtExecution,
  executedBy,
  executedByNameAtExecution,
  shown = true
) {
  return new Promise(async (res) => {
    // await mysqlQuery(`INSERT INTO log(event, eventData, affectedObjects, affectedObjectsNamesAtExecution, executedBy, executedByNameAtExecution, shown) VALUES (
    //     '${eventType}', '${JSON.stringify(
    //   eventData
    // )}', '${affectedObjects}', '${affectedObjectsNamesAtExecution}', '${executedBy}', '${executedByNameAtExecution}', '${booleanToInt(
    //   shown
    // )}'
    // )`);
    res(true);
  });
}
function booleanToInt(value) {
  if (value == true) return 1;
  if (value == false) return 0;
}

export { appendLog };
