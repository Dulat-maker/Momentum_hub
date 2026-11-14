import QRCode from "qrcode";

/**
 * A QR code pointing at the event, for the host to put on a slide or print.
 * Scanning it lands a team on the event page, where they can register or log
 * in and mark themselves down - no separate join flow to keep in sync.
 *
 * Rendered on white on purpose: a dark code on a dark card is the classic way
 * to make a QR unreadable by a phone in a gym.
 */
export async function EventQr({
  url,
  label,
}: {
  url: string;
  label?: string;
}) {
  let svg: string;

  try {
    svg = await QRCode.toString(url, {
      type: "svg",
      errorCorrectionLevel: "M",
      margin: 1,
      color: { dark: "#0a0612", light: "#ffffff" },
    });
  } catch {
    return (
      <p className="text-xs text-fg-dim">
        The QR code could not be drawn. The link still works:{" "}
        <span className="break-all text-fg-muted">{url}</span>
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-full max-w-56 rounded-xl bg-white p-3"
        // qrcode returns a complete <svg> document for the code.
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {label ? (
        <p className="text-center text-xs text-fg-dim">{label}</p>
      ) : null}
      <p className="w-full break-all text-center text-[11px] text-fg-dim">
        {url}
      </p>
    </div>
  );
}
