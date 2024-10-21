import React from 'react';
import './App.css';
import {Header} from "./Components/Header";
import {Main} from "./Components/Main";
import {Footer} from "./Components/Footer";
import './customTheme.scss';
import {BoardProvider} from './Context/BoardContext';
import {StoreProvider} from "./Context/StoreContext";

function App() {

    return (
        <div className="App">
            <StoreProvider>
                <BoardProvider>
                    <Header/>
                    <Main/>
                    <Footer/>
                </BoardProvider>
            </StoreProvider>
        </div>
    );
}

export default App;
