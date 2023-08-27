import { jsx } from "@emotion/react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { IncomingSeedsView } from "./incoming-seeds-view";
import { ReactorDispatchView } from "./reactor-dispatch-view";
import { TrashView } from "./trash-view";
import { ReactorOutputView } from "./reactor-output-view";

export function MainView({
    ...props
}: jsx.JSX.IntrinsicElements["div"]) {
    return <div {...props}>
        <Tabs>
            <TabList>
                <Tab>Incoming Seeds</Tab>
                <Tab>Reactor Dispatch</Tab>
                <Tab>Trash</Tab>
                <Tab>Reactor Output</Tab>
            </TabList>
            <TabPanel>
                <IncomingSeedsView />
            </TabPanel>
            <TabPanel>
                <ReactorDispatchView />
            </TabPanel>
            <TabPanel>
                <TrashView />
            </TabPanel>
            <TabPanel>
                <ReactorOutputView />
            </TabPanel>
        </Tabs>
    </div>;
}
