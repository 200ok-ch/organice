SHELL = /bin/bash

.DEFAULT_GOAL = run

# ------------------------------------------------------------
# dev

.PHONY: setup
setup:
	yarn install --production=false

.PHONY: run
run: setup
	yarn start

.PHONY: test
test:
	yarn test

.PHONY: docs
docs:
	./bin/compile_doc.sh
