# Deno Chat
A simple chat app written with deno.js

## Installation & Execution
Requires `tsc` (typescript compiler) & `deno` (deno.js)

1. Clone the repo
2. Change the const `WSSERVER` in `script.ts` to "YOUR_LOCAL_IP:8081"
3. Run these commands
```
chmod +x run
./run
```
4. Go to SERVER_COMPUTER_LOCAL_IP:8080 to see the webpage


## Details
The backend is written with deno.js, which serves a webpage and a websocket server asynchronously.
The webpage is served on port 8080, with the frontend javascript.

The websocket server is used to communicate with each of the clients, using a Message class that is serialized into json. This is how the text messages and name updates are sent to each client.