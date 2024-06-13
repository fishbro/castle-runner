import React, { useEffect, useRef, useState } from "react";
import PixiApp from "./modules/main/PixiApp";
import "./App.scss";

function App() {
    const appRef = useRef<HTMLDivElement>(null);
    const view: React.MutableRefObject<PixiApp | null> = useRef<PixiApp>(null);
    const [isGameStarted, setIsGameStarted] = useState(false);

    useEffect(() => {
        if (appRef.current && !view.current) {
            view.current = new PixiApp(appRef.current);
        }
    });

    const startGame = () => {
        view.current?.start();
        setIsGameStarted(true);
    };

    return (
        <div className="App">
            <div className="game-view" ref={appRef}></div>
            {!isGameStarted ? (
                <div className="ui-overlay">
                    <button onClick={startGame}>Start Game</button>
                </div>
            ) : null}
        </div>
    );
}

export default App;
