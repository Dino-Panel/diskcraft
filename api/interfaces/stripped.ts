import { permissionsModel } from "./default";

interface vps_model_stripped {
  uuid: string;
  alias: string;
  status: string;
  firewall_rules: any;

  iso: any;

  renew: boolean;
  suspended: boolean;

  stats: {
    cpu: number;
    diskRead: number;
    diskWrite: number;
    netIn: number;
    netOut: number;
  };
  share_details: any;
  installed: boolean;
}

interface user_model_stripped {
  balance: number;
  pterodactyl_id: number;
  discord_id: number;
  permissions: permissionsModel;
}

export { vps_model_stripped, user_model_stripped };
