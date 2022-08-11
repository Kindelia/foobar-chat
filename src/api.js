export default function new_api(url = "http://127.0.0.1:1337/api/v0") {

  var options = body => ({
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify(body)
  });

  async function request(func, args) {
    var resp = await fetch(url + "/" + func, options(args));
    var body = JSON.parse(await resp.text());
    switch (body.$) {
      case "done": return body.val;
      case "fail": throw body.err;
    };
    throw "Unknown request.";
  };

  async function count() {
    return await request("count", {});
  };

  async function post(user, text) {
    return await request("post", {user, text});
  }

  async function load(from, to) {
    return await request("load", {from: String(from), to: String(to)});
  }

  return {
    count,
    post,
    load,
  };
};
