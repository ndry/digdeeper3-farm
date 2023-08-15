import { useRef, useState } from "react";
import { RulePreview } from "../../app/rule-preview";
import { Rule } from "../../ca237v1/rule-io";


export function LinkCaPreview({ substance }: { substance: Rule }) {
    const [isHovered, setIsHovered] = useState(false);

    const refLink = useRef<HTMLAnchorElement | null>(null);
    const distanceToBottom = refLink.current?.getBoundingClientRect().bottom;
    const viewportHeight = window.innerHeight;
    const isTooLow =
        viewportHeight - (distanceToBottom ? distanceToBottom : 0) > 140;

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
                        background: "#00000044",
                        top: isTooLow ? "0px" : "auto",
                        bottom: !isTooLow ? "0px" : "auto",
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
