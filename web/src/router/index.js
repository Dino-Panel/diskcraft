import Vue from "vue";
import VueRouter from "vue-router";

Vue.use(VueRouter);

const routes = [
  {
    path: "/",
    name: "Redirect",
    redirect: "/dashboard",
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("../views/client/login.vue"),
  },
  {
    path: "/vps-manager",
    name: "Vps Management",
    component: () => import("../views/client/vps-dashboard.vue"),
  },
  {
    path: "/vps-legacy/:vps_uuid",
    name: "Legacy VPS Manager",
    component: () => import("../views/client/vps-control.vue"),
  },
  {
    path: "/vps/:vps_uuid",
    name: "VPS Manager",
    component: () => import("../views/client/vps-control-redesign.vue"),
  },
  {
    path: "/vps/:vps_uuid/:page",
    name: "VPS Manager",
    component: () => import("../views/client/vps-control-redesign.vue"),
  },
  {
    path: "/console/:vps_uuid",
    name: "VPS Console",
    component: () => import("../views/client/console.vue"),
  },
  {
    path: "/shell/:vps_uuid",
    name: "VPS Shell",
    component: () => import("../views/client/shell.vue"),
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("../views/client/register.vue"),
  },
  {
    path: "/deploy",
    name: "deploy",
    component: () => import("../views/client/deploy.vue"),
  },
  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("../views/client/dashboard.vue"),
  },
  {
    path: "/servers",
    name: "Servers",
    component: () => import("../views/client/server-dashboard.vue"),
  },
  {
    path: "/change-password",
    name: "Change Password",
    component: () => import("../views/client/change-password.vue"),
  },
  {
    path: "/activate",
    name: "Email Verification",
    component: () => import("../views/client/verify-email.vue"),
  },
  {
    path: "/admin",
    name: "Admin ",
    component: () => import("../views/admin/admin-center.vue"),
  },
  {
    path: "/admin/users",
    name: "Admin | Users",
    component: () => import("../views/admin/users.vue"),
  },
  {
    path: "/admin/user/:user_id/vps",
    name: "Admin | User",
    component: () => import("../views/admin/user-vps.vue"),
  },
  {
    path: "/admin/user/:user_id/servers",
    name: "Admin | User",
    component: () => import("../views/admin/user-servers.vue"),
  },
  {
    path: "/admin/user/:user_id",
    name: "Admin | User",
    component: () => import("../views/admin/user-general.vue"),
  },
  {
    path: "/admin/vps/awaitng_cancellation",
    name: "Admin | VPS",
    component: () => import("../views/admin/vps-cancellation.vue"),
  },
  {
    path: "/admin/servers/awaitng_cancellation",
    name: "Admin | Servers",
    component: () => import("../views/admin/servers-cancellation.vue"),
  },
  {
    path: "/admin/log",
    name: "Admin | Log",
    component: () => import("../views/admin/log.vue"),
  },
  {
    path: "/error",
    name: "Error Screen",
    component: () => import("../views/client/api-error.vue"),
  },
  {
    path: "/discordauthcallback",
    name: "Discord Auth",
    component: () => import("../views/client/discord-auth.vue"),
  },
  {
    path: "/admin/vps-dashboard",
    name: "Admin | VPS",
    component: () => import("../views/admin/vps-dashboard-all.vue"),
  },
  {
    path: "/admin/server-dashboard",
    name: "Admin | Servers",
    component: () => import("../views/admin/server-dashboard-all.vue"),
  },
  {
    path: "/admin/qemu-hypervisors",
    name: "Admin | QEMU Hypervisors",
    component: () => import("../views/admin/qemu-hypervisors.vue"),
  },
  {
    path: "/admin/statistics",
    name: "Admin | Statistics",
    component: () => import("../views/admin/general-statistics.vue"),
  },
  {
    path: "/cart",
    name: "Cart",
    component: () => import("../views/client/cart.vue"),
  },
  {
    path: "/order",
    name: "Order",
    component: () => import("../views/client/order.vue"),
  },
];

const router = new VueRouter({
  mode: "hash",
  base: process.env.BASE_URL,
  routes,
});

export default router;
