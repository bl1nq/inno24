import React, {createContext, useContext, useEffect} from "react";

export type SettingsContextType = {
    numPointsESCSpeed: number;
    numPointsStepperAngularSpeed: number;
    numPointsDistance: number;
    numPointsDistanceStdDev: number;
    pauseGraphUpdates: boolean;

    setPauseGraphUpdates: (pauseGraphUpdates: boolean) => void;
    setNumPointsESCSpeed: (numPointsESCSpeed: number) => void;
    setNumPointsStepperAngularSpeed: (numPointsStepperAngularSpeed: number) => void;
    setNumPointsDistanceStdDev: (numPointsDistanceStdDev: number) => void;
    setNumPointsDistance: (numPointsDistance: number) => void;
}

const SettingsContext = createContext<SettingsContextType>({
    numPointsESCSpeed: 100,
    numPointsStepperAngularSpeed: 100,
    numPointsDistance: 100,
    numPointsDistanceStdDev: 100,
    pauseGraphUpdates: false,
    setNumPointsDistance: () => {},
    setNumPointsDistanceStdDev: () => {},
    setPauseGraphUpdates: () => {},
    setNumPointsESCSpeed: () => {},
    setNumPointsStepperAngularSpeed: () => {},
});

const useSettings = () => useContext(SettingsContext);

function SettingsProvider({children}: { children: React.ReactNode }) {
    let [numPointsESCSpeed, setNumPointsESCSpeed] = React.useState(200);
    let [numPointsStepperAngularSpeed, setNumPointsStepperAngularSpeed] = React.useState(400);
    let [numPointsDistance, setNumPointsDistance] = React.useState(200);
    let [numPointsDistanceStdDev, setNumPointsDistanceStdDev] = React.useState(200);
    let [pauseGraphUpdates, setPauseGraphUpdates] = React.useState(false);

    return (
        <SettingsContext.Provider value={{
            numPointsESCSpeed: numPointsESCSpeed,
            numPointsStepperAngularSpeed: numPointsStepperAngularSpeed,
            numPointsDistance: numPointsDistance,
            numPointsDistanceStdDev: numPointsDistanceStdDev,
            pauseGraphUpdates: pauseGraphUpdates,
            setNumPointsDistance,
            setNumPointsESCSpeed,
            setNumPointsDistanceStdDev,
            setNumPointsStepperAngularSpeed,
            setPauseGraphUpdates
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export {useSettings, SettingsProvider, SettingsContext};
