const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

// this function will take the pk(id) of the url from db and convert it to b62 to generate shortcode
export function encodeBase62(num: bigint): string {
  let result = '';
  const base = BigInt(62);

  while (num > 0) {
    result = chars[Number(num % base)] + result;
    num /= base;
  }

  return result;
}
