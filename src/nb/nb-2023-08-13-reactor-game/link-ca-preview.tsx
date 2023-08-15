import { useRef, useState } from "react";
import { RulePreview } from "../../app/rule-preview";
import { Rule } from "../../ca237v1/rule-io";


export function LinkCaPreview({ link, rule }: { link: string, rule: Rule }) {
    const [isHovered, setIsHovered] = useState(false);

    const refLink = useRef<HTMLAnchorElement | null>(null);
    const distanceToBottom = refLink.current?.getBoundingClientRect().bottom;
    const viewportHeight = window.innerHeight;
    const isTooLow =
        viewportHeight - (distanceToBottom ? distanceToBottom : 0) > 140;

    return <>
        <a
            ref={refLink}
            href={link}
            css={{ position: "relative" }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {rule}
            {isHovered
                && <div
                    css={{
                        position: "absolute",
                        width: "fit-content",
                        background: "#00000044",
                        top: isTooLow ? "0px" : "auto",
                        bottom: !isTooLow ? "0px" : "auto",
                        left: "101%",
                        backgroundColor: "#000000",
                        zIndex: 100,
                    }}>
                    <RulePreview code={rule} />
                </div>}
        </a>

    </>;
}
