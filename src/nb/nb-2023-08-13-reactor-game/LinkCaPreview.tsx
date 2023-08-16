import { useEffect, useRef, useState } from "react";
import { RulePreview } from "../../app/rule-preview";
import { Rule } from "../../ca237v1/rule-io";


export function LinkCaPreview({ substance }: { substance: Rule }) {
    const [isHovered, setIsHovered] = useState(false);

    const refLink = useRef<HTMLAnchorElement | null>(null);
    const [isLow, setIsLow] = useState(false);

    useEffect(() => {

        const handleResize = () => {
            const elementHeight = 140;
            const windowHeight = window.innerHeight;
            const distanceToBottom =
                refLink.current?.getBoundingClientRect().bottom;
            setIsLow(windowHeight -
                (distanceToBottom ? distanceToBottom : 0) > elementHeight);
        };

        handleResize();

        window.addEventListener("resize", handleResize);
        window.addEventListener("scroll", handleResize);
        return () => {
            window.removeEventListener("resize", handleResize);
            window.removeEventListener("scroll", handleResize);
        };

    }, []);

    return <>
        <a
            ref={refLink}
            href={"./notes/?" + (() => {
                const s = new URLSearchParams();
                s.set("filter", JSON.stringify({ tags: substance }));
                return s.toString();

            })()}
            css={{ position: "relative" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >  {substance}
            {isHovered
                && <div
                    css={{
                        position: "absolute",
                        width: "fit-content",
                        top: isLow ? "0px" : "auto",
                        bottom: !isLow ? "0px" : "auto",
                        left: "100%",
                        backgroundColor: "#000000",
                        zIndex: 100,
                        paddingLeft: "0.5em",
                    }}>
                    <RulePreview code={substance} />
                </div>}
        </a>

    </>;
}
