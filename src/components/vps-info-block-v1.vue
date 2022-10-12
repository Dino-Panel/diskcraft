<template>
  <div class="card" :style="vpsStyle(vpsInstance)">
    <div class="card-header" style="padding-left: 10px; display:inline-flex">
      <i
        v-if="vpsInstance.renew == 0"
        class="fad fa-times"
        style="margin-right: 5px; color: red"
      ></i>
      <i
        v-if="vpsInstance.suspended == 1"
        class="fad fa-server"
        style="color: red"
      ></i>
      <i
        v-else-if="vpsInstance.status == 'Running'"
        class="fad fa-server"
        style="color: green"
      ></i>

      <i v-else class="fad fa-server" style="color: orange"></i>
      <p v-if="vpsInstance.alias == null">
        {{ vpsInstance.name }}
      </p>
      <p v-else>
        {{ vpsInstance.alias }}
      </p>
    </div>
    <div class="card-body" style="padding: 5px">
      <div class="card-text">
        <section style="display: inline-flex; width: 100%">
          <div class="vpsInfoBlock">
            <div
              style="margin: auto 8px;"
              v-if="vpsInstance.network.ipv4_enabled == true"
            >
              <b>IPv4:</b>
              {{
                vpsInstance.network.ipv4_displayname ||
                  vpsInstance.network.ipv4_address
              }}
            </div>
            <div
              style="margin: auto 8px;"
              v-if="vpsInstance.network.ipv6_enabled == true"
            >
              <b>IPv6:</b>
              {{
                vpsInstance.network.ipv6_displayname ||
                  vpsInstance.network.ipv6_address
              }}
            </div>
            <div style="margin: auto 8px;">
              <b>CPU:</b> {{ vpsInstance.hardware.cpuCores }}
              {{ vpsInstance.hardware.cpuCores == 1 ? "core" : "cores" }}
            </div>
            <div style="margin: auto 8px;">
              <b>RAM:</b> {{ vpsInstance.hardware.ram / 1024 }}GB
            </div>
            <div style="margin: auto 8px;">
              <b>Main Disk:</b> {{ vpsInstance.hardware.disk / 1024 }}GB
            </div>
            <div style="margin: auto 8px;">
              <b>State:</b>
              {{
                vpsInstance.suspended == 1 ? "Suspended" : vpsInstance.status
              }}
            </div>
            <div style="margin: auto 8px;">
              <b>Price:</b>
              {{ $root.$children[0].api_capabilities.currency.symbol
              }}{{ priceFixer(vpsInstance.price) }}<small>/month</small>
            </div>
            <div style="margin: auto 8px;">
              <b
                >{{
                  vpsInstance.renew == 0 ? "Cancellation" : "Renew"
                }}
                Date:</b
              >
              {{ mysqlDate(new Date(vpsInstance.expiresAt)) }}
            </div>
          </div>
          <mini-info-chart
            class="vpsInfoChart"
            :dataPoints="60"
            :uuid="vpsInstance.uuid"
          ></mini-info-chart>
        </section>
        <div
          style="margin: 0px 0px; flex-wrap: wrap; display: flex; justify-content: center"
        >
          <button
            type="button"
            class="btn btn-dark sameSizeBtn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Start"
            :disabled="vpsInstance.renew == 0"
            @click="stopRenew(vpsInstance)"
            style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
          >
            <i
              class="fad fa-window-close"
              style="color: var(--bs-button-text);position: relative; left: -2px;"
            ></i>
            Cancel server
          </button>
          <div class="btn-group" role="group" aria-label="Basic example">
            <button
              type="button"
              class="btn btn-success poweraction_btn"
              data-bs-toggle="tooltip"
              data-bs-placement="top"
              style="color: var(--bs-button-text)"
              title="Start"
              :disabled="
                vpsInstance.status == 'Running' || vpsInstance.suspended == 1
              "
              @click="
                $parent.showPowerConfirmation(
                  `Are you sure you want to start ${vpsInstance.alias ||
                    vpsInstance.name}?`,
                  start,
                  vpsInstance
                )
              "
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
              style="color: var(--bs-button-text)"
              title="Shutdown"
              class="btn btn-warning poweraction_btn"
              :disabled="
                vpsInstance.status != 'Running' || vpsInstance.suspended == 1
              "
              @click="
                $parent.showPowerConfirmation(
                  `Are you sure you want to shutdown ${vpsInstance.alias ||
                    vpsInstance.name}?`,
                  shutdown,
                  vpsInstance
                )
              "
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
              style="color: var(--bs-button-text)"
              title="Reboot"
              :disabled="
                vpsInstance.status != 'Running' || vpsInstance.suspended == 1
              "
              @click="
                $parent.showPowerConfirmation(
                  `Are you sure you want to reboot ${vpsInstance.alias ||
                    vpsInstance.name}?`,
                  reboot,
                  vpsInstance
                )
              "
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
              style="color: var(--bs-button-text)"
              title="Reset"
              :disabled="
                vpsInstance.status != 'Running' || vpsInstance.suspended == 1
              "
              @click="
                $parent.showPowerConfirmation(
                  `Are you sure you want to reset ${vpsInstance.alias ||
                    vpsInstance.name}?`,
                  reset,
                  vpsInstance
                )
              "
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
                vpsInstance.status != 'Running' || vpsInstance.suspended == 1
              "
              @click="
                $parent.showPowerConfirmation(
                  `Are you sure you want to kill ${vpsInstance.alias ||
                    vpsInstance.name}?`,
                  kill,
                  vpsInstance
                )
              "
            >
              <i
                class="fa-regular fa-skull-crossbones"
                style="color: var(--bs-button-text)"
              ></i>
            </button>
          </div>
          <button
            @click="manageUrl(vpsInstance.uuid)"
            class="btn btn-primary sameSizeBtn"
            type="button"
            style="margin: 5px; color: var(--bs-button-text)"
            :disabled="vpsInstance.suspended == 1"
          >
            <i
              class="fad fa-tasks-alt"
              style="color: var(--bs-button-text); position: relative; left: -2px;"
            ></i>
            Manage
          </button>

          <button
            v-if="cancelNowOnly == true"
            type="button"
            class="btn btn-danger sameSizeBtn"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            title="Start"
            :disabled="vpsInstance.renew == 1"
            @click="cancelNowFunction(vpsInstance)"
            style="color: var(--bs-button-text); min-height: 40px; margin: 5px"
          >
            <i
              class="fad fa-window-close"
              style="color: var(--bs-button-text);position: relative; left: -2px;"
            ></i>
            Cancel now (admin)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sameSizeBtn {
  min-width: 150px;
  height: 40px;
}
.poweraction_btn {
  width: 40px !important;
  height: 40px !important;
  margin: 5px;
}
.card-header p {
  margin-bottom: 0px;
  line-height: 28px;
  margin-left: 5px;
}
.card-header .fad {
  font-size: 20px;
}
.card {
  background-color: var(--bs-card-bg);
  min-width: fit-content;
  width: 100%;
  margin: 5px;
  flex-grow: 1;
}
.card .card-header {
  background-color: var(--bs-card-header-bg);
}
.vpsInfoChart {
  height: 125px;
  width: 100% !important;
  max-width: 600px;
  flex-grow: 5;
  float: right;
  margin-left: auto;
}
.vpsInfoBlock {
  min-width: fit-content;
}

