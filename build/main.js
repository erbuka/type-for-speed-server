"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = require("./server");
let SERVER_PORT = parseInt(process.env.PORT) || 5000;
let SERVER_AUTH = process.env.TOS_SERVER_AUTH || "Basic YWRtaW46YWRtaW4="; // admin:admin;
new server_1.TOSServer(SERVER_PORT, SERVER_AUTH).start();
