import "./App.css";
import new_api from "./api.js";
import logo from "./logo.svg";
import { useState, useEffect } from "react";

// TODO: get env var
var api = new_api("http://kindelia.org:1337/api/v0");

function App() {

  var [messages, setMessages] = useState({value: []});
  var [tags, setTags] = useState({value: []});
  var [name, setName] = useState({value: "anon"});

  // Message loader
  // - gets the last N messages that satisfy the selected filter
  // - currently the API doesn't support tag queries, so we just get it all
  useEffect(() => {
    async function load_new_messages() {
      // FIXME: https://stackoverflow.com/questions/54676966/push-method-in-react-hooks-usestate
      //        /\ claims the best way to push to an array is by cloning it fully
      var old_message_count = messages.value.length;
      var new_message_count = await api.count();
      var message_loaders = [];
      for (var id = old_message_count; id < new_message_count; ++id) {
        message_loaders.push(api.load(id));
      }
      var new_messages = await Promise.all(message_loaders);
      for (var new_message of new_messages) {
        messages.value.push(new_message);
      }
      console.log("added " + new_messages.length + " messages");
      setMessages({value: messages.value});
    }

    var cruel_pooler = setInterval(async () => {
      await load_new_messages();
    }, 100);

    return () => clearInterval(cruel_pooler);
  });

  // Tags Menu
  // ---------

  function TagsMenu() {
    var tags_style = {
      "width": "100%",
      "height": "36px",
      "padding": "5px",
      "display": "flex",
      "flexFlow": "row nowrap",
      "alignItems": "center",
      "borderBottom": "1px solid #909090",
      "backgroundColor": "#E0E0E0",
    };

    var title_style = {
      "color": "#404040",
      "width": "110px",
      "fontWeight": "bold",
      "paddingTop": "2px",
      "cursor": "pointer",

    };

    var tags_input_style = {
      "height": "28px",
      "width": "calc(100% - 110px - 12px)",
      "margin": "0px 6px",
      "outline": "none",
      "border": "1px solid #B0B0B0",
      "backgroundColor": "#F8F8F8",
      "color": "#606060",
      "fontSize": "16px",
      "padding": "4px",
    };

    function tags_input_onchange() {
      var tags_input = document.getElementById("tags_input");
      var new_tags = tags_input.value.split(" ").filter(x => x.length > 0);
      setTags({value: new_tags});
    }

    function title_onclick() {
      setName({value: prompt("Your name?")});
    }

    return <div id="tags" style={tags_style}>
      <span style={title_style} onClick={() => title_onclick()}>FOOBAR-CHAT</span>
      <input
        id="tags_input"
        style={tags_input_style}
        autoComplete="off"
        onChange={tags_input_onchange}>
      </input>
    </div>;
  }

  // Messages
  // --------

  function Message(message) {
    function format_time(time) {
      return new Date(time).toISOString().substring(0,19).replace("T", " ");
    }

    var message_style = {
      "padding": "3px 0px",
      "borderTop": "1px solid #E0E0E0",
    };

    var user_style = {
      "fontWeight": "bold",
      "display": "flex",
      "flexFlow": "row nowrap",
      "justifyContent": "space-between",
      "color": "#202020",
    };

    var text_style = {
      "color": "#404040",
    };

    return <div key={String(message.time)} style={message_style}>
      <div style={user_style}>
        <div>{message.user}</div>
        <div>{format_time(message.time)}</div>
      </div>
      <div style={text_style}>
        {message.text}
      </div>
    </div>;
  }

  // Main Chat
  // ---------

  function MainChat() {
    var chat_style = {
      "width": "100%",
      "height": "calc(100% - 72px)",
      "padding": "5px",
      "overflowY": "scroll",
      "display": "flex",
      "flexDirection": "column-reverse",
    };

    var message_elems = [];
    for (var message of messages.value) {
      var show = true;
      for (var tag of tags.value) {
        show = show && (message.text.split(" ").indexOf(tag) !== -1);
      }
      if (show) {
        message_elems.push(Message(message));
      }
    }
    message_elems.reverse();

    return <div id="chat" style={chat_style}>
      {message_elems}
    </div>;
  };

  // Post Message
  // ------------

  // FIXME: make a controlled input?
  async function send_post() {
    var post_input = document.getElementById("post_input");
    var post_text = post_input.value;
    if (post_text.length > 0) {
      post_input.value = ""; // FIXME: is this right?
      post_input.focus();
      await api.post(name.value, post_text);
    }
  }

  function Post() {
    var post_style = {
      "display": "flex",
      "flexFlow": "row nowrap",
      "alignItems": "center",
      "justifyContent": "space-between",
      "width": "100%",
      "height": "36px",
      "padding": "5px",
      "borderTop": "1px solid #909090",
      "backgroundColor": "#E0E0E0",
    };

    var post_input_style = {
      "width": "calc(100% - 80px - 10px)",
      "height": "28px",
      "padding": "4px",
      "outline": "none",
    };

    var post_button_style = {
      "width": "80px",
      "height": "28px",
      "cursor": "pointer",
      "color": "#404040",
      "fontSize": "18px",
    };

    function post_input_onkeypress(e) {
      if (e.charCode === 13) { // enter / return
        send_post();
      }
    }

    return <div id="post" style={post_style}>
      <input id="post_input" style={post_input_style} onKeyPress={(e) => post_input_onkeypress(e)} autoComplete="off"></input>
      <button id="post_button" style={post_button_style} onClick={() => send_post()}>
        send
      </button>
    </div>;
  }

  return (
    <div style={{"height": "100%"}}>
      {TagsMenu()}
      {MainChat()}
      {Post()}
    </div>
  );
}

export default App;