.btn-group {
  width: 300px;
}

@media only screen and (max-width: 800px) {
  .vpsInfoChart {
    display: none;
  }
  .btn-group,
  .btn {
    width: 100%;
  }
  .btn {
    margin-top: 5px;
  }
}
</style>

<script>
import miniInfoChart from "./mini-info-chart.vue";

export default {
  props: ["vpsInstance", "cancelNowOnly"],
  components: {
    miniInfoChart,
  },
  methods: {
    idToUser(id) {
      return this.$root.$children[0].users.find((user) => user.id == id);
    },
    stopRenew(vps) {
      var vm = this;
      var vpsUUID = vps.uuid;

      fetch(`${vm.$root.$children[0].api_base_url}/@me/cancel`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "VPS",
          target: vpsUUID,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
        });
      });
    },
    cancelNowFunction(vps) {
      var vm = this;
      var vpsUUID = vps.id;

      fetch(`${vm.$root.$children[0].api_base_url}/@admin/cancelnow`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
        body: JSON.stringify({
          service: "vps",
          id: vpsUUID,
        }),
      }).then((res) => {
        res.json().then((data) => {
          vm.$root.$children[0].checkMessage(data);
        });
      });
    },
    mysqlDate(date) {
      var vm = this;
      date = vm.convertUTCDateToLocalDate(date);
      return (
        date.getFullYear() +
        "-" +
        vm.twoDigits(1 + date.getMonth()) +
        "-" +
        vm.twoDigits(date.getDate()) +
        " " +
        vm.twoDigits(date.getHours()) +
        ":" +
        vm.twoDigits(date.getMinutes()) +
        ":" +
        vm.twoDigits(date.getSeconds())
      );
    },
    convertUTCDateToLocalDate(date) {
      var newDate = new Date(
        date.getTime() + date.getTimezoneOffset() * 60 * 1000
      );

      var offset = date.getTimezoneOffset() / 60;
      var hours = date.getHours();

      newDate.setHours(hours - offset);

      return newDate;
    },
    twoDigits(d) {
      if (0 <= d && d < 10) return "0" + d.toString();
      if (-10 < d && d < 0) return "-0" + (-1 * d).toString();
      return d.toString();
    },
    vpsStyle(vps) {
      if (vps.renew == 0 && vps.suspended == 1) return "display: none;";
      return;
    },
    shutdown(vpsInstance) {
      var vm = this;
      var vpsUUID = vpsInstance.uuid;

      var jobId = vm.$root.$children[0].createJob(
        `The shutdown command is being sent to ${vpsInstance.alias ||
          vpsInstance.name}.`
      );

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
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch(() => {
          vm.$root.$children[0].stopJob(jobId);
        });
    },
    reset(vpsInstance) {
      var vm = this;
      var vpsUUID = vpsInstance.uuid;

      var jobId = vm.$root.$children[0].createJob(
        `The reset command is being sent to ${vpsInstance.alias ||
          vpsInstance.name}.`
      );

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reset`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch(() => {
          vm.$root.$children[0].stopJob(jobId);
        });
    },
    kill(vpsInstance) {
      var vm = this;
      var vpsUUID = vpsInstance.uuid;

      var jobId = vm.$root.$children[0].createJob(
        `The kill command is being sent to ${vpsInstance.alias ||
          vpsInstance.name}.`
      );

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
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch(() => {
          vm.$root.$children[0].stopJob(jobId);
        });
    },
    reboot(vpsInstance) {
      var vm = this;
      var vpsUUID = vpsInstance.uuid;

      var jobId = vm.$root.$children[0].createJob(
        `The reboot command is being sent to ${vpsInstance.alias ||
          vpsInstance.name}.`
      );

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/reboot`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch(() => {
          vm.$root.$children[0].stopJob(jobId);
        });
    },
    start(vpsInstance) {
      var vm = this;
      var vpsUUID = vpsInstance.uuid;

      var jobId = vm.$root.$children[0].createJob(
        `The start command is being sent to ${vpsInstance.alias ||
          vpsInstance.name}.`
      );

      fetch(`${vm.$root.$children[0].api_base_url}/@me/vps/${vpsUUID}/start`, {
        headers: {
          Authorization: `Bearer ${window.localStorage.getItem("jwt")}`,
        },
      })
        .then((res) => {
          res.json().then((data) => {
            vm.$root.$children[0].checkMessage(data);
            vm.$root.$children[0].stopJob(jobId);
          });
        })
        .catch(() => {
          vm.$root.$children[0].stopJob(jobId);
        });
    },
    formatBytes(bytes, decimals = 2) {
      if (bytes === 0) return "0 Bytes";

      const k = 1024;
      const dm = decimals < 0 ? 0 : decimals;
      const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

      const i = Math.floor(Math.log(bytes) / Math.log(k));

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    },
    goto(path) {
      this.$router.push({
        path: path,
      });
    },
    manageUrl(uuid) {
      this.$router.push({
        path: `/vps/${uuid}`,
      });
    },
    priceFixer(input) {
      var vm = this;
      if (input == undefined) return;
      vm.api_capabilities = vm.$root.$children[0].api_capabilities;
      if (input.toString().includes(".")) {
        var returnStr = (Math.round(input * 100) / 100)
          .toString()
          .replace(".", vm.api_capabilities.currency.separator);
        if (
          returnStr.split(vm.api_capabilities.currency.separator)[1] &&
          returnStr.split(vm.api_capabilities.currency.separator)[1].length == 1
        )
          returnStr += `0`;

        if (returnStr.split(vm.api_capabilities.currency.separator)[1] == null)
          returnStr += `${vm.api_capabilities.currency.separator}00`;

        return returnStr;
      } else {
        return input + `${vm.api_capabilities.currency.separator}00`;
      }
    },
  },
};
</script>
