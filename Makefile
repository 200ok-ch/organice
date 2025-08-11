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
test: setup
	yarn test

.PHONY: test-update-snapshots
test-update-snapshots: setup
	yarn test -u

.PHONY: docs
docs:
	./bin/compile_doc.sh

.PHONY: deploy-docs
deploy-docs: docs
	./bin/compile_doc_and_upload.sh

.PHONY: deploy
deploy:
	./bin/compile_and_upload.sh
	./bin/compile_doc_and_upload.sh
