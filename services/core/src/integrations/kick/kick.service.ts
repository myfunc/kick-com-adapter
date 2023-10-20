import puppeteer from "puppeteer-extra";
import { Page } from "puppeteer-extra-plugin/dist/puppeteer";
import { Injectable, OnModuleInit } from "@nestjs/common";
import WebSocket from "ws";
import { ChannelData, ChatMessage } from "./dto";
import { Browser } from "puppeteer";
import { Wait } from "src/util/utils";

export type OnMessageHandler = (message: ChatMessage) => void;
export type WSConnection = {
    ws: WebSocket;
    handlers: Set<OnMessageHandler>;
};

@Injectable()
export class KickService implements OnModuleInit {
    private readonly kickUrl = "https://kick.com";
    private readonly wsUrl =
        "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false";

    private _page: Page | null = null;
    private wsSubscribers: Map<string, WSConnection>;
    private kickProvider: any;

    constructor() {
        this.wsSubscribers = new Map();
    }
    async onModuleInit() {
        await this.init();
        await this.login();
    }

    public async init() {
        if (this._page) return;

        const browser = await puppeteer.launch({
            headless: true,
            executablePath: "/usr/bin/google-chrome-stable",
            args: ["--no-sandbox"],
        });

        this._page = await browser.newPage();
        await this._page.setRequestInterception(true);
        this._page.on("request", (request) => {
            request.continue();
        });
        this._page.on("response", async (response) => {
            if (response.url() === "https://kick.com/kick-token-provider") {
                console.log("CATCHED kick-token-provider");
                this.kickProvider = await response.json();
            }
        });
        await this._page.setViewport({ width: 1920, height: 1080 });
        await this._page.goto(this.kickUrl);
    }

    private async callGet(url: string) {
        return await this._page.evaluate(async (url) => {
            const response = await fetch(url);
            return response.json();
        }, url);
    }

    private async login() {
        await this.callGet("https://kick.com/kick-token-provider");

        const socketId = await this._page.evaluate(() => {
            try {
                return (window as any).document.doctype.nextSibling.children[0]
                    .nextElementSibling.children[0]._vnode.component.appContext
                    .app.config.globalProperties.$echo.connector.pusher
                    .connection.socket_id;
            } catch (e) {
                return null;
            }
        });

        let cookies = await this._page.cookies();
        let xsrfToken = cookies.find(
            (cookie) => cookie.name === "XSRF-TOKEN"
        ).value;

        await Wait(2);
        const encryptedValidFrom = this.kickProvider.encryptedValidFrom;
        const nameFieldName = this.kickProvider.nameFieldName;

        const loginArgs = {
            headers: {
                socketId,
                xsrfToken: xsrfToken.replace("%3D", "="),
            },
            data: {
                email: "robinbot",
                [nameFieldName]: "",
                _kick_token_valid_from: encryptedValidFrom,
                password: "Rb123456-",
            },
        };

        const loginResCode = await this._page.evaluate(async (args) => {
            const response = await fetch("https://kick.com/login", {
                method: "POST",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                    // "X-Socket-ID": args.headers.socketId,
                    Authorization: `Bearer ${args.headers.xsrfToken}`,
                    "accept-language": "en-US",
                    "X-XSRF-TOKEN": args.headers.xsrfToken,
                },
                body: JSON.stringify(args.data),
            });
            return response.status;
        }, loginArgs);

        console.log("Login status: " + loginResCode);

        await Wait(2);

        cookies = await this._page.cookies();
        xsrfToken = cookies.find(
            (cookie) => cookie.name === "XSRF-TOKEN"
        ).value;

        const verifyArgs = {
            headers: {
                xsrfToken: xsrfToken.replace("%3D", "="),
            },
            data: {
                code: "905014",
            },
        };

        const codeResCode = await this._page.evaluate(async (args) => {
            const response = await fetch(
                "https://kick.com/api/v1/signup/verify/login-code",
                {
                    method: "POST",
                    headers: {
                        Accept: "application/json, text/plain, */*",
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${args.headers.xsrfToken}`,
                        "accept-language": "en-US",
                        "X-XSRF-TOKEN": args.headers.xsrfToken,
                    },
                    body: JSON.stringify(args.data),
                }
            );
            return response.status;
        }, verifyArgs);

        console.log("Email code status: " + codeResCode);
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

    private parseWsMessage(rawMessage) {
        let message = {} as any;
        if (Buffer.isBuffer(rawMessage)) {
            const strMessage = rawMessage.toString("utf8");
            try {
                message = JSON.parse(strMessage);
            } catch (err) {
                console.error("Failed to parse message:", strMessage);
                return;
            }
        } else if (typeof rawMessage === "string") {
            try {
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

    public async sendMessage(chatroomId: string, message: string) {
        const cookies = await this._page.cookies();
        const xsrfToken = cookies.find(
            (cookie) => cookie.name === "XSRF-TOKEN"
        ).value;

        const endpoint = `https://kick.com/api/v2/messages/send/${chatroomId}`;
        const requestArgs = {
            url: endpoint,
            headers: {
                xsrfToken: xsrfToken.replace("%3D", "="),
            },
            data: {
                content: message,
                type: "message",
            },
        };
        await this._page.evaluate(async (args) => {
            await fetch(args.url, {
                method: "POST",
                headers: {
                    Accept: "application/json, text/plain, */*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${args.headers.xsrfToken}`,
                    "accept-language": "en-US",
                    "X-XSRF-TOKEN": args.headers.xsrfToken,
                },
                body: JSON.stringify(args.data),
            });
        }, requestArgs);
    }

    public async onMessage(chatroomId: string, handler: OnMessageHandler) {
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
                const chatMessage = JSON.parse(message.data) as ChatMessage;
                if (chatMessage.content.startsWith("!say")) {
                    const botAnswer = chatMessage.content.replace(
                        "!say",
                        "That wat you sad: "
                    );
                    this.sendMessage(chatroomId, botAnswer);
                }
                handler(JSON.parse(message.data) as ChatMessage);
            }
        });
    }

    public async offMessages(chatroomId, handler) {
        const channel = `chatrooms.${chatroomId}.v2`;
        const wsConnection = this.wsSubscribers.get(channel);
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
