install:
    bun install --minimum-release-age 1036800

drizzle-generate:
    @echo "Generating migration"
    bun drizzle-kit generate

drizzle-migrate:
    @echo "Running migrations"
    bun drizzle-kit migrate

drizzle-unsafe-reset:
    @echo "Unsafely resetting database"

    rm -rf drizzle
    mkdir drizzle

    rm -rf database
    mkdir database

    just drizzle-generate
    just drizzle-migrate

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
