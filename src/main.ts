import { TOSServer } from "./server";

let SERVER_PORT = parseInt(process.env.PORT) || 5000;
let SERVER_AUTH = process.env.TOS_SERVER_AUTH || "Basic YWRtaW46YWRtaW4=" // admin:admin;

new TOSServer(SERVER_PORT, SERVER_AUTH).start();
