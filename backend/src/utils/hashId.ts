import Hashids from "hashids";
const hashids = new Hashids("k8Jv#1t!Ru@e5ZxLq$9pFn3^DgY2Bw7h", 10);
const alphabet =
  "jnw2ihCHfcTFSIUtsuMV0KZl4x3yWqzdeoPXJ1prE8gRGvkOm7BabANDQ596YL";

const encodeId = (id: number): string => {
  return hashids.encode(id);
};

const decodeId = (hash: string): number | null => {
  const validRegex = new RegExp(`^[${alphabet}]+$`);

  if (!validRegex.test(hash)) return null;

  const decoded = hashids.decode(hash);
  return decoded.length > 0 ? (decoded[0] as number) : null;
};

const hashId = {
  encodeId,
  decodeId,
};

export default hashId;
