import { useEffect, useState } from "react";
import usePromise from "react-use-promise";


export async function fetchDateseed(datetime: Date | string) {
    const _dt = typeof datetime === "string"
        ? datetime
        : datetime.toISOString();
    const url = `https://dd3.x-pl.art/dateseed/${_dt}`;
    const response = await fetch(url);
    const dateseed = await response.text();
    return dateseed;
}

export const fetchDailyDateseed = () =>
    fetchDateseed(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

export const fetchMonthlyDateseed = () =>
    fetchDateseed(new Date().toISOString().slice(0, 7) + "-01T00:00:00.000Z");

export const useDailyDateseed = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const dayDatetime =
        new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
    useEffect(() => {
        // to avoid dealing with time calculations,
        // just run a simple date check every minute
        const h = setInterval(
            () => {
                const dayDatetime1 =
                    new Date().toISOString().split("T")[0] + "T00:00:00.000Z";
                if (dayDatetime1 === dayDatetime) { return; }
                setRefreshTrigger(refreshTrigger + 1);
            },
            1 * 60 * 1000);
        return () => clearTimeout(h);
    }, []);
    return usePromise(
        () => fetchDateseed(dayDatetime),
        [dayDatetime]);
};

export const useMonthlyDateseed = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const weekDatetime =
        new Date().toISOString().slice(0, 7) + "-01T00:00:00.000Z";
    useEffect(() => {
        // to avoid dealing with time calculations,
        // just run a simple date check every minute
        const h = setInterval(
            () => {
                const dayDatetime1 =
                    new Date().toISOString().slice(0, 7) + "-01T00:00:00.000Z";
                if (dayDatetime1 === weekDatetime) { return; }
                setRefreshTrigger(refreshTrigger + 1);
            },
            1 * 60 * 1000);
        return () => clearTimeout(h);
    }, []);
    return usePromise(
        () => fetchDateseed(weekDatetime),
        [weekDatetime]);
};