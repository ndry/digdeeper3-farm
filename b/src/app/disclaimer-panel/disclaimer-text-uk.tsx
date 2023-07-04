import { StateProp } from "../../utils/reactish/state-prop";


export function DisclaimerTextUk({
    optOutSubmissionState: [optOutSubmission, setOptOutSubmission],
    optOutAnalyticsState: [optOutAnalytics, setOptOutAnalytics],
}: {
    optOutSubmissionState: StateProp<boolean>;
    optOutAnalyticsState: StateProp<boolean>;
}) {
    return <>
        <h3>
            # TODO
        </h3>
        <p>
            todo
        </p>
        <label>
            <input
                type="checkbox"
                checked={!optOutSubmission}
                onChange={e => setOptOutSubmission(!e.target.checked)}
            ></input>
            &nbsp;<b>Надсилати анонімні рішення</b>
            <br />
            (Це <b>необхідна</b> частина дослідження!)
        </label>
        <br />
        <h3># Аналітика</h3>
        <p>
            Гра збирає анонімну статистику взаємодії користувача
            за допомогою аналітики <a
                href="https://amplitude.com"
                target="_blank"
            >Amplitude</a>.
        </p>
        <label>
            <input
                type="checkbox"
                checked={!optOutAnalytics}
                onChange={e => setOptOutAnalytics(!e.target.checked)}
            ></input>
            &nbsp;<b>Надсилати анонімну аналітику</b>
            <br />
            (Це лише допомагає нам відстежувати та покращувати
            геймерський досвід)
        </label>
        <br />
        <br />
        <h3>
            # Попередження щодо втрати прогресу
        </h3>
        <p>
            Гра знаходиться у стадії <b>активної розробки</b>.
            У неї можна грати, але вона ще буде сильно змінюватися.
            Налаштування та прогрес зберігаються локально,
            не синхронізуються,
            і <b>можуть і будуть втрачені</b> у разі несумісних змін
            у майбутніх версіях. Це дозволяє нам швидше ітерувати.
        </p>
    </>;
}
