<template>
  <div class="page">
    <section class="top-bar">
      <div class="top-bar-content">
        <div class="vps-power-icon">
          <i
            class="fad fa-scrubber server-power-icon-breathe"
            style="color:green"
            v-if="server().status == 'Running'"
          ></i>
          <i
            class="fad fa-scrubber server-power-icon"
            style="color:orange"
            v-else
          ></i>
        </div>
        <p v-if="name_change_active == false" class="vps-name">
          {{ server().alias || server().name }}
        </p>
        <i
          v-if="name_change_active == false"
          @click="name_change_active = true"
          class="fal fa-pencil-alt name-modify-icon"
        ></i>

        <div
          style="display: inline-flex"
          class="name-modify-input"
          v-if="name_change_active == true"
        >
          <input
            id="vpsAliasName"
            type="text"
            class="form-control "
            aria-label="Amount"
            :placeholder="server().alias || server().name"
            minlength="1"
            maxlength="15"
          />
          <button
            @click="saveVpsAlias()"
            type="button "
            class="btn btn-primary aliasSaveBtn"
          >
            Save
          </button>
        </div>

        <div class="net-info">
          <p class="net-info4" v-if="server().network.ipv4_enabled == 1">
            <b>IPv4:</b> {{ server().network.ipv4_address }}
          </p>
          <p class="net-info6" v-if="server().network.ipv6_enabled == 1">
            <b>IPv6:</b> {{ server().network.ipv6_address }}
          </p>
        </div>

        <div class="power-options-and-monitor">
          <div class="monitor-icon-holder">
            <div class="monitor-icon" @click="open_console_window()">
              <i class="fal fa-desktop-alt"></i>
            </div>
          </div>
          <div class="btn-group" role="group" aria-label="Basic example">
            <button
              type="button"
              class="btn btn-success poweraction_btn"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Start"
              style="color: var(--bs-button-text)"
              :disabled="
                server().status == 'Running' || server().suspended == 1
              "
              @click="start()"
            >
              <i
                class="fa-regular fa-play"
                style="color: var(--bs-button-text);position: relative; left: -2px;"
              ></i>
            </button>
            <button
              type="button"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Shutdown"
              class="btn btn-warning poweraction_btn"
              style="color: var(--bs-button-text)"
              :disabled="
                server().status != 'Running' || server().suspended == 1
              "
              @click="shutdown()"
            >
              <i
                class="fa-regular fa-stop"
                style="color: var(--bs-button-text)"
              ></i>
            </button>
            <button
              type="button"
              class="btn btn-warning poweraction_btn"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Reboot"
              style="color: var(--bs-button-text)"
              :disabled="
                server().status != 'Running' || server().suspended == 1
              "
              @click="reboot()"
            >
              <i
                class="fa-regular fa-sync"
                style="color: var(--bs-button-text); position: relative; left: -1px;"
              ></i>
            </button>
            <button
              type="button"
              class="btn btn-danger poweraction_btn"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Reset"
              style="color: var(--bs-button-text)"
              :disabled="
                server().status != 'Running' || server().suspended == 1
              "
              @click="reset()"
            >
              <i
                class="fa-regular fa-bolt"
                style="color: var(--bs-button-text)"
              ></i>
            </button>
            <button
              type="button"
              class="btn btn-danger poweraction_btn"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              title="Kill"
              style="color: var(--bs-button-text)"
              :disabled="
                server().status != 'Running' || server().suspended == 1
              "
              @click="kill()"
            >
              <i
                class="fa-regular fa-skull-crossbones"
                style="color: var(--bs-button-text)"
              ></i>
            </button>
          </div>
        </div>
      </div>
    </section>
    <section class="main-content">
      <section class="nav-side">
        <div class="nav-links">
          <div
            class="nav-link"
            @click="load_page('overview')"
            :active="page == 'overview'"
          >
            <i class="fal fa-archway menu-item-icon"></i>
            <a>Overview</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('monitor')"
            :active="page == 'monitor'"
          >
            <i class="fal fa-desktop menu-item-icon"></i>
            <a>Monitor</a>
          </div>
          <div
            class="nav-link"
            v-if="ssh_server() != 'No firewall rule'"
            @click="load_page('shell')"
            :active="page == 'shell'"
          >
            <i class="fal fa-terminal menu-item-icon"></i>
            <a>Shell</a>
          </div>
          <div
            class="nav-link"
            :active="page == 'graphs'"
            @click="load_page('graphs')"
          >
            <i class="fal fa-chart-area menu-item-icon"></i>
            <a>Graphs</a>
          </div>
          <div
            v-if="server()"
            class="nav-link"
            @click="load_page('reinstall')"
            :active="page == 'reinstall'"
          >
            <i class="fal fa-cloud-download menu-item-icon"></i>
            <a>Reinstall</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('iso_mount')"
            :active="page == 'iso_mount'"
          >
            <i class="fal fa-usb-drive menu-item-icon"></i>
            <a>ISO Mount</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('firewall')"
            :active="page == 'firewall'"
          >
            <i class="fal fa-shield-alt menu-item-icon"></i>
            <a>Firewall rules</a>
          </div>
          <div
            class="nav-link"
            @click="load_page('info')"
            :active="page == 'info'"
          >
            <i class="fal fa-microchip menu-item-icon"></i>
            <a>System Info</a>
          </div>
          <div
            style="display: none"
            class="nav-link"
            @click="load_page('support')"
            :active="page == 'support'"
          >
            <i class="fal fa-ticket-alt menu-item-icon"></i>
            <a>Support</a>
          </div>
          <div
            v-if="server().is_share == false"
            class="nav-link"
            @click="load_page('share')"
            :active="page == 'share'"
          >
            <i class="fal fa-share-all menu-item-icon"></i>
            <a>Share</a>
          </div>
        </div>
      </section>
      <section class="nav-content">
        <div class="share" v-if="page == 'share'">
          <div class="share-content">
            <p class="note">
              Sharing will soon be enabled for all users. Want to share your
              server and try the feature out? Create a support ticket to get
              started.
            </p>
            <table class="shared-with-table">
              <tr>
                <th>Email</th>
                <th>Username</th>
                <th>First name</th>
                <th>Last name</th>
                <th>Actions</th>
              </tr>
              <tr
                v-for="(share_user, index) of server().share_details"
                :key="index + 30"
              >
                <td>{{ share_user.email }}</td>
                <td>{{ share_user.username }}</td>
                <td>{{ share_user.first_name }}</td>
                <td>{{ share_user.last_name }}</td>
                <td>
                  <button
                    class="btn btn-danger isoMountBtn"
                    type="button"
                    style="width: 100%"
                    disabled
                    @click="remove_share_user(share_user)"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            </table>
          </div>
        </div>

        <div class="reinstall" v-if="page == 'reinstall'">
          <div class="reinstall-content">
            <p class="note">
              You can select one of the linux distros from the list down below
              the reinstall your server with using cloud-init. The installation
              can take a few minutes, but you will receive an email notification
              when your server is ready for use. Your cloud-init credentials
              will stay the same. You can request a new password for cloudinit
              via a support ticket. When you click install your server will be
              killed and it's existing virtual harddrive will be deleted. There
              is no confirmation button.
            </p>
            <div class="cloudinit-image-card">
              <div class="header-img">
                <img src="/img/cloudinit/ubuntu.png" />
              </div>
              <h2 class="card-title">Ubuntu 21.04</h2>
              <p class="card-subtitle">
                Ubuntu "Hirsute Hippo" 21.04 Live Server<br />&nbsp;
              </p>
              <button
                class="btn btn-success select-button"
                type="button"
                style="width: 100%"
                @click="select_cloudinit_install('ubuntu_live_server_2104')"
              >
                Install
              </button>
            </div>
            <div class="cloudinit-image-card">
              <div class="header-img">
                <img src="/img/cloudinit/ubuntu.png" />
              </div>
              <h2 class="card-title">Ubuntu 20.10</h2>
              <p class="card-subtitle">
                Ubuntu "Groovy Gorilla" 20.10 Live Server<br />&nbsp;
              </p>
              <button
                class="btn btn-success select-button"
                type="button"
                style="width: 100%"
                @click="select_cloudinit_install('ubuntu_live_server_2010')"
              >
                Install
              </button>
            </div>
            <div class="cloudinit-image-card">
              <div class="header-img">
                <img src="/img/cloudinit/ubuntu.png" />
              </div>
              <h2 class="card-title">Ubuntu 20.04</h2>
              <p class="card-subtitle">
                Ubuntu "Focal Fossa" 20.04 Live Server<br />&nbsp;
              </p>
              <button
                class="btn btn-success select-button"
                type="button"
                style="width: 100%"
                @click="select_cloudinit_install('ubuntu_live_server_2004')"
              >
                Install
              </button>
            </div>
            <div class="cloudinit-image-card">
              <div class="header-img">
                <img src="/img/cloudinit/ubuntu.png" />
              </div>
              <h2 class="card-title">Ubuntu 18.04</h2>
              <p class="card-subtitle">
                Ubuntu "Bionic Beaver" 18.04 Live Server<br />
                No full support guaranteed
              </p>
              <button
                class="btn btn-success select-button"
                type="button"
                style="width: 100%"
                @click="select_cloudinit_install('ubuntu_live_server_1804')"
              >
                Install
              </button>
            </div>
            <div class="cloudinit-image-card">
              <div class="header-img">
                <img src="/img/cloudinit/ubuntu.png" />
              </div>
              <h2 class="card-title">Ubuntu 16.04</h2>
              <p class="card-subtitle">
                Ubuntu "Xenial Xerus" 16.04 Live Server <br />No full support
                guaranteed
              </p>
              <button
                class="btn btn-success select-button"
                type="button"
                style="width: 100%"
                @click="select_cloudinit_install('ubuntu_live_server_1604')"
              >
                Install
              </button>
            </div>
          </div>
        </div>

        <div class="overview" v-if="page == 'overview'">
          <div class="overview-content">
            <div class="overview-box overview-cloudinit">
              <p class="overview-box-title">Cloud-Init</p>
              <div class="overview-box-content">
                <div class="inline">
                  <b>Username:</b>&nbsp;
                  {{ server().cloudinit_username }}
                </div>
                <br />
                <div class="inline">
                  <b>Password:</b>&nbsp;
                  {{ server().cloudinit_password }}
                </div>
                <br />
                <div class="inline">
                  <b>SSH:</b>&nbsp;
                  {{ ssh_server() }}
                </div>
              </div>
            </div>
            <br />
            <div class="overview-box overview-location">
              <p class="overview-box-title">Location</p>
              <div class="overview-box-content">
                <div class="inline">
                  <p>{{ location_string() }}</p>
                  <img class="location-flag" :src="flag_url()" />
                </div>
              </div>
            </div>
            <br />
            <div class="overview-box overview-price">
              <p class="overview-box-title">Price</p>
              <div class="overview-box-content">
                <div class="inline">
                  <p>
                    {{ $root.$children[0].api_capabilities.currency.symbol
                    }}{{ server().price }} <small>/month</small>
                  </p>
                </div>
              </div>
            </div>
            <br />
            <div class="overview-box overview-vnc">
              <p class="overview-box-title">VNC Connection</p>
              <div class="overview-box-content">
                <p style="width: 100%; margin-bottom:0px">
                  <b>Server:</b> {{ server().vnc_server }}
                </p>
                <p style="width: 100%; margin-bottom:0px">
                  <b>Port:</b> {{ server().vnc_port }}
                </p>
                <p style="width: 100%; margin-bottom:0px">
                  <b>Password:</b> {{ server().vnc_password }}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div class="graphs" v-if="page == 'graphs'">
          <div class="chart-ctl">
            <div
              class="btn-group"
              style="width: 100%;"
              role="group"
              aria-label="Basic example"
            >
              <button
                type="button"
                class="btn btn-primary"
                @click="setChartDatapoints(10)"
              >
                Live
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="setChartDatapoints(60)"
              >
                1 Minute
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="setChartDatapoints(300)"
              >
                5 Minutes
              </button>
              <button
                type="button"
                class="btn btn-primary"
                @click="setChartDatapoints(600)"
              >
                10 Minutes
              </button>
            </div>
          </div>
          <div class="graphs-content" style="overflow:hidden">
            <cpu-chart
              class="chart cpu-chart"
              :uuid="server().uuid"
              :dataPoints="dataPointsChart"
              v-if="show_chart"
            ></cpu-chart>
            <br />
            <network-chart
              class="chart network-chart"
              :uuid="server().uuid"
              :dataPoints="dataPointsChart"
              v-if="show_chart"
            ></network-chart>
            <br />
            <disk-chart
              class="chart disk-chart"
              :uuid="server().uuid"
              :dataPoints="dataPointsChart"
              v-if="show_chart"
            ></disk-chart>
          </div>
        </div>

        <div class="iso-mount" v-if="page == 'iso_mount'">
          <div class="iso-mount-content">
            <p class="note">
              Your server has to be offline to mount an installer disk. After a
              disk has been mounted, start the server as usual and the installer
              will load. After the installation has completed mount the
              'no-iso.iso' file to avoid loading the installer again.
            </p>
            <div
              class="iso-mount-item"
              v-for="(iso, index) in mountableIsos"
              :key="index"
            >
              <p class="iso-mount-name">{{ iso_string(iso) }}</p>
              <button
                class="btn btn-primary isoMountBtn"
                type="button"
                style="float:right"
                @click="mountIso(iso)"
                :disabled="isMountedDisk(iso) || server().status == 'Running'"
              >
                {{ isMountedDisk(iso) == true ? "Mounted" : "Mount" }}
              </button>
            </div>
          </div>
        </div>
        <div class="monitor-page" v-if="page == 'monitor'">
          <iframe
            id="vps_frame"
            :src="frameSrc()"
            class="monitor_frame"
          ></iframe>
        </div>
        <div class="shell-page" v-if="page == 'shell'">
          <iframe
            id="vps_shell"
            :src="shell_src()"
            class="shell_frame"
          ></iframe>
        </div>
        <div class="firewall-page" v-if="page == 'firewall'">
          <div class="firewall-content">
            <h3>IPv4 NAT Firewall</h3>
            <table style="width: 100%; margin-bottom:0px; font-size: 14px">
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Public IP</th>
                <th>Public Port</th>
                <th>Private IP</th>
                <th>Private Port</th>
                <th>Actions</th>
              </tr>
              <tr
                v-for="(rule, index) of server().firewall_rules"
                :key="index + 20"
              >
                <td>{{ index + 1 }}</td>
                <td>{{ rule.type }}</td>
                <td>{{ server().network.node }}</td>
                <td>{{ rule.public_port }}</td>
                <td>{{ rule.private_ip }}</td>
                <td>{{ rule.private_port }}</td>
                <td>
                  <button
                    class="btn btn-danger isoMountBtn"
                    type="button"
                    style="width: 100%"
                    @click="delete_forward_rule(rule.public_port)"
                  >
                    Remove
                  </button>
                </td>
              </tr>

              <tr>
                <td>0</td>
                <td>tcp</td>
                <td>
                  <input
                    type="text"
                    class="form-control"
                    :value="server().network.node"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="text"
                    class="form-control"
                    placeholder="Randomly generated"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="text"
                    class="form-control"
                    :value="server().network.ipv4_address"
                    disabled
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    class="form-control"
                    placeholder="Target port"
                    id="new_rule_target_port"
                  />
                </td>
                <td>
                  <button
                    class="btn btn-success isoMountBtn"
                    type="button"
                    style="width: 100%"
                    @click="create_forward_rule()"
                  >
                    Add
                  </button>
                </td>
              </tr>
            </table>
          </div>
        </div>
        <div class="info-page" v-if="page == 'info'">
          <div class="info-content">
            <div>
              <h3>Hardware</h3>
              <p style="width: 100%; margin-bottom:0px">
                <b>CPU:</b> {{ server().hardware.cpuCores }}
                {{ server().hardware.cpuCores == 1 ? "core" : "cores" }}
              </p>
              <p style="width: 100%; margin-bottom:0px">
                <b>RAM:</b> {{ server().hardware.ram / 1024 }}GB
              </p>
              <p style="width: 100%; margin-bottom:0px">
                <b>Disk:</b> {{ server().hardware.disk / 1024 }}GB
              </p>
              <p style="width: 100%; margin-bottom:0px">
                <b>Network:</b> {{ server().net_io_speed / 100 }} Mbit/s
              </p>
            </div>
            <br />
            <div>
              <h3>Network</h3>
              <p
                style="width: 100%; margin-bottom:0px"
                v-if="server().network.ipv4_enabled == true"
              >
                <b>IPv4:</b>
                {{
                  server().network.ipv4_displayname ||
                    server().network.ipv4_address
                }}
                [{{ server().network.ipv4_type }}]
              </p>

              <p
                style="width: 100%; margin-bottom:0px"
                v-if="server().network.ipv6_enabled == true"
              >
                <b>IPv6:</b>
                {{
                  server().network.ipv6_displayname ||
                    server().network.ipv6_address
                }}
                [{{ server().network.ipv6_type }}]
              </p>
            </div>
            <br />
            <div>
              <h3>VNC Info</h3>
              <p style="width: 100%; margin-bottom:0px">
                <b>Server:</b> {{ server().vnc_server }}
              </p>
              <p style="width: 100%; margin-bottom:0px">
                <b>Port:</b> {{ server().vnc_port }}
              </p>
              <p style="width: 100%; margin-bottom:0px">
                <b>Password:</b> {{ server().vnc_password }}
              </p>
            </div>
          </div>
        </div>
      </section>
    </section>
  </div>
