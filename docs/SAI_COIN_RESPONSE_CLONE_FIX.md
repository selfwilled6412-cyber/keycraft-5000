# SAI COIN response clone fix

Production diagnostics showed that KEY CRAFT reached 20/20 with `missionCompleted=true`, all SAI COIN Worker secrets were present, and the SAI mission/source were active, but no `sai_coin_outbox` row was created.

The integration wrapper previously cloned the progress `Response` inside the async background function after awaiting the cloned request body. By that time the original response could already be in use by the client.

The wrapper now clones the integration response synchronously before returning the original response, then the background task consumes only that dedicated clone. KEY CRAFT progress behavior remains unchanged if SAI COIN is unavailable.
