// soopPacket.js
function buildPacketArray(arr) {
  return arr.map((i) => `\f${i}`).concat('\f');
}

function makeBytes(arr) {
  return Buffer.from(arr.join(''), 'utf8');
}

function makeHeader(svc, bodyLength) {
  return [
    '\x1b',             // 0x1b ESC
    '\t',               // Tab character
    String(svc).padStart(4, '0'),
    String(bodyLength).padStart(6, '0'),
    '00',               // return code (00 for normal)
  ];
}

function createPacket(svc, data) {
  const body = makeBytes(buildPacketArray(data));
  const header = makeBytes(makeHeader(svc, body.length));
  return Buffer.concat([header, body]);
}

module.exports = {
  createPacket,
};
