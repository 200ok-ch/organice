{
  description = "A very basic flake for organice";

  # Type 'nix develop' to enter a development shell with all programs
  # and dependencies available.

  # Using the exact same node version as in .nvmrc would be good.
  # But it's hard to implement in Nix and takes a long time to compile.

  # Other problems that the development shell fixes automatically (see shellHook):
  # 1. In package.json, change engines node version to "" in order to
  #    allow newer versions of node.

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
      in {
        devShells.default = pkgs.mkShell {
          name = "dev-shell";
          buildInputs = with pkgs; [
            nodejs
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
