import { Module } from "@nestjs/common";
import { MessageService } from "./message.service";
import { MessageController } from "./controller/message.controller";
import { KickService } from "src/integrations/kick/kick.service";

@Module({
    controllers: [MessageController],
    providers: [MessageService, KickService],
})
export class MessageModule {}
