import puppeteer from "puppeteer-extra";
import { Page } from "puppeteer-extra-plugin/dist/puppeteer";
import { Injectable } from "@nestjs/common";
import WebSocket from "ws";
import { ChannelData, ChatMessage } from "./dto";
import { Browser } from "puppeteer";

export type OnMessageHandler = (message: ChatMessage) => void;
export type WSConnection = {
    ws: WebSocket;
    handlers: Set<OnMessageHandler>;
};

@Injectable()
export class KickService {
    private readonly kickUrl = "https://kick.com";
    private readonly wsUrl =
        "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false";

    private _page: Page | null = null;
    private wsSubscribers: Map<string, WSConnection>;

    constructor() {
        this.wsSubscribers = new Map();
    }

    public async init() {
        if (this._page) return;

        let browser: Browser;
        if (process.env.RUN_IN_DOCKER) {
            browser = await puppeteer.launch({
                headless: true,
                executablePath: "/usr/bin/google-chrome-stable",
                args: ["--no-sandbox"], // Disable the Chrome sandbox
            });
        } else {
            browser = await puppeteer.launch();
        }

        this._page = await browser.newPage();
        await this._page.setViewport({ width: 1920, height: 1080 });
        await this._page.goto(this.kickUrl);
    }

    public async stop() {
        await this._page?.browser().close();
    }

    private async getPage() {
        await this.init();
        return this._page!;
    }

    public async getDataByMethod<T>(endpoint) {
        try {
            const page = await this.getPage();
            const responseData = await page.evaluate((endpoint) => {
                return fetch(endpoint).then(
                    (response) => response.json() as Promise<T>
                );
            }, endpoint);

            return responseData;
        } catch (e) {
            console.error(`Error on fetch data: ${e.message}, ${e.stack}`);
        }
    }

    public async getChannelInfo(channelName) {
        return this.getDataByMethod<ChannelData>(
            `/api/v1/channels/${channelName}`
        );
    }

    // https://kick.com/api/v1/channels/myfunc - chanel info. $.chatrooms.id - chatroom.[id].v2
    // wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false

    // ws messages updates
    // {"event":"pusher:subscribe","data":{"auth":"","channel":"chatrooms.[id].v2"}}

    // update:
    // {
    //     "event": "App\\Events\\ChatMessageEvent",
    //     "data": "{\"id\":\"5ad90b78-7283-444a-a91d-7105097a4250\",\"chatroom_id\":875062,\"content\":\"[emote:37226:KEKW]\",\"type\":\"message\",\"created_at\":\"2023-10-12T01:29:15+00:00\",\"sender\":{\"id\":1052763,\"username\":\"Edoardq\",\"slug\":\"edoardq\",\"identity\":{\"color\":\"#FBCFD8\",\"badges\":[]}}}",
    //     "channel": "chatrooms.875062.v2"
    // }

    private parseWsMessage(rawMessage) {
        let message = {} as any;
        if (Buffer.isBuffer(rawMessage)) {
            // Convert buffer to string
            const strMessage = rawMessage.toString("utf8");
            try {
                // Try parsing the string message to JSON
                message = JSON.parse(strMessage);
            } catch (err) {
                console.error("Failed to parse message:", strMessage);
                return;
            }
        } else if (typeof rawMessage === "string") {
            try {
                // Try parsing the string message to JSON
                message = JSON.parse(rawMessage);
            } catch (err) {
                console.error("Failed to parse message:", rawMessage);
                return;
            }
        } else {
            console.error("Unexpected message type:", rawMessage);
            return;
        }
        return message;
    }

    public async onMessage(chatroomId: number, handler: OnMessageHandler) {
        const channel = `chatrooms.${chatroomId}.v2`;
        let wsConnection = this.wsSubscribers.get(channel);

        if (!wsConnection) {
            wsConnection = {
                ws: new WebSocket(this.wsUrl),
                handlers: new Set([handler]),
            };

            this.wsSubscribers.set(channel, wsConnection);
        }

        wsConnection.ws.on("open", () => {
            wsConnection.ws.send(
                `{"event":"pusher:subscribe","data":{"auth":"","channel":"${channel}"}}`
            );
        });

        wsConnection.ws.on("message", (rawMessage) => {
            const message = this.parseWsMessage(rawMessage);
            if (
                message.event === "App\\Events\\ChatMessageEvent" &&
                message.channel === channel
            ) {
                handler(JSON.parse(message.data) as ChatMessage);
            }
        });
    }

    public async offMessages(chatroomId, handler) {
        const channel = `chatrooms.${chatroomId}.v2`;
        let wsConnection = this.wsSubscribers.get(channel);
        if (wsConnection) {
            wsConnection.handlers.delete(handler);
            if (!wsConnection.handlers.size) {
                try {
                    wsConnection.ws.close();
                } catch (e) {
                    console.warn(
                        "Cannot close WS connection. Message: " + e.message
                    );
                }
                this.wsSubscribers.delete(channel);
            }
        }
    }
}
