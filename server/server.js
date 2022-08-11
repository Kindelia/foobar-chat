// TODO: optimize message stream / websocket
// TODO: index by hashtags, extend API

var express = require("express");
var app = express();
var cors = require("cors");
var fs_sync = require("fs");
var { promises: fs } = require("fs");
var lib = require("./lib.js");

// Utils
// -----

// Checks if a file exists
async function file_exists(path) {
  return new Promise((resolve, reject) => {
    fs_sync.exists(path, resolve);
  });
}

// Validations
// -----------

function valid_message(msg) {
  if (typeof msg !== "object") {
    return false;
  }
  if (typeof msg.user !== "string") {
    return false;
  }
  if (typeof msg.text !== "string" || msg.text.length > 512) {
    return false;
  }
  return true;
}

function valid_load_query(lq) {
  if (typeof lq !== "object") {
    return false;
  }
  if (typeof lq.from !== "string") {
    return false;
  }
  if (typeof lq.to !== "string") {
    return false;
  }
  if (isNaN(Number(lq.from))) {
    return false;
  }
  if (isNaN(Number(lq.to))) {
    return false;
  }
  return true;
}

// Message
// -------

// FIXME: benchmark, possible bottleneck
// FIXME: reason
function get_tags(text) {
  var regex = new RegExp("#+[a-zA-Z0-9(_)]{1,}", "g");
  var matched = text.matchAll(regex);
  var tags = [];
  for (var tag of matched) {
    tags.push(tag[0]);
  }
  return tags;
}
  
// Paths
// -----

function message_path(id) {
  return __dirname + "/database/message/" + lib.show_id(id);
}

function message_count_path() {
  return __dirname + "/database/message/count";
}

// API Functions
// -------------

async function get_message_count() {
  return JSON.parse(await fs.readFile(__dirname + "/database/message/count", "utf8"));
}

async function post_message(message) {
  var count = await get_message_count();
  await fs.writeFile(message_path(count), JSON.stringify(message));
  await fs.writeFile(message_count_path(), JSON.stringify(count + 1));
  return true;
}

// load_message : Number -> Promise (Option Message)
async function load_message(id) {
  let path = message_path(id);
  if (await file_exists(path)) {
    return JSON.parse(await fs.readFile(path, "utf8"));
  } else {
    return null;
  }
}

// HTTP API
// --------

app.use(express.json());
app.use(cors());

// Posts a message
app.post("/api/v0/post", async function(req, res) {
  var msg = req.body;

  // Validates message
  if (!valid_message(msg)) {
    res.send(JSON.stringify({$: "fail", err: "Invalid message."}));
    return;
  }

  // Posts message
  var posted = await post_message({
    user: msg.user,
    text: msg.text,
    time: Date.now(),
  });
  if (!posted) {
    res.send(JSON.stringify({$: "fail", err: "Couldn't post message."}));
    return;
  }

  // Returns successs
  res.send(JSON.stringify({$: "done", val: "Posted."}));
});

app.post("/api/v0/load", async function(req, res) {
  var lq = req.body;

  // Validates load query
  if (!valid_load_query(lq)) {
    res.send(JSON.stringify({$: "fail", err: "Message from/to must be a decimal strings."}));
    return;
  }

  // Loads message 
  var msgs = [];
  for (var id = lq.from; id < lq.to; ++id) {
    var msg = await load_message(Number(id));
    if (!msg) {
      res.send(JSON.stringify({$: "fail", err: "Couldn't load messages."}));
    } else {
      msgs.push(msg);
    }
  }

  res.send(JSON.stringify({$: "done", val: msgs}));
});

app.post("/api/v0/count", async function(req, res) {
  res.send(JSON.stringify({$: "done", val: Number(await get_message_count())}));
});

app.use(express.static("build"));

app.listen(1337, function() {
  console.log("Example app listening on port 1337!");
});
