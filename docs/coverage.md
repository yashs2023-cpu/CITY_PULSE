# T2 Coverage Evidence

## Current status

The available T2 evidence contains a **30/30 test pass rate (100%)**, but it does not contain a verified code-coverage percentage. Test pass rate and code coverage are different measures.

## Final-branch command

Run the repository's configured coverage script from the repository root:

```powershell
npm run coverage --if-present
```

If the repository uses a different configured coverage command, use that command and save the generated report under `docs/evidence/coverage/`.

## Acceptance target

The team plan says to raise coverage toward **80%+**. The final report must state the actual measured coverage percentage, not the target, unless the tool confirms the target was reached.
