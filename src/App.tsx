import React, { useEffect, useRef } from "react";
import PixiApp from "./modules/main/PixiApp";
import "./App.scss";

function App() {
    const appRef = useRef<HTMLDivElement>(null);
    const view: React.MutableRefObject<PixiApp | null> = useRef<PixiApp>(null);

    useEffect(() => {
        if (appRef.current && !view.current) {
            view.current = new PixiApp(appRef.current);
        }
    });

    return <div className="App" ref={appRef} />;
}

export default App;
