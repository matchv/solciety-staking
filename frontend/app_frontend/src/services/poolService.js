export const getChain = () => ([
    { id: '1', title: 'Ethereum' },
    { id: '2', title: 'Avalanche' },
])

const datatableData1 = [
    ["SushiSwap a", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["SushiSwap b", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["SushiSwap c", 100, 1, 2, 3, 4, 0.1, 0.2],
];

const datatableData2 = [
    ["XSwap a", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["XSwap b", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["XSwap c", 100, 1, 2, 3, 4, 0.1, 0.2],
];

const datatableData3 = [
    ["MSwap a", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["MSwap b", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["MSwap c", 100, 1, 2, 3, 4, 0.1, 0.2],
];

const datatableData4 = [
    ["WSwap a", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["WSwap b", 100, 1, 2, 3, 4, 0.1, 0.2],
    ["WSwap c", 100, 1, 2, 3, 4, 0.1, 0.2],
];

export const getPools = (protocolId) => {
    if (protocolId == 'Ethereum/SushiSwap') {
        return datatableData1;
    } else if (protocolId == 'Ethereum/XSwap') {
        return datatableData2;
    } else if (protocolId == 'Avalanche/MSwap') {
        return datatableData3;
    }else if (protocolId == 'Avalanche/WSwap') {
        return datatableData4;
    }
}