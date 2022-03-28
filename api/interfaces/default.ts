interface userModel {
  id: number;
  username: string;
  balance: number;
  phone: any;
  email: string;
  first_name: string;
  last_name: string;
  admin: boolean;
  activated: boolean;
  activation_code: string;
  discord_id: Partial<number>;
  pterodactyl_id: Partial<number>;
  permissions: permissionsModel;
  servers: Partial<object[]>;
  vps: Partial<object[]>;
}

interface vpsModel {
  id: number;
  uuid: string;
  name: string;
  alias: string;
  network: any;
  status: string;
  parent: number;
  price: number;
  firewall_rules: any;
  net_io_speed: number;

  iso: any;
  location: string;

  novnc_port: number;
  vnc_port: number;
  vnc_server: string;
  vnc_password: string;

  renew: boolean;
  suspended: boolean;
  expiresAt: Date;
  node: string;
  hardware: serverHardware;

  stats: {
    cpu: number;
    diskRead: number;
    diskWrite: number;
    netIn: number;
    netOut: number;
    name: string;
  };
  statsHistory: any;
  is_share: boolean;
  share_details: any;
  cloudinit_username: string;
  cloudinit_password: string;
  installed: boolean;
}

interface serverHardware {
  cpuCores: number;
  ram: number;
  disk: number;
}

interface hypervisorData {
  name: string;
  uuid: string;
  id: number;
  status: string;
  ram: number;
  cpu: number;
}

interface permissionsModel {
  can_add_credit: boolean;
  can_change_password: boolean;
  can_deploy: boolean;
  can_enable_pterodactyl: boolean;
}

interface pterodactylServer {
  id: number;
  identifier: string;
  name: string;
  owner: number;
  renew: boolean;
  suspended: boolean;
  expiresAt: Date;
  type: string;
  online: boolean;
  price: number;
  originalPrice: number;
  limits: {
    memory: number;
    disk: number;
    cpu: number;
  };
  statistics: {
    cpuPercent: number;
    memPercent: number;
  };
  is_installed: boolean;
  node_location: string;
}

export {
  permissionsModel,
  userModel,
  vpsModel,
  hypervisorData,
  pterodactylServer,
};
