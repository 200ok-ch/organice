SHELL = /bin/bash

.DEFAULT_GOAL = run

# ------------------------------------------------------------
# dev

.PHONY: setup
setup:
	yarn install --production=false

.PHONY: run
run: setup
	NODE_OPTIONS=--openssl-legacy-provider yarn start

.PHONY: test
test: setup
	yarn test

.PHONY: docs
docs:
	./bin/compile_doc.sh

.PHONY: deploy-docs
deploy-docs: docs
	./bin/compile_doc_and_upload.sh
