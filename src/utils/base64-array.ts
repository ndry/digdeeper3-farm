

const byteToDigit = 
    [..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"]
        .map(c => c.charCodeAt(0));
const digitToByte = byteToDigit.reduce(
    (acc, byte, i) => (acc[byte] = i, acc),
    {} as Record<number, number>,
);

export const getValueAt = (
    valueBitSize: number,
    arrayBase64: string,
    index: number,
) => {
    if (!Number.isInteger(6 / valueBitSize)) {
        throw new Error("valueBitSize must be a divisor of 6");
    }
    const valueMask = (1 << valueBitSize) - 1;
    const bitIndex = index * valueBitSize;
    const byteIndex = Math.floor(bitIndex / 6);
    const bitInByteIndex = bitIndex % 6;
    const byte = digitToByte[arrayBase64.charCodeAt(byteIndex)];
    return (byte >> bitInByteIndex) & valueMask;
};

export const encode = (
    valueBitSize: number,
    array: number[],
) => {
    if (!Number.isInteger(6 / valueBitSize)) {
        throw new Error("valueBitSize must be a divisor of 6");
    }
    const arrayBase64 = new Uint8Array(
        Math.ceil(array.length * valueBitSize / 6));
    for (let i = 0; i < array.length; i++) {
        const byteIndex = Math.floor(i * valueBitSize / 6);
        const bitInByteOffset = (i * valueBitSize) % 6;
        arrayBase64[byteIndex] |= array[i] << bitInByteOffset;
    }
    for (let i = 0; i < arrayBase64.length; i++) {
        arrayBase64[i] = byteToDigit[arrayBase64[i]];
    }
    return String.fromCharCode(...arrayBase64);
};