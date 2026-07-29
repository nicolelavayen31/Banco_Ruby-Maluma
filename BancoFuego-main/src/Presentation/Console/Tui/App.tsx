import React from "react";

import {
    TuiLayout
} from "./Components/TuiLayout";

import {
    useTuiController
} from "./Controllers/useTuiController";

import {
    TuiRouter
} from "./TuiRouter";

export const App: React.FC = () => {
    const tui =
        useTuiController();

    return (
        <TuiLayout>
            <TuiRouter tui={tui} />
        </TuiLayout>
    );
};