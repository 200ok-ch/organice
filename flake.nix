{
  description = "A very basic flake for organice";

  # Type 'nix develop' to enter a development shell with all programs
  # and dependencies available.

  # Problems that still need to be fixed:
  # 1. Change the engines > node version to "^20" to allow the newer
  #    version of node.
  # 2. Remove the dependency node-sass in package.json because it
  #    cannot easily be installed on NixOS.
  # 3. Using the exact same node version as in .nvmrc would be good.

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }: let
    system = "x86_64-linux";
    pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
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
        # required for 'yarn start' to work:
        export NODE_OPTIONS=--openssl-legacy-provider
      '';
    };
  };
}
