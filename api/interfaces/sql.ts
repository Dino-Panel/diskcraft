interface sqlUserResult {
  id: number;
  username: string;
  balance: number;
  phone_number: any;
  email: string;
  first_name: string;
  last_name: string;
  is_activated: number;
  is_admin: number;
  activation_code: string;
  discord_user_id: number;
  pterodactyl_user_id: number;
  add_credit: number;
  change_password: number;
  deploy: number;
  enable_pterodactyl: number;
}
interface sqlVpsResult {
  id: number;
  uuid: string;
  price: number;
  server_user: number;
  vnc_port: number;
  vnc_password: string;
  net_io_speed: number;
  allocation_id: number;
  disk_size: number;
  novnc_port: number;
  vnc_server: string;
  suspended: number;
  expire_date: Date;
  renew: number;
  node: string;
  name_alias: string;
  cloudinit_password: string;
  installed: any;
}

export { sqlUserResult, sqlVpsResult };
