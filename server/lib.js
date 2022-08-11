function pad(msg, chr, len, side) {
  while (msg.length < len) {
    if (side === "left") {
      msg = chr + msg;
    } else if (side === "right") {
      msg = msg + chr;
    }
  }
  return msg;
}

function show_id(id) {
  return pad(String(id), '0', 16, "left");
}

module.exports = {
  pad,
  show_id,
};
