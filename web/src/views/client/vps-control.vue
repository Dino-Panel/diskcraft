<template style="background-color: var(--bs-bg);">
  <div
    class="CardArea"
    v-if="$root.$children[0].user.vps"
    style="padding-bottom: 20px; background-color: var(--bs-bg);"
  >
    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-power-off"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; Power options - Server is currently
        {{ server().status == "Running" ? "online." : "offline." }}
      </div>
      <div class="card-body" style="padding: 5px">
        <div
          class="card-text"
          style="display: flex; flex-wrap: wrap; justify-content: center"
        >
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
    </div>
    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-desktop"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; Monitor
      </div>
      <div class="card-body" id="monitor_frame" style="padding: 5px; ">
        <iframe id="vps_frame" :src="frameSrc()" class="monitor_frame"></iframe>
      </div>
    </div>
    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <p>
          <i
            class="fa-regular fa-chart-line"
            style="color: var(--bs-text-default)"
          ></i>
          &nbsp; Chart
        </p>
        <div
          class="btn-group"
          style="float: right"
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
      <cpu-chart
        v-if="showChart"
        :uuid="server().uuid"
        :dataPoints="dataPointsChart"
      ></cpu-chart>
    </div>
    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-microchip"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; System
      </div>
      <div class="card-body" style="padding: 5px">
        <div class="card-text" style="display: flex; flex-wrap: wrap">
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
          <p style="width: 100%; margin-bottom:0px"><b>VNC:</b> Yes</p>
          <div style="display: inline-flex">
            <b style="margin-right: 10px">Alias: </b>
            <input
              id="vpsAliasName"
              type="text"
              class="form-control aliasTextInput"
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
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-desktop"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; IPv4 NAT Rules
      </div>
      <div class="card-body" style="padding: 5px">
        <div class="card-text" style="display: flex; flex-wrap: wrap">
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
    </div>

    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-desktop"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; VNC information
      </div>
      <div class="card-body" style="padding: 5px">
        <div class="card-text" style="display: flex; flex-wrap: wrap">
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
    <div class="card isoMounting">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-disc-drive"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; Mount installer disk
      </div>
      <div class="card-body" style="padding: 10px">
        <div class="card-text" style="display: flex; flex-wrap: wrap">
          <div
            v-for="(iso, index) in mountableIsos"
            :key="index"
            style="display: inline; width: 100%; height: 38px; line-height: 38px; align-items:baseline; margin: 3px"
          >
            {{ iso_string(iso) }}
            <button
              class="btn btn-primary isoMountBtn"
              :disabled="isMountedDisk(iso) || server().status == 'Running'"
              type="button"
              style="float:right"
              @click="mountIso(iso)"
            >
              {{ isMountedDisk(iso) == true ? "Mounted" : "Mount" }}
            </button>
          </div>
          <p style="margin-left: 4px; margin-top: 10px">
            Your server has to be offline to mount an installer disk. After a
            disk has been mounted, start the server as usual and the installer
            will load. After the installation has completed mount the
            'no-iso.iso' file.
          </p>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-network-wired"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; Network information
      </div>
      <div class="card-body" style="padding: 5px">
        <div class="card-text" style="display: flex; flex-wrap: wrap">
          <p
            style="width: 100%; margin-bottom:0px"
            v-if="server().network.ipv4_enabled == true"
          >
            <b>IPv4:</b>
            {{
              server().network.ipv4_displayname || server().network.ipv4_address
            }}
            [{{ server().network.ipv4_type }}]
          </p>

          <p
            style="width: 100%; margin-bottom:0px"
            v-if="server().network.ipv6_enabled == true"
          >
            <b>IPv6:</b>
            {{
              server().network.ipv6_displayname || server().network.ipv6_address
            }}
            [{{ server().network.ipv6_type }}]
          </p>
        </div>
      </div>
    </div>
    <div class="card">
      <div class="card-header" style="padding-left: 10px">
        <i
          class="fa-regular fa-chart-network"
          style="color: var(--bs-text-default)"
        ></i>
        &nbsp; Internal network
      </div>
      <div class="card-body" style="padding: 5px">
        <div class="card-text" style="display: flex; flex-wrap: wrap">
          <p style="width: 100%; margin-bottom:0px">
            <b>Status:</b> not connected
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cpuChart from "../../components/vpsChart.vue";
export default {
  components: { cpuChart },

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
    delete_forward_rule(public_port) {
      var vpsUUID = this.server().uuid;
      var vm = this;
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
          });
        })
        .catch((e) => {
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
          });
        })
        .catch((e) => {
          vm.$root.$children[0].reportError(
            {
              panel: vm.$router.path,
              request: `${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/createforward/${port}`,
            },
            e
          );
        });
    },
    saveVpsAlias() {
      var name = document.getElementById("vpsAliasName").value;
      var vm = this;
      var vpsUUID = this.server().uuid;
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
    idToUser(id) {
      return this.$root.$children[0].users.find((user) => user.id == id);
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
    setChartDatapoints(count) {
      var vm = this;
      vm.dataPointsChart = count;
      vm.showChart = false;
      vm.$nextTick(() => {
        vm.showChart = true;
      });
    },
    isChartDatapoint(count) {
      var vm = this;
      return vm.dataPointsChart == count;
    },
  },
  mounted() {
    var vm = this;
    if (vm.server() && vm.server().suspended == 1) {
      this.$router.push({
        path: "/vps-manager",
      });
    }

    vm.refreshObject = setInterval(() => {
      console.log(vm.data_hash);
      var selectedServer = vm.server();
      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps?include_iso=true`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
          "x-request-server": vm.server().uuid,
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
              vm.data_hash = vm.create_hash_checksum(
                btoa(JSON.stringify(data.data))
              );

              vm.mountableIsos = data.data.iso.availible;
              vm.mountedIso = data.data.iso.mounted;
              var target = vm.$root.$children[0].user.vps.find((vps) => {
                return vps.uuid == data.data.uuid;
              });
              var target_index = vm.$root.$children[0].user.vps.indexOf(target);
              vm.$root.$children[0].user.vps[target_index] = data.data;
              if (
                vm.prevState != selectedServer.status &&
                selectedServer.status == "Running"
              ) {
                document
                  .getElementById("vps_frame")
                  .contentWindow.location.reload();
              }
              vm.prevState = selectedServer.status;
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
  data() {
    return {
      mountableIsos: [],
      prevState: "Running",
      refreshObject: null,
      mountedIso: null,
      prevStats: null,
      dataPointsChart: 300,
      showChart: true,
      data_hash: "",
    };
  },
};
</script>

<style scoped>
.isoMountBtn {
  width: 120px;
}
.monitor_frame {
  width: 100%;
  height: 800px;
}
@media only screen and (max-width: 1200px) {
  .k {
    height: 750;
    width: 100%;
  }
}

@media only screen and (max-width: 800px) {
  .monitor_frame {
    height: 500px;
    width: 100%;
  }
  .isoMounting {
    display: none;
  }
}

.poweraction_btn {
  width: 40px !important;
  height: 40px !important;
  margin: 5px;
}
.CardArea {
  width: 98%;
  margin: 10px auto;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}
.CardArea .card {
  background-color: var(--bs-card-bg);
  width: 100%;
  margin: 5px;
  flex-grow: 1;
  color: var(--bs-text-default);
}
.CardArea .card .card-header {
  background-color: var(--bs-card-header-bg);
}
.btn-group {
  width: 100%;
}
.aliasTextInput {
  height: 25px;
}
.aliasSaveBtn {
  float: right;
  color: var(--bs-button-text);
  margin-left: 5px;
  height: 25px;
  padding: 0px 10px;
}
</style>
