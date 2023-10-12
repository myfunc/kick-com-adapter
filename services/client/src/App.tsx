import React from "react";
import { Toolbar } from "./Toolbar";
import { Messages } from "./Messages";

const App: React.FC = () => {
    const [messages, setMessages] = React.useState<string[]>([]);
    const [channelName, setChannelName] = React.useState<string>("");

    const handleNewMessage = (message: string) => {
        setMessages((prev) => [...prev, message]);
    };

    return (
        <div style={{ paddingBottom: "50px" }}>
            <Messages messages={messages} />
            <Toolbar
                channelName={channelName}
                onChannelNameChange={setChannelName}
                onNewMessage={handleNewMessage}
            />
        </div>
    );
};

export default App;
