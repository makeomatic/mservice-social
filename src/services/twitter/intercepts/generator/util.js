
function getRandomInt() {
  return Math.ceil(Math.random() * 1_000_000)
}

function getDateString() {
  const date = new Date();

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const dayOfWeek = daysOfWeek[date.getUTCDay()];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const seconds = date.getUTCSeconds();
  const year = date.getUTCFullYear();

  return `${dayOfWeek} ${month} ${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} +0000 ${year}`;
}

module.exports = {
  getRandomInt,
  getDateString
}
