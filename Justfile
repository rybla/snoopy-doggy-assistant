install:
    bun install

add package:
    bun add --minimum-release-age 1036800 {{package}}

drizzle-generate:
    @echo "Generating migration"
    bun drizzle-kit generate

drizzle-migrate:
    @echo "Running migrations"
    mkdir -p databases
    bun drizzle-kit migrate

drizzle-unsafe-reset:
    @echo "Unsafely resetting database"

    rm -rf drizzle
    mkdir drizzle

    rm -rf database
    mkdir -p databases

    just drizzle-generate
    just drizzle-migrate

lance-unsafe-reset:
    @echo "Unsafely resetting lance databases"

    rm -rf database/lance

format:
    @echo "Formatting entire project"
    bun prettier . --write

typecheck:
    @echo "Typechecking entire project"
    bun tsc --noEmit

lint:
    @echo "Linting entire project"
    bun eslint . --fix

test:
    @echo "Testing entire project"
    bun test

bundle:
    @echo "Bundling frontend"
    bun run scripts/bundle.ts

# workflows

[doc("Setup project")]
setup: install drizzle-migrate

[doc("Run build pipeline")]
build: setup format typecheck lint test

genkit-start entrypoint:
    bun genkit start -- bun run {{entrypoint}}

flows:
    just genkit-start src/ai/flows.ts

telegramBot:
    just genkit-start src/telegramBot.ts
