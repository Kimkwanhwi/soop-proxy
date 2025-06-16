function buildPacket(svc, data) {
  const body = data.map(str => "\f" + str).join("") + "\f";
  const bodyBuffer = Buffer.from(body, "utf8");

  const header = Buffer.alloc(14);
  header.write("\u001b", 0);         // Start marker
  header.write("\t", 1);             // Tab separator
  header.write(svc.toString().padStart(4, "0"), 2);  // SVC code
  header.write(bodyBuffer.length.toString().padStart(6, "0"), 6); // Body length
  header.write("00", 12);           // Reserved

  return Buffer.concat([header, bodyBuffer]);
}

function parsePacket(buffer) {
  if (buffer.length < 14) return {};
  const svc = parseInt(buffer.toString("utf8", 2, 6));
  const body = buffer.slice(14).toString("utf8");
  const packet = body.split("\f").filter(Boolean);
  return { svc, packet };
}

module.exports = {
  buildPacket,
  parsePacket
};
