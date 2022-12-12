import { AptosClient, BCS, TxnBuilderTypes } from "aptos";

export const aptosClient = new AptosClient(
    "https://fullnode.testnet.aptoslabs.com/v1"
);
const COIN_MODULE = "0x1::coin";
const TRANSFER_METHOD = "transfer";
const APTOS_TOKEN = "0x1::aptos_coin::AptosCoin";

const fakeSender = "0x8284169a7564153e0d767176164db1466f5b2ba03abfd587702d44c7dda0a690";
const to = "0xe3785fa2ccd744e7799b271b624bb2557fbf5d466b72a1b11f3d3ebc0037434f";
const amount = 12345n;

export const fakeTransferPayload = new TxnBuilderTypes.TransactionPayloadEntryFunction(
    TxnBuilderTypes.EntryFunction.natural(
        COIN_MODULE,
        TRANSFER_METHOD,
        [
            new TxnBuilderTypes.TypeTagStruct(
                TxnBuilderTypes.StructTag.fromString(APTOS_TOKEN)
            ),
        ],
        [
            BCS.bcsToBytes(TxnBuilderTypes.AccountAddress.fromHex(to)),
            BCS.bcsSerializeUint64(amount),
        ]
    )
);

export const fakePayload = async (sender = fakeSender) => {
    return {
        payload: {
            type: "entry_function",
            function: `${COIN_MODULE}::${TRANSFER_METHOD}`,
            type_arguments: [APTOS_TOKEN],
            arguments: [to, amount],
        },
        option: {
            sender,
            gas_unit_price: 100n,
        }
    }
}

export const fakeTxn = async (sender = fakeSender) => {
    const { sequence_number } = await aptosClient.getAccount(sender);
    const chainId = await aptosClient.getChainId();
    return new TxnBuilderTypes.RawTransaction(
        TxnBuilderTypes.AccountAddress.fromHex(sender),
        BigInt(sequence_number),
        fakeTransferPayload,
        10000n,
        100n,
        BigInt(Math.floor(Date.now() / 1000) + 600),
        new TxnBuilderTypes.ChainId(chainId)
    );
};