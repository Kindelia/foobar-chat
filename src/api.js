export default function new_api(url = "http://127.0.0.1:1337/api/v0") {

  var options = body => ({
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    headers: {"Content-Type": "application/json"},
    redirect: "follow",
    referrerPolicy: "no-referrer",
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

  async function load(id) {
    return await request("load", {id: String(id)});
  }

  return {
    count,
    post,
    load,
  };
};
