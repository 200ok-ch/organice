-include .ok/credentials.mk
-include local.mk

ANDROID_TARGET?=Pixel_3_API_32

SHELL=/bin/bash

.DEFAULT_GOAL=run

check_defined = \
  $(strip $(foreach 1,$1, \
    $(call __check_defined,$1,$(strip $(value 2)))))
__check_defined = \
  $(if $(value $1),, \
    $(error Undefined $1$(if $2, ($2))))

# ------------------------------------------------------------
# dev

.PHONY: help
help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m  %-30s\033[0m %s\n", $$1, $$2}'

.PHONY: setup
setup: ## Setup the project
	yarn install --production=false

.PHONY: run
run: setup src/lib/headline_filter_parser.js
run: ## Run a server that serves organice as PWA (default)
	yarn start

.PHONY: test
test: setup
test: ## Run the tests
	yarn test

.PHONY: docs
docs: ## Compile the documentation
	./bin/compile_doc.sh

.PHONY: deploy-docs
deploy-docs: docs
deploy-docs: ## Deploy the documentation
	./bin/compile_doc_and_upload.sh

REVISION=$(shell git describe --tags)

BUILD_FILES=$(shell find build0/ -type f -name '*.js')

.PHONY: build
build: ## Build a production build
	bin/transient_env_vars.sh bait
	yarn build
	bin/transient_env_vars.sh switch build build0
	make set-revision

.PHONY: set-revision
set-revision: $(BUILD_FILES)
set-revision: ## Set the build revision
	for FILE in $?; do sed -i "s/ORGANICE_ROLLING_RELEASE/$(REVISION)/" $$FILE; done

.PHONY: android
android: build
android: ## Build the android app and run it on $ANDROID_TARGET
	npx cap run android --target $(ANDROID_TARGET)

.PHONY: check-ftp-credentials
check-ftp-credentials: ## Check for FTP credentials
	$(call check_defined, FTP_HOST, deployment target)
	$(call check_defined, FTP_USER, deployment user)
	$(call check_defined, FTP_PASSWD, deployment password)

.PHONY: deploy
deploy: check-ftp-credentials setup build
deploy: ## Deploy PWA
	cd build0 && \
	  lftp -u${FTP_USER},${FTP_PASSWD} -e "mirror -R ./" ${FTP_HOST}

# TODO: this could replace the sh script bin/compile_search_parser.sh
src/lib/headline_filter_parser.js: src/lib/headline_filter_parser.grammar.pegjs
	echo '/* eslint-disable */' > $@
	npx pegjs -o - $< >> $@
