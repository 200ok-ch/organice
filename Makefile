-include .ok/credentials.mk

SHELL=/bin/bash

.DEFAULT_GOAL=run

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
run: setup
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

BUILD_FILES=$(shell find build/ -type f -name '*.js')

.PHONY: build
build: ## Build a production build
	bin/transient_env_vars.sh bait
	yarn build
	bin/transient_env_vars.sh switch build build0
	make set-revision

.PHONY: set-revision
set-revision: $(BUILD_FILES)
set-revision: ## Set the build revision
	for FILE in $?; do sed -i "s/ORGANICE_REVISION/$(REVISION)/" $$FILE; done

ANDROID_TARGET?=Pixel_3_API_32

.PHONY: android
android: build
android: ## Build the android app and run it on $ANDROID_TARGET
	npx cap run android --target $(ANDROID_TARGET)

.PHONY: check-ftp-credentials
check-ftp-credentials: ## Check for FTP credentials
	[ -z ${FTP_HOST+x} ] && (echo "$FTP_HOST needs to be set for uploading to FTP."; exit 1)
	[ -z ${FTP_USER+x} ] && (echo "$FTP_USER needs to be set for uploading to FTP."; exit 1)
	[ -z ${FTP_PASSWD+x} ] && (echo "$FTP_PASSWD needs to be set for uploading to FTP."; exit 1)

.PHONY: deploy
deploy: check-ftp-credentials setup build
deploy: ## Deploy PWA
	cd build0 && \
	  lftp -u${FTP_USER},${FTP_PASSWD} -e "mirror -R ./" ${FTP_HOST}
