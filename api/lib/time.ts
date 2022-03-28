function getTime(date) {
  var d = new Date();
  if (date) d = date;
  var utc = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate(),
    d.getUTCHours(),
    d.getUTCMinutes(),
    d.getUTCSeconds()
  );

  return new Date(utc);
}

function parseSql(d) {
  return (
    d.getUTCFullYear() +
    "-" +
    twoDigits(1 + d.getUTCMonth()) +
    "-" +
    twoDigits(d.getUTCDate()) +
    " " +
    twoDigits(d.getUTCHours()) +
    ":" +
    twoDigits(d.getUTCMinutes()) +
    ":" +
    twoDigits(d.getUTCSeconds())
  );
}

let addHours = function (d, h) {
  d.setTime(d.getTime() + h * 60 * 60 * 1000);
  return d;
};

export { getTime, parseSql, addHours };

function twoDigits(d) {
  if (0 <= d && d < 10) return "0" + d.toString();
  if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
  return d.toString();
}
