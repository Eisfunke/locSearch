self:

{ pkgs, lib, config, ... }:

{
  options.services.locsearch = {
    enable = lib.mkEnableOption (lib.mdDoc "locsearch, a location finding game.");
    package = lib.mkOption {
      description = "The locsearch package to use.";
      type = lib.types.package;
      default = self.packages.${pkgs.stdenv.hostPlatform.system}.default;
    };
    instanceNames = lib.mkOption {
      description = "List of names of instances to run. If multiple names are given, multiple instances are started. Names are used as suffix in names and paths.";
      type = lib.types.listOf lib.types.str;
      default = [ "" ];
    };
  };

  config = let
    cfg = config.services.locsearch;
    mkServiceConfig = name:
      let fullName = if name != "" then "locsearch-${name}" else "locsearch";
      in {
        "${fullName}" = {
          description = fullName;
          wantedBy = [ "multi-user.target" ];
          after = [ "networking.target" ];
          serviceConfig = {
            DynamicUser = true;
            StateDirectory = fullName;
            WorkingDirectory = "/var/lib/private/${fullName}";
            ExecStart = "${cfg.package}/bin/locsearch";
            Restart = "always";
          };
        };
      };
  in lib.mkIf cfg.enable {
    systemd.services = lib.mkMerge (map mkServiceConfig cfg.instanceNames);
  };
}
