const WSSERVER = "192.168.1.165:8081"

enum MessageType {
    NameChange = "name_change",
    Message = "message"
}

class Message {
    type: MessageType;
    content: string;
    uid?: number;

    constructor(type: MessageType, content: string) {
        this.type = type;
        this.content = content;
    }
}

let uid_name_map = new Map();

let socket = new WebSocket(`ws://${WSSERVER}`);

// add a message to the ul when gotten
socket.onmessage = function(event) {
    let parsed_message: Message = JSON.parse(event.data)

    if (parsed_message.type == MessageType.Message) {
        handle_text_message(parsed_message);
    } else if (parsed_message.type == MessageType.NameChange) {
        handle_name_change(parsed_message);
    }
};

function handle_text_message(text_message: Message) {
    let msgul = document.getElementById("messages");

    let name = document.createElement("span");
    name.className = `${text_message.uid} name`;
    name.innerHTML = `${text_message.uid}: `

    let message = document.createElement("span");
    message.innerHTML = text_message.content;

    let message_li = document.createElement("li");

    message_li.appendChild(name);
    message_li.appendChild(message);

    msgul.appendChild(message_li);
}

function handle_name_change(parsed_message: Message) {
    let elements = document.getElementsByClassName(`${parsed_message.uid}`);
    for (var i = 0; i < elements.length; i++) {
        elements[i].innerHTML = parsed_message.content + ": ";
    }
}


document.getElementById("update").addEventListener('click', () => {
    let new_name = document.getElementById("username").value;
    let msg = new Message(MessageType.NameChange, new_name);
    handle_name_change(msg);

    socket.send(JSON.stringify(msg));
});

document.getElementById("submit").addEventListener('click', () => {
    let text = document.getElementById("text").value;
    document.getElementById("text").value = "";

    let msg = new Message(MessageType.Message, text);
    handle_text_message(msg);

    socket.send(JSON.stringify(msg));
});

// make sure the socket close event is fired
var unloaded = false;
window.addEventListener("beforeunload", function(e)
{
    if (unloaded)
        return;
    unloaded = true;
    socket.close();
});

window.addEventListener("visibilitychange", function(e)
{
    if (document.visibilityState == 'hidden')
    {
        if (unloaded)
            return;
        unloaded = true;
        socket.close();
    }
});