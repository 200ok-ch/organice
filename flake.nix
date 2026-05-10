{
  description = "organice";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = inputs @ {
    self,
    nixpkgs,
    flake-utils,
    ...
  }:
    flake-utils.lib.eachSystem
    ["x86_64-linux" "aarch64-linux" "aarch64-darwin"]
    (system: let
      pkgs = import nixpkgs {
        inherit system;
      };
      organice = pkgs.callPackage (
        {
          lib,
          stdenv,
          fetchYarnDeps,
          writableTmpDirAsHomeHook,
          yarnConfigHook,
          yarnBuildHook,
          nodejs_20,
          dropboxClientId ? "",
          gitlabClientId ? "",
          gitlabSecret ? "",
          webdavUrl ? "",
        }: let
          envFile = pkgs.writeText "organice.env" ''
            REACT_APP_DROPBOX_CLIENT_ID=${dropboxClientId}
            REACT_APP_GITLAB_CLIENT_ID=${gitlabClientId}
            REACT_APP_GITLAB_SECRET=${gitlabSecret}
            REACT_APP_WEBDAV_URL=${webdavUrl}
          '';
        in
          stdenv.mkDerivation (finalAttrs: {
            pname = "organice";
            version = "0.2.0";

            src = lib.cleanSource ./.;

            yarnOfflineCache = fetchYarnDeps {
              yarnLock = ./yarn.lock;
              hash = "sha256-PVxdwevmg3RDmUnh4/AW/sOC7czcfmo+Q0eBv2FViAw=";
            };

            nativeBuildInputs = [
              writableTmpDirAsHomeHook
              yarnConfigHook
              yarnBuildHook
              nodejs_20
            ];

            # package.json's engines field has historically been strict in this
            # project. The derivation chooses nodejs_20 explicitly, so do not
            # require Yarn to enforce the field as well.
            YARN_IGNORE_ENGINES = "1";

            postPatch = ''
              patchShebangs bin
            '';

            preBuild = ''
              cp ${envFile} .env
            '';

            installPhase = ''
              runHook preInstall

              mkdir -p $out/share/organice
              cp -r dist/* $out/share/organice/

              runHook postInstall
            '';

            meta = {
              description = "A browser-based Org mode client";
              homepage = "https://github.com/200ok-ch/organice";
              license = lib.licenses.agpl3Only;
              platforms = lib.platforms.all;
            };
          })
      ) {};
    in {
      packages = {
        inherit organice;
        default = organice;
      };

      devShells.default = pkgs.mkShell {
        name = "dev-shell";
        buildInputs = with pkgs; [
          nodejs_20
          # Install sass this way and remove it from package.json because that one requires gyp which doesn't work on nix:
          nodePackages.sass
          yarn
          # Required for compile_docs.sh:
          emacs
          pandoc
          # Required to upload docs:
          lftp
          # Required in transient_env_vars.sh
          gnused
          # Required in entrypoint.sh
          nodePackages.serve
        ];
        shellHook = ''
          echo
          read -rp "Apply changes in package.json to work on NixOS? [Y/n] " ans
          if [[ $ans =~ ^([Yy]|)$ ]]; then
            sed -i \
                -e 's/"node": ".*"/"node": ""/' \
                package.json
            echo
            echo "Note: Be careful to not accidentally commit this change!"
            echo
            echo "You can now run 'yarn start', 'yarn test', etc."
            echo
          fi
        '';
      };
    });
}
