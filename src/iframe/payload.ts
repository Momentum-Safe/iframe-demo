type Array<T> = T[];
type Base = string | number | Uint8Array | boolean;
type Arg<T> = T | Array<Base>;
type Args = Array<Arg<Base>>;

export type Payload = {
    function: string,
    type_arguments: string[],
    arguments: Args,
} | Uint8Array;
