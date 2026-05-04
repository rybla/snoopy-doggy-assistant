import { log } from "@/logger";
import { do_, nextTimeOfDay, randomItem, showError } from "@/utilities";

export type TimeOfDay = { hour: number; minute: number };

export function scheduleDailyAction<State>(input: {
  label: string;
  schedule:
    | {
        type: "timeOfDay";
        timeOfDay: TimeOfDay;
      }
    | {
        type: "sampleTimeOfDay";
        timeOfDayOptions: TimeOfDay[];
      };
  action: (state: State) => Promise<State>;
  state: State;
}) {
  if (
    input.schedule.type === "sampleTimeOfDay" &&
    input.schedule.timeOfDayOptions.length === 0
  )
    throw new Error(
      `The options to sample the time of day from must be non-empty.`,
    );

  function foo() {
    const now = new Date();
    const next = do_(() => {
      switch (input.schedule.type) {
        case "timeOfDay":
          return nextTimeOfDay(now, input.schedule.timeOfDay);
        case "sampleTimeOfDay":
          return nextTimeOfDay(
            now,
            randomItem(input.schedule.timeOfDayOptions)!,
          );
      }
    });
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