</template>

<script>
import cpuChart from "../../components/charts/cpu.vue";
import networkChart from "../../components/charts/network.vue";
import diskChart from "../../components/charts/disk.vue";
export default {
  components: { cpuChart, networkChart, diskChart },
  data() {
    return {
      page: "overview",
      dataPointsChart: 300,
      mountableIsos: [],
      prevState: "Running",
      refreshObject: null,
      mountedIso: null,
      prevStats: null,
      name_change_active: false,
      data_hash: "",
      show_chart: true,
    };
  },
  methods: {
    shell_src() {
      var vps = this.server();
      var ssh_uri = this.ssh_server();

      return `${window.origin}/ssh/host/${vps.node}?port=${
        ssh_uri.split(":")[1]
      }&username=${this.server().cloudinit_username}&password=${
        this.server().cloudinit_password
      }`;
    },
    select_cloudinit_install(installer_name) {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(
        `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reinstall/${installer_name}`,
        {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
        }
      )
        .then((res) => {
          res.json().then((data) => {
            setTimeout(() => {
              vm.$root.$children[0].checkMessage(data);
              vm.$router.push({
                path: "/vps-manager",
              });
            }, 1000);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/shutdown`,
            },
            e
          );
        });
    },
    open_console_window() {
      var vm = this;
      vm.prevent_navigate = true;
      setTimeout(() => {
        vm.prevent_navigate = false;
      }, 250);
      window.open(
        `${location.origin}/console/${this.server().uuid}`,
        "targetWindow",
        `toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no,width=1025px,height=861px`
      );
    },
    setChartDatapoints(count) {
      var vm = this;
      vm.dataPointsChart = count;
      vm.show_chart = false;
      vm.$nextTick(() => {
        vm.show_chart = true;
      });
    },
    isChartDatapoint(count) {
      var vm = this;
      return vm.dataPointsChart == count;
    },
    shutdown() {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(
        `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/shutdown`,
        {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
        }
      )
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/shutdown`,
            },
            e
          );
        });
    },
    reset() {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reset`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reset`,
            },
            e
          );
        });
    },
    kill() {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(
        `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/destroy`,
        {
          headers: {
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
        }
      )
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/destroy`,
            },
            e
          );
        });
    },
    reboot() {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reboot`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reboot`,
            },
            e
          );
        });
    },
    start() {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/start`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            setTimeout(() => {
              document
                .getElementById("vps_frame")
                .contentWindow.location.reload();
            }, 500);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/start`,
            },
            e
          );
        });
    },
    power_icon_style() {
      if (this.server().status == "Running") {
        return `color: green;`;
      } else {
        return `color: orange;`;
      }
    },
    iso_string(string) {
      if (string == "no-iso.iso") return string;
      var split_values = string.split(".");

      if (split_values) {
        if (split_values[0] == "installer") {
          return `${split_values[1]} ${split_values[2]} (${split_values[3]})`;
        }
        if (split_values[0] == "driver") {
          return `${split_values[1]} (Driver)`;
        }
      }
    },
    mountIso(isoName) {
      var vm = this;
      var vpsUUID = this.server().uuid;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/iso`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          iso: isoName,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/iso`,
            },
            e
          );
        });
    },
    isMountedDisk(isoName) {
      return this.mountedIso.includes(isoName);
    },
    load_page(name) {
      var vm = this;
      this.page = name;
      this.$router.push({
        path: `/vps/${vm.$route.params.vps_uuid}/${name}`,
      });
    },
    delete_forward_rule(public_port) {
      var vpsUUID = this.server().uuid;
      var vm = this;
      var jobId = vm.$root.$children[0].createJob(
        `Applying new firewall ruleset...`
      );
      fetch(
        `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/deleteforward/${public_port}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
          body: null,
        }
      )
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].stopJob(jobId);
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/deleteforward/${public_port}`,
            },
            e
          );
        });
    },
    create_forward_rule() {
      var vpsUUID = this.server().uuid;
      var port = document.getElementById("new_rule_target_port").value;
      if (port == "") return;
      var vm = this;
      var jobId = vm.$root.$children[0].createJob(
        `Applying new firewall ruleset...`
      );
      fetch(
        `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/createforward/${port}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          },
          body: null,
        }
      )
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch((e) => {
          vm.$root.$children[0].stopJob(jobId);
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/createforward/${port}`,
            },
            e
          );
        });
    },
    frameSrc() {
      var vm = this;
      return `/novnc/?autoconnect=true&password=${
        vm.server().vnc_password
      }&reconnect=true&reconnect_delay=1000&host=${
        vm.server().vnc_server
      }?noport=${vm.server().novnc_port}`;
    },
    server() {
      var vm = this;
      var vpsUuid = vm.$route.params.vps_uuid;

      if (vm.$root.$children[0].user) {
        var target = vm.$root.$children[0].user.vps.find((vps) => {
          return vps.uuid == vpsUuid;
        });

        if (!target) {
          this.$router.push({
            path: "/vps-manager",
          });
        } else {
          return target;
        }
      }
      return;
    },
    saveVpsAlias() {
      var name = document.getElementById("vpsAliasName").value;
      var vm = this;
      var vpsUUID = this.server().uuid;

      var target = vm.$root.$children[0].user.vps.find(
        (v) => v.uuid == vpsUUID
      );

      target.alias = name;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/alias`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          alias: name,
        }),
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.name_change_active = false;
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/alias`,
            },
            e
          );
        });
    },
    flag_url() {
      var location_string = this.server().location;
      var init = location_string.indexOf("[");
      var fin = location_string.indexOf("]");
      return `/flags/${location_string.substr(init + 1, fin - init - 1)}.png`;
    },
    location_string() {
      var location_string_raw = this.server().location;
      if (location_string_raw == null) return `Unkown`;
      var init = location_string_raw.indexOf("[");
      return location_string_raw.substr(0, init);
    },
    ssh_server() {
      var vm = this;
      var firewall_rules = vm.server().firewall_rules;
      var ssh_rule = firewall_rules.find((r) => r.private_port == 22);
      if (ssh_rule) {
        return `${vm.server().node}:${ssh_rule.public_port}`;
      } else {
        return `No firewall rule`;
      }
    },
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
  },
  mounted() {
    var vm = this;

    if (this.$route.params.page) {
      vm.page = vm.$route.params.page;
    }

    if (vm.server() && vm.server().suspended == 1) {
      this.$router.push({
        path: "/vps-manager",
      });
    }

    fetch(`${vm.$root.$children[0].api_base_url}/@me/vps?include_iso=true`, {
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        "x-request-server": vm.$route.params.vps_uuid || null,
      },
    })
      .then((res) => {
        res.json().then((data) => {
          if (data.success == false) {
            this.$root.$children[0].user = "";
            this.$root.$children[0].permissions = {};
            this.$router.push({
              path: "/login",
            });
          } else {
            vm.mountableIsos = data.data.iso.availible;
            vm.mountedIso = data.data.iso.mounted;
            var target = vm.$root.$children[0].user.vps.find((vps) => {
              return vps.uuid == data.data.uuid;
            });
            var target_index = vm.$root.$children[0].user.vps.indexOf(target);
            vm.$root.$children[0].user.vps[target_index] = data.data;

            vm.$forceUpdate();
          }
        });
      })
      .catch((e) => {
        vm.$root.$children[0].reportError(
          {
            panel: vm.$router.path,
            request: `${vm.api_base_url}/@me?options=["SKIP_SERVERS", "SKIP_VPSS"]`,
          },
          e
        );
      });

    vm.refreshObject = setInterval(() => {
      var selectedServer = vm.server();
      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps?include_iso=true`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          "x-request-server": vm.server().uuid || null,
          "x-data-strip": "true",
          "x-check-hash-latest": vm.data_hash,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            if (data.success == false) {
              this.$root.$children[0].user = "";
              this.$root.$children[0].permissions = {};
              this.$router.push({
                path: "/login",
              });
            } else {
              if (data.data.iso) vm.mountableIsos = data.data.iso.availible;
              if (data.data.iso) vm.mountedIso = data.data.iso.mounted;
              var target = vm.$root.$children[0].user.vps.find((vps) => {
                return vps.uuid == data.data.uuid;
              });
              var target_index = vm.$root.$children[0].user.vps.indexOf(target);
              if (data.data && vm.$root.$children[0].user.vps[target_index])
                Object.assign(
                  vm.$root.$children[0].user.vps[target_index],
                  data.data
                );
              vm.prevState = selectedServer.status;

              vm.$forceUpdate();

              vm.data_hash = vm.create_hash_checksum(
                btoa(JSON.stringify(data.data))
              );
            }
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.api_base_url}/@me?options=["SKIP_SERVERS", "SKIP_VPSS"]`,
            },
            e
          );
        });
    }, 1000);
  },
  beforeDestroy() {
    clearInterval(this.refreshObject);
  },
};
</script>

<style>
@media only screen and (max-width: 1000px) {
  .top-bar {
    height: 180px !important;
  }
  .top-bar-content {
    flex-wrap: wrap;
  }
  .net-info {
    width: 100% !important;
    display: block !important;
    position: relative !important;
    top: -25px !important;
  }
  .net-info4,
  .net-info6 {
    margin-bottom: 0px !important;
    height: fit-content;
    position: relative !important;
  }
  .net-info6 {
    top: -10px !important;
  }
  .power-options-and-monitor {
    width: 100% !important;
    margin-left: 20px !important;
    position: relative !important;
    top: -35px !important;
  }
  .monitor-icon-holder {
    display: none;
  }
  .main-content {
    display: block !important;
  }
  .nav-content {
    margin-left: 0px !important;
  }
  .nav-side {
    max-width: 100% !important;
  }
  .page {
    overflow-y: scroll !important;
  }
  .name-modify-input {
    margin-bottom: 31px !important;
  }
  .monitor_frame,
  .shell_frame {
    height: 80vw !important;
  }
  .overview-content {
    height: 100% !important;
    min-height: fit-content !important;
  }
}
.cpu-chart,
.network-chart,
.disk-chart {
  height: 233px;
}

.cloudinit-image-card {
  max-width: 350px;
  min-width: 350px;
  border-radius: 10px;
  padding: 15px;
  backdrop-filter: brightness(80%);
  margin: 10px;
}
.cloudinit-image-card .select-button {
  margin-top: 20px;
}

.cloudinit-image-card .card-subtitle {
  text-align: center;
  position: relative;
  top: -5px;
}
.cloudinit-image-card .card-title {
  text-align: center;
}
.cloudinit-image-card .header-img {
  height: 60px;
  position: relative;
}
.cloudinit-image-card .header-img img {
  height: 60px;
  position: absolute;
  left: 0;
  right: 0;
  margin: auto;
}

.reinstall-content {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-evenly;
}

.share-content {
  padding: 20px;
}
.shared-with-table {
  width: 100%;
}

.page {
  height: calc(100% - 65px);
  overflow: hidden;
}

.monitor-icon-holder {
  flex-grow: 1;
  font-size: 21px;
  margin: 0px 10px;
  width: fit-content;
  margin-right: 20px;
}

.monitor-icon {
  font-size: 21px;
  width: fit-content;
  cursor: pointer;
}

.overview-location,
.overview-price {
  height: 45px;
}

.overview-cloudinit {
  height: 90px;
}
.overview-vnc {
  height: 90px;
}
.location-flag {
  height: 15px;
  position: relative;
  left: 5px;
  top: 5px;
}
.inline {
  display: inline-flex;
}
.inline p {
  width: fit-content;
}
.overview-content {
  padding: 20px;
}
.overview-box {
  border-style: solid;
  border-radius: 5px;
  border-width: 1px;
}
.overview-box-title {
  position: relative;
  top: -12px;
  left: 10px;
  background-color: var(--bs-card-header-bg);
  width: fit-content;
  margin-bottom: 0px;
}
.overview-box-content {
  position: relative;
  top: -15px;
  left: 10px;
  margin-bottom: 0px;
}
.note {
  text-decoration: underline;
  text-decoration-color: var(--bs-primary);
  padding-right: 24%;
  padding-left: 24%;
  text-align: center;
  /* text-decoration-style: wavy; */
}
.name-modify-input {
  position: relative;
  top: 9px;
  height: 40px;
  left: 5px;
}
.name-modify-icon {
  position: relative;
  top: 8px;
  left: 5px;
  cursor: pointer;
  color: var(--bs-text-default);
  height: fit-content;
}
.name-modify-icon:hover {
  color: var(--bs-primary);
}
.net-info {
  position: relative;
  top: 10px;
  left: 30px;
  font-size: 12px;
  display: inline-flex;
}
.net-info4 {
  margin-right: 10px;
}
.server-power-icon {
  font-size: 30px;
}
.server-power-icon-breathe {
  font-size: 30px;
  animation: breathing 5s ease-out infinite normal;
}
.chart-ctl {
  width: 90%;
  margin: 10px auto;
}
.power-options-and-monitor {
  float: right;
  margin-left: auto;
  height: 100%;
  width: 410px;
  position: relative;
  top: 7.5px;
  right: 10px;
  display: inline-flex;
}
.btn-group {
  width: 100%;
}
.isoMountBtn {
  width: 150px;
}
.iso-mount-content {
  padding: 20px;
  display: flex;
  flex-wrap: wrap;
}
.iso-mount-item {
  display: inline;
  width: 100%;
  margin-bottom: 5px;
  padding: 4px;
  border-style: solid;
  border-color: var(--bs-card-border);
  border-width: 1px;
  border-radius: 5px;
}
.iso-mount-item p {
  width: fit-content;
  float: left;
  margin-right: 0px;
  margin-bottom: 0px;
  line-height: 40px;
}
.firewall-content {
  padding: 20px;
  width: 100%;
}
.info-content {
  padding: 20px;
}
.monitor-page,
.shell-page {
  height: 100%;
}
.monitor_frame,
.shell_frame {
  width: 100%;
  height: 100%;
  border-radius: 5px;
}
.top-bar-content {
  padding: 10px;
  line-height: 40px;
  margin-bottom: 0px;
  display: flex;
}
.vps-power-icon {
  height: fit-content;
  position: relative;
  top: 9px;
  left: 4px;
}
.vps-name {
  /* margin-bottom: 0px; */
  line-height: 55px;
  margin-left: 10px;
  font-size: 21px;
  width: fit-content;
}
.nav-link[active] {
  color: var(--bs-primary);
}
.menu-item-icon {
  width: 35px;
}
.nav-content {
  color: var(--bs-text-default);
  border-radius: 5px;
  background-color: var(--bs-card-header-bg);
  backdrop-filter: opacity(0.5);
  margin-left: 5px;
  overflow-y: auto;
}
.nav-side {
  flex-grow: 5;
  color: var(--bs-text-default);
  border-radius: 5px;
  background-color: var(--bs-card-header-bg);
  backdrop-filter: opacity(0.5);
  max-width: 200px;
  min-width: 200px;
}
.nav-link {
  color: var(--bs-text-default);
  width: fit-content;
}
.nav-links {
  width: 100%;
  margin: 5px auto;
}
.nav-content {
  flex-grow: 95;
}
.main-content {
  display: flex;
  width: 98%;
  margin: 5px auto;
  height: calc(100% - 95px);
}
.top-bar {
  width: 98%;
  margin: 5px auto;
  border-radius: 5px;
  height: 75px;
  color: var(--bs-text-default);
  background-color: var(--bs-card-header-bg);
  backdrop-filter: opacity(0.5);
}

@keyframes breathing {
  0% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }

  25% {
    -webkit-transform: scale(1);
    -ms-transform: scale(1);
    transform: scale(1);
  }

  60% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }

  100% {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
  }
}
</style>
