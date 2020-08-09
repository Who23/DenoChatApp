import { serve, Server } from "https://deno.land/std/http/server.ts";
import {
    acceptWebSocket,
    isWebSocketCloseEvent,
    WebSocket,
  } from "https://deno.land/std/ws/mod.ts";


const WEBPORT = 8080
const WSPORT = 8081

const users = new Map();
let uidcounter = 0;

class User {
    uid: number;
    name: string;
    sock: WebSocket;

    constructor(uid: number, name: string, sock: WebSocket) {
        this.uid = uid;
        this.name = name;
        this.sock = sock;
    }
}

enum MessageType {
    NameChange = "name_change",
    Message = "message"
}

class Message {
    type: MessageType;
    content: string;
    uid?: number

    constructor(type: MessageType, content: string) {
        this.type = type;
        this.content = content;
    }
}

async function serveHttp() {
    console.log(`website served on ${WEBPORT}`)
    for await (const req of serve(`:${WEBPORT}`)) {
        if (req.url === "/") {
            req.respond({ body: await Deno.open("./index.html")});

        } else if (req.url === "/script.js") {
            req.respond({ body: await Deno.open("./script.js")});

        } else {
            req.respond({status: 404});
        }
    }
}

async function serveWs() {
    console.log(`websocket server is running on :${WSPORT}`);
    for await (const req of serve(`:${WSPORT}`)) {
        const { conn, r: bufReader, w: bufWriter, headers } = req;
        acceptWebSocket({
            conn,
            bufReader,
            bufWriter,
            headers,
        })
        .then(handleWsConn)
        .catch(async (err: string) => {
            console.error(`failed to accept websocket: ${err}`);
            await req.respond({ status: 400 });
        });
    }
}

async function handleWsConn(sock: WebSocket) {
    const uid = uidcounter;
    uidcounter += 1;

    try {
        await broadcast(uid, new Message(MessageType.Message, `${uid} has joined!`));

        let user = new User(uid, '', sock);

        users.set(uid, user);

        for await (const ev of sock) {
            if (typeof ev === "string") {
                // text message
                const message: Message = JSON.parse(ev);

                if (message.type === "message") {
                    await broadcast(uid, message);
                    console.log(`${uid}: message ${message.content}`);

                } else if (message.type === "name_change") {
                    user.name = message.content;
                    console.log(`${uid}: name change to ${message.content}`);
                    await broadcast(uid, message);
                }

            } else if (isWebSocketCloseEvent(ev)) {
                // close
                const { code, reason } = ev;
                users.delete(uid);
                await broadcast(uid, new Message(MessageType.Message, `${uid} has left!`));
            }
        }
    } catch (err) {
        console.error(`error with websockets: ${err}`)

        users.delete(uid);
        await broadcast(uid, new Message(MessageType.Message, `${uid} has left!`));

        if (!sock.isClosed) {
            await sock.close(1000).catch(console.error);
        }          
    } 
}

async function broadcast(uid: number, message: Message) {
    message.uid = uid;

    for (const [dest_uid, user] of users) {
        if (dest_uid != uid) {
            await user.sock.send(JSON.stringify(message));
        }
    }
}


await Promise.all([serveHttp(), serveWs()]);