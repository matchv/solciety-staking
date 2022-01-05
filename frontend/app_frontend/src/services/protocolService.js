

const datatableData1 = [
    ["SushiSwap"],
    ["XSwap"],
];

const datatableData2 = [
    ["MSwap"],
    ["WSwap"],
];

export const getProtocols = (chainId) => {
    if (chainId == '1') {
        return datatableData1;
    } else if (chainId == '2') {
        return datatableData2;
    }
}