/**
 * Serialises data for a <script type="application/ld+json"> block.
 *
 * `JSON.stringify` does not escape `<`, so any value containing the literal
 * text `</script>` would terminate the script element early and allow HTML
 * injection. Song titles and descriptions are operator-supplied and flow
 * straight into JSON-LD, so they are escaped here.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\u003c")
    .replace(/>/g, "\u003e")
    .replace(/\u2028/g, "\u2028")
    .replace(/\u2029/g, "\u2029");
}
