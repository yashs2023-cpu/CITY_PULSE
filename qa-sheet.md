# Q&A Sheet (Owner: T4) — one-line answers

- Why “Unavailable” panels? → No verified public feed is available, so the system avoids inventing values.
- Why model-based air quality? → It is a model estimate, not a direct sensor reading; a verified Chennai sensor source can replace or supplement it if T1 finds one.
- How was the simulator validated? → T3 must report the measured MAE, sample count (n), and evaluation period; do not claim validation until those results are available.
- Is the authority real? → No. It is a simulated authority role; permit checks are manual and there is no government database integration.
- How do you tell traffic from an accident? → Heavy traffic alone is not labelled an accident; an accident label requires provider evidence or an approved authority report.
- What do the metrics show? → T2 should provide measured metrics with the command/tool run or log used to generate each number.
- What happens if submission fails? → The citizen form displays an inline error so the user can retry; it does not claim that a report was submitted.
- What accessibility improvements were made? → Explicit form labels, visible keyboard focus, clearer status/error feedback, and larger controls were added to the authority pages.
