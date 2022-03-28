<template>
  <div class="" style="background-color: var(--bs-bg); height: 100%">
    <div
      v-if="fetching_root == true && api_capabilities != null"
      style="background-color: var(--bs-bg); height: 100%"
    >
      <div class="spinner-grow text-white center-loader" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
    <div style="background-color: var(--bs-bg); height: 100%">
      <nav
        class="navbar navbar-expand-lg navbar-dark bg-dark"
        v-if="user && show_nav"
        style="border-radius: 0px 0px 15px 15px"
      >
        <div class="container-fluid">
          <a class="navbar-brand"
            ><img
              :src="api_capabilities.panel.menu_logo_url"
              width="35"
              height="35"
              alt=""
          /></a>
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>
          <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
              <li class="nav-item">
                <a
                  class="nav-link"
                  @click="goto('/dashboard')"
                  aria-current="page"
                  >Dashboard</a
                >
              </li>
              <li
                class="nav-item"
                v-if="
                  $root.$children[0].api_capabilities.capabilities
                    .pterodactylServer
                "
              >
                <a
                  class="nav-link"
                  @click="goto('/servers')"
                  aria-current="page"
                  >Servers</a
                >
              </li>
              <li
                class="nav-item"
                v-if="$root.$children[0].api_capabilities.capabilities.qemuVps"
              >
                <a
                  class="nav-link"
                  @click="goto('/vps-manager')"
                  aria-current="page"
                  >VPS</a
                >
              </li>
              <li class="nav-item">
                <a class="nav-link" @click="goto('/order')" aria-current="page"
                  >Order</a
                >
              </li>
              <li class="nav-item">
                <a class="nav-link" @click="goto('/cart')" aria-current="page"
                  >Cart</a
                >
              </li>
              <li class="nav-item" v-if="$root.$children[0].user.admin == true">
                <a class="nav-link" @click="goto('/admin')" aria-current="page"
                  >Admin</a
                >
              </li>
              <li
                class="nav-item dropdown"
                v-if="$root.$children[0].user.admin == true && false"
              >
                <a
                  class="nav-link dropdown-toggle"
                  id="navbarDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                >
                  Admin
                </a>
                <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li>
                    <router-link class="dropdown-item" to="/admin/users"
                      >Users</router-link
                    >
                  </li>
                  <li>
                    <router-link class="dropdown-item" to="/admin/log"
                      >Log</router-link
                    >
                  </li>
                  <li
                    v-if="
                      $root.$children[0].api_capabilities.capabilities.qemuVps
                    "
                  >
                    <router-link class="dropdown-item" to="/admin/vps-dashboard"
                      >All VPSs</router-link
                    >
                  </li>
                  <li
                    v-if="
                      $root.$children[0].api_capabilities.capabilities
                        .pterodactylServer
                    "
                  >
                    <router-link
                      class="dropdown-item"
                      to="/admin/server-dashboard"
                      >All Servers</router-link
                    >
                  </li>
                  <li
                    v-if="
                      $root.$children[0].api_capabilities.capabilities.qemuVps
                    "
                  >
                    <router-link
                      class="dropdown-item"
                      to="/admin/vps/awaitng_cancellation"
                      >VPSs Awaiting Cancellation</router-link
                    >
                  </li>
                  <li
                    v-if="
                      $root.$children[0].api_capabilities.capabilities
                        .pterodactylServer
                    "
                  >
                    <router-link
                      class="dropdown-item"
                      to="/admin/servers/awaitng_cancellation"
                      >Servers Awaiting Cancellation</router-link
                    >
                  </li>
                </ul>
              </li>
            </ul>
            <div class="dropdown">
              <button
                class="btn btn-primary dropdown-toggle"
                type="button"
                id="dropdownMenuButton1"
                data-bs-toggle="dropdown"
                aria-expanded="true"
              >
                <i
                  style="color: var(--bs-button-text); position: relative; left: -2px;"
                  class="fad fa-user"
                ></i>
                {{ user.first_name }} {{ user.last_name }}
              </button>
              <ul class="dropdown-menu " aria-labelledby="dropdownMenuButton1">
                <li>
                  <a class="dropdown-item" @click="toggleLightMode()"
                    ><i class="far fa-eclipse menuItemIcon"></i> Switch theme</a
                  >
                </li>
                <li>
                  <a class="dropdown-item" @click="goto('/change-password')"
                    ><i class="far fa-key menuItemIcon"></i> Change Password</a
                  >
                </li>
                <li><hr class="dropdown-divider" /></li>
                <li>
                  <a class="dropdown-item" @click="logout()"
                    ><i class="far fa-sign-out menuItemIcon"></i> Sign out</a
                  >
                </li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
      <div class="toast-container">
        <div v-for="(msg, index) in messages" style="z-index: 10" :key="index">
          <div
            v-if="msg.error == false"
            class="toast align-items-center text-white bg-success border-0 showing onscreen-message"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div class="toast-header bg-success text-white">
              <strong class="me-auto">{{ msg.title }}</strong>
              <button
                @click="dismissMsg(index)"
                type="button"
                class="btn-close text-white"
                data-bs-dismiss="toast"
                aria-label="Close"
              ></button>
            </div>
            <div class="d-flex">
              <div class="toast-body">
                {{ msg.content }}
              </div>
            </div>
          </div>
          <div
            v-if="msg.error == true"
            class="toast align-items-center text-white bg-danger border-0 showing onscreen-message"
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div class="toast-header bg-danger text-white">
              <strong class="me-auto">{{ msg.title }}</strong>
              <button
                @click="dismissMsg(index)"
                type="button"
                class="btn-close text-white"
                data-bs-dismiss="toast"
                aria-label="Close"
              ></button>
            </div>
            <div class="d-flex">
              <div class="toast-body">
                {{ msg.content }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div
          class="alert alert-primary"
          role="alert"
          style="width:95%; margin: 10px auto; "
          v-for="(job, index) of jobs"
          :key="index"
        >
          <div
            class="spinner-border text-primary"
            style="height: 20px; width: 20px; position: relative; top: 2px"
            role="status"
          ></div>
          {{ job.text }}
        </div>
      </div>
      <router-view
        v-if="$root.$children[0].api_capabilities"
        style="z-index: 5"
      />
    </div>
  </div>
</template>

<script>
import Tawk from "vue-tawk";
import Vue from "vue";

export default {
  data() {
    return {
      messages: [
        // {
        //   time: new Date().getTime(),
        //   error: false,
        //   title: "UI",
        //   content: "BODY",
        //   timeout: 9999999,
        // },
      ],
      jwt: "",
      user: "",
      permissions: {},
      api_base_url: "",
      api_default: "https://billing.yourdomain.com/api",
      fetching_root: true,
      is_verify_email: false,
      refreshInterval: null,
      refreshInterval2: null,
      users: null,
      jobs: [],
      show_nav: false,
      disable_tawk: false,
      api_capabilities: null,
      data_hash: "",
      knownHosts: {
        localhost: "http://localhost:2250",
        "billing.yourdomain.com": "https://billing.yourdomain.com/api",
      },
    };
  },
  mounted() {
    var vm = this;

    if (this.$route.name == "Vps Console") {
      this.show_nav = false;
    } else {
      this.show_nav = true;
    }

    window.onerror = function(msg, url, lineNo, columnNo, error) {
      vm.reportError(url, {
        msg: msg,
        line: lineNo,
        column: columnNo,
        error: error,
      });

      return false;
    };

    const api_endpoint = vm.knownHosts[window.location.hostname];
    vm.api_base_url = api_endpoint;
    if (!api_endpoint) vm.api_base_url = vm.api_default;

    // if (window.location.host == "panel.diskos.net") {
    //   vm.api_base_url = vm.api_base_url_production;
    // }

    fetch(`${vm.api_base_url}/panelcapabilities`, {}).then((res) => {
      res.json().then((data) => {
        vm.api_capabilities = data.data;
        // vm.api_base_url = data.data.api_base_url;
        document.title = data.data.panel.name;
        var link =
          document.querySelector("link[rel*='icon']") ||
          document.createElement("link");
        link.type = "image/x-icon";
        link.rel = "shortcut icon";
        link.href = data.data.panel.fav_icon_url.replace("./", "/");
        document.getElementsByTagName("head")[0].appendChild(link);

        if (window.localStorage.getItem("jwt"))
          this.jwt = window.localStorage.getItem("jwt");

        setTimeout(() => {
          if (data.data.panel.tawk_url && vm.disable_tawk == false) {
            Vue.use(Tawk, {
              tawkSrc: data.data.panel.tawk_url,
            });
          }
        }, 5000);

        fetch(`${vm.api_base_url}/@me`, {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
        })
          .then((res) => {
            res.json().then((data) => {
              if (vm.is_verify_email == true) return;
              this.$root.$children[0].checkMessage(data);
              if (data.success == false) {
                this.$router.push({
                  path: "/login",
                });
              } else {
                this.$root.$children[0].user = data.data;
              }
              vm.fetching_root = false;
            });
          })
          .catch((e) => {
            vm.reportError(
              {
                panel: vm.$router.path,
                request: `${vm.api_base_url}/@me`,
              },
              e
            );

            this.$router.push({
              path: "/error",
            });
          });

        vm.refreshInterval = setInterval(async () => {
          if (window.localStorage.getItem("jwt") != null) {
            fetch(
              `${vm.api_base_url}/@me?options=["SKIP_SERVERS", "SKIP_VPSS"]`,
              {
                headers: {
                  Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
                  "x-data-strip": "true",
                  "x-check-hash-latest": vm.data_hash,
                },
              }
            )
              .then((res) => {
                res
                  .json()
                  .then((data) => {
                    if (vm.is_verify_email == true) return;
                    this.$root.$children[0].checkMessage(data);
                    if (data.success == false) {
                      this.$router.push({
                        path: "/login",
                      });
                    } else {
                      Object.assign(vm.$root.$children[0].user, data.data);
                      vm.data_hash = vm.create_hash_checksum(
                        btoa(JSON.stringify(data.data))
                      );
                    }
                    vm.fetching_root = false;
                  })
                  .catch((e) => {
                    vm.reportError(
                      {
                        panel: vm.$router.path,
                        request: `${vm.api_base_url}/@me?options=["SKIP_SERVERS", "SKIP_VPSS"]`,
                      },
                      e
                    );
                  });
              })
              .catch(() => {
                this.$router.push({
                  path: "/error",
                });
              });
          }
        }, 5000);

        vm.refreshInterval2 = setInterval(() => {
          vm.messages.forEach((msg) => {
            var index = vm.messages.indexOf(msg);
            if (msg.timeout - 1 <= 0) {
              vm.messages.splice(index, 1);
            } else {
              vm.messages[index].timeout = msg.timeout - 1;
            }
          });
        }, 1000);
      });
    });
  },
  beforeDestroy() {
    clearInterval(this.refreshInterval);
    clearInterval(this.refreshInterval2);
  },
  methods: {
    create_hash_checksum(str, seed = 0) {
      let h1 = 0xdeadbeef ^ seed,
        h2 = 0x41c6ce57 ^ seed;
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 =
        Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
        Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 =
        Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
        Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return 4294967296 * (2097151 & h2) + (h1 >>> 0);
    },
    createJob(text) {
      var vm = this;
      var id = Math.floor(Math.random() * 10000) + 10000;
      vm.jobs.push({
        id: id,
        text: text,
      });
      return id;
    },
    stopJob(id) {
      var vm = this;
      var jobs = vm.jobs;
      var job = jobs.find((j) => j.id == id);
      if (!job) return;
      var jobIndex = jobs.indexOf(job);
      jobs.splice(jobIndex, 1);
    },
    toggleLightMode() {
      if (document.body.classList.contains("light") == true) {
        document.body.classList.remove("light");
      } else {
        document.body.classList.add("light");
      }
    },
    checkMessage(data) {
      var vm = this;

      if (data.messages == null) return;
      data.messages.forEach((msg) => {
        if (msg.displayHeader != null && msg.displayText != null) {
          vm.messages.push({
            time: new Date().getTime(),
            error: msg.isError,
            title: msg.displayHeader,
            content: msg.displayText,
            timeout: msg.timeout || 5,
          });
        }
        if (msg.sysCode == "SESSION_EXPIRED") {
          window.localStorage.clear();
          vm.$root.$children[0].user = null;
          this.$router.push({
            path: "/login",
          });
        }
      });
    },
    reportError(url, e) {
      var vm = this;
      if (vm.api_capabilities.panel.report_errors == true) {
        fetch(`${vm.$root.$children[0].api_base_url}/@me/reporterror`, {
          method: "POST",
          mode: "cors",
          cache: "no-cache",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
          redirect: "follow",
          referrerPolicy: "no-referrer",
          body: JSON.stringify({
            url: url,
            errorData: e,
          }),
        });
      }
    },
    sysCodeParser(sysCode) {
      if (sysCode == "VPS_START") return "VPS Startup";
      if (sysCode == "VPS_SHUTDOWN") return "VPS Shutdown";
      if (sysCode == "VPS_RESET") return "VPS Power Reset";
      if (sysCode == "VPS_KILL") return "VPS Power Kill";
      if (sysCode == "VPS_REBOOT") return "VPS reboot";
      if (sysCode == "TOKEN_EXPIRED") return "User Session";
      if (sysCode == "ISO_MOUNT") return "ISO Installer";
      if (sysCode == "INVALID_USERNAME_PASSWORD") return "Login";
      if (sysCode == "LOGIN_OK") return "Login";
      if (sysCode == "ACCOUNT_NOT_ACTIVATED") return "Account activation";
      if (sysCode == "INVALID_ACTIVATION_CODE") return "Account activation";
      if (sysCode == "ACCOUNT_ACTIVATED") return "Account activation";

      return sysCode;
    },
    dismissMsg(index) {
      this.messages.splice(index, 1);
    },
    goto(path) {
      this.$router.push({
        path: path,
      });
    },
    logout() {
      window.localStorage.clear();
      this.$root.$children[0].user = null;
      this.$root.$children[0].jwt = "";
      this.$router.push({
        path: "/login",
      });
    },
  },
};
</script>

<style>
@media only screen and (max-width: 650px) {
  .onscreen-message {
    margin: 0px 20px;
    width: calc(100% - 40px);
  }
  .toast-container {
    width: 100%;
    z-index: 15;
    position: fixed;
    bottom: 20px;
    left: 0px !important;
    color: white;
  }
}

.toast-container {
  z-index: 15;
  position: fixed;
  bottom: 20px;
  left: 20px;
  color: white;
}

.center-loader {
  position: fixed; /* or absolute */
  top: 50%;
  left: 50%;
  width: 3rem;
  height: 3rem;
}

::-webkit-scrollbar {
  width: 5px;
}

/* Track */
::-webkit-scrollbar-track {
  box-shadow: inset 0 0 5px;
  border-radius: 0px;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #3d6892;
  border-radius: 5px;
  opacity: 0.5;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #4b80b4;
  opacity: 1;
}

a {
  cursor: pointer;
}
.menuItemIcon {
  width: 20px !important;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: var(--bs-text-default);
  background-color: var(--bs-bg);
}
:root {
  --bs-bg: rgb(40, 54, 67);
  --bs-primary: #5c7cfa;
  --bs-primary-hover: #475fc2;
  --bs-primary-disabled: #526edd;
  --bs-text-default: #ffffff;
  --bs-card-bg: #3d464e;
  --bs-card-header-bg: #3c4146;
  --bs-card-border: #1f2020;
  --bs-footer-text: grey;
}

.light {
  --bs-bg: #ffffff;
  --bs-primary: #5c7cfa;
  --bs-primary-hover: #475fc2;
  --bs-primary-disabled: #526edd;
  --bs-text-default: #000000;
  --bs-button-text: #ffffff;
  --bs-card-bg: #cecfcf;
  --bs-card-header-bg: #b9b9b9;
  --bs-footer-text: grey;
}
.btn-primary {
  background-color: var(--bs-primary);
  border-color: var(--bs-primary);
}
.btn-primary:hover {
  background-color: var(--bs-primary-hover);
}
.btn-primary:disabled {
  background-color: var(--bs-primary-disabled);
  border-color: var(--bs-primary-disabled);
}
</style>
