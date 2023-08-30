import { Rule } from "../../../ca237v1/rule-io";


export const keyify = (rule: Rule, reagent0: Rule, reagent1: Rule) =>
    `rs238v1_${rule}_${reagent0}_${reagent1}` as const;

export type ReactionSeed = ReturnType<typeof keyify>;

export const getRule = (rs: ReactionSeed) =>
    rs.split("_")[1] + "_" + rs.split("_")[2] as Rule;
export const getReagent0 = (rs: ReactionSeed) =>
    rs.split("_")[3] + "_" + rs.split("_")[4] as Rule;
export const getReagent1 = (rs: ReactionSeed) =>
    rs.split("_")[5] + "_" + rs.split("_")[6] as Rule;

export const destruct = (rs: ReactionSeed) => {
    const s = rs.split("_");
    return {
        rule: s[1] + "_" + s[2] as Rule,
        reagent0: s[3] + "_" + s[4] as Rule,
        reagent1: s[5] + "_" + s[6] as Rule,
    };
};
