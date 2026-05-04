import { log } from "@/logger";
import { do_, nextTimeOfDay, showError } from "@/utilities";

export function scheduleDailyAction<State>(input: {
  label: string;
  timeOfDay: { hour: number; minute: number };
  action: (state: State) => Promise<State>;
  state: State;
}) {
  function foo() {
    const now = new Date();
    const next = nextTimeOfDay(now, input.timeOfDay);
    const delay = next.getTime() - now.getTime();

    const state = input.state;

    setTimeout(() => {
      void do_(async () => {
        try {
          log(`Running raily action: ${input.label}`, {
            state,
          });
          await input.action(state);
        } catch (error) {
          log(`Error in daily action: ${input.label}`, {
            state,
            error: showError(error),
          });
        }

        // schedule next invocation after executing
        foo();
      });
    }, delay);
  }

  // schedule first invocation
  foo();
}
